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
    
    // Fechas con nombres de la BD
    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'updated_at';
    const DELETED_AT = 'deleted_at';  // SoftDeletes

    protected $fillable = [
        'id_empresa',
        'id_clinica',
        'id_usuario', // se puede dejar vacío
        'nombre',     // nombre del paciente
        'apellido',   // apellido del paciente
        'email',      // correo del paciente
        'fecha_nacimiento',
        'telefono',
        'direccion',
        'historial_medico',
        'deleted'
    ];
    
    // Borrado suave: marca deleted y fecha
    public function delete()
    {
        $this->deleted = true;
        $this->deleted_at = now();
        return $this->save();
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'id_paciente');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'id_paciente');
    }
}
