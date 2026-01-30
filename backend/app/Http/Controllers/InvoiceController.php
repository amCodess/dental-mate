<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $invoices = Invoice::with('patient')->paginate(10);
        return response()->json($invoices);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empresa' => 'required|integer',
            'id_paciente' => 'required|integer',
            'fecha_emision' => 'required|date',
            'importe_total' => 'required|numeric',
            'tipo_pago' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $invoice = Invoice::create($request->all());
        return response()->json($invoice, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $invoice = Invoice::with('patient')->find($id);
        if (!$invoice) return response()->json(['message' => 'Not found'], 404);
        return response()->json($invoice);
    }

    /**
     * Generate and download PDF.
     */
    public function downloadPdf($id)
    {
        $invoice = Invoice::with('patient')->find($id);
        
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        // Simple view for PDF. In a real app, create resources/views/invoices/pdf.blade.php
        $pdf = Pdf::loadHTML("<h1>Factura #{$invoice->id_factura}</h1><p>Paciente: {$invoice->patient->nombre}</p><p>Importe: {$invoice->importe_total}</p>");
        
        return $pdf->download("factura_{$invoice->id_factura}.pdf");
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $invoice = Invoice::find($id);
        if (!$invoice) return response()->json(['message' => 'Not found'], 404);

        $invoice->update($request->all());
        return response()->json($invoice);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $invoice = Invoice::find($id);
        if (!$invoice) return response()->json(['message' => 'Not found'], 404);
        
        $invoice->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
