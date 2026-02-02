# Script de Inicializacion de Proyecto DentalMate

Write-Host "Iniciando configuracion de DentalMate..." -ForegroundColor Cyan

# 0. Configurar Entorno (.env)
if (-not (Test-Path ".\backend\.env")) {
    Write-Host "Configurando archivo .env para Backend..." -ForegroundColor Yellow
    Copy-Item ".\backend\.env.example" ".\backend\.env"
    
    # Reemplazar configuracion de SQLite por PostgreSQL (Docker)
    (Get-Content ".\backend\.env") -replace "DB_CONNECTION=sqlite", "DB_CONNECTION=pgsql" `
                                    -replace "# DB_HOST=127.0.0.1", "DB_HOST=db" `
                                    -replace "# DB_PORT=3306", "DB_PORT=5432" `
                                    -replace "# DB_DATABASE=laravel", "DB_DATABASE=dental_mate" `
                                    -replace "# DB_USERNAME=root", "DB_USERNAME=dental_user" `
                                    -replace "# DB_PASSWORD=", "DB_PASSWORD=dental_password" | Set-Content ".\backend\.env"
    Write-Host "Archivo .env configurado para PostgreSQL." -ForegroundColor Green
}

# 1. Levantar contenedores
Write-Host "Levantando contenedores Docker..." -ForegroundColor Yellow
docker compose up -d --build

# Esperar a que los contenedores esten listos
Write-Host "Esperando a que inicien los servicios..."
Start-Sleep -Seconds 10

# 2. Inicializar Backend (Laravel)
Write-Host "Instalando dependencias de Backend (Composer)..." -ForegroundColor Yellow
# Usamos timeout alto para evitar fallos en unzip
docker compose exec -u root -e COMPOSER_PROCESS_TIMEOUT=2000 app composer install

Write-Host "Generando clave de aplicacion..." -ForegroundColor Yellow
docker compose exec -u root app php artisan key:generate

# Generar JWT Secret si no existe
Write-Host "Configurando JWT..." -ForegroundColor Yellow
docker compose exec -u root app bash -c "grep -q 'JWT_SECRET' .env || (php -r 'echo \"JWT_SECRET=\" . base64_encode(random_bytes(32)) . PHP_EOL;' >> .env && php -r 'echo \"JWT_ALGO=HS256\" . PHP_EOL;' >> .env && php -r 'echo \"JWT_TTL=60\" . PHP_EOL;' >> .env)"


if (Test-Path ".\docs\DentalMate.sql") {
    Write-Host "Importando esquema de base de datos desde docs\DentalMate.sql..." -ForegroundColor Yellow
    docker compose cp docs/DentalMate.sql db:/tmp/dump.sql
    # Importamos usando psql directamente
    docker compose exec -u root db psql -U dental_user -d dental_mate -f /tmp/dump.sql
    
    # Crear tabla sessions requerida por Laravel
    Write-Host "Creando tabla sessions..." -ForegroundColor Yellow
    docker compose exec -u root db psql -U dental_user -d dental_mate -c "CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(255) PRIMARY KEY, user_id INT NULL, ip_address VARCHAR(45) NULL, user_agent TEXT NULL, payload TEXT NOT NULL, last_activity INT NOT NULL); CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions (user_id); CREATE INDEX IF NOT EXISTS sessions_last_activity_index ON sessions (last_activity);"
    
    # Insertar roles por defecto
    Write-Host "Insertando roles por defecto..." -ForegroundColor Yellow
    docker compose exec -u root db psql -U dental_user -d dental_mate -c "INSERT INTO \"Roles\" (nombre_role, descripcion, tipo) VALUES ('admin', 'Administrador del sistema', 'empleado'), ('usuario', 'Usuario regular', 'usuario') ON CONFLICT DO NOTHING;"
} else {
    Write-Host "Ejecutando migraciones de base de datos (Default)..." -ForegroundColor Yellow
    docker compose exec -u root app php artisan migrate --seed --force
}

# 3. Inicializar Frontend (React + Vite)
if (-not (Test-Path ".\frontend\package.json")) {
    # Caso: Nuevo proyecto (vacio)
    Write-Host "Instalando React + Vite en el contenedor frontend..." -ForegroundColor Yellow
    docker compose exec -u root frontend npm create vite@latest . -- --template react
    docker compose exec -u root frontend npm install
} else {
    # Caso: Proyecto existente (git clone)
    Write-Host "Instalando dependencias de Frontend (NPM) dentro de Docker..." -ForegroundColor Yellow
    # Instalamos en el volumen nombrado para compatibilidad Linux/Windows
    docker compose run --rm -u root frontend npm install
}

# 4. Configurar Permisos Finales
Write-Host "Ajustando permisos..." -ForegroundColor Yellow
# Backend
docker compose exec -u root app chown -R dental:dental /var/www/html/storage /var/www/html/bootstrap/cache
# Frontend (Asegurar que el volumen de node_modules pertenezca al usuario 'node')
docker compose exec -u root frontend chown -R node:node /app/node_modules

# Reiniciar frontend para aplicar cambios
docker compose restart frontend

Write-Host "Inicializacion completada!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173"
Write-Host "   Backend API: http://localhost:8000/api"
