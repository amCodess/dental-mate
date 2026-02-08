<?php

namespace App\Http\Controllers;

use App\Models\Treatment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TreatmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Treatment::all());
    }

    /**
     * Store a newly created resource in storage.
     */
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

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $treatment = Treatment::find($id);
        if (!$treatment)
            return response()->json(['message' => 'Not found'], 404);
        return response()->json($treatment);
    }

    /**
     * Update the specified resource in storage.
     */
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $treatment = Treatment::find($id);
        if (!$treatment)
            return response()->json(['message' => 'Not found'], 404);

        $treatment->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
