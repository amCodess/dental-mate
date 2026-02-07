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

# Start server
echo "Starting Laravel server..."
exec php artisan serve --host=0.0.0.0 --port=8000
