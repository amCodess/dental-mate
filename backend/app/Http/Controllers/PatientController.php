<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Clinic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PatientController extends Controller
{
    /** Lista pacientes con filtros opcionales */
    public function index(Request $request)
    {
        $query = Patient::query()->where('deleted', false);

        if ($request->has('company_id') && !empty($request->company_id)) {
            $query->where('id_empresa', $request->company_id);
        }

        if ($request->has('clinic_id') && !empty($request->clinic_id)) {
            $query->where('id_clinica', $request->clinic_id);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'ilike', "%{$search}%")
                    ->orWhere('apellido', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        $patients = $query
            ->select([
                'id_paciente',
                'id_empresa',
                'id_clinica',
                'nombre',
                'apellido',
                'email',
                'telefono',
                'fecha_nacimiento',
                'direccion',
                'historial_medico',
                'fecha_creacion'
            ])
            ->orderBy('fecha_creacion', 'desc')
            ->simplePaginate(10);
        return response()->json($patients);
    }

    /** Crea un paciente */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empresa' => 'nullable|integer', // puede venir vacío y ponerlo después
            'id_clinica' => 'nullable|integer|exists:Clinicas,id_clinica',
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100', // obligatorio
            'id_usuario' => 'nullable|integer|exists:Usuarios,id_usuario', // usuario opcional
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Si no viene empresa, poner la 1 por defecto
        $data = $request->all();
        if (!isset($data['id_empresa'])) {
            $data['id_empresa'] = 1; // Default
        }

        if (!isset($data['id_clinica']) && isset($data['id_empresa'])) {
            $clinic = Clinic::where('id_empresa', $data['id_empresa'])->first();
            if ($clinic) {
                $data['id_clinica'] = $clinic->id_clinica;
            }
        }

        // Crear paciente con los datos limpios
        $patient = Patient::create($data);

        return response()->json($patient, 201);
    }

    /** Muestra un paciente por id */
    public function show($id)
    {
        $patient = Patient::with('appointments')->find($id);

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        return response()->json($patient);
    }

    /** Actualiza un paciente */
    public function update(Request $request, $id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        $patient->update($request->all());

        return response()->json($patient);
    }

    /** Borra un paciente (lógico) */
    public function destroy($id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        // Manual soft delete to satisfy DB constraint (deleted=true AND deleted_at not null)
        $patient->deleted = true;
        $patient->deleted_at = now();
        $patient->save();

        return response()->json(['message' => 'Patient deleted successfully']);
    }
}
