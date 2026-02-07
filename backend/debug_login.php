<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Config auth.defaults.guard: " . config('auth.defaults.guard') . "\n";
echo "Config auth.guards.api.driver: " . config('auth.guards.api.driver') . "\n";
echo "Config auth.guards.api.provider: " . config('auth.guards.api.provider') . "\n";
echo "Config auth.providers.users.model: " . config('auth.providers.users.model') . "\n";

$credentials = ['email' => 'admin@dentalmate.com', 'password' => 'Admin123!'];
echo "Attempting login with: " . json_encode($credentials) . "\n";

try {
    $token = auth('api')->attempt($credentials);
    echo "Token result: ";
    var_dump($token);
} catch (\Exception $e) {
    echo "Exception during attempt: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
