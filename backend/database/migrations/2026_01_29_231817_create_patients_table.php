<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('Pacientes', function (Blueprint $table) {
            $table->id('id_paciente');
            $table->integer('id_empresa');
            $table->integer('id_clinica')->nullable();
            $table->integer('id_usuario')->nullable()->unique();
            $table->date('fecha_nacimiento')->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('direccion', 255)->nullable();
            $table->text('historial_medico')->nullable();
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamps(); // updated_at
            $table->softDeletes(); // deleted_at
            $table->boolean('deleted')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Pacientes');
    }
};
