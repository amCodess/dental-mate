# Guía de Despliegue Local (Entorno de Desarrollo)
> [!IMPORTANT]
> Esta guía asegura que tu entorno local tenga **EXACTAMENTE la misma estructura y datos** que el entorno de producción en Railway.

## 1. Requisitos Previos
- Tener PostgreSQL instalado en tu máquina (versión 16 o superior recomendada).
- Tener el comando `psql` accesible en tu terminal (si usaste el script de automatización `deploy_db_fix.ps1`, esto ya debería estar listo).

## 2. Preparación Base de Datos
1. Abre tu terminal (PowerShell).
2. Crea una base de datos vacía para el proyecto:
   ```powershell
   # Si tienes el comando 'createdb' en el PATH:
   createdb -U postgres dentalmate_local
   
   # O entra en psql y ejecútalo manualmente:
   psql -U postgres -c "CREATE DATABASE dentalmate_local;"
   ```

## 3. Inicialización Idéntica a Producción (Paso Clítico)
Ejecutaremos **los mismos scripts** que usamos en Railway.

### Paso 3.1: Cargar Esquema y Datos Base
Ejecuta el script maestro `init_railway.sql`:
```powershell
# Ajusta 'postgres' por tu usuario local si es diferente
cmd /c "psql -U postgres -d dentalmate_local < backend\database\init_railway.sql"
```

### Paso 3.2: Inyectar Datos Faltantes (Fix)
Ejecuta el script de corrección `fix_data_insertion.sql`:
```powershell
cmd /c "psql -U postgres -d dentalmate_local < backend\database\fix_data_insertion.sql"
```

## 4. Configurar Backend (.env)
Ahora conecta tu Laravel local a esta base de datos exacta:
Abre tu archivo `.env` y configura:
```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=dentalmate_local
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña_local
```

## 5. Verificación
Si ejecutas:
```bash
php artisan tinker
>>> App\Models\User::count();
```
Debería devolver `1` (o más), igual que en Railway.
