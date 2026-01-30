<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'Notificaciones';
    protected $primaryKey = 'id_notificacion';

    protected $fillable = [
        'id_empresa',
        'id_usuario',
        'id_paciente',
        'titulo',
        'mensaje',
        'leida',
        'fecha_envio'
    ];
}
