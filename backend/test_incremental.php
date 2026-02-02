<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== TEST 1: Minimal required fields ===\n";
try {
    $p1 = \App\Models\Patient::create([
        'nombre' => 'Test',
        'apellido' => 'Minimal',
        'id_empresa' => 1
    ]);
    echo "✅ SUCCESS with minimal fields! ID: " . $p1->id_paciente . "\n";
    $p1->delete();
} catch (\Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    if ($e instanceof \Illuminate\Database\QueryException) {
        echo "   SQL: " . $e->getSql() . "\n";
    }
}

echo "\n=== TEST 2: Adding email ===\n";
try {
    $p2 = \App\Models\Patient::create([
        'nombre' => 'Test',
        'apellido' => 'WithEmail',
        'id_empresa' => 1,
        'email' => 'test@test.com'
    ]);
    echo "✅ SUCCESS with email! ID: " . $p2->id_paciente . "\n";
    $p2->delete();
} catch (\Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    if ($e instanceof \Illuminate\Database\QueryException) {
        echo "   SQL: " . $e->getSql() . "\n";
    }
}

echo "\n=== TEST 3: Full user data ===\n";
try {
    $p3 = \App\Models\Patient::create([
        'nombre' => 'Amedín',
        'apellido' => 'Aguado',
        'telefono' => '637683117',
        'fecha_nacimiento' => '2009-12-29',
        'email' => 'profesionalemailame@gmail.com',
        'direccion' => 'Calle Boedo n1 bajo derecha',
        'historial_medico' => 'x',
        'id_empresa' => 1
    ]);
    echo "✅ SUCCESS with full data! ID: " . $p3->id_paciente . "\n";
    $p3->delete();
} catch (\Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    if ($e instanceof \Illuminate\Database\QueryException) {
        echo "   SQL: " . $e->getSql() . "\n";
        echo "   Bindings: " . json_encode($e->getBindings()) . "\n";
    }
}
