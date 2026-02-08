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
        $query = Invoice::query()
            ->select([
                'id_factura',
                'id_empresa',
                'id_clinica',
                'id_paciente',
                'id_cita',
                'fecha_emision',
                'importe_total',
                'tipo_pago',
                'pago_status',
                'fecha_creacion'
            ])
            ->with(['patient:id_paciente,nombre,apellido,id_clinica']);

        if (request()->has('company_id')) {
            $query->where('id_empresa', request()->get('company_id'));
        }

        if (request()->has('clinic_id')) {
            $clinic = request()->get('clinic_id');
            // Incluimos facturas asociadas directamente a la clínica
            // o facturas sin clínica explícita pero cuyo paciente pertenece a la clínica.
            $query->where(function ($q) use ($clinic) {
                $q->where('id_clinica', $clinic)
                  ->orWhereHas('patient', function ($qp) use ($clinic) {
                      $qp->where(function ($qq) use ($clinic) {
                          $qq->where('id_clinica', $clinic)
                             ->orWhere('clinic_id', $clinic);
                      });
                  });
            });
        }

        $invoices = $query->orderBy('fecha_emision', 'desc')->get();
        return response()->json($invoices);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!$request->filled('fecha_emision')) {
            $request->merge(['fecha_emision' => now()->toDateString()]);
        }

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
        $invoice = Invoice::with(['patient:id_paciente,nombre,apellido'])->find($id);
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
