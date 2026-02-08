<?php

namespace App\Http\Controllers;

use App\Models\Clinic;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClinicController extends Controller
{
    /**
     * Muestra una lista de clínicas.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth('api')->user();
        $isSuperAdmin = $user && $user->role && $user->role->nombre_role === 'superadmin';

        $query = Clinic::query()
            ->select([
                'Clinicas.id_clinica',
                'Clinicas.id_empresa',
                'Clinicas.nombre',
                'Clinicas.telefono',
                'Clinicas.email_recordatorios',
                'Clinicas.telefono_recordatorios',
                'Clinicas.nombre_remitente',
                'Clinicas.direccion',
                'Clinicas.fecha_creacion'
            ])
            ->with(['company:id_empresa,nombre'])
            ->where('Clinicas.deleted', false);

        if (!$isSuperAdmin && $user) {
            $query->join('Usuarios_Clinicas as uc', function ($join) use ($user) {
                $join->on('Clinicas.id_clinica', '=', 'uc.id_clinica')
                    ->where('uc.id_usuario', '=', $user->id_usuario);
            });
            $query->addSelect([
                'uc.rol as user_role'
            ]);
        }
        
        if ($request->has('company_id')) {
            $query->where('Clinicas.id_empresa', $request->get('company_id'));
        }

        return response()->json($query->get());
    }

    /**
     * Almacena una nueva clínica en la base de datos.
     * Solo accesible por SuperAdmin.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_empresa' => 'required|exists:Empresas,id_empresa',
            'nombre' => 'required|string|max:150',
            'telefono' => 'nullable|string|max:20',
            'email_recordatorios' => 'nullable|email|max:150',
            'telefono_recordatorios' => 'nullable|string|max:20',
            'nombre_remitente' => 'nullable|string|max:150',
            'direccion' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }
        $validated = $validator->validated();
        $company = Company::find($validated['id_empresa']);
        if (!$company) {
            return response()->json(['message' => 'La empresa especificada no existe.'], 404);
        }

        $clinic = Clinic::create($validated);

        return response()->json([
            'message' => 'Clínica creada exitosamente.',
            'clinic' => $clinic
        ], 201);
    }

    /**
     * Muestra la clínica especificada.
     */
    public function show(string $id): JsonResponse
    {
        $clinic = Clinic::query()
            ->select([
                'id_clinica',
                'id_empresa',
                'nombre',
                'telefono',
                'email_recordatorios',
                'telefono_recordatorios',
                'nombre_remitente',
                'direccion',
                'fecha_creacion'
            ])
            ->with(['company:id_empresa,nombre'])
            ->where('deleted', false)
            ->find($id);

        if (!$clinic) {
            return response()->json(['message' => 'Clínica no encontrada'], 404);
        }

        return response()->json($clinic);
    }

    /**
     * Actualiza la clínica especificada.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $clinic = Clinic::where('deleted', false)->find($id);

        if (!$clinic) {
            return response()->json(['message' => 'Clínica no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'id_empresa' => 'required|exists:Empresas,id_empresa',
            'nombre' => 'required|string|max:150',
            'telefono' => 'nullable|string|max:20',
            'email_recordatorios' => 'nullable|email|max:150',
            'telefono_recordatorios' => 'nullable|string|max:20',
            'nombre_remitente' => 'nullable|string|max:150',
            'direccion' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }
        $validated = $validator->validated();
        $clinic->update($validated);

        return response()->json([
            'message' => 'Clínica actualizada exitosamente.',
            'clinic' => $clinic
        ]);
    }

    /**
     * Elimina la clínica especificada (soft delete manual).
     */
    public function destroy(string $id): JsonResponse
    {
        $clinic = Clinic::where('deleted', false)->find($id);

        if (!$clinic) {
            return response()->json(['message' => 'Clínica no encontrada'], 404);
        }

        $clinic->deleted = true;
        $clinic->deleted_at = now();
        $clinic->save();

        return response()->json(['message' => 'Clínica eliminada correctamente']);
    }
}




