<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\TreatmentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\NotificationController;

Route::prefix('v1')->group(function () {

    // Auth Public Routes
    Route::get('test', function() { return response()->json(['status' => 'ok', 'db' => DB::connection()->getDatabaseName()]); });
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);

    // Protected Routes
    Route::middleware('auth:api')->group(function () {

        // Auth Management
        Route::post('auth/refresh', [AuthController::class, 'refresh']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/me', [AuthController::class, 'me']);

        // Resources
        Route::apiResource('patients', PatientController::class);
        Route::apiResource('appointments', AppointmentController::class);
        Route::get('appointments/availability', [AppointmentController::class, 'availability']); // Custom extra route

        Route::apiResource('treatments', TreatmentController::class);

        Route::apiResource('invoices', InvoiceController::class);
        Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf']);

        Route::apiResource('notifications', NotificationController::class)->only(['index', 'store']);
        Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    });
});
