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
        Schema::create('Tratamientos', function (Blueprint $table) {
            $table->id('id_tratamiento');
            $table->integer('id_empresa');
            $table->string('nombre_tratamiento', 150);
            $table->text('descripcion')->nullable();
            $table->decimal('unidades', 10, 2)->nullable();
            $table->decimal('precio', 10, 2)->nullable();
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Tratamientos');
    }
};
