<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Treatment extends Model
{
    use HasFactory;

    protected $table = 'Tratamientos';
    protected $primaryKey = 'id_tratamiento';
    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'id_empresa',
        'nombre_tratamiento',
        'descripcion',
        'unidades',
        'precio',
        'duracion_minima'
    ];
}
