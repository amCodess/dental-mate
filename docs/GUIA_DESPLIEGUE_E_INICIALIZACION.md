# Guía de despliegue e inicialización local

Esta guía detalla cómo desplegar e inicializar el proyecto DentalMate en un entorno local, utilizando Docker (recomendado) o una configuración manual.

> [!IMPORTANT]
> El archivo `backend/database/init_database.sql` es la **única fuente de verdad** para la estructura de la base de datos.

---

## Parte 1: Despliegue con Docker (Recomendado)

Esta es la forma más sencilla de levantar el entorno completo asegurando compatibilidad.

### 1.1 Prerrequisitos
1.  **Docker Desktop** instalado y ejecutándose.
2.  **NO es necesario** tener PostgreSQL, PHP o Node instalados en tu sistema (Docker se encarga de esto).
3.  Puertos **8000** (Backend), **5173** (Frontend) y **5432** (Base de datos) libres en tu máquina.

> **Nota sobre PostgreSQL:** Docker descargará automáticamente una imagen de PostgreSQL 16 y la ejecutará en un contenedor aislado. No necesitas instalar el servidor PostgreSQL manualmente en Windows.

### 1.2 Inicialización del entorno
1.  Abre una terminal en la raíz del proyecto.
2.  Ejecuta:
    ```bash
    docker compose up -d --build
    ```
    Esto iniciará:
    - **db**: PostgreSQL 16.
    - **backend**: Laravel en http://localhost:8000.
    - **frontend**: React + Vite en http://localhost:5173.

### 1.3 Configuración inicial
1.  Espera unos segundos a que el contenedor de backend instale las dependencias automáticamente (monitoriza con `docker compose logs -f backend`).
2.  Configura entorno y clave (solo la primera vez):
    ```bash
    docker compose exec backend php artisan key:generate
    ```
3.  La base de datos se inicializa automáticamente en el primer arranque del contenedor `db` (se ejecuta `backend/database/init_database.sql` cuando el volumen está vacío).
4.  Las migraciones de Laravel se ejecutan automáticamente al arrancar el contenedor `backend` (incluye índices de rendimiento).
    - Si necesitas forzarlas manualmente:
    ```bash
    docker compose exec backend php artisan migrate --force
    ```
5.  Credenciales de acceso por defecto (seed inicial):
    - Usuario: `admin@dentalmate.com`
    - Contraseña: `Admin123!`

> Si necesitas re-inicializar desde cero (por ejemplo, al mover el proyecto a otro ordenador), borra el volumen de PostgreSQL y vuelve a levantar todo:
> ```bash
> docker compose down -v
> docker compose up -d --build
> ```
### 1.4 Configuración del frontend
Si es necesario (por defecto automático):
```bash
docker compose exec frontend npm install
```

> Nota: En Docker local, `VITE_API_URL` debe apuntar a `http://localhost:8000/api/v1` (el navegador accede al backend por el puerto publicado).

### 1.5 Acceso Visual a la Base de Datos (Adminer)
El proyecto incluye **Adminer** para gestionar visualmente la base de datos sin comandos.

1.  Accede a: [http://localhost:8081](http://localhost:8081)
2.  Usa estas credenciales:
    *   **Sistema:** PostgreSQL
    *   **Servidor:** `db`
    *   **Usuario:** `dental_user`
    *   **Contraseña:** `secret`
    *   **Base de datos:** `dental_mate`

Esto te permitirá ver tablas como `Usuarios`, `cache`, `Roles`, etc.

### 2. Comandos útiles (Docker)

---

## Parte 3: Despliegue manual (Sin Docker)

Si prefieres usar tus instalaciones locales de PHP, Node y Postgres.

### 3.1 Base de datos
1.  Crea la base de datos:
    ```powershell
    createdb -U postgres dentalmate_local
    ```
2.  Carga el esquema unificado:
    ```powershell
    cmd /c "psql -U postgres -d dentalmate_local < backend\database\init_database.sql"
    ```

### 2.2 Backend
Configura `.env` hacia `127.0.0.1` y ejecuta:
```bash
cd backend
composer install
php artisan key:generate
php artisan serve
```

### 2.3 Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Resolución de problemas

**Error: "bind: address already in use"**
Detén servicios locales (XAMPP, Postgres) que usen los puertos 8000, 5173 o 5432.

**Login devuelve "Unauthorized"**
1.  Asegura que la base de datos se inicializó correctamente en el primer arranque.
2.  Fuerza un reset de la base de datos:
    ```bash
    docker compose down -v
    docker compose up -d --build
    docker compose exec backend php artisan migrate --force
    ```
3.  Verifica que el frontend use `VITE_API_URL=http://localhost:8000/api/v1` (si usas Docker local).
**Error de permisos en `storage/`**
```bash
docker compose exec backend chown -R www-data:www-data /var/www/html/storage
```

