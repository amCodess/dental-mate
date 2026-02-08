<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'Rol_tipo_enum' AND e.enumlabel = 'sistema') THEN ALTER TYPE \"Rol_tipo_enum\" ADD VALUE 'sistema'; END IF; END $$;");
        DB::statement("UPDATE \"Roles\" SET \"tipo\" = 'sistema' WHERE \"nombre_role\" = 'superadmin' AND \"tipo\" <> 'sistema';");
    }

    public function down(): void
    {
        DB::statement("UPDATE \"Roles\" SET \"tipo\" = 'empleado' WHERE \"nombre_role\" = 'superadmin' AND \"tipo\" = 'sistema';");
    }
};
