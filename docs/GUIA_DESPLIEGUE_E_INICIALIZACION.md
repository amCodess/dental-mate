# Guía de despliegue e inicialización local

Esta guía detalla cómo desplegar e inicializar el proyecto DentalMate en un entorno local, utilizando Docker (recomendado) o una configuración manual.

> [!IMPORTANT]
> El archivo `backend/database/init_database.sql` es la **única fuente de verdad** para la estructura de la base de datos.

---

## Parte 1: Despliegue con Docker (Recomendado)

Esta es la forma más sencilla de levantar el entorno completo asegurando compatibilidad.

### 1.1 Prerrequisitos
1.  Entorno Docker funcionando:
    - **Windows / macOS:** instala **Docker Desktop** (incluye Docker Engine y `docker compose` v2).  
    - **Linux:** instala **Docker Engine** + el **plugin `docker compose`** (`docker compose version` debe funcionar).  
    - **Solo instalar `docker-compose` sin Docker Engine NO sirve**: necesitas el engine en segundo plano para crear contenedores.
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

### 1.2.1 Inicializacion limpia (recomendada para evitar errores de login)
Usa estos pasos si quieres que TODO se inicialice desde `backend/database/init_database.sql`.
1.  Borra el volumen de la base de datos:
    ```bash
    docker compose down -v
    ```
2.  Levanta todo de nuevo:
    ```bash
    docker compose up -d --build
    ```
3.  Espera a que el backend termine de arrancar (revisa con `docker compose logs -f backend`).
4.  Entra al frontend y prueba el login con las credenciales por defecto.

### 1.3 Configuración inicial
1.  Espera unos segundos a que el contenedor de backend instale las dependencias automáticamente (monitoriza con `docker compose logs -f backend`).
2.  **La clave se genera automaticamente** en cada arranque del backend.
    - Si quieres desactivar esto, pon `APP_AUTO_KEYGENERATE=false` en `docker-compose.yml`.
3.  La base de datos se inicializa automáticamente en el primer arranque del contenedor `db` (se ejecuta `backend/database/init_database.sql` cuando el volumen esta vacio).
4.  **No uses migraciones en este proyecto.** Todo el esquema (tablas, enums, índices, datos base) se crea desde `init_database.sql`, incluyendo la limpieza de columnas heredadas de roles y la bandera `is_superadmin`.
    - El backend ya viene con `APP_RUN_MIGRATIONS=false` y no requiere cambios.
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

Esto te permitirá ver tablas como `Usuarios`, `cache`, `Empresas`, `Clinicas`, etc. (la tabla `Roles` ya no se usa).

### 2. Comandos útiles (Docker)
No habilites migraciones: el esquema completo se aplica desde `backend/database/init_database.sql` cada vez que el volumen de la base se crea.

Para desactivar la generacion automatica de `APP_KEY`:
```bash
# 1) Edita docker-compose.yml
APP_AUTO_KEYGENERATE=false

# 2) Reinicia el backend
docker compose restart backend
```

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
php artisan serve
```
> Nota: no es necesario ejecutar `php artisan migrate` si cargaste `init_database.sql`.  
> Si vienes de una versión anterior, vuelve a cargar `backend/database/init_database.sql` sobre una base vacía para limpiar columnas de roles y marcar el `is_superadmin`.

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
    ```
3.  Verifica que el frontend use `VITE_API_URL=http://localhost:8000/api/v1` (si usas Docker local).

**Login devuelve error inesperado (500)**
1.  Haz una inicializacion limpia para que el schema venga SOLO del script de init:
    ```bash
    docker compose down -v
    docker compose up -d --build
    ```
2.  Espera a que el backend termine de arrancar (revisa `docker compose logs -f backend`).
3.  Intenta nuevamente con:
    - Usuario: `admin@dentalmate.com`
    - Contraseña: `Admin123!`
4.  Si alguien cambio la contraseña del superadmin, fuerza el reset:
    ```bash
    docker compose exec backend php artisan db:seed --class=ResetAdminPasswordSeeder
    ```
**Error de permisos en `storage/`**
```bash
docker compose exec backend chown -R www-data:www-data /var/www/html/storage
```
