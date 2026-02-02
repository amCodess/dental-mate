<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CHECKING PACIENTES TABLE SCHEMA ===\n\n";

try {
    $cols = \Illuminate\Support\Facades\DB::select(
        "SELECT column_name FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position",
        ['Pacientes']
    );

    echo "Columns in Pacientes table:\n";
    foreach ($cols as $col) {
        echo "  - " . $col->column_name . "\n";
    }

} catch (\Exception $e) {
    echo "ERROR checking schema: " . $e->getMessage() . "\n";
}
