<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'Usuarios';
    protected $primaryKey = 'id_usuario';
    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'updated_at';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nombre',
        'apellido',
        'email',
        'password',
        'estado',
        'id_role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'deleted',
        'deleted_at',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'estado' => 'string',
        'deleted' => 'boolean'
    ];

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->id_role,
            'email' => $this->email
        ];
    }

    /**
     * Get the name for frontend compatibility.
     *
     * @return string
     */
    public function getNameAttribute()
    {
        return "{$this->nombre} {$this->apellido}";
    }

    /**
     * Relation with Role
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role', 'id_role');
    }

    /**
     * Relación con Clínicas (Pivot)
     */
    public function clinics()
    {
        return $this->belongsToMany(Clinic::class, 'Usuarios_Clinicas', 'id_usuario', 'id_clinica')
            ->withPivot(
                'rol',
                'id_empresa',
                'menu_citas',
                'menu_pacientes',
                'menu_facturacion',
                'menu_productos',
                'menu_proveedores',
                'menu_tratamientos',
                'menu_usuarios'
            );
    }

    /**
     * Relación con Empresas (Pivot)
     */
    public function companies()
    {
        return $this->belongsToMany(Company::class, 'Usuarios_Empresas', 'id_usuario', 'id_empresa')
            ->withPivot('rol');
    }

    /**
     * Soft delete updating both deleted_at and deleted flag to satisfy DB constraint.
     */
    protected function runSoftDelete()
    {
        $time = $this->freshTimestamp();
        $deletedAtColumn = $this->getDeletedAtColumn();

        $this->{$deletedAtColumn} = $time;
        $this->deleted = true;

        $this->setKeysForSaveQuery($this->newModelQuery())
            ->update([
                $deletedAtColumn => $this->fromDateTime($time),
                'deleted' => true,
            ]);
    }

    /**
     * Restore user and clear deleted flag.
     */
    public function restore()
    {
        if ($this->fireModelEvent('restoring') === false) {
            return false;
        }

        $this->{$this->getDeletedAtColumn()} = null;
        $this->deleted = false;

        $this->setKeysForSaveQuery($this->newModelQuery())
            ->update([
                $this->getDeletedAtColumn() => null,
                'deleted' => false,
            ]);

        $this->fireModelEvent('restored', false);

        return true;
    }
}
