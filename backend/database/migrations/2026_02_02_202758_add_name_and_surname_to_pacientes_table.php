<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('Pacientes', function (Blueprint $table) {
            $table->string('nombre', 100)->after('id_usuario');
            $table->string('apellido', 100)->after('nombre');
            $table->integer('id_usuario')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('Pacientes', function (Blueprint $table) {
            $table->dropColumn(['nombre', 'apellido']);
            // No podemos revertir fácilmente nullable sin saber el estado previo exacto, 
            // pero normalmente se dejaría así o se intentaría poner nullable(false) si se limpia la data.
        });
    }
};
