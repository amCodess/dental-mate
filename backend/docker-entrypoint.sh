#!/bin/sh

# Salir si algo falla
set -e

# Moverse al código
cd /var/www/html

# Instalar deps si falta vendor
if [ ! -d "vendor" ]; then
  composer install --no-interaction --prefer-dist --no-progress
fi

# Generar key si se permite
if [ "${APP_AUTO_KEYGENERATE}" = "true" ] || [ "${APP_AUTO_KEYGENERATE}" = "1" ]; then
  php artisan key:generate --force || true
fi

# Migraciones desactivadas por defecto (APP_RUN_MIGRATIONS=false)
if [ "${APP_RUN_MIGRATIONS}" = "true" ] || [ "${APP_RUN_MIGRATIONS}" = "1" ]; then
  php artisan migrate --force
fi

# Optimizar caches de Laravel para acelerar respuestas
if [ "${APP_OPTIMIZE:-true}" = "true" ]; then
  # Evitar fallo de view:cache si no hay vistas (API only)
  mkdir -p resources/views
  (
    set +e
    php artisan config:cache --quiet
    php artisan route:cache --quiet
  ) >/dev/null 2>&1 &
fi

# Servidor PHP embebido en el puerto 8000
exec php -S 0.0.0.0:8000 -t public public/index.php
