# Guía de despliegue e inicialización

Esta guía unifica todos los procesos para desplegar e inicializar el proyecto DentalMate tanto en entornos locales (con y sin Docker) como en producción (Railway).

> [!IMPORTANT]
> El archivo `backend/database/init_database.sql` es la **única fuente de verdad** para la estructura de la base de datos. Se utiliza en todos los entornos para garantizar consistencia.

---

## Parte 1: Despliegue local con Docker (Recomendado)

Esta es la forma más sencilla de levantar el entorno completo (Backend, Frontend y Base de Datos) asegurando que todo funcione sin problemas de compatibilidad.

### 1.1 Prerrequisitos
1.  **Docker Desktop** instalado y ejecutándose.
2.  Puertos **8000** (Backend), **5173** (Frontend) y **5432** (Base de datos) libres en tu máquina.

### 1.2 Inicialización del entorno
1.  Abre una terminal en la raíz del proyecto.
2.  Ejecuta el siguiente comando para construir y levantar los servicios:
    ```bash
    docker-compose up -d --build
    ```
    Esto iniciará:
    - **db**: PostgreSQL 16.
    - **backend**: Laravel en http://localhost:8000.
    - **frontend**: React + Vite en http://localhost:5173.

### 1.3 Configuración del backend
Una vez levantados los contenedores, configura las dependencias de Laravel:

1.  Instala las dependencias de PHP:
    ```bash
    docker-compose exec backend composer install
    ```
2.  Copia el archivo de entorno y genera la clave de cifrado (si es la primera vez):
    ```bash
    docker-compose exec backend cp .env.example .env
    docker-compose exec backend php artisan key:generate
    ```
3.  Asegúrate de que tu `.env` (dentro del contenedor o localmente en `backend/`) tenga estas credenciales para Docker:
    ```ini
    DB_CONNECTION=pgsql
    DB_HOST=db
    DB_PORT=5432
    DB_DATABASE=dental_mate
    DB_USERNAME=dental_user
    DB_PASSWORD=secret
    ```
4.  Ejecuta las migraciones y seeders para poblar la base de datos:
    ```bash
    docker-compose exec backend php artisan migrate:fresh --seed
    ```
    *Esto creará las tablas y usuarios por defecto (admin@dentalmate.com / Admin123!).*

### 1.4 Configuración del frontend
El frontend suele estar listo automáticamente, pero si necesitas reinstalar dependencias:
```bash
docker-compose exec frontend npm install
```
Accede a la aplicación en `http://localhost:5173`. Los cambios que hagas en el código se reflejarán automáticamente.

---

## Parte 2: Despliegue en Railway (Producción)

Pasos para llevar el código a producción usando la plataforma Railway.

### 2.1 Configuración del proyecto
1.  Asegúrate de estar en la rama `develop2` que contiene el script `backend/database/init_database.sql`.
2.  En Railway, crea un nuevo proyecto y añade un servicio **PostgreSQL**.
3.  Añade un servicio desde **GitHub Repo** seleccionando este repositorio.

### 2.2 Variables de entorno (Backend)
Configura las siguientes variables en el servicio de backend en Railway:

- `DATABASE_URL`: Usa la variable dinámica `${{Postgres.DATABASE_URL}}`.
- `DB_HOST`: `${{Postgres.PGHOST}}`
- `DB_PORT`: `${{Postgres.PGPORT}}`
- `DB_DATABASE`: `${{Postgres.PGDATABASE}}`
- `DB_USERNAME`: `${{Postgres.PGUSER}}`
- `DB_PASSWORD`: `${{Postgres.PGPASSWORD}}`
- `APP_KEY`: Genera una nueva clave o usa una segura.
- `APP_ENV`: `production`

### 2.3 Inicialización de la base de datos
Para producción, usa el script unificado que garantiza la estructura correcta (tablas PascalCase, triggers, etc.).

**Opción A: Railway CLI (Recomendado)**
```bash
cmd /c "railway connect < backend\database\init_database.sql"
```

**Opción B: Cliente externo**
Conéctate con TablePlus/DBeaver a la BD de Railway y ejecuta el contenido de `backend/database/init_database.sql`.

> [!WARNING]
> En producción, evita usar `php artisan migrate` si ya has usado el script SQL, ya que podrían entrar en conflicto si el historial de migraciones no está sincronizado.

---

## Parte 3: Despliegue local manual (Legado)

Si prefieres no usar Docker y tienes PHP/Node/Postgres instalados en tu sistema operativo.

### 3.1 Base de datos
1.  Crea una base de datos vacía:
    ```powershell
    createdb -U postgres dentalmate_local
    ```
2.  Carga el script unificado:
    ```powershell
    cmd /c "psql -U postgres -d dentalmate_local < backend\database\init_database.sql"
    ```

### 3.2 Backend
1.  Configura el `.env` para apuntar a `localhost` (127.0.0.1).
2.  Ejecuta:
    ```bash
    cd backend
    composer install
    php artisan key:generate
    php artisan serve
    ```

### 3.3 Frontend
1.  Ejecuta:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

---

## Resolución de problemas comunes

**Error: "bind: address already in use" (Docker)**
Algún servicio local (XAMPP, PostgreSQL local) ocupa el puerto 8000 o 5432. Detenlos antes de iniciar Docker.

**Error de permisos en `storage/`**
Ejecuta:
```bash
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
```
