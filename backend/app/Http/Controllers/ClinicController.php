<?php

namespace App\Http\Controllers;

use App\Models\Clinic;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClinicController extends Controller
{
    /**
     * Muestra una lista de clínicas.
     */
    public function index(Request $request)
    {
        $query = Clinic::with('company');
        
        if ($request->has('company_id')) {
            $query->where('id_empresa', $request->get('company_id'));
        }

        return response()->json($query->get());
    }

    /**
     * Almacena una nueva clínica en la base de datos.
     * Solo accesible por SuperAdmin.
     */
    public function store(Request $request)
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

        // Validación extra: verificar si la empresa existe (ya cubierto por 'exists' rule pero doble check es bueno)
        $company = Company::find($request->id_empresa);
        if (!$company) {
            return response()->json(['message' => 'La empresa especificada no existe.'], 404);
        }

        $clinic = Clinic::create($request->all());

        return response()->json([
            'message' => 'Clínica creada exitosamente.',
            'clinic' => $clinic
        ], 201);
    }

    /**
     * Muestra la clínica especificada.
     */
    public function show(string $id)
    {
        $clinic = Clinic::with('company')->find($id);

        if (!$clinic) {
            return response()->json(['message' => 'Clínica no encontrada'], 404);
        }

        return response()->json($clinic);
    }
}
