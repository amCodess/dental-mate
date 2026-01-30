# Script de Inicializacion de Proyecto DentalMate

Write-Host "Iniciando configuracion de DentalMate..." -ForegroundColor Cyan

# 1. Levantar contenedores
Write-Host "Levantando contenedores Docker..." -ForegroundColor Yellow
docker compose up -d --build

# Esperar a que los contenedores esten listos
Start-Sleep -Seconds 10

# 2. Inicializar Backend (Laravel)
if (-not (Test-Path ".\backend\composer.json")) {
    Write-Host "Instalando Laravel en el contenedor backend..." -ForegroundColor Yellow
    # Limpiar directorio para asegurar que composer create-project funcione (requiere carpeta vacia)
    # Ejecutamos rm dentro del contenedor
    docker compose exec -u root app sh -c "find . -mindepth 1 -delete"
    
    # Instalar Laravel
    docker compose exec -u root app composer create-project laravel/laravel . --prefer-dist --no-interaction
    
    # Ajustar owner
    docker compose exec -u root app chown -R dental:dental .
} else {
    Write-Host "Laravel ya esta instalado." -ForegroundColor Green
}

# 3. Inicializar Frontend (React + Vite)
if (-not (Test-Path ".\frontend\package.json")) {
    Write-Host "Instalando React + Vite en el contenedor frontend..." -ForegroundColor Yellow
    
    # Crear proyecto Vite
    docker compose exec -u root frontend npm create vite@latest . -- --template react
    
    # Instalar dependencias
    docker compose exec -u root frontend npm install
    
    # Ajustar owner
    docker compose exec -u root frontend chown -R node:node .
} else {
    Write-Host "React ya esta instalado." -ForegroundColor Green
}

# 4. Configurar Permisos Finales
Write-Host "Ajustando permisos..." -ForegroundColor Yellow
docker compose exec -u root app chown -R dental:dental /var/www/html/storage /var/www/html/bootstrap/cache

Write-Host "Inicializacion completada!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173"
Write-Host "   Backend API: http://localhost:8000/api"
