<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $patient = \App\Models\Patient::create([
        'nombre' => 'Amedín',
        'apellido' => 'Aguado',
        'telefono' => '637683117',
        'fecha_nacimiento' => '2009-12-29',
        'email' => 'profesionalemailame@gmail.com',
        'direccion' => 'Calle Boedo n1 bajo derecha',
        'historial_medico' => 'x',
        'id_empresa' => 1,
        'id_clinica' => null,
        'id_usuario' => null
    ]);

    echo "✅ SUCCESS: Patient created with ID: " . $patient->id_paciente . "\n";
    echo "   Name: " . $patient->nombre . " " . $patient->apellido . "\n";
    echo "   Email: " . $patient->email . "\n";

    // Clean up
    $patient->delete();
    echo "   (Test patient deleted)\n";

} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    if ($e instanceof \Illuminate\Database\QueryException) {
        echo "   SQL: " . $e->getSql() . "\n";
        echo "   Bindings: " . json_encode($e->getBindings()) . "\n";
    }
    echo "\n   Full trace:\n";
    echo $e->getTraceAsString() . "\n";
}
