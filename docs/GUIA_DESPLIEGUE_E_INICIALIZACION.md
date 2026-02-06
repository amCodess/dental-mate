# Guía de despliegue e inicialización local

Esta guía detalla cómo desplegar e inicializar el proyecto DentalMate en un entorno local, utilizando Docker (recomendado) o una configuración manual.

> [!IMPORTANT]
> El archivo `backend/database/init_database.sql` es la **única fuente de verdad** para la estructura de la base de datos.

---
# Guía de Despliegue e Inicialización - DentalMate

Este documento explica cómo levantar el proyecto en local usando Docker. He configurado todo para que sea lo más automático posible.

## Requisitos previos

Necesitas tener instalado:
- **Docker Desktop** (asegúrate de que está abierto).
- **Git** (para bajarte el código).

---

## 1. Puesta en marcha rápida 🚀

### 1.1 Clonar y preparar

Lo primero es bajarse el repo y entrar en la carpeta:

```bash
git clone <URL_DEL_REPO>
cd dental-mate
```

### 1.2 Arrancar los contenedores

He creado un script `docker-compose` que levanta el Backend (Laravel), el Frontend (React + Vite) y la Base de Datos (PostgreSQL) todo junto.

Ejecuta este comando para construir y levantar todo:
```bash
docker-compose up -d --build
```
*(Puede tardar un poco la primera vez mientras se bajan las imágenes y se instalan las dependencias).*

### 1.3 Configuración inicial

Una vez que los contenedores están arriba (puedes verlos en Docker Desktop), hay que hacer un par de ajustes **solo la primera vez**:

1.  **Generar la clave de la aplicación:**
    Le decimos al backend que genere su clave de cifrado:
    ```bash
    docker-compose exec backend php artisan key:generate
    ```
npm run dev
```

---

## Resolución de problemas

**Error: "bind: address already in use"**
Detén servicios locales (XAMPP, Postgres) que usen los puertos 8000, 5173 o 5432.

**Error de permisos en `storage/`**
```bash
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
```
