<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /** Registrar servicios de la app */
    public function register(): void
    {
        // aquí no registramos nada extra
    }

    /** Arrancar servicios de la app */
    public function boot(): void
    {
        // sin ajustes extra al arrancar
    }
}
