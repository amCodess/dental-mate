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
        Schema::create('Citas', function (Blueprint $table) {
            $table->id('id_cita');
            $table->integer('id_empresa');
            $table->integer('id_clinica')->nullable();
            $table->integer('id_paciente');
            $table->integer('id_empleado');
            $table->date('fecha');
            $table->time('hora');
            $table->string('estado')->default('Pendiente'); 
            $table->text('notas')->nullable();
            $table->integer('duracion_minutos')->default(30);
            $table->string('tipo')->default('Normal');
            $table->string('prioridad')->default('Media');
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamps();
            $table->softDeletes();
            $table->boolean('deleted')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Citas');
    }
};
