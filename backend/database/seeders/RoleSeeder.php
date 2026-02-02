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
        $count = DB::selectOne('SELECT COUNT(*) as count FROM "Roles"')->count;
        
        if ($count == 0) {
            // Primera vez: insertar todos los roles
            DB::insert('INSERT INTO "Roles" (nombre_role, descripcion, tipo) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)', [
                'superadmin', 'Superadministrador del sistema con acceso total', 'empleado',
                'admin', 'Administrador del sistema', 'empleado',
                'usuario', 'Usuario estándar', 'usuario'
            ]);
        } else {
            // Verificar si existe superadmin
            $superadminExists = DB::selectOne('SELECT COUNT(*) as count FROM "Roles" WHERE nombre_role = ?', ['superadmin'])->count;
            
            if ($superadminExists == 0) {
                // Añadir solo superadmin
                DB::insert('INSERT INTO "Roles" (nombre_role, descripcion, tipo) VALUES (?, ?, ?)', [
                    'superadmin', 'Superadministrador del sistema con acceso total', 'empleado'
                ]);
                $this->command->info('Rol superadmin creado.');
            }
        }
    }
}
