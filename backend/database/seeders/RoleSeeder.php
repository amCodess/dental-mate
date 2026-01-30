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
        // Verificar si ya existen para evitar duplicados si se corre varias veces
        if (DB::table('Roles')->count() == 0) {
            DB::table('Roles')->insert([
                [
                    'nombre_role' => 'admin',
                    'descripcion' => 'Administrador del sistema',
                    'tipo' => 'empleado'
                ],
                [
                    'nombre_role' => 'usuario',
                    'descripcion' => 'Usuario estándar',
                    'tipo' => 'usuario'
                ]
            ]);
        }
    }
}
