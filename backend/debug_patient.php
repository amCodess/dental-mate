<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Patient;
use Illuminate\Support\Facades\Schema;

echo "Checking Patient Model...\n";
try {
    $columns = Schema::getColumnListing('Pacientes');
    echo "Columns in Pacientes table: " . implode(', ', $columns) . "\n";

    if (!in_array('nombre', $columns)) {
        echo "ERROR: 'nombre' column missing!\n";
    }
    if (!in_array('apellido', $columns)) {
        echo "ERROR: 'apellido' column missing!\n";
    }

    echo "Attempting to create generic patient...\n";
    $p = new Patient();
    $p->id_empresa = 1;
    $p->nombre = 'Test';
    $p->apellido = 'Debug';
    $p->save();
    echo "Created Patient ID: " . $p->id_paciente . "\n";

    echo "Attempting to delete...\n";
    $p->delete();
    echo "Deleted successfully.\n";

} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
