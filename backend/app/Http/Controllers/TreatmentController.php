<?php

namespace App\Http\Controllers;

use App\Models\Treatment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TreatmentController extends Controller
{
    /** Lista todos los tratamientos */
    public function index()
    {
        return response()->json(Treatment::all());
    }

    /** Crea un tratamiento nuevo */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empresa' => 'required|integer',
            'nombre_tratamiento' => 'required|string|max:150',
            'precio' => 'numeric|min:0',
            'duracion_minima' => 'nullable|integer|min:5'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $treatment = Treatment::create($request->all());
        return response()->json($treatment, 201);
    }

    /** Muestra un tratamiento por id */
    public function show($id)
    {
        $treatment = Treatment::find($id);
        if (!$treatment)
            return response()->json(['message' => 'Not found'], 404);
        return response()->json($treatment);
    }

    /** Actualiza un tratamiento */
    public function update(Request $request, $id)
    {
        $treatment = Treatment::find($id);
        if (!$treatment)
            return response()->json(['message' => 'Not found'], 404);

        $validator = Validator::make($request->all(), [
            'nombre_tratamiento' => 'sometimes|required|string|max:150',
            'precio' => 'numeric|min:0',
            'duracion_minima' => 'nullable|integer|min:5'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $treatment->update($request->all());
        return response()->json($treatment);
    }

    /** Borra un tratamiento */
    public function destroy($id)
    {
        $treatment = Treatment::find($id);
        if (!$treatment)
            return response()->json(['message' => 'Not found'], 404);

        $treatment->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
