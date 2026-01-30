<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'Pacientes';
    protected $primaryKey = 'id_paciente';

    protected $fillable = [
        'id_empresa',
        'id_clinica',
        'id_usuario',
        'fecha_nacimiento',
        'telefono',
        'direccion',
        'historial_medico',
        'deleted'
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'id_paciente');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'id_paciente');
    }
}
