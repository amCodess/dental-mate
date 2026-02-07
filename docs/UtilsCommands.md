# Scripts de gestión DentalMate

Este documento contiene comandos útiles para la gestión del proyecto DentalMate, organizados por categorías.

---

## 📦 Docker

### Gestión de contenedores
<z>
```bash
# Iniciar todos los servicios
docker compose up -d

# Detener todos los servicios
docker compose down

# Reiniciar todos los servicios
docker compose restart

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f app
docker compose logs -f db
docker compose logs -f frontend

# Ver estado de los contenedores
docker compose ps

# Reconstruir imágenes y reiniciar
docker compose up -d --build

# Eliminar contenedores y volúmenes (⚠️ Elimina datos)
docker compose down -v
```

### Acceso a contenedores

```bash
# Acceder al contenedor backend (Laravel/PHP)
docker compose exec app bash

# Acceder al contenedor de base de datos
docker compose exec db bash

# Acceder al contenedor frontend (Node/Vite)
docker compose exec frontend sh
```

---

## 🗄️ Base de datos (PostgreSQL)

### Conexión y consultas básicas

```bash
# Conectar a PostgreSQL
docker compose exec db psql -U dental_user -d dental_mate

# Ejecutar consulta SQL directamente
docker compose exec db psql -U dental_user -d dental_mate -c "CONSULTA_SQL"
```

### Listar estructuras

```bash
# Listar todas las tablas
docker compose exec db psql -U dental_user -d dental_mate -c "\dt"

# Listar tablas con detalles (tamaño, etc.)
docker compose exec db psql -U dental_user -d dental_mate -c "\dt+"

# Describir estructura de una tabla
docker compose exec db psql -U dental_user -d dental_mate -c "\d nombre_tabla"
docker compose exec db psql -U dental_user -d dental_mate -c "\d users"
docker compose exec db psql -U dental_user -d dental_mate -c "\d \`"Citas\`""

# Listar bases de datos
docker compose exec db psql -U dental_user -d dental_mate -c "\l"

# Listar esquemas
docker compose exec db psql -U dental_user -d dental_mate -c "\dn"
```

### Gestión de usuarios

```bash
# Listar todos los usuarios (emails)
docker compose exec db psql -U dental_user -d dental_mate -c "SELECT id, name, email, created_at FROM users;"

# Ver detalles completos de un usuario (⚠️ NO muestra contraseña en claro)
docker compose exec db psql -U dental_user -d dental_mate -c "SELECT * FROM users WHERE email = 'ejemplo@email.com';"

# Contar usuarios
docker compose exec db psql -U dental_user -d dental_mate -c "SELECT COUNT(*) FROM users;"

# Buscar usuarios por nombre
docker compose exec db psql -U dental_user -d dental_mate -c "SELECT id, name, email FROM users WHERE name LIKE '%nombre%';"
```

### Gestión de datos

```bash
# Eliminar un usuario específico por email
docker compose exec db psql -U dental_user -d dental_mate -c "DELETE FROM users WHERE email = 'ejemplo@email.com';"

# Eliminar usuarios que coincidan con un patrón
docker compose exec db psql -U dental_user -d dental_mate -c "DELETE FROM users WHERE email LIKE '%patron%';"

# Vaciar tabla completa (⚠️ Elimina todos los registros)
docker compose exec db psql -U dental_user -d dental_mate -c "TRUNCATE TABLE nombre_tabla CASCADE;"

# Insertar usuario manualmente
docker compose exec db psql -U dental_user -d dental_mate -c "INSERT INTO users (name, email, password, created_at, updated_at) VALUES ('Usuario Test', 'test@test.com', '\$2y\$12\$hashedpassword', NOW(), NOW());"
```

### Backup y restauración

```bash
# Crear backup de la base de datos
docker compose exec db pg_dump -U dental_user dental_mate > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar desde backup
docker compose exec -T db psql -U dental_user dental_mate < backup_archivo.sql

# Exportar solo datos de una tabla
docker compose exec db pg_dump -U dental_user dental_mate --table=nombre_tabla --data-only > tabla_data.sql
```

---

## 🔧 Laravel (Backend)

### Artisan - Comandos generales

```bash
# Limpiar caché
docker compose exec app php artisan cache:clear
docker compose exec app php artisan config:clear
docker compose exec app php artisan route:clear
docker compose exec app php artisan view:clear

# Ver rutas registradas
docker compose exec app php artisan route:list

# Ver configuración actual
docker compose exec app php artisan config:show

# Entrar en modo interactivo (Tinker)
docker compose exec app php artisan tinker
```

### Migraciones

```bash
# Ver estado de migraciones
docker compose exec app php artisan migrate:status

# Ejecutar migraciones pendientes
docker compose exec app php artisan migrate

# Ejecutar migraciones sin confirmación (producción)
docker compose exec app php artisan migrate --force

# Revertir última migración
docker compose exec app php artisan migrate:rollback

# Revertir todas las migraciones
docker compose exec app php artisan migrate:reset

# Recrear base de datos desde cero (⚠️ Elimina todos los datos)
docker compose exec app php artisan migrate:fresh

# Recrear base de datos y ejecutar seeders
docker compose exec app php artisan migrate:fresh --seed

# Crear nueva migración
docker compose exec app php artisan make:migration nombre_de_la_migracion
```

### Seeders

```bash
# Ejecutar todos los seeders
docker compose exec app php artisan db:seed

# Ejecutar seeder específico
docker compose exec app php artisan db:seed --class=NombreSeeder

# Crear nuevo seeder
docker compose exec app php artisan make:seeder NombreSeeder
```

### Generación de código

```bash
# Crear controlador
docker compose exec app php artisan make:controller NombreController

# Crear modelo
docker compose exec app php artisan make:model Nombre

# Crear modelo con migración
docker compose exec app php artisan make:model Nombre -m

# Crear modelo con migración, factory y seeder
docker compose exec app php artisan make:model Nombre -mfs

# Crear middleware
docker compose exec app php artisan make:middleware NombreMiddleware

# Crear request (validación)
docker compose exec app php artisan make:request NombreRequest
```

### JWT (Autenticación)

```bash
# Generar secret JWT
docker compose exec app php artisan jwt:secret

# Invalidar token JWT (en código, usar Auth::logout())
```

---

## ⚛️ Frontend (React + Vite)

### NPM - Gestión de dependencias

```bash
# Acceder al contenedor frontend
docker compose exec frontend sh

# Instalar dependencias
npm install

# Instalar paquete específico
npm install nombre-paquete

# Instalar paquete de desarrollo
npm install -D nombre-paquete

# Desinstalar paquete
npm uninstall nombre-paquete

# Actualizar dependencias
npm update

# Ver dependencias desactualizadas
npm outdated
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo (dentro del contenedor)
npm run dev

# Construir para producción
npm run build

# Vista previa de build de producción
npm run preview

# Limpiar caché de node_modules
rm -rf node_modules package-lock.json && npm install
```

---

## 🔍 Depuración y logs

### Logs de Laravel

```bash
# Ver logs de Laravel en tiempo real
docker compose exec app tail -f storage/logs/laravel.log

# Ver últimas 100 líneas del log
docker compose exec app tail -n 100 storage/logs/laravel.log

# Limpiar logs
docker compose exec app truncate -s 0 storage/logs/laravel.log
```

### Logs de PostgreSQL

```bash
# Ver logs de PostgreSQL en Docker
docker compose logs db

# Ver logs en tiempo real
docker compose logs -f db
```

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
docker compose exec app php artisan test

# Ejecutar tests con cobertura
docker compose exec app php artisan test --coverage

# Ejecutar test específico
docker compose exec app php artisan test --filter NombreDelTest

# Crear nuevo test
docker compose exec app php artisan make:test NombreTest
```

---

## 🔐 Seguridad

### Contraseñas

> **Nota importante**: Las contraseñas en la base de datos están **hasheadas con bcrypt**. No es posible ver la contraseña en texto plano, solo puedes:
> 1. Resetear la contraseña.
> 2. Crear un usuario con contraseña conocida.

```bash
# Ver hash de contraseña (no es la contraseña real)
docker compose exec db psql -U dental_user -d dental_mate -c "SELECT id, email, password FROM users WHERE email = 'ejemplo@email.com';"

# Generar hash de contraseña en Laravel Tinker
docker compose exec app php artisan tinker
# Luego ejecutar: Hash::make('nueva_contraseña')

# Actualizar contraseña de un usuario
docker compose exec db psql -U dental_user -d dental_mate -c "UPDATE users SET password = '\$2y\$12\$HASH_GENERADO' WHERE email = 'ejemplo@email.com';"
```

---

## 📝 Notas importantes

- **⚠️ Contraseñas hasheadas**: Laravel usa bcrypt para hashear contraseñas. No es posible recuperar una contraseña en texto plano desde la base de datos.
- **⚠️ Comandos destructivos**: Los comandos marcados con ⚠️ eliminan datos permanentemente. Úsalos con precaución.
- **🔄 Actualización de .env**: Si modificas el archivo `.env`, reinicia los contenedores para aplicar cambios:
  ```bash
  docker compose restart
  ```
- **🗄️ Esquema DentalMate.sql**: El archivo `docs/DentalMate.sql` contiene el esquema completo multi-tenant. Las migraciones actuales de Laravel son una versión simplificada.