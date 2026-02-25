# DentalMate

Aplicación web de gestión clínica desarrollada como **Trabajo de Fin de Grado (TFG) del ciclo DAW**.  
El proyecto está orientado a centralizar procesos clave de una clínica dental: autenticación, administración multiempresa/multiclínica, gestión de pacientes, citas, tratamientos y facturación.

## 📌 Resumen del proyecto

**DentalMate** nace con un enfoque full-stack para cubrir necesidades reales de digitalización en clínicas dentales, aplicando buenas prácticas de arquitectura, despliegue y mantenimiento.

### Objetivos principales
- Diseñar una solución web moderna y escalable para gestión odontológica.
- Integrar backend y frontend desacoplados mediante API REST.
- Facilitar despliegue reproducible en local con Docker.
- Servir como proyecto académico integral para demostrar competencias DAW.

## 🧩 Funcionalidades destacadas

- Inicio de sesión y control de acceso por usuario.
- Gestión de empresas y clínicas.
- Gestión de pacientes y su seguimiento.
- Gestión de citas y de histórico de citas.
- Gestión de tratamientos.
- Gestión de productos, proveedores y usuarios.
- Módulo de facturación.
- Panel administrativo y vistas de soporte para operaciones.

> El alcance funcional puede ampliarse según evolución del TFG.

## 🏗️ Arquitectura y stack tecnológico

### Backend
- **Laravel 12** (PHP 8.2+)
- Autenticación con **JWT** (`tymon/jwt-auth`)
- Generación de documentos con **Dompdf**
- API versionada sobre `/api/v1`

### Frontend
- **React 19** + **Vite 7**
- **React Router** para navegación
- **Axios** para consumo de API
- Formularios con **React Hook Form** + validación con **Yup**

### Base de datos
- **PostgreSQL 16**
- Esquema inicial centralizado en `backend/database/init_database.sql`

### Infraestructura local
- **Docker Compose** con servicios:
  - `backend` (Laravel)
  - `frontend` (React + Vite)
  - `db` (PostgreSQL)
  - `adminer` (gestión visual de base de datos)

## 📁 Estructura del repositorio

```text
.
├── backend/               # API Laravel
├── frontend/              # Aplicación React
├── docs/                  # Documentación técnica y SQL auxiliar
├── docker-compose.yml     # Orquestación de servicios
└── README.md
```

## 🚀 Puesta en marcha rápida (Docker recomendado)

### Prerrequisitos
- Docker Engine + Docker Compose v2
- Puertos libres: `8000`, `5173`, `5432`, `8081`

### Despliegue
```bash
docker compose up -d --build
```

### Accesos
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Adminer: http://localhost:8081

### Credenciales iniciales (entorno local)
- Usuario: `admin@dentalmate.com`
- Contraseña: `Admin123!`

> Para una reinicialización completa de base de datos:
>
> ```bash
> docker compose down -v
> docker compose up -d --build
> ```

## ⚙️ Ejecución manual (sin Docker)

### Backend
```bash
cd backend
composer install
php artisan serve
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Base de datos
- Crear base de datos PostgreSQL local.
- Importar esquema desde `backend/database/init_database.sql`.

## ✅ Estado académico del TFG

Este repositorio representa el desarrollo práctico del TFG, incluyendo:
- análisis y diseño técnico,
- implementación full-stack,
- despliegue y documentación,
- enfoque en mantenibilidad y escalabilidad.

## 📚 Documentación complementaria

- Guía de despliegue e inicialización: `docs/GUIA_DESPLIEGUE_E_INICIALIZACION.md`
- Script SQL de referencia: `backend/database/init_database.sql`

## 👤 Autor

Proyecto desarrollado como **Trabajo de Fin de Grado (DAW)**.

---

© 2026 DentalMate. Todos los derechos reservados.
