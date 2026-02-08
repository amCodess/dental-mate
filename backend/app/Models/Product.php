<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $table = 'Productos';
    protected $primaryKey = 'id_producto';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'id_empresa',
        'nombre_producto',
        'precio',
        'coste',
        'vendible',
        'stock_actual',
        'stock_minimo'
    ];
}
