<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('Tratamientos', function (Blueprint $table) {
            if (!Schema::hasColumn('Tratamientos', 'duracion_minima')) {
                $table->integer('duracion_minima')->nullable()->after('precio');
            }
        });
    }

    public function down(): void
    {
        Schema::table('Tratamientos', function (Blueprint $table) {
            if (Schema::hasColumn('Tratamientos', 'duracion_minima')) {
                $table->dropColumn('duracion_minima');
            }
        });
    }
};
?>
