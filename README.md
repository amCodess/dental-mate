# DentalMate

**DentalMate** es una aplicación web integral para la gestión de clínicas dentales, diseñada para optimizar la administración de pacientes, citas, tratamientos y facturación.

## 🚀 Visión del proyecto

El objetivo es modernizar la gestión clínica mediante una arquitectura modular y escalable, permitiendo a dentistas y asistentes centrarse en lo más importante: la atención al paciente.

## 🛠️ Stack tecnológico

-   **Backend**: PHP 8.2+ con Laravel 10/11.
-   **Frontend**: React 18+ (Vite).
-   **Base de datos**: PostgreSQL 15+.
-   **Infraestructura**: Docker para desarrollo local.

## 📂 Estructura del proyecto

El repositorio sigue una arquitectura de **monolito modular**:

-   `/backend`: API REST (Laravel).
-   `/frontend`: Single Page Application (React).
-   `/docker`: Configuración de contenedores.
-   `/docs`: Documentación de arquitectura y diseño.

## ⚡ Guía de inicio rápido (local con Docker)

### Requisitos previos
-   Docker Desktop instalado y corriendo.
-   Node.js 18+ y PHP 8.2 (opcional si usas Docker, pero recomendado para herramientas locales).

### Pasos para ejecutar

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/amCodess/dental-mate.git
    cd dental-mate
    ```

2.  **Levantar el entorno**:
    ```bash
    docker-compose up -d
    ```

3.  **Instalar dependencias (backend)**:
    ```bash
    docker-compose exec app composer install
    docker-compose exec app php artisan key:generate
    docker-compose exec app php artisan migrate --seed
    ```

4.  **Instalar dependencias (frontend)**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

5.  **Acceder a la aplicación**:
    -   Frontend: `http://localhost:5173`
    -   API: `http://localhost:8000/api`

## 🌍 Despliegue (Vercel)

Este proyecto está configurado para un despliegue "Split" en Vercel:
-   **Frontend**: Despliegue estático/SPA estándar de React.
-   **Backend**: Despliegue serverless usando `vercel-php`.

Para más detalles, consulta [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## 📄 Documentación

Toda la documentación técnica se encuentra en la carpeta `docs/`.
-   [Arquitectura](./docs/ARCHITECTURE.md)
-   [Propuesta inicial](./docs/Propuesta%20DentalMate.txt)

---
Desarrollado como Proyecto Fin de Ciclo (DAW).