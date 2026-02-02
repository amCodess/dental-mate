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

Write-Host "Ejecutando migraciones de base de datos..." -ForegroundColor Yellow
docker compose exec -u root app php artisan migrate --seed --force

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
