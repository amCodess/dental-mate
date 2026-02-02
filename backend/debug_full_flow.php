<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Invoice;
use App\Models\Appointment;
use App\Models\Patient;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "=== START DEBUG FLOW ===\n";

try {
    // 1. Check Pre-requisites
    echo "\n[1] Checking Empirical Data:\n";
    $empresa = DB::table('Empresas')->where('id_empresa', 1)->first();
    echo "Empresa ID 1: " . ($empresa ? "OK" : "MISSING") . "\n";

    $paciente = Patient::first();
    if (!$paciente) {
        echo "No patients found. Creating one...\n";
        $paciente = Patient::create([
            'id_empresa' => 1,
            'nombre' => 'Debug',
            'apellido' => 'User',
            'email' => 'debug@test.com'
        ]);
    }
    echo "Patient ID: " . $paciente->id_paciente . "\n";

    $empleado = DB::table('Empleados')->where('id_empleado', 1)->first();
    echo "Empleado ID 1: " . ($empleado ? "OK" : "MISSING") . "\n";
    if (!$empleado) {
        echo "Creating dummy Empleado ID 1 linked to User ID 1 ??\n";
        // Check if user 1 exists
        $user = DB::table('Usuarios')->find(1);
        if ($user) {
            try {
                DB::table('Empleados')->insert([
                    'id_empleado' => 1,
                    'id_empresa' => 1,
                    'id_usuario' => 1,
                    'especialidad' => 'General'
                ]);
                echo "Created Empleado ID 1.\n";
            } catch (\Exception $e) {
                echo "Could not create Empleado: " . $e->getMessage() . "\n";
            }
        } else {
            echo "User ID 1 MISSING. Cannot create Empleado.\n";
        }
    }

    // 2. Check Appointment Creation
    echo "\n[2] Testing Appointment Creation...\n";
    try {
        // Randomize time to avoid overlap constraint
        $hour = rand(8, 18);
        $apt = Appointment::create([
            'id_empresa' => 1,
            'id_paciente' => $paciente->id_paciente,
            'id_empleado' => 1,
            'fecha' => date('Y-m-d', strtotime('+' . rand(1, 10) . ' days')),
            'hora' => sprintf('%02d:00', $hour),
            'duracion_minutos' => 30,
            'estado' => 'Pendiente',
            'tipo' => 'Normal',
            'prioridad' => 'Media'
        ]);
        echo "SUCCESS: Appointment Created ID: " . $apt->id_cita . "\n";
        // Do not delete immediately to check persistence if needed, or delete.
        $apt->delete();
    } catch (\Exception $e) {
        echo "FAILURE: Appointment Error: " . $e->getMessage() . "\n";
    }

    // 3. Check Invoice Creation
    echo "\n[3] Testing Invoice Creation...\n";
    try {
        $inv = Invoice::create([
            'id_empresa' => 1,
            'id_paciente' => $paciente->id_paciente,
            'fecha_emision' => date('Y-m-d'),
            'importe_total' => 100.50,
            'tipo_pago' => 'Efectivo',
            'pago_status' => 'Pendiente'
        ]);
        echo "SUCCESS: Invoice Created ID: " . $inv->id_factura . "\n";
        $inv->delete();
    } catch (\Exception $e) {
        echo "FAILURE: Invoice Error: " . $e->getMessage() . "\n";
    }

} catch (\Exception $e) {
    echo "FATAL EXCEPTION: " . $e->getMessage() . "\n";
}
echo "\n=== END DEBUG FLOW ===\n";
