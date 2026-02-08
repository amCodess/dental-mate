<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $includeDeleted = request()->boolean('include_deleted', false);

        $query = Appointment::with(['patient', 'invoice']);

        if ($includeDeleted) {
            $query->withTrashed();
        }

        if (request()->has('company_id')) {
            $query->where('id_empresa', request()->get('company_id'));
        }

        if (request()->has('clinic_id')) {
            $query->where(function ($q) {
                $clinic = request()->get('clinic_id');
                $q->where('id_clinica', $clinic);
            });
        }

        $appointments = $query->get();
        return response()->json($appointments);
    }

    /**
     * Check availability for a slot.
     */
    public function availability(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fecha' => 'required|date',
            'hora' => 'required',
            'id_empleado' => 'required|integer',
            'id_empresa' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Simple conflict check: same employee, same date, approximate time
        // This should be enhanced with the actual "start_ts" and "end_ts" overlap logic from SQL
        $exists = Appointment::where('id_empresa', $request->id_empresa)
            ->where('id_empleado', $request->id_empleado)
            ->where('fecha', $request->fecha)
            ->where('hora', $request->hora)
            ->exists();

        return response()->json(['available' => !$exists]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_empresa' => 'required|integer',
            'id_paciente' => 'required|integer|exists:Pacientes,id_paciente',
            'id_empleado' => 'required|integer', // exists:Empleados,id_empleado
            'fecha' => 'required|date',
            'hora' => 'required',
            'duracion_minutos' => 'integer|min:5',
            'motivo' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $appointment = Appointment::create($request->all());

        return response()->json($appointment, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $appointment = Appointment::with('patient')->find($id);

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        return response()->json($appointment);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $appointment = Appointment::find($id);
        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'motivo' => 'nullable|string|max:255'
        ]);
        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $appointment->update($request->all());

        // Autogenerar factura al completar y marcar como pagado si aún no existe
        $estado = $request->input('estado', $appointment->estado);
        $pagoStatus = $request->input('pago_status', $appointment->pago_status ?? null);

        if ($estado === 'Completada' && $pagoStatus === 'Pagado') {
            $existingInvoice = Invoice::where('id_cita', $appointment->id_cita)->first();
            if (!$existingInvoice) {
                $importe = $request->input('precio');
                $clinicForInvoice = $appointment->id_clinica
                    ?? optional($appointment->patient)->id_clinica
                    ?? optional($appointment->patient)->clinic_id
                    ?? $request->input('id_clinica');
                // fallback a importe 0 si no viene precio; no bloqueamos la creación
                $invoice = Invoice::create([
                    'id_empresa'   => $appointment->id_empresa,
                    'id_clinica'   => $clinicForInvoice,
                    'id_paciente'  => $appointment->id_paciente,
                    'id_cita'      => $appointment->id_cita,
                    'importe_total'=> $request->input('importe_total', $importe !== null ? floatval($importe) : 0),
                    'tipo_pago'    => $request->input('tipo_pago', 'Efectivo'),
                    'pago_status'  => 'Pagado',
                    'fecha_emision'=> $appointment->fecha ?? now()->toDateString()
                ]);
                // Adjuntar factura al response
                $appointment->setRelation('invoice', $invoice);
            }
        }

        return response()->json($appointment);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $appointment = Appointment::find($id);
        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        // No permitir eliminar citas completadas ni pagadas
        if ($appointment->estado === 'Completada') {
            return response()->json(['message' => 'No se puede eliminar una cita completada.'], 400);
        }
        $invoice = Invoice::where('id_cita', $appointment->id_cita)->first();
        if ($invoice && $invoice->pago_status === 'Pagado') {
            return response()->json(['message' => 'No se puede eliminar una cita pagada.'], 400);
        }
        // Soft delete respecting check constraint (deleted=true when deleted_at is set)
        $appointment->forceFill([
            'deleted' => true,
            'deleted_at' => now()
        ])->save();

        return response()->json(['message' => 'Appointment deleted']);
    }
}
