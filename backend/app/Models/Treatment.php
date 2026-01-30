<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Treatment extends Model
{
    use HasFactory;

    protected $table = 'Tratamientos';
    protected $primaryKey = 'id_tratamiento';

    protected $fillable = [
        'id_empresa',
        'nombre_tratamiento',
        'descripcion',
        'unidades',
        'precio'
    ];
}
