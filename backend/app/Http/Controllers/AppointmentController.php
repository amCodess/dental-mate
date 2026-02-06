<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $appointments = Appointment::with(['patient'])->get();
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
            'duracion_minutos' => 'integer|min:5'
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
        $appointment->update($request->all());
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
        $appointment->delete();
        return response()->json(['message' => 'Appointment deleted']);
    }
}
