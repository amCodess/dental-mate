<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rolesBase = [
            ['nombre_role' => 'superadmin', 'descripcion' => 'Superadministrador del sistema con acceso total', 'tipo' => 'sistema'],
            ['nombre_role' => 'admin', 'descripcion' => 'Administrador del sistema', 'tipo' => 'empleado'],
            ['nombre_role' => 'empleado', 'descripcion' => 'Empleado de la clínica', 'tipo' => 'empleado'],
            ['nombre_role' => 'usuario', 'descripcion' => 'Usuario estándar', 'tipo' => 'usuario']
        ];

        $existingRoles = DB::table('Roles')
            ->pluck('nombre_role')
            ->map(fn ($role) => strtolower(trim($role)))
            ->toArray();

        $missingRoles = array_filter($rolesBase, function ($role) use ($existingRoles) {
            return !in_array($role['nombre_role'], $existingRoles, true);
        });

        if (!empty($missingRoles)) {
            DB::table('Roles')->insert(array_values($missingRoles));
            $this->command->info('Roles base creados o actualizados.');
        }

        DB::table('Roles')
            ->where('nombre_role', 'superadmin')
            ->where('tipo', '<>', 'sistema')
            ->update(['tipo' => 'sistema']);
    }
}
