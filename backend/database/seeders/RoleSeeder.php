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
        // Verificar si ya existen los roles básicos
        $count = DB::table('Roles')->count();

        if ($count == 0) {
            // Primera vez: insertar todos los roles
            DB::table('Roles')->insert([
                ['nombre_role' => 'superadmin', 'descripcion' => 'Superadministrador del sistema con acceso total', 'tipo' => 'empleado'],
                ['nombre_role' => 'admin', 'descripcion' => 'Administrador del sistema', 'tipo' => 'empleado'],
                ['nombre_role' => 'usuario', 'descripcion' => 'Usuario estándar', 'tipo' => 'usuario']
            ]);
        } else {
            // Verificar si existe superadmin
            $superadminExists = DB::table('Roles')->where('nombre_role', 'superadmin')->exists();

            if (!$superadminExists) {
                // Añadir solo superadmin
                DB::table('Roles')->insert([
                    'nombre_role' => 'superadmin',
                    'descripcion' => 'Superadministrador del sistema con acceso total',
                    'tipo' => 'empleado'
                ]);
                $this->command->info('Rol superadmin creado.');
            }
        }
    }
}
