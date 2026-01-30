FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    git \
    unzip \
    curl

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_pgsql \
    mbstring \
    zip \
    exif \
    pcntl \
    bcmath \
    intl \
    opcache

# basic php.ini config
RUN echo "upload_max_filesize=50M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size=50M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit=256M" >> /usr/local/etc/php/conf.d/memory.ini

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create a non-root user matching the host user (optional, but good practice for dev)
# Here we use standard www-data but ensure it can own files if needed
# Or better, create a 'dental' user
RUN addgroup -g 1000 dental && adduser -u 1000 -G dental -s /bin/sh -D dental

USER dental

WORKDIR /var/www/html
