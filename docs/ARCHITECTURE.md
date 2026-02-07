# Arquitectura del proyecto DentalMate

## 1. Visión general y estructura

El sistema DentalMate está diseñado para ser una solución de gestión clínica robusta y escalable. Aunque se concibe con una mentalidad de servicios distribuidos, la implementación inicial seguirá un patrón de **monolito modular**.

### Estructura de directorios

```text
/dental-mate
├── /backend                    # API REST (Laravel)
│   ├── /app
│   │   ├── /Modules            # Lógica de dominio modularizada
│   │   │   ├── /Auth           # (DTOs, Services, Models, Events)
│   │   │   ├── /Patients
│   │   │   ├── /Appointments
│   │   │   └── /Billing
│   │   ├── /Http/Controllers   # Controladores (Slim, solo orquestan)
│   │   └── /Core               # Shared Kernel (Helpers, Traits comunes)
│   ├── /routes                 # api.php (versionado v1)
│   └── ...
├── /frontend                   # SPA (React + Vite)
│   ├── /src
│   │   ├── /features           # Slices de funcionalidad (Auth, Calendar, etc.)
│   │   ├── /components         # UI Kit compartido
│   │   └── /services           # API Clients
├── /docker                     # Infraestructura los code
└── /docs                       # Documentación técnica
```

---

## 2. Stack tecnológico

Basado en la propuesta del proyecto y optimizado para las necesidades detectadas:

### Backend
- **Lenguaje**: PHP 8.2+
- **Framework**: Laravel 10/11
    - Gestión de rutas, controladores, middlewares.
    - Eloquent ORM para manejo de datos.
    - **Queue system**: Laravel Queues (Database driver inicialmente).
- **Seguridad**: JWT (JSON Web Tokens) vía `tymon/jwt-auth`.

### Frontend
- **Librería UI**: React 18+
- **Build tool**: Vite (para entorno de desarrollo rápido).
- **Lenguaje**: JavaScript (ES6+).
- **Estilos**: CSS Puro / CSS Modules (Diseño Responsive y "Premium" sin frameworks pesados si no se requieren).
- **Comunicación**: AJAX vía **Axios** (Interceptores para manejo de tokens JWT).

### Base de datos
- **Motor**: PostgreSQL 15+
    - **Crítico**: El esquema `DentalMate.sql` utiliza características avanzadas de Postgres (`ENUMs`, `EXCLUDE USING GIST`, campos `GENERATED ALWAYS`).
    - *Nota*: SQLite **NO** es compatible con este esquema debido a la falta de soporte para tipos Enum nativos y constraints geométricos/temporales complejos.

### Infraestructura (DevOps)
- **Contenedorización**: Docker & Docker Compose.
    - Servicios: `app` (PHP-FPM), `web` (Nginx), `db` (Postgres), `frontend` (Node/Nginx para serve estático).

---

## 3. Estrategia modular: definición detallada de módulos

El backend se estructura en módulos independientes "lógicos", donde cada un tiene sus propias rutas, controladores y servicios. Esto facilita la futura migración a microservicios reales.

### 3.1 AuthService (autenticación y autorización)
Encargado de la seguridad y el control de acceso.
-   **Responsabilidad**: Login, registro (si aplica), refresco de tokens, gestión de permisos (roles).
-   **Endpoints (/api/v1/auth/...)**:
    -   `POST /login`: Valida credenciales, retorna JWT y usuario.
    -   `POST /register`: (Solo Admin) Crea nuevos usuarios de sistema.
    -   `POST /logout`: Invalida el token actual.
    -   `GET /me`: Obtiene datos del usuario actual y sus permisos.
    -   `POST /refresh`: Renueva el JWT expirado.

### 3.2 PatientsService (gestión de pacientes)
Núcleo clínico administrativo.
-   **Responsabilidad**: Alta, baja y modificación de datos de pacientes. Búsqueda avanzada.
-   **Endpoints (/api/v1/patients/...)**:
    -   `GET /`: Lista paginada de pacientes (filtros por nombre, DNI).
    -   `POST /`: Crea un nuevo paciente.
    -   `GET /{id}`: Detalles completos del paciente.
    -   `PUT /{id}`: Actualiza datos personales.
    -   `DELETE /{id}`: Baja lógica (Soft Delete).
    -   `GET /{id}/history`: Acceso directo a resumen histórico (relación con HistoricalService).

### 3.3 AppointmentsService (gestión de citas)
Motor de la agenda clínica.
-   **Responsabilidad**: Programación, validación de conflictos (Exclusion Constraints), gestión de estados.
-   **Endpoints (/api/v1/appointments/...)**:
    -   `GET /`: Vista calendario (params: `from`, `to`, `doctor_id`).
    -   `POST /`: Agendar nueva cita (Valida disponibilidad).
    -   `PATCH /{id}/reschedule`: Mover cita (Valida conflicto).
    -   `PATCH /{id}/status`: Transiciones (`CONFIRMED` -> `COMPLETED` -> `CANCELLED`).
    -   `GET /availability`: Endpoint auxiliar para consultar slots libres.

### 3.4 BillingService (facturación y pagos)
Módulo financiero.
-   **Responsabilidad**: Generación de presupuestos, emisión de facturas, registro de pagos.
-   **Endpoints (/api/v1/billing/...)**:
    -   `POST /invoices`: Generar factura desde un tratamiento completado.
    -   `GET /invoices/{id}`: Obtener PDF o datos de factura.
    -   `POST /payments`: Registrar un pago (parcial o total).
    -   `GET /stats`: Reporte de ingresos (diario/mensual).
    -   `POST /quotes`: Crear presupuesto para paciente.

### 3.5 NotificationsService (comunicaciones)
Sistema de mensajería asíncrona.
-   **Responsabilidad**: Envío de correos, SMS o Webhooks a terceros.
-   **Endpoints (/api/v1/notifications/...)**:
    -   `POST /send`: (Interno/Admin) Disparar notificación manual.
    -   `GET /logs`: Historial de envíos.
    -   `POST /webhooks/register`: Registrar URL para eventos (ej. integración con Zapier).
    -   `GET /preferences`: Configurar canales preferidos por usuario.

---

## 4. Estrategia arquitectónica: de monolito a microservicios

### Enfoque actual: monolito modular
Se opta por un monolito modular para el MVP y fases iniciales por:
- **Simplicidad operativa**: Un solo pipeline de CI/CD, un solo repositorio, menor complejidad de red.
- **Consistencia de datos**: Transacciones ACID facilitadas en una única base de datos física (aunque lógicamente separada).

### Criterios de transición a microservicios
La separación física de un módulo a un servicio independiente se disparará solo si:
1.  **Escalabilidad independiente**: Un módulo (ej. Notificaciones) requiere recursos desproporcionados respecto al resto.
2.  **Ciclo de vida dispar**: Un equipo dedicado necesita desplegar cambios en "Facturación" varias veces al día sin afectar al núcleo clínico.
3.  **Tecnología específica**: Se requiere un lenguaje distinto para una tarea concreta (ej. Python para IA de análisis de imágenes).

**Límites de dominio (Bounded contexts):**
Se definen contextos delimitados claros. Comunicación entre módulos *dentro* del monolito se realizará vía **interfaces de servicio** (no llamadas directas a Eloquent de otro módulo) o **eventos de dominio**.

---

## 5. Modelo de datos y multi-tenancy

Para soportar múltiples clínicas (empresas) bajo una misma instalación (SAAS), se implementará una estrategia multi-tenancy.

### Estrategia: base de datos compartida (Shared Database, Separate Schemas/Discriminator)
Por eficiencia en recursos para el MVP, usaremos una **columna discriminadora** (`id_empresa` / `tenant_id`) en todas las tablas principales.

- **Tablas globales**: `Usuarios`, `Empresas` (tenants), `Roles`, `Planes`? (implícito).
- **Tablas tenant-scoped**: `Pacientes`, `Citas`, `Tratamientos`, `Facturacion`.
- **Seguridad**:
    - **Global scopes en Laravel**: Aplicar automáticamente `where('id_empresa', $currentEmpresaId)` en todas las consultas de Eloquent.
    - **RLS (Row Level Security)**: Configuración en PostgreSQL para reforzar el aislamiento a nivel de motor (Usuario de DB `app_rls` definido en SQL).

### Selección de contexto
El frontend enviará el contexto activo en cada petición, típicamente vía cabecera `X-Tenant-ID` (o derivado del token JWT si el usuario solo pertenece a una empresa).

---

## 6. Contratos de API y estándares de implementación

### Estándar de API REST
- **Versionado**: Prefijo `/api/v1/...`
- **Formato**: JSON (`application/json`)

#### Formato de respuesta exitoso
```json
{
  "data": { ... },       // Objeto o Array de resultados
  "meta": {              // Metadatos (paginación)
    "current_page": 1,
    "per_page": 15,
    "total": 57
  }
}
```

#### Formato de error
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "El paciente solicitado no existe.",
    "details": []        // Errores de validación detallados si aplica
  }
}
```

### Lógica de negocio
- **Services pattern**: Los controladores NO contienen lógica de negocio. Solo validan input y llaman a un `Service` o `Action`.
    - Ejemplo: `AppointmentController::store` llama a `CreateAppointmentAction`.
- **Validación**:
    - **FormRequests**: Para validación sintáctica de entrada (tipos, requeridos).
    - **Reglas de negocio**: Dentro de los servicios/modelos (ej. "No se puede agendar si el paciente tiene deuda > X").

---

## 7. Operación, despliegue y seguridad

### Configuración y secretos
- **Variables de entorno**: Todo lo configurable va en `.env` (no hardcodeado).
- **Gestión de secretos**:
    - `APP_KEY`
    - `JWT_SECRET`
    - `DB_PASSWORD`
    - No commitear `.env` nunca. Usar `.env.example`.

### Logs y observabilidad
- **Request ID**: Middleware que añade un UUID a cada request y response, y lo inyecta en el contexto de los logs para trazar peticiones completas.
- **Canales de log**:
    - `daily`: Archivos rotados por día en disco (para dev/simple deploy).
    - `slack`/`error-tracking`: Para errores críticos (500) en producción.

### Backups
- **Automatización**: Job programado (`Laravel Scheduler`) que ejecuta `pg_dump` diariamente y sube el archivo a un storage externo.

---

## 8. Sistema de notificaciones y colas

### Asyncónico y colas
Para no bloquear la respuesta HTTP en tareas pesadas (enviar emails, generar PDFs grandes).

- **Driver**: `database` (para simplicidad inicial) o `Redis` (producción recomendada).
- **Eventos de dominio**:
    - `AppointmentCreated` -> Listener: `SendAppointmentConfirmationEmail`
    - `InvoiceGenerated` -> Listener: `NotifyPatientNewInvoice`
- **Reintentos**: Configurar `tries` y `backoff` en los jobs para manejar fallos temporales de red.

### Tipos de notificación
- **Transaccionales**: Confirmación de cita, reseteo de password. (Prioridad Alta)
- **Recordatorios**: Cron job que busca citas `mañana` y dispara eventos. (Prioridad Media)

---

## 9. Estrategia de despliegue en Vercel

Dado el requerimiento de desplegar en la plataforma **Vercel**, la arquitectura se adapta de la siguiente manera para aprovechar su infraestructura "Serverless" y "Edge":

### 9.1. Arquitectura de despliegue (Split deployment)

Se recomienda separar el repositorio o la configuración de despliegue en dos proyectos dentro de Vercel (o usar un monorepo configurado):

1.  **Project Frontend (`/frontend`)**:
    -   **Framework preset**: Vite.
    -   **Build command**: `npm run build`.
    -   **Output directory**: `dist`.
    -   **Variables de entorno**: `VITE_API_URL` (Debe apuntar a la URL de producción del backend en Vercel).

2.  **Project Backend (`/backend`)**:
    -   **Runtime**: PHP vía **vercel-php** (Community Runtime). Esto permite ejecutar Laravel como funciones serverless.
    -   **Configuración**: Requiere archivo `vercel.json` en la raíz de `/backend`.
    -   **Limitaciones críticas**:
        -   **No persistencia**: No se pueden guardar archivos locales (drivers de `storage` para imágenes/PDFs deben ser S3/Google Cloud Storage).
        -   **Timeouts**: Las peticiones tienen un tiempo límite estricto (10s en plan Hobby, 60s en Pro).
        -   **No background jobs**: El sistema de colas (queues) y cron (scheduler) de Laravel **NO** funciona nativamente en entorno serverless puro.

### 9.2. Base de datos en Vercel
-   Se recomienda usar **Vercel Postgres** (impulsado por Neon) o un servicio externo compatible con PostgreSQL 15+.
-   Configuración en Laravel (`config/database.php`) debe usar `SSL mode` 'require' para conectar con Vercel Postgres.

### 9.3. Configuración específica (`vercel.json` para backend)

Ejemplo de configuración necesaria para desplegar Laravel en Vercel:

```json
{
    "version": 2,
    "builds": [
        { "src": "/api/index.php", "use": "vercel-php@0.6.0" }
    ],
    "routes": [
        { "src": "/(.*)", "dest": "/api/index.php" }
    ],
    "env": {
        "APP_ENV": "production",
        "APP_DEBUG": "false",
        "APP_KEY": "@app_key_secret",
        "DB_CONNECTION": "pgsql"
    }
}
```

### 9.4. Recomendación para TFC (Trabajo Fin de Ciclo)
Para asegurar el éxito de la defensa y la demostración de todas las funcionalidades (especialmente colas y notificaciones), se proponen dos caminos:

**Opción A: Full Vercel (sencilla para demo)**
-   **Frontend**: Vercel.
-   **Backend**: Vercel (serverless).
-   **Ajuste**: Configurar `QUEUE_CONNECTION=sync` en el `.env` de producción. Esto hará que el envío de emails y generación de PDFs se haga en el mismo momento de la petición HTTP. El usuario esperará unos segundos más, pero se garantiza que funcione sin necesidad de configurar workers externos complejos.

**Opción B: Híbrida (profesional)**
-   **Frontend**: Vercel.
-   **Backend**: Plataforma con soporte de procesos persistentes (ej. **Railway** o **Render**).
-   **Ventaja**: Permite tener workers de colas (`php artisan queue:work`) corriendo realmente en segundo plano, ideal para notificaciones masivas o tareas pesadas sin bloquear al usuario.
