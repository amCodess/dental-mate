<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Obtener usuarios con su rol y empresa
        // Como User tiene belongsTo role, podemos usar with('role')

        $query = User::query()
            ->select([
                'id_usuario',
                'nombre',
                'apellido',
                'email',
                'id_role',
                'estado'
            ])
            ->with('role')
            ->where('deleted', false);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('apellido', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filtrar por roles específicos (comma separated)
        if ($request->has('role_in')) {
            $roles = explode(',', $request->get('role_in'));
            $query->whereHas('role', function ($q) use ($roles) {
                $q->whereIn('nombre_role', $roles);
            });
        }

        // Filtrar por clínica
        if ($request->has('clinic_id')) {
            $clinicId = $request->get('clinic_id');
            $query->whereHas('clinics', function ($q) use ($clinicId) {
                $q->where('Usuarios_Clinicas.id_clinica', $clinicId);
            });
        }

        // Paginación
        $users = $query->orderBy('id_usuario', 'desc')->simplePaginate(10);

        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'email' => 'required|email|unique:Usuarios,email',
            'password' => 'required|string|min:6',
            'id_role' => 'required|exists:Roles,id_role',
            'clinic_id' => 'nullable|exists:Clinicas,id_clinica'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        try {
            DB::beginTransaction();

            $user = new User();
            $user->nombre = $request->nombre;
            $user->apellido = $request->apellido;
            $user->email = $request->email;
            $user->password = Hash::make($request->password);
            $user->id_role = $request->id_role;
            $user->estado = 'activo';
            $user->save();

            if ($request->has('clinic_id')) {
                $clinic = \App\Models\Clinic::find($request->clinic_id);
                if ($clinic) {
                    // Associate to clinic AND company
                    $user->clinics()->syncWithoutDetaching([
                        $clinic->id_clinica => [
                            'rol' => 'empleado',
                            'id_empresa' => $clinic->id_empresa
                        ]
                    ]);
                    // Also associate to company directly if needed? 
                    // Usually `Usuarios_Empresas` is also used.
                    $user->companies()->syncWithoutDetaching([
                        $clinic->id_empresa => ['rol' => 'empleado']
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Usuario creado exitosamente',
                'user' => $user->load('role')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al crear usuario: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = User::with('role')->find($id);
        if (!$user)
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user)
            return response()->json(['error' => 'Usuario no encontrado'], 404);

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|string|max:100',
            'apellido' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:Usuarios,email,' . $id . ',id_usuario',
            'password' => 'sometimes|nullable|string|min:6',
            'id_role' => 'sometimes|exists:Roles,id_role',
            'estado' => 'sometimes|in:activo,inactivo'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        try {
            if ($request->has('nombre'))
                $user->nombre = $request->nombre;
            if ($request->has('apellido'))
                $user->apellido = $request->apellido;
            if ($request->has('email'))
                $user->email = $request->email;
            if ($request->has('id_role'))
                $user->id_role = $request->id_role;
            if ($request->has('estado'))
                $user->estado = $request->estado;

            if ($request->has('password') && !empty($request->password)) {
                $user->password = Hash::make($request->password);
            }

            $user->save();

            return response()->json([
                'message' => 'Usuario actualizado exitosamente',
                'user' => $user->load('role')
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user)
            return response()->json(['error' => 'Usuario no encontrado'], 404);

        // Soft delete o hard delete? 
        // El modelo tiene 'deleted' boolean column, no un trait SoftDeletes estándar con timestamp.
        // Pero el User model en paso 177 tiene 'deleted' => 'boolean' en casts y hidden.

        // Simplemente marcamos deleted = true
        $user->deleted = true;
        $user->deleted_at = now(); // Required by check constraint "usuarios_deleted_chk"
        $user->save();
        // User.php fillable no tenía 'deleted'. Revisaré update.

        // Pero espera, User.php usa 'deleted' en hidden, no está en fillable.
        // Voy a usar forceDelete() si el modelo no tiene SoftDeletes trait configurado, 
        // O actualizar la propiedad directamente y save().
        // Si 'deleted' no está en fillable, $user->deleted = true funciona igual por asignación directa de propiedad.

        return response()->json(['message' => 'Usuario eliminado correctamente']);
    }
}
