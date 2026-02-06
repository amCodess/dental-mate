# Guía de Despliegue en Railway (Backend y Base de Datos)
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

### Opción A: Usando Railway CLI (Recomendado)
1. Instala Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Vincula tu proyecto: `railway link` (selecciona tu proyecto DentalMate).
4. Ejecuta el script SQL directamente contra la base de datos de producción:
   ```bash
   railway connect < backend/database/init_railway.sql
   ```
   *Esto cargará todas las tablas, funciones, triggers y los datos por defecto (Super Admin).*

### Opción B: Usando Cliente Externo (TablePlus / PgAdmin / DBeaver)
1. Ve a tu servicio PostgreSQL en Railway > pestaña **Connect**.
2. Copia la **Postgres Connection URL**.
3. Abre tu cliente SQL favorito y conéctate usando esa URL.
4. Abre el archivo `backend/database/init_railway.sql` en el cliente.
5. Ejecuta todo el script.

## 4. Verificación
Una vez ejecutado el script, tu base de datos tendrá:
- **Tablas**: `Usuarios`, `Empresas`, `Clinicas`, etc. (Nombres correctos en PascalCase).
- **Usuario Admin**: `admin@dentalmate.com` (Password: `password` o el hash estándar insertado).
- **Datos Demo**: Empresa "DentalMate HQ" y "Clínica Central".

## 5. Finalizar Despliegue del Backend
Una vez la base de datos está lista:
1. Ve a Railway > Servicio Backend > **Settings**.
2. Haz clic en **Restart Service** o **Redeploy**.
3. Revisa los **Deploy Logs**. Debería iniciar correctamente y conectar a la BD ya preparada.

## Notas Adicionales
- **No ejecutes `php artisan migrate`** en producción si usas este método, ya que podría intentar crear tablas que ya existen o crear tablas duplicadas (`users` vs `Usuarios`).
- Para futuros cambios, crea migraciones de Laravel que alteren las tablas existentes (`Usuarios`, etc.) o actualiza manualmente si prefieres el enfoque SQL puro.
