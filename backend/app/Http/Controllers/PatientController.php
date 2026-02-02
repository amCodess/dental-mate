<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PatientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Patient::query();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'ilike', "%{$search}%")
                    ->orWhere('apellido', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        $patients = $query->orderBy('fecha_creacion', 'desc')->paginate(10);
        return response()->json($patients);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empresa' => 'nullable|integer', // Puede ser null si se asigna después o default
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100', // Campos requeridos
            'id_usuario' => 'nullable|integer|exists:Usuarios,id_usuario', // Id usuario nullable
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Asignar id_empresa por defecto si no viene (ej: id 1 para demo)
        $data = $request->all();
        if (!isset($data['id_empresa'])) {
            $data['id_empresa'] = 1; // Default
        }

        // Asegurarse de que no incluya campos no fillable si los hubiere
        $patient = Patient::create($data);

        return response()->json($patient, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $patient = Patient::with('appointments')->find($id);

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        return response()->json($patient);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        $patient->update($request->all());

        return response()->json($patient);
    }

    /**
     * Remove the specified resource from storage.
     */
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
