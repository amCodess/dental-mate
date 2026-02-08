<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('Usuarios_Clinicas', function (Blueprint $table) {
            if (!Schema::hasColumn('Usuarios_Clinicas', 'menu_citas')) {
                $table->boolean('menu_citas')->default(true);
            }
            if (!Schema::hasColumn('Usuarios_Clinicas', 'menu_pacientes')) {
                $table->boolean('menu_pacientes')->default(true);
            }
            if (!Schema::hasColumn('Usuarios_Clinicas', 'menu_facturacion')) {
                $table->boolean('menu_facturacion')->default(true);
            }
            if (!Schema::hasColumn('Usuarios_Clinicas', 'menu_productos')) {
                $table->boolean('menu_productos')->default(true);
            }
            if (!Schema::hasColumn('Usuarios_Clinicas', 'menu_proveedores')) {
                $table->boolean('menu_proveedores')->default(true);
            }
            if (!Schema::hasColumn('Usuarios_Clinicas', 'menu_tratamientos')) {
                $table->boolean('menu_tratamientos')->default(true);
            }
            if (!Schema::hasColumn('Usuarios_Clinicas', 'menu_usuarios')) {
                $table->boolean('menu_usuarios')->default(true);
            }
        });
    }

    public function down(): void
    {
        Schema::table('Usuarios_Clinicas', function (Blueprint $table) {
            $columns = [
                'menu_usuarios',
                'menu_tratamientos',
                'menu_proveedores',
                'menu_productos',
                'menu_facturacion',
                'menu_pacientes',
                'menu_citas',
            ];
            $existing = array_filter($columns, fn ($column) => Schema::hasColumn('Usuarios_Clinicas', $column));
            if (!empty($existing)) {
                $table->dropColumn(array_values($existing));
            }
        });
    }
};
