<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== DIAGNOSTIC TEST ===\n";

// Test 1: Database Connection
try {
    $pdo = DB::connection()->getPdo();
    echo "✓ Database connection: SUCCESS\n";
    echo "  Roles count: " . DB::table('Roles')->count() . "\n";
} catch (Exception $e) {
    echo "✗ Database connection: FAILED - " . $e->getMessage() . "\n";
    exit(1);
}

// Test 2: JWT Config
$jwtSecret = config('jwt.secret');
echo "✓ JWT_SECRET: " . ($jwtSecret ? "EXISTS (" . strlen($jwtSecret) . " chars)" : "MISSING") . "\n";

// Test 3: Create User
try {
    $user = new App\Models\User();
    $user->nombre = 'DiagTest';
    $user->apellido = 'User';
    $user->email = 'diagtest' . time() . '@test.com';
    $user->password = Hash::make('123456');
    $user->id_role = 2;
    $user->estado = 'activo';
    $user->save();
    echo "✓ User creation: SUCCESS (ID: {$user->id_usuario})\n";
    
    // Test 4: JWT Token Generation
    try {
        $token = auth('api')->login($user);
        echo "✓ JWT token generation: SUCCESS\n";
    } catch (Exception $e) {
        echo "✗ JWT token generation: FAILED - " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "✗ User creation: FAILED - " . $e->getMessage() . "\n";
    echo "  Stack trace:\n";
    echo $e->getTraceAsString() . "\n";
}
