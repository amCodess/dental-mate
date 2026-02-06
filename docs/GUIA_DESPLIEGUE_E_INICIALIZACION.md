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
    docker-compose up -d --build
    ```
    Esto iniciará:
    - **db**: PostgreSQL 16.
    - **backend**: Laravel en http://localhost:8000.
    - **frontend**: React + Vite en http://localhost:5173.

### 1.3 Configuración inicial
1.  Espera unos segundos a que el contenedor de backend instale las dependencias automáticamente (monitoriza con `docker-compose logs -f backend`).
2.  Configura entorno y clave (solo la primera vez):
    ```bash
    docker-compose exec backend php artisan key:generate
    ```
3.  Puebla la base de datos (usando el script maestro):
    ```powershell
    Get-Content backend/database/init_database.sql | docker-compose exec -T db psql -U dental_user -d dental_mate
    ```
    *Nota: Si estás en Mac/Linux usa `cat` en lugar de `Get-Content`.*


### 1.4 Configuración del frontend
Si es necesario (por defecto automático):
```bash
docker-compose exec frontend npm install
```

---

## Parte 2: Despliegue manual (Sin Docker)

Si prefieres usar tus instalaciones locales de PHP, Node y Postgres.

### 2.1 Base de datos
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

**Error de permisos en `storage/`**
```bash
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
```
