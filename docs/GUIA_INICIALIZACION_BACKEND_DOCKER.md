# Guía de Inicialización del Backend con Docker

Esta guía explica cómo levantar y configurar el entorno de desarrollo del Backend (Laravel) utilizando Docker.

## Prerrequisitos
1.  **Docker Desktop** instalado y ejecutándose.
2.  Puerto **8000** y **5432** libres en tu máquina.

## Pasos para Inicializar

### 1. Levantar los contenedores
Desde la raíz del proyecto, ejecuta:

```bash
docker-compose up -d --build
```

Esto descargará las imágenes, construirá los contenedores e iniciará los servicios `backend`, `frontend` y `db`.

### 2. Instalar dependencias de PHP
Una vez levantado, necesitamos instalar las dependencias de Composer dentro del contenedor:

```bash
docker-compose exec backend composer install
```

### 3. Configurar entorno y generar clave
Si es la primera vez, copia el archivo de entorno y genera la clave de aplicación:

```bash
docker-compose exec backend cp .env.example .env
docker-compose exec backend php artisan key:generate
```

### 4. Configurar base de datos en Docker
Asegúrate de que tus variables en `.env` (dentro del contenedor, y también puedes usar el local como referencia) apunten al servicio `db`:

```ini
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=dental_mate
DB_USERNAME=dental_user
DB_PASSWORD=secret
```

### 5. Iniciar base de datos
Ejecuta las migraciones y seeders para poblar la base de datos:

```bash
docker-compose exec backend php artisan migrate:fresh --seed
```

O si prefieres usar el script SQL unificado (`backend/database/init_database.sql`):
```bash
# Copia el archivo al contenedor si es necesario, o úsalo desde un cliente SQL conectando a localhost:5432
```
*Recomendación: Usar `migrate:fresh --seed` es lo estándar en Laravel.*

### 6. Verificar funcionamiento
Visita `http://localhost:8000/api/health` (si creas esa ruta) o simplemente verifica que responda la home de Laravel.

## Resolución de Problemas

**Error: "bind: address already in use"**
- Algún servicio en tu PC ya usa el puerto 8000 o 5432.
- Solución: Detén el servicio local (ej. XAMPP, otro Postgres) o cambia los puertos en `docker-compose.yml`.

**Error de permisos en `storage/`**
- Si Laravel se queja de permisos:
```bash
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
```
