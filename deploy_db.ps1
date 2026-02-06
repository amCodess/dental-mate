# deploy_db_fix.ps1
Write-Host "🚀 Iniciando despliegue del parche de base de datos..." -ForegroundColor Cyan

# 1. Configurar ruta de PostgreSQL
$pgPath = "C:\Program Files\PostgreSQL\18\bin"
if (Test-Path $pgPath) {
    Write-Host "✅ PostgreSQL 18 encontrado en: $pgPath" -ForegroundColor Green
    $env:Path += ";$pgPath"
} else {
    Write-Host "⚠️ No se detectó PostgreSQL 18 en la ruta por defecto. Intentando ejecutar de todos modos..." -ForegroundColor Yellow
}

# 2. Verificar archivo SQL
$sqlFile = "backend\database\init_database.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Error "❌ No se encuentra el archivo $sqlFile. Asegúrate de estar en la raíz del proyecto."
    exit 1
}

# 3. Ejecutar comando Railway
Write-Host "⏳ Enviando script a Railway (Servicio Postgres)..." -ForegroundColor Cyan
Write-Host "👉 Por favor, selecciona 'Postgres' si se te solicita y pulsa Enter." -ForegroundColor Yellow

# Usamos cmd /c para manejar la redirección de entrada (<) que PowerShell no maneja igual
cmd /c "railway connect < $sqlFile"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ¡Script ejecutado con éxito!" -ForegroundColor Green
    Write-Host "Los datos por defecto (Superadmin, Empresa, Clínica) deberían estar listos."
} else {
    Write-Host "`n❌ Hubo un error al ejecutar el script." -ForegroundColor Red
}
