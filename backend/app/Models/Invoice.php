<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $table = 'Facturacion';
    protected $primaryKey = 'id_factura';

    protected $fillable = [
        'id_empresa',
        'id_clinica',
        'id_paciente',
        'id_cita',
        'id_presupuesto',
        'fecha_emision',
        'importe_total',
        'descuento',
        'pago_status',
        'tipo_pago'
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'id_paciente');
    }
}
