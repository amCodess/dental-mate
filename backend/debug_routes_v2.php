<?php

use App\Models\User;
use App\Models\Role;
use App\Models\Company;
use App\Models\Clinic;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- DEBUG START ---\n";

// 1. Test Company Show
$company = Company::first();
if ($company) {
    echo "Found Company ID: " . $company->id_empresa . "\n";
    // Simulate Show
    $found = Company::find($company->id_empresa);
    echo "Company Show Result: " . ($found ? 'OK' : 'FAIL') . "\n";
} else {
    echo "No companies found to test.\n";
}

// 2. Test User Filter (role_in)
$admins = User::whereHas('role', function ($q) {
    $q->whereIn('nombre_role', ['admin', 'superadmin']);
})->get();

echo "Found " . $admins->count() . " admins/superadmins via Eloquent directly.\n";

// 3. Test Clinic Filter (company_id)
if ($company) {
    $clinics = Clinic::where('id_empresa', $company->id_empresa)->get();
    echo "Found " . $clinics->count() . " clinics for company " . $company->id_empresa . ".\n";
}

echo "--- DEBUG END ---\n";
