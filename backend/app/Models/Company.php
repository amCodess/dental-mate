<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    /**
     * Tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'empresas';

    /**
     * Clave primaria asociada.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * Nombre de la columna created_at.
     *
     * @var string
     */
    // Standard timestamps

    /**
     * Campos asignables masivamente.
     *
     * @var array
     */
    protected $fillable = [
        'nombre',
        'nif',
        'email',
        'telefono',
        'email_recordatorios',
        'telefono_recordatorios',
        'nombre_remitente',
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
     * Relación con Clínicas.
     */
    public function clinics()
    {
        return $this->hasMany(Clinic::class, 'id_empresa', 'id');
    }
}
