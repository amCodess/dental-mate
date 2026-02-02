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
            $table->string('email', 150)->nullable()->after('apellido');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('Pacientes', function (Blueprint $table) {
            $table->dropColumn('email');
        });
    }
};
