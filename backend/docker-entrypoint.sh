#!/bin/bash

# Exit on error
set -e

# Install dependencies if vendor missing
if [ ! -d "vendor" ]; then
    echo "Vendor directory not found. Installing dependencies..."
    composer install --ignore-platform-reqs
fi

# Ensure .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env || true
    # If copy failed (no example), we might need to rely on the one created by the user or creating a dummy
fi

# Generate key if not set
if grep -q "APP_KEY=" .env && [ -z "$(grep "APP_KEY=base64" .env)" ]; then
    echo "Generating application key..."
    php artisan key:generate
fi

# Run migrations with retry to wait for DB readiness
echo "Running database migrations..."
set +e
status=1
attempt=1
max_attempts=30
while [ $attempt -le $max_attempts ]; do
    php artisan migrate --force --no-interaction
    status=$?
    if [ $status -eq 0 ]; then
        echo "Migrations complete."
        break
    fi
    echo "Migration failed (attempt $attempt/$max_attempts). Retrying in 2s..."
    sleep 2
    attempt=$((attempt + 1))
done
set -e

if [ $status -ne 0 ]; then
    echo "Migrations failed after $max_attempts attempts."
    exit $status
fi

# Optional config/route caching for faster boot
if [ "${APP_CACHE_CONFIG}" = "true" ]; then
    echo "Caching config..."
    php artisan config:cache
fi

if [ "${APP_CACHE_ROUTES}" = "true" ]; then
    echo "Caching routes..."
    php artisan route:cache
fi

# Start server
echo "Starting Laravel server..."
exec php artisan serve --host=0.0.0.0 --port=8000
