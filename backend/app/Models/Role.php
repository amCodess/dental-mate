<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'Roles';
    protected $primaryKey = 'id_role';
    public $timestamps = false; // La tabla Roles no tiene timestamps en el SQL original si no se definieron, o si se definieron verificar. Validando con SQL... 
    // SQL dice: no tiene timestamps automáticos de laravel (created_at, updated_at) standard, tiene columnas especificas?
    // Revisando SQL: CREATE TABLE "Roles" ("id_role"..., "nombre_role"..., "descripcion"..., "tipo"...); 
    // No tiene timestamps.

    protected $fillable = [
        'nombre_role',
        'descripcion',
        'tipo' // 'empleado' o 'usuario'
    ];
}
