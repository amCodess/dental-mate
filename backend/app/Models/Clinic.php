<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Clinic extends Model
{
    use HasFactory;

    /**
     * Tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'Clinicas';

    /**
     * Clave primaria asociada.
     *
     * @var string
     */
    protected $primaryKey = 'id_clinica';

    /**
     * Nombre de la columna created_at.
     *
     * @var string
     */
    const CREATED_AT = 'fecha_creacion';

    /**
     * Campos asignables masivamente.
     *
     * @var array
     */
    protected $fillable = [
        'id_empresa',
        'nombre',
        'telefono',
        'email_recordatorios',
        'telefono_recordatorios',
        'nombre_remitente',
        'direccion',
        'deleted',
        'deleted_at'
    ];

    /**
     * Ocultar campos en serialización.
     *
     * @var array
     */
    protected $hidden = [
        'deleted',
        'deleted_at'
    ];

    /**
     * Relación con Empresa.
     */
    public function company()
    {
        return $this->belongsTo(Company::class, 'id_empresa', 'id_empresa');
    }
}
