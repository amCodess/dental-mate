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
        $existingUser = DB::table('users')->where('email', 'admin@dentalmate.com')->exists();

        if ($existingUser) {
            $this->command->info('El usuario superadmin ya existe. Actualizando contraseña...');
            DB::table('users')->where('email', 'admin@dentalmate.com')->update([
                'password' => Hash::make('Admin123!'),
                'updated_at' => now(),
            ]);
            return;
        }

        // Crear empresa demo si no existe
        $empresa = DB::table('empresas')->where('nombre', 'DentalMate HQ')->first();

        if (!$empresa) {
            $empresaId = DB::table('empresas')->insertGetId([
                'nombre' => 'DentalMate HQ',
                'nif' => 'A12345678',
                'email' => 'info@dentalmate.com',
                'telefono' => '+34 900 123 456',
                'fecha_creacion' => now(),
                'updated_at' => now(),
                'deleted' => false
            ]);
        } else {
            $empresaId = $empresa->id;
        }

        // Crear clínica demo si no existe
        $clinica = DB::table('clinicas')->where('nombre', 'Clínica Central')->where('id_empresa', $empresaId)->first();

        if (!$clinica) {
            $clinicaId = DB::table('clinicas')->insertGetId([
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
            $clinicaId = $clinica->id;
        }

        // Obtener el id del rol superadmin
        $role = DB::table('roles')->where('nombre_role', 'superadmin')->first();

        if (!$role) {
            $this->command->error('El rol superadmin no existe. Ejecuta RoleSeeder primero.');
            return;
        }

        $roleId = $role->id; // En migration pusimos ->id(), no id_role (aunque en vieja era id_role, aqui estandarizamos a id)
        // WAIT: In recent migration 000000, I used $table->id(); for roles. So the column is 'id'.
        // In previous seeder it used id_role. I need to be careful.
        // My migration 000000: Schema::create('roles'... $table->id()...) -> creates 'id'.
        // So here usage of $role->id is correct.

        // Crear usuario superadmin
        $passwordHash = Hash::make('Admin123!');

        $userId = DB::table('users')->insertGetId([
            'name' => 'Super',
            'apellido' => 'Admin',
            'email' => 'admin@dentalmate.com',
            'password' => $passwordHash,
            'estado' => 'activo',
            'id_role' => $roleId,

            'created_at' => now(),
            'updated_at' => now(),
            'deleted' => false
        ]);

        // Asociar usuario a empresa con rol owner
        DB::table('usuarios_empresas')->insert([
            'id_usuario' => $userId,
            'id_empresa' => $empresaId,
            'rol' => 'owner',
            'fecha_creacion' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Asociar usuario a clínica con rol owner
        DB::table('usuarios_clinicas')->insert([
            'id_empresa' => $empresaId,
            'id_usuario' => $userId,
            'id_clinica' => $clinicaId,
            'rol' => 'owner',
            'fecha_creacion' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Crear empleado asociado
        DB::table('empleados')->insert([
            'id_empresa' => $empresaId,
            'id_clinica' => $clinicaId,
            'id_usuario' => $userId,
            'especialidad' => 'Administración',
            'fecha_creacion' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $this->command->info('Usuario superadmin creado exitosamente:');
        $this->command->info('Email: admin@dentalmate.com');
        $this->command->info('Password: Admin123!');
        $this->command->warn('IMPORTANTE: Cambia la contraseña después del primer login.');
    }
}
