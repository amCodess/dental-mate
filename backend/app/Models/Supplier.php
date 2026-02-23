<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $table = 'Proveedores';
    protected $primaryKey = 'id_proveedor';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'id_empresa',
        'nombre',
        'contacto',
        'email',
        'telefono',
        'direccion'
    ];
}
