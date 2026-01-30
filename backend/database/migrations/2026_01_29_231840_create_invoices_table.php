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
        Schema::create('Facturacion', function (Blueprint $table) {
            $table->id('id_factura');
            $table->integer('id_empresa');
            $table->integer('id_clinica')->nullable();
            $table->integer('id_paciente');
            $table->integer('id_cita')->nullable();
            $table->integer('id_presupuesto')->nullable();
            $table->date('fecha_emision');
            $table->decimal('importe_total', 10, 2);
            $table->decimal('descuento', 10, 2)->default(0);
            $table->string('pago_status')->default('Pendiente');
            $table->string('tipo_pago');
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Facturacion');
    }
};
