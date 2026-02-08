<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSuperAdmin
{
    /**
     * Gestiona una solicitud entrante.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        if (!$user->is_superadmin) {
            return response()->json(['message' => 'Acceso denegado. Se requieren permisos de Super Admin.'], 403);
        }

        return $next($request);
    }
}
