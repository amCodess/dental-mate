<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompanyController extends Controller
{
    /**
     * Muestra una lista de empresas.
     */
    public function index()
    {
        // Solo para debug o admin panel
        $companies = Company::query()
            ->select([
                'id_empresa',
                'nombre',
                'nif',
                'email',
                'telefono',
                'fecha_creacion'
            ])
            ->orderBy('fecha_creacion', 'desc')
            ->get();

        return response()->json($companies);
    }

    /**
     * Almacena una nueva empresa en la base de datos.
     * Solo accesible por SuperAdmin (gestionado por ruta/middleware).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:150',
            'nif' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:20',
            'email_recordatorios' => 'nullable|email|max:150',
            'telefono_recordatorios' => 'nullable|string|max:20',
            'nombre_remitente' => 'nullable|string|max:150',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $company = Company::create($request->all());

        return response()->json([
            'message' => 'Empresa creada exitosamente.',
            'company' => $company
        ], 201);
    }

    /**
     * Muestra la empresa especificada.
     */
    public function show(string $id)
    {
        $company = Company::find($id);

        if (!$company) {
            return response()->json(['message' => 'Empresa no encontrada'], 404);
        }

        return response()->json($company);
    }
}
