<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::with(['role', 'companies', 'clinics']);

        if ($request->has('include_deleted') && filter_var($request->include_deleted, FILTER_VALIDATE_BOOLEAN)) {
            $query->withTrashed();
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
        $request->validate([
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'email' => 'required|email|unique:Usuarios,email', // Table name is Usuarios
            'password' => 'required|string|min:6',
            // Use integer checks and verify existence manually to avoid Postgres case issues
            'id_role' => 'required|integer',
            'id_empresa' => 'required|integer',
        ]);

        // Manual existence checks to respect quoted table names in Postgres
        $roleName = Role::where('id_role', $request->id_role)->value('nombre_role');
        if (!$roleName) {
            return response()->json(['error' => 'El rol seleccionado no existe'], 422);
        }
        $tenantRole = $this->mapTenantRole($roleName);

        $empresaExists = DB::table('Empresas')->where('id_empresa', $request->id_empresa)->exists();
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
                'id_role' => $request->id_role,
                'estado' => 'activo',
            ]);

            // Attach Company
            if ($request->id_empresa) {
                $user->companies()->attach($request->id_empresa, ['rol' => $tenantRole]);
            }

            // Attach Clinic if provided, with menu permissions
            if ($request->id_clinica) {
                $menuPermissions = [
                    'rol' => $tenantRole,
                    'id_empresa' => $request->id_empresa,
                    'menu_citas' => $request->boolean('menu_citas', true),
                    'menu_pacientes' => $request->boolean('menu_pacientes', true),
                    'menu_facturacion' => $request->boolean('menu_facturacion', true),
                    'menu_productos' => $request->boolean('menu_productos', true),
                    'menu_proveedores' => $request->boolean('menu_proveedores', true),
                    'menu_tratamientos' => $request->boolean('menu_tratamientos', true),
                    'menu_usuarios' => $request->boolean('menu_usuarios', true),
                ];
                $user->clinics()->attach($request->id_clinica, $menuPermissions);
            }

            DB::commit();

            $user->load(['role', 'companies', 'clinics']);

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
        $user = User::with(['role', 'companies', 'clinics'])->withTrashed()->find($id);
        
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

        $request->validate([
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('Usuarios')->ignore($user->id_usuario, 'id_usuario')],
            // Validate basic type, then manually assert existence to avoid Postgres case sensitivity issues
            'id_role' => 'required|integer',
        ]);

        $roleName = Role::where('id_role', $request->id_role)->value('nombre_role');
        if (!$roleName) {
            return response()->json(['error' => 'El rol seleccionado no existe'], 422);
        }
        $tenantRole = $this->mapTenantRole($roleName);

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
                'id_role' => $request->id_role,
            ];

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }
            
            if ($request->has('estado')) {
                $updateData['estado'] = $request->estado;
            }

            // Restore if requested
            if ($user->trashed() && $request->has('deleted_at') && is_null($request->deleted_at)) {
                $user->restore();
            }

            $user->update($updateData);

            if ($request->filled('id_clinica')) {
                 $clinicId = $request->id_clinica;
                 
                 // Prepare menu permissions
                 $menuPermissions = [
                    'rol' => $tenantRole,
                    'menu_citas' => $request->boolean('menu_citas', $user->clinics->find($clinicId)?->pivot->menu_citas ?? true),
                    'menu_pacientes' => $request->boolean('menu_pacientes', $user->clinics->find($clinicId)?->pivot->menu_pacientes ?? true),
                    'menu_facturacion' => $request->boolean('menu_facturacion', $user->clinics->find($clinicId)?->pivot->menu_facturacion ?? true),
                    'menu_productos' => $request->boolean('menu_productos', $user->clinics->find($clinicId)?->pivot->menu_productos ?? true),
                    'menu_proveedores' => $request->boolean('menu_proveedores', $user->clinics->find($clinicId)?->pivot->menu_proveedores ?? true),
                    'menu_tratamientos' => $request->boolean('menu_tratamientos', $user->clinics->find($clinicId)?->pivot->menu_tratamientos ?? true),
                    'menu_usuarios' => $request->boolean('menu_usuarios', $user->clinics->find($clinicId)?->pivot->menu_usuarios ?? true),
                ];

                // Check if user is attached to this clinic
                $isAttached = $user->clinics()->where('Usuarios_Clinicas.id_clinica', $clinicId)->exists();
                
                if ($isAttached) {
                     $user->clinics()->updateExistingPivot($clinicId, $menuPermissions);
                } else {
                     $menuPermissions['id_empresa'] = $request->id_empresa ?? $user->companies()->first()->id_empresa ?? 1;
                     $user->clinics()->attach($clinicId, $menuPermissions);
                }
            }

            DB::commit();

            $user->load(['role', 'companies', 'clinics']);

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

    /**
     * Map application roles to the enum allowed in tenant pivot tables.
     */
    private function mapTenantRole(?string $roleName): string
    {
        $normalized = strtolower(trim($roleName ?? ''));

        return match ($normalized) {
            'superadmin' => 'owner',
            'admin' => 'admin',
            'empleado' => 'staff',
            'usuario' => 'viewer',
            default => 'staff',
        };
    }
}
