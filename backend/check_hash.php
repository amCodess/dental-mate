<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'admin@dentalmate.com')->first();
if (!$user) {
    echo "User not found\n";
    exit(1);
}

echo "Current Hash: " . $user->password . "\n";
$check = \Illuminate\Support\Facades\Hash::check('Admin123!', $user->password);
echo "Hash Check (Admin123!): " . ($check ? "TRUE" : "FALSE") . "\n";
