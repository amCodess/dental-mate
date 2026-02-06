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
    
    // Timestamp columns personalizados para coincidir con la BD
    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'updated_at';
    const DELETED_AT = 'deleted_at';  // Para SoftDeletes

    protected $fillable = [
        'id_empresa',
        'id_clinica',
        'id_usuario', // Opcional ahora
        'nombre',     // Nuevo
        'apellido',   // Nuevo
        'email',      // Nuevo (fix error create)
        'fecha_nacimiento',
        'telefono',
        'direccion',
        'historial_medico',
        'deleted'
    ];
    
    // Override delete para satisfacer constraint de BD (deleted=true AND deleted_at not null)
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
