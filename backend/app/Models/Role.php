<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'Roles';
    protected $primaryKey = 'id_role';
    public $timestamps = false;

    protected $fillable = [
        'nombre_role',
        'descripcion',
        'tipo' // 'empleado' o 'usuario'
    ];
}
