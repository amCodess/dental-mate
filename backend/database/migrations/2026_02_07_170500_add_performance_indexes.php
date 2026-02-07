<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('Usuarios')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_usuarios_email" ON "Usuarios" ("email")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_usuarios_id_role" ON "Usuarios" ("id_role")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_usuarios_deleted" ON "Usuarios" ("deleted")');
        }

        if (Schema::hasTable('Roles')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_roles_nombre_role" ON "Roles" ("nombre_role")');
        }

        if (Schema::hasTable('Pacientes')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_id_empresa" ON "Pacientes" ("id_empresa")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_id_clinica" ON "Pacientes" ("id_clinica")');
            if (Schema::hasColumn('Pacientes', 'nombre')) {
                DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_nombre" ON "Pacientes" ("nombre")');
            }
            if (Schema::hasColumn('Pacientes', 'apellido')) {
                DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_apellido" ON "Pacientes" ("apellido")');
            }
            if (Schema::hasColumn('Pacientes', 'email')) {
                DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_email" ON "Pacientes" ("email")');
            }
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_telefono" ON "Pacientes" ("telefono")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_fecha_creacion" ON "Pacientes" ("fecha_creacion" DESC)');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_deleted" ON "Pacientes" ("deleted")');
        }

        if (Schema::hasTable('Facturacion')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_facturacion_id_empresa" ON "Facturacion" ("id_empresa")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_facturacion_id_paciente" ON "Facturacion" ("id_paciente")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_facturacion_fecha_emision" ON "Facturacion" ("fecha_emision" DESC)');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_facturacion_pago_status" ON "Facturacion" ("pago_status")');
        }

        if (Schema::hasTable('Clinicas')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_clinicas_id_empresa" ON "Clinicas" ("id_empresa")');
        }

        if (Schema::hasTable('Usuarios_Clinicas')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_usuarios_clinicas_id_empresa" ON "Usuarios_Clinicas" ("id_empresa")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_usuarios_clinicas_id_usuario" ON "Usuarios_Clinicas" ("id_usuario")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_usuarios_clinicas_id_clinica" ON "Usuarios_Clinicas" ("id_clinica")');
        }

        if (Schema::hasTable('Usuarios_Empresas')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_usuarios_empresas_id_usuario" ON "Usuarios_Empresas" ("id_usuario")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_usuarios_empresas_id_empresa" ON "Usuarios_Empresas" ("id_empresa")');
        }

        if (Schema::hasTable('Citas')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_citas_id_empresa" ON "Citas" ("id_empresa")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_citas_id_paciente" ON "Citas" ("id_paciente")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_citas_id_empleado" ON "Citas" ("id_empleado")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_citas_fecha" ON "Citas" ("fecha")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_citas_deleted" ON "Citas" ("deleted")');
        }

        if (Schema::hasTable('Notificaciones')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_notificaciones_id_usuario" ON "Notificaciones" ("id_usuario")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_notificaciones_id_empresa" ON "Notificaciones" ("id_empresa")');
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_notificaciones_leida" ON "Notificaciones" ("leida")');
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS "idx_usuarios_email"');
        DB::statement('DROP INDEX IF EXISTS "idx_usuarios_id_role"');
        DB::statement('DROP INDEX IF EXISTS "idx_usuarios_deleted"');
        DB::statement('DROP INDEX IF EXISTS "idx_roles_nombre_role"');
        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_id_empresa"');
        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_id_clinica"');
        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_nombre"');
        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_apellido"');
        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_email"');
        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_telefono"');
        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_fecha_creacion"');
        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_deleted"');
        DB::statement('DROP INDEX IF EXISTS "idx_facturacion_id_empresa"');
        DB::statement('DROP INDEX IF EXISTS "idx_facturacion_id_paciente"');
        DB::statement('DROP INDEX IF EXISTS "idx_facturacion_fecha_emision"');
        DB::statement('DROP INDEX IF EXISTS "idx_facturacion_pago_status"');
        DB::statement('DROP INDEX IF EXISTS "idx_clinicas_id_empresa"');
        DB::statement('DROP INDEX IF EXISTS "idx_usuarios_clinicas_id_empresa"');
        DB::statement('DROP INDEX IF EXISTS "idx_usuarios_clinicas_id_usuario"');
        DB::statement('DROP INDEX IF EXISTS "idx_usuarios_clinicas_id_clinica"');
        DB::statement('DROP INDEX IF EXISTS "idx_usuarios_empresas_id_usuario"');
        DB::statement('DROP INDEX IF EXISTS "idx_usuarios_empresas_id_empresa"');
        DB::statement('DROP INDEX IF EXISTS "idx_citas_id_empresa"');
        DB::statement('DROP INDEX IF EXISTS "idx_citas_id_paciente"');
        DB::statement('DROP INDEX IF EXISTS "idx_citas_id_empleado"');
        DB::statement('DROP INDEX IF EXISTS "idx_citas_fecha"');
        DB::statement('DROP INDEX IF EXISTS "idx_citas_deleted"');
        DB::statement('DROP INDEX IF EXISTS "idx_notificaciones_id_usuario"');
        DB::statement('DROP INDEX IF EXISTS "idx_notificaciones_id_empresa"');
        DB::statement('DROP INDEX IF EXISTS "idx_notificaciones_leida"');
    }
};
