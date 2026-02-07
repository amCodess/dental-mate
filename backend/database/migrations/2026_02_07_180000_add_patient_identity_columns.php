<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('Pacientes')) {
            return;
        }

        $hasNombre = Schema::hasColumn('Pacientes', 'nombre');
        $hasApellido = Schema::hasColumn('Pacientes', 'apellido');
        $hasEmail = Schema::hasColumn('Pacientes', 'email');

        if ($hasNombre && $hasApellido && $hasEmail) {
            return;
        }

        Schema::table('Pacientes', function (Blueprint $table) use ($hasNombre, $hasApellido, $hasEmail) {
            if (!$hasNombre) {
                $table->string('nombre', 100)->nullable();
            }
            if (!$hasApellido) {
                $table->string('apellido', 100)->nullable();
            }
            if (!$hasEmail) {
                $table->string('email', 150)->nullable();
            }
        });

        if (Schema::hasColumn('Pacientes', 'nombre')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_nombre" ON "Pacientes" ("nombre")');
        }
        if (Schema::hasColumn('Pacientes', 'apellido')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_apellido" ON "Pacientes" ("apellido")');
        }
        if (Schema::hasColumn('Pacientes', 'email')) {
            DB::statement('CREATE INDEX IF NOT EXISTS "idx_pacientes_email" ON "Pacientes" ("email")');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('Pacientes')) {
            return;
        }

        Schema::table('Pacientes', function (Blueprint $table) {
            if (Schema::hasColumn('Pacientes', 'email')) {
                $table->dropColumn('email');
            }
            if (Schema::hasColumn('Pacientes', 'apellido')) {
                $table->dropColumn('apellido');
            }
            if (Schema::hasColumn('Pacientes', 'nombre')) {
                $table->dropColumn('nombre');
            }
        });

        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_nombre"');
        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_apellido"');
        DB::statement('DROP INDEX IF EXISTS "idx_pacientes_email"');
    }
};
