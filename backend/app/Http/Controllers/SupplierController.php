<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query();

        if ($request->has('company_id') && !empty($request->company_id)) {
            $query->where('id_empresa', $request->company_id);
        }

        $suppliers = $query
            ->orderBy('fecha_creacion', 'desc')
            ->get();

        return response()->json($suppliers);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empresa' => 'required|integer|exists:Empresas,id_empresa',
            'nombre' => 'required|string|max:150',
            'contacto' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $supplier = Supplier::create($validator->validated());

        return response()->json($supplier, 201);
    }

    public function show($id)
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return response()->json(['message' => 'Proveedor no encontrado'], 404);
        }

        return response()->json($supplier);
    }

    public function update(Request $request, $id)
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return response()->json(['message' => 'Proveedor no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'id_empresa' => 'sometimes|integer|exists:Empresas,id_empresa',
            'nombre' => 'sometimes|string|max:150',
            'contacto' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $supplier->update($validator->validated());

        return response()->json($supplier);
    }

    public function destroy($id)
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return response()->json(['message' => 'Proveedor no encontrado'], 404);
        }

        $supplier->delete();

        return response()->json(['message' => 'Proveedor eliminado']);
    }
}
