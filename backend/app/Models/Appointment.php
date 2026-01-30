<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appointment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'Citas';
    protected $primaryKey = 'id_cita';

    protected $fillable = [
        'id_empresa',
        'id_clinica',
        'id_paciente',
        'id_empleado',
        'fecha',
        'hora',
        'estado',
        'notas',
        'duracion_minutos',
        'tipo',
        'prioridad',
        'deleted'
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'id_paciente');
    }
}
