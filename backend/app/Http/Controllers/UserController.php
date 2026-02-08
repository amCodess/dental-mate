<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    
    public function index(Request $request)
    {
        $query = User::with(['companies', 'clinics']);

        if ($request->has('include_deleted') && filter_var($request->include_deleted, FILTER_VALIDATE_BOOLEAN)) {
            $query->withTrashed();
        }

        // Filtrar superadmins si se solicita
        if ($request->boolean('superadmin')) {
            // Incluir aunque estén soft-deleted para no perder al admin base
            $query->withTrashed();
            $query->where(function ($q) {
                $q->where('is_superadmin', true)
                  ->orWhere('email', 'admin@dentalmate.com');
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('apellido', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by company or clinic if needed
        if ($request->filled('company_id')) {
            $companyId = $request->company_id;
            $query->whereHas('companies', function($q) use ($companyId) {
                $q->where('Usuarios_Empresas.id_empresa', $companyId);
            });
        }

        if ($request->filled('clinic_id')) {
            $clinicId = $request->clinic_id;
            $query->whereHas('clinics', function($q) use ($clinicId) {
                $q->where('Usuarios_Clinicas.id_clinica', $clinicId);
            });
        }

        $users = $query->orderBy('fecha_creacion', 'desc')->paginate(10);

        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'email' => 'required|email|unique:Usuarios,email', // Table name is Usuarios
            'password' => 'required|string|min:6',
            'id_empresa' => 'sometimes|integer',
            'is_superadmin' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            $errors = $validator->errors();
            if ($errors->isNotEmpty()) {
                return response()->json([
                    'message' => $errors->first(),
                    'errors' => $errors,
                ], 422);
            }
        }

        if (!$request->boolean('is_superadmin') && !$request->filled('id_empresa')) {
            return response()->json(['error' => 'El campo id_empresa es requerido'], 422);
        }

        $companyId = $request->id_empresa;
        if (!$companyId) {
            $companyId = DB::table('Empresas')->orderBy('id_empresa')->value('id_empresa') ?? 1;
        }

        $empresaExists = DB::table('Empresas')->where('id_empresa', $companyId)->exists();
        if (!$empresaExists) {
            return response()->json(['error' => 'La empresa especificada no existe'], 422);
        }

        try {
            DB::beginTransaction();

            $user = User::create([
                'nombre' => $request->nombre,
                'apellido' => $request->apellido,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'estado' => 'activo',
                'is_superadmin' => $request->boolean('is_superadmin', false),
            ]);

            // Attach Company (superadmin incluido para tener empresa base)
            if ($companyId) {
                $user->companies()->attach($companyId);
            }

            // Attach Clinic if provided
            if ($request->id_clinica) {
                $user->clinics()->attach($request->id_clinica, [
                    'id_empresa' => $companyId,
                ]);
            }

            DB::commit();

            $user->load(['companies', 'clinics']);

            return response()->json($user, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error creating user: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = User::with(['companies', 'clinics'])->withTrashed()->find($id);
        
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('Usuarios')->ignore($user->id_usuario, 'id_usuario')],
            'is_superadmin' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            $errors = $validator->errors();
            if ($errors->isNotEmpty()) {
                return response()->json([
                    'message' => $errors->first(),
                    'errors' => $errors,
                ], 422);
            }
        }

        if ($request->filled('id_empresa')) {
            $empresaExists = DB::table('Empresas')->where('id_empresa', $request->id_empresa)->exists();
            if (!$empresaExists) {
                return response()->json(['error' => 'La empresa especificada no existe'], 422);
            }
        }

        try {
            DB::beginTransaction();

            $updateData = [
                'nombre' => $request->nombre,
                'apellido' => $request->apellido,
                'email' => $request->email,
            ];

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }
            
            if ($request->has('estado')) {
                $updateData['estado'] = $request->estado;
            }

            if ($request->has('is_superadmin')) {
                $updateData['is_superadmin'] = $request->boolean('is_superadmin');
            }

            // Restore if requested
            if ($user->trashed() && $request->has('deleted_at') && is_null($request->deleted_at)) {
                $user->restore();
            }

            $user->update($updateData);

            if ($request->filled('id_clinica')) {
                 $clinicId = $request->id_clinica;

                // Check if user is attached to this clinic
                $isAttached = $user->clinics()->where('Usuarios_Clinicas.id_clinica', $clinicId)->exists();
                
                if ($isAttached) {
                     $user->clinics()->updateExistingPivot($clinicId, [
                        'id_empresa' => $request->id_empresa ?? $user->companies()->first()->id_empresa ?? 1,
                     ]);
                } else {
                     $user->clinics()->attach($clinicId, [
                        'id_empresa' => $request->id_empresa ?? $user->companies()->first()->id_empresa ?? 1,
                     ]);
                }
            }

            DB::commit();

            $user->load(['companies', 'clinics']);

            return response()->json($user);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error updating user: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

}
