FROM php:8.2-apache

# Install system dependencies and PHP extensions
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        curl \
        libzip-dev \
        libpq-dev \
        libonig-dev \
        zlib1g-dev \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring zip \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Configure Apache to serve the Laravel public directory and listen on the dynamic Koyeb port
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
ENV PORT=8000
RUN sed -ri "s!/var/www/html!${APACHE_DOCUMENT_ROOT}!g" /etc/apache2/sites-available/000-default.conf \
    && sed -ri "s!<Directory /var/www/>!<Directory ${APACHE_DOCUMENT_ROOT}/>!g" /etc/apache2/apache2.conf \
    && sed -i "s/80/${PORT}/g" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf \
    && echo "ServerName localhost" >> /etc/apache2/apache2.conf

WORKDIR /var/www/html

# Install Composer
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install PHP dependencies
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Copy the rest of the application code
COPY . .

# Re-run Composer without skipping scripts now that the full application is present
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

EXPOSE $PORT

CMD ["apache2-foreground"]
