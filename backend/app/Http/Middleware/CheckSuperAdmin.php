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
        // Verifica si existe usuario autenticado y si tiene rol
        if (!$request->user() || !$request->user()->role) {
            return response()->json(['message' => 'No autorizado. Rol no encontrado.'], 403);
        }

        // Verifica estrictamente el nombre del rol
        if ($request->user()->role->nombre_role !== 'superadmin') {
            return response()->json(['message' => 'Acceso denegado. Se requieren permisos de Super Admin.'], 403);
        }

        return $next($request);
    }
}
