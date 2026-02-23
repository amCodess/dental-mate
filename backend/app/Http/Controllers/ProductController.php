<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->has('company_id') && !empty($request->company_id)) {
            $query->where('id_empresa', $request->company_id);
        }

        $products = $query
            ->orderBy('fecha_creacion', 'desc')
            ->get();

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empresa' => 'required|integer|exists:Empresas,id_empresa',
            'nombre_producto' => 'required|string|max:150',
            'precio' => 'nullable|numeric|min:0',
            'coste' => 'nullable|numeric|min:0',
            'vendible' => 'nullable|boolean',
            'stock_actual' => 'nullable|integer|min:0',
            'stock_minimo' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $product = Product::create($validator->validated());

        return response()->json($product, 201);
    }

    public function show($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'id_empresa' => 'sometimes|integer|exists:Empresas,id_empresa',
            'nombre_producto' => 'sometimes|string|max:150',
            'precio' => 'nullable|numeric|min:0',
            'coste' => 'nullable|numeric|min:0',
            'vendible' => 'nullable|boolean',
            'stock_actual' => 'nullable|integer|min:0',
            'stock_minimo' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $product->update($validator->validated());

        return response()->json($product);
    }

    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        $product->delete();

        return response()->json(['message' => 'Producto eliminado']);
    }
}
