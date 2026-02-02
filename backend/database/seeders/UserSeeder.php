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
        $existingUser = DB::selectOne('SELECT COUNT(*) as count FROM "Usuarios" WHERE email = ?', ['admin@dentalmate.com']);
        
        if ($existingUser->count > 0) {
            $this->command->info('El usuario superadmin ya existe.');
            return;
        }

        // Crear empresa demo si no existe
        $empresa = DB::selectOne('SELECT id_empresa FROM "Empresas" WHERE nombre = ?', ['DentalMate HQ']);
        
        if (!$empresa) {
            DB::insert('INSERT INTO "Empresas" (nombre, nif, email, telefono, fecha_creacion, updated_at, deleted) 
                VALUES (?, ?, ?, ?, NOW(), NOW(), false) RETURNING id_empresa', [
                'DentalMate HQ',
                'A12345678',
                'info@dentalmate.com',
                '+34 900 123 456'
            ]);
            $empresa = DB::selectOne('SELECT id_empresa FROM "Empresas" WHERE nombre = ?', ['DentalMate HQ']);
        }
        
        $empresaId = $empresa->id_empresa;

        // Crear clínica demo si no existe
        $clinica = DB::selectOne('SELECT id_clinica FROM "Clinicas" WHERE nombre = ? AND id_empresa = ?', ['Clínica Central', $empresaId]);
        
        if (!$clinica) {
            DB::insert('INSERT INTO "Clinicas" (id_empresa, nombre, telefono, email_recordatorios, direccion, fecha_creacion, updated_at, deleted) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW(), false) RETURNING id_clinica', [
                $empresaId,
                'Clínica Central',
                '+34 900 123 456',
                'recordatorios@dentalmate.com',
                'Calle Principal, 123, Madrid'
            ]);
            $clinica = DB::selectOne('SELECT id_clinica FROM "Clinicas" WHERE nombre = ? AND id_empresa = ?', ['Clínica Central', $empresaId]);
        }
        
        $clinicaId = $clinica->id_clinica;

        // Obtener el id del rol superadmin
        $role = DB::selectOne('SELECT id_role FROM "Roles" WHERE nombre_role = ?', ['superadmin']);
        
        if (!$role) {
            $this->command->error('El rol superadmin no existe. Ejecuta RoleSeeder primero.');
            return;
        }
        
        $roleId = $role->id_role;

        // Crear usuario superadmin
        $passwordHash = Hash::make('Admin123!');
        
        DB::insert('INSERT INTO "Usuarios" (nombre, apellido, email, password, estado, id_role, fecha_creacion, updated_at, deleted) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), false) RETURNING id_usuario', [
            'Super',
            'Admin',
            'admin@dentalmate.com',
            $passwordHash,
            'activo',
            $roleId
        ]);
        
        $user = DB::selectOne('SELECT id_usuario FROM "Usuarios" WHERE email = ?', ['admin@dentalmate.com']);
        $userId = $user->id_usuario;

        // Asociar usuario a empresa con rol owner
        DB::insert('INSERT INTO "Usuarios_Empresas" (id_usuario, id_empresa, rol, fecha_creacion, updated_at) 
            VALUES (?, ?, ?, NOW(), NOW())', [
            $userId,
            $empresaId,
            'owner'
        ]);

        // Asociar usuario a clínica con rol owner
        DB::insert('INSERT INTO "Usuarios_Clinicas" (id_empresa, id_usuario, id_clinica, rol, fecha_creacion, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW())', [
            $empresaId,
            $userId,
            $clinicaId,
            'owner'
        ]);

        // Crear empleado asociado
        DB::insert('INSERT INTO "Empleados" (id_empresa, id_clinica, id_usuario, especialidad, fecha_creacion, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW())', [
            $empresaId,
            $clinicaId,
            $userId,
            'Administración'
        ]);

        $this->command->info('Usuario superadmin creado exitosamente:');
        $this->command->info('Email: admin@dentalmate.com');
        $this->command->info('Password: Admin123!');
        $this->command->warn('IMPORTANTE: Cambia la contraseña después del primer login.');
    }
}
