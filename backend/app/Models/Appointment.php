<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Invoice;

class Appointment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'Citas';
    protected $primaryKey = 'id_cita';

    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'id_empresa',
        'id_clinica',
        'id_paciente',
        'id_empleado',
        'fecha',
        'hora',
        'estado',
        'notas',
        'motivo',
        'duracion_minutos',
        'tipo',
        'prioridad',
        'deleted',
        'deleted_at'
    ];

    protected $appends = [
        'pago_status'
    ];

    protected $casts = [
        'deleted' => 'boolean',
        'deleted_at' => 'datetime'
    ];

    protected function runSoftDelete()
    {
        $time = $this->freshTimestamp();
        $columns = [
            $this->getDeletedAtColumn() => $this->fromDateTime($time),
            'deleted' => true,
        ];

        $this->{$this->getDeletedAtColumn()} = $time;
        $this->deleted = true;

        $this->setKeysForSaveQuery($this->newModelQuery())->update($columns);

        $this->syncOriginalAttributes($columns);
    }

    public function restore()
    {
        if ($this->fireModelEvent('restoring') === false) {
            return false;
        }

        $columns = [
            $this->getDeletedAtColumn() => null,
            'deleted' => false,
        ];

        $this->{$this->getDeletedAtColumn()} = null;
        $this->deleted = false;

        $this->exists = true;

        $this->setKeysForSaveQuery($this->newModelQuery()->withTrashed())->update($columns);

        $this->syncOriginalAttributes($columns);

        $this->fireModelEvent('restored', false);

        return true;
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'id_paciente');
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class, 'id_cita', 'id_cita');
    }

    public function getPagoStatusAttribute()
    {
        return $this->invoice ? $this->invoice->pago_status : null;
    }
}
