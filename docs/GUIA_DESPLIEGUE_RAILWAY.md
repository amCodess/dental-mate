# Guía de Despliegue en Railway (Producción)
> [!IMPORTANT]
> Sigue esta guía paso a paso para desplegar tu proyecto DentalMate en Railway asegurando que la base de datos se crea correctamente con el esquema definido.

## 1. Preparación del Proyecto
Asegúrate de estar en la rama correcta donde tienes el script de inicialización unificado:
```bash
git checkout develop2
```
Deberías ver el archivo `backend/database/init_database.sql`.

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
Usaremos el script único unificado que crea el esquema e inserta los datos por defecto.

### Opción A: Usando Railway CLI (Recomendado)
1. Instala Railway CLI y haz login/link.
2. Ejecuta el script único:
   ```bash
   cmd /c "railway connect < backend\database\init_database.sql"
   ```
   *Esto cargará tablas, funciones, triggers y el usuario Super Admin de una sola vez.*

### Opción B: Usando Cliente Externo
1. Conecta tu cliente (TablePlus, DBeaver) usando la URL de conexión de Railway.
2. Ejecuta el contenido de `backend/database/init_database.sql`.

## 4. Verificación
Tu base de datos tendrá:
- **Tablas**: Correctamente creadas (`Usuarios`, `Empresas`...).
- **Datos**: Usuario `admin@dentalmate.com` listo para usar.

## 5. Finalizar Despliegue del Backend
1. Reinicia el servicio de Backend en Railway.
2. Revisa que el log indique conexión exitosa.

## Notas Importantes
- **NO ejecutes `php artisan migrate`**. El esquema ya está gestionado por el script SQL.
