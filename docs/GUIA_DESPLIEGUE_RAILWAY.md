# Guía de Despliegue en Railway (Producción)
> [!IMPORTANT]
> Sigue esta guía paso a paso para desplegar tu proyecto DentalMate en Railway asegurando que la base de datos se crea correctamente con el esquema definido.

## 1. Preparación del Proyecto
Asegúrate de estar en la rama correcta donde tienes el script de inicialización:
```bash
git checkout develop2
```
Deberías ver el archivo `backend/database/init_railway.sql`.

## 2. Configuración en Railway
### 2.1 Crear Nuevo Proyecto y Base de Datos
1. Ve a [Railway Dashboard](https://railway.app/dashboard).
2. Haz clic en **+ New Project** > **Provision PostgreSQL**.
3. Espera a que se cree el servicio PostgreSQL.

### 2.2 Desplegar el Backend (Repositorio)
1. En el mismo proyecto, haz clic en **+ New** > **GitHub Repo**.
2. Selecciona tu repositorio `dental-mate`.
3. Railway detectará automáticamente el archivo `Dockerfile` (si existe en tu rama) o `package.json`/`composer.json`.
4. **IMPORTANTE:** No dejes que el build termine exitosamente todavía si tu backend intenta conectar a la BD al iniciar. Primero debemos configurar las variables.

### 2.3 Variables de Entorno (Environment Variables)
Ve a la pestaña **Variables** de tu servicio de **backend** y añade:
- `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (Railway autocompletará esto).
- `DB_HOST`: `${{Postgres.PGHOST}}`
- `DB_PORT`: `${{Postgres.PGPORT}}`
- `DB_DATABASE`: `${{Postgres.PGDATABASE}}`
- `DB_USERNAME`: `${{Postgres.PGUSER}}`
- `DB_PASSWORD`: `${{Postgres.PGPASSWORD}}`
- `APP_KEY`: (Genera una clave de Laravel nueva o usa la de tu `.env` local).
- `APP_ENV`: `production`

## 3. Inicialización de la Base de Datos (Paso Crítico)
Como hemos detectado que las migraciones estándar de Laravel no coinciden al 100% con tu esquema SQL complejo (`DentalMate.sql`), usaremos el script maestro que hemos generado.

### 3.1 Cargar Esquema y Datos Base (Automático)
Usa el script de automatización `deploy_db_fix.ps1` que incluye tanto la conexión como la carga de datos de corrección, o hazlo manualmente:

**Opción Manual:**
1. Instala Railway CLI y haz login/link.
2. Cargar esquema base:
   ```bash
   cmd /c "railway connect < backend\database\init_railway.sql"
   ```
3. Cargar datos faltantes (Fix):
   ```bash
   cmd /c "railway connect < backend\database\fix_data_insertion.sql"
   ```

## 4. Verificación
Una vez ejecutados los scripts, tu base de datos tendrá:
- **Tablas**: `Usuarios`, `Empresas`, `Clinicas`, etc. (Nombres correctos en PascalCase).
- **Usuario Admin**: `admin@dentalmate.com` (Password: `password` o el hash estándar insertado).
- **Datos Demo**: Empresa "DentalMate HQ" y "Clínica Central".

## 5. Finalizar Despliegue del Backend
Una vez la base de datos está lista (ya sea con el script automático o manual):
1. Ve a Railway > Servicio Backend > **Settings**.
2. Haz clic en **Restart Service** o **Redeploy**.
3. Revisa los **Deploy Logs**. Debería iniciar correctamente y conectar a la BD ya preparada.

## Notas Importantes
- **NO ejecutes `php artisan migrate`** en producción.
- Para el entorno local, consulta la guía separada: `docs/GUIA_DESPLIEGUE_LOCAL.md`.
