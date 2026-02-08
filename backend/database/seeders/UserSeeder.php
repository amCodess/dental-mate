<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Verificar si ya existe el superadmin
        $existingUser = DB::table('Usuarios')->where('email', 'admin@dentalmate.com')->exists();

        if ($existingUser) {
            $this->command->info('El usuario superadmin ya existe. Actualizando contraseña...');
            DB::table('Usuarios')->where('email', 'admin@dentalmate.com')->update([
                'password' => Hash::make('Admin123!'),
                'updated_at' => now(),
            ]);
            return;
        }

        // Crear empresa demo si no existe
        $empresa = DB::table('Empresas')->where('nombre', 'DentalMate HQ')->first();

        if (!$empresa) {
            $empresaId = DB::table('Empresas')->insertGetId([
                'nombre' => 'DentalMate HQ',
                'nif' => 'A12345678',
                'email' => 'info@dentalmate.com',
                'telefono' => '+34 900 123 456',
                'fecha_creacion' => now(),
                'updated_at' => now(),
                'deleted' => false
            ]);
        } else {
            $empresaId = $empresa->id_empresa;
        }

        // Crear clínica demo si no existe
        $clinica = DB::table('Clinicas')->where('nombre', 'Clínica Central')->where('id_empresa', $empresaId)->first();

        if (!$clinica) {
            $clinicaId = DB::table('Clinicas')->insertGetId([
                'id_empresa' => $empresaId,
                'nombre' => 'Clínica Central',
                'telefono' => '+34 900 123 456',
                'email_recordatorios' => 'recordatorios@dentalmate.com',
                'direccion' => 'Calle Principal, 123, Madrid',
                'fecha_creacion' => now(),
                'updated_at' => now(),
                'deleted' => false
            ]);
        } else {
            $clinicaId = $clinica->id_clinica;
        }

        // Crear usuario superadmin
        $passwordHash = Hash::make('Admin123!');

        $userId = DB::table('Usuarios')->insertGetId([
            'nombre' => 'Super',
            'apellido' => 'Admin',
            'email' => 'admin@dentalmate.com',
            'password' => $passwordHash,
            'estado' => 'activo',
            'is_superadmin' => true,

            'fecha_creacion' => now(),
            'updated_at' => now(),
            'deleted' => false
        ]);

        // Asociar usuario a empresa
        DB::table('Usuarios_Empresas')->insert([
            'id_usuario' => $userId,
            'id_empresa' => $empresaId,
            'fecha_creacion' => now(),
            'updated_at' => now()
        ]);

        // Asociar usuario a clínica
        DB::table('Usuarios_Clinicas')->insert([
            'id_empresa' => $empresaId,
            'id_usuario' => $userId,
            'id_clinica' => $clinicaId,
            'fecha_creacion' => now(),
            'updated_at' => now()
        ]);

        // Crear empleado asociado
        DB::table('Empleados')->insert([
            'id_empresa' => $empresaId,
            'id_clinica' => $clinicaId,
            'id_usuario' => $userId,
            'especialidad' => 'Administración',
            'fecha_creacion' => now(),
            'updated_at' => now()
        ]);

        $this->command->info('Usuario superadmin creado exitosamente:');
        $this->command->info('Email: admin@dentalmate.com');
        $this->command->info('Password: Admin123!');
        $this->command->warn('IMPORTANTE: Cambia la contraseña después del primer login.');
    }
}
