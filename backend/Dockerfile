FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev 

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd
RUN docker-php-ext-enable opcache

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# PHP performance config (opcache, realpath cache)
COPY docker/php-opcache.ini /usr/local/etc/php/conf.d/zzz-opcache.ini

# Set working directory
WORKDIR /var/www/html

# Entrypoint updates dependencies if needed
ENTRYPOINT ["docker-entrypoint.sh"]

