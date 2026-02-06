# Guía de Despliegue Local (Entorno de Desarrollo)
> [!IMPORTANT]
> Esta guía asegura que tu entorno local tenga **EXACTAMENTE la misma estructura y datos** que el entorno de producción.

## 1. Requisitos Previos
- Tener PostgreSQL instalado.
- Tener el comando `psql` accesible en tu terminal.

## 2. Preparación Base de Datos
1. Abre Powershell.
2. Crea la base de datos vacía:
   ```powershell
   createdb -U postgres dentalmate_local
   ```

## 3. Inicialización (Script Unificado)
Ejecutaremos el mismo script maestro que en producción.

```powershell
# Asegúrate de que la ruta a psql está en tu PATH (o usa el script automático)
cmd /c "psql -U postgres -d dentalmate_local < backend\database\init_database.sql"
```

Este comando:
1.  Crea todas las tablas y tipos.
2.  Crea los triggers de fecha.
3.  Inserta el Super Admin y la empresa de prueba.

## 4. Configurar Backend (.env)
Apunta tu Laravel local a la nueva BD:
```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=dentalmate_local
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña
```

## 5. Verificación
Entra a tinker y comprueba:
```bash
php artisan tinker
>>> App\Models\User::count();
// Debe devolver 1
```
