
-- =========================================================
-- DENTALMATE DATABASE INITIALIZATION SCRIPT
-- =========================================================
-- This script creates the entire schema and populates default data.
-- It is designed to be idempotent-safe for data insertion (IF NOT EXISTS).
--
-- Supported Environments: Local (Development), Railway (Production)
-- =========================================================

BEGIN;

-- =========================================================
-- 0) ROLES & EXTENSIONS
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
    CREATE ROLE app_owner NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_rls') THEN
    CREATE ROLE app_rls NOINHERIT BYPASSRLS;
  END IF;
END$$;

-- Endurecer schema public (opcional)
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE, CREATE ON SCHEMA public TO app_owner;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =========================================================
-- 1) ENUMS
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Citas_estado_enum') THEN
    CREATE TYPE "Citas_estado_enum" AS ENUM ('Pendiente','Confirmada','Cancelada','Completada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Facturacion_pago_status_enum') THEN
    CREATE TYPE "Facturacion_pago_status_enum" AS ENUM ('Pendiente','Pagado','Parcial');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Operacion_enum') THEN
    CREATE TYPE "Operacion_enum" AS ENUM ('INSERT','UPDATE','DELETE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Rol_tipo_enum') THEN
    CREATE TYPE "Rol_tipo_enum" AS ENUM ('empleado','usuario','sistema');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Consentimiento_estado_enum') THEN
    CREATE TYPE "Consentimiento_estado_enum" AS ENUM ('Aceptado','Rechazado','Pendiente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Tipo_pago_enum') THEN
    CREATE TYPE "Tipo_pago_enum" AS ENUM ('Efectivo','Tarjeta','Transferencia','Cheque');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Estado_pedido_enum') THEN
    CREATE TYPE "Estado_pedido_enum" AS ENUM ('Pendiente','Enviado','Recibido','Cancelado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Cita_tipo_enum') THEN
    CREATE TYPE "Cita_tipo_enum" AS ENUM ('Normal','Urgente','Control');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Cita_prioridad_enum') THEN
    CREATE TYPE "Cita_prioridad_enum" AS ENUM ('Baja','Media','Alta');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Movimiento_stock_tipo_enum') THEN
    CREATE TYPE "Movimiento_stock_tipo_enum" AS ENUM ('Entrada','Salida','Ajuste');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Estado_usuario_enum') THEN
    CREATE TYPE "Estado_usuario_enum" AS ENUM ('activo','inactivo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Recordatorio_estado_enum') THEN
    CREATE TYPE "Recordatorio_estado_enum" AS ENUM ('Pendiente','Enviado','Fallido');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Dia_semana_enum') THEN
    CREATE TYPE "Dia_semana_enum" AS ENUM ('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Tipo_mensaje_enum') THEN
    CREATE TYPE "Tipo_mensaje_enum" AS ENUM ('email','sms');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Tenant_role_enum') THEN
    CREATE TYPE "Tenant_role_enum" AS ENUM ('owner','admin','staff','viewer','empleado','manager');
  END IF;
END$$;

-- =========================================================
-- 2) FUNCIONES HELPER
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;
ALTER FUNCTION set_updated_at() OWNER TO app_owner;

-- =========================================================
-- 2.5) LARAVEL STANDARD TABLES
-- =========================================================
CREATE TABLE IF NOT EXISTS "cache" (
    "key" VARCHAR(255) NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "expiration" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "cache_locks" (
    "key" VARCHAR(255) NOT NULL PRIMARY KEY,
    "owner" VARCHAR(255) NOT NULL,
    "expiration" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" VARCHAR(255) NOT NULL PRIMARY KEY,
    "user_id" BIGINT NULL,
    "ip_address" VARCHAR(45) NULL,
    "user_agent" TEXT NULL,
    "payload" TEXT NOT NULL,
    "last_activity" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "sessions_user_id_index" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_last_activity_index" ON "sessions" ("last_activity");

CREATE TABLE IF NOT EXISTS "jobs" (
    "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "queue" VARCHAR(255) NOT NULL,
    "payload" TEXT NOT NULL,
    "attempts" SMALLINT NOT NULL,
    "reserved_at" INTEGER NULL,
    "available_at" INTEGER NOT NULL,
    "created_at" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "jobs_queue_index" ON "jobs" ("queue");

CREATE TABLE IF NOT EXISTS "failed_jobs" (
    "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "uuid" VARCHAR(255) NOT NULL UNIQUE,
    "connection" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "exception" TEXT NOT NULL,
    "failed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 3) TABLAS (SCHEMA DEFINITION)
-- =========================================================

-- Empresas
CREATE TABLE IF NOT EXISTS "Empresas" (
  "id_empresa" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "nombre" varchar(150) NOT NULL,
  "nif" varchar(50),
  "email" varchar(150),
  "telefono" varchar(20),
  "email_recordatorios" varchar(150),
  "telefono_recordatorios" varchar(20),
  "nombre_remitente" varchar(150),
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  CONSTRAINT "empresas_deleted_chk" CHECK (("deleted"=false AND "deleted_at" IS NULL) OR ("deleted"=true AND "deleted_at" IS NOT NULL)),
  CONSTRAINT "empresas_nombre_chk" CHECK (length(trim("nombre")) > 0)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_empresas_set_updated_at') THEN
    CREATE TRIGGER "tr_empresas_set_updated_at" BEFORE UPDATE ON "Empresas" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Clinicas
CREATE TABLE IF NOT EXISTS "Clinicas" (
  "id_clinica" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "nombre" varchar(150) NOT NULL,
  "telefono" varchar(20),
  "email_recordatorios" varchar(150),
  "telefono_recordatorios" varchar(20),
  "nombre_remitente" varchar(150),
  "direccion" varchar(255),
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  CONSTRAINT "clinicas_deleted_chk" CHECK (("deleted"=false AND "deleted_at" IS NULL) OR ("deleted"=true AND "deleted_at" IS NOT NULL)),
  CONSTRAINT "clinicas_nombre_chk" CHECK (length(trim("nombre")) > 0),
  CONSTRAINT "ux_clinicas_tenant" UNIQUE ("id_empresa","id_clinica")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_clinicas_set_updated_at') THEN
    CREATE TRIGGER "tr_clinicas_set_updated_at" BEFORE UPDATE ON "Clinicas" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Roles
CREATE TABLE IF NOT EXISTS "Roles" (
  "id_role" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "nombre_role" varchar(50) NOT NULL,
  "descripcion" varchar(255),
  "tipo" "Rol_tipo_enum" NOT NULL,
  CONSTRAINT "roles_nombre_chk" CHECK (length(trim("nombre_role")) > 0)
);

-- Usuarios
CREATE TABLE IF NOT EXISTS "Usuarios" (
  "id_usuario" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "nombre" varchar(100) NOT NULL,
  "apellido" varchar(100) NOT NULL,
  "email" varchar(150) NOT NULL,
  "password" varchar(255) NOT NULL,
  "estado" "Estado_usuario_enum" NOT NULL DEFAULT 'activo',
  "id_role" int NOT NULL,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  CONSTRAINT "usuarios_deleted_chk" CHECK (("deleted"=false AND "deleted_at" IS NULL) OR ("deleted"=true AND "deleted_at" IS NOT NULL)),
  CONSTRAINT "usuarios_email_chk" CHECK (length(trim("email")) > 3)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_usuarios_set_updated_at') THEN
    CREATE TRIGGER "tr_usuarios_set_updated_at" BEFORE UPDATE ON "Usuarios" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Usuarios_Empresas
CREATE TABLE IF NOT EXISTS "Usuarios_Empresas" (
  "id" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_usuario" int NOT NULL,
  "id_empresa" int NOT NULL,
  "rol" "Tenant_role_enum" NOT NULL,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ux_usuarios_empresas_usuario_empresa" UNIQUE ("id_usuario","id_empresa")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_usuarios_empresas_set_updated_at') THEN
    CREATE TRIGGER "tr_usuarios_empresas_set_updated_at" BEFORE UPDATE ON "Usuarios_Empresas" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Usuarios_Clinicas
CREATE TABLE IF NOT EXISTS "Usuarios_Clinicas" (
  "id" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_usuario" int NOT NULL,
  "id_clinica" int NOT NULL,
  "rol" "Tenant_role_enum" NOT NULL,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ux_usuarios_clinicas_usuario_clinica" UNIQUE ("id_usuario","id_clinica")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_usuarios_clinicas_set_updated_at') THEN
    CREATE TRIGGER "tr_usuarios_clinicas_set_updated_at" BEFORE UPDATE ON "Usuarios_Clinicas" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Empleados
CREATE TABLE IF NOT EXISTS "Empleados" (
  "id_empleado" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_clinica" int,
  "id_usuario" int UNIQUE NOT NULL,
  "especialidad" varchar(100),
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ux_empleados_tenant" UNIQUE ("id_empresa","id_empleado")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_empleados_set_updated_at') THEN
    CREATE TRIGGER "tr_empleados_set_updated_at" BEFORE UPDATE ON "Empleados" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Pacientes
CREATE TABLE IF NOT EXISTS "Pacientes" (
  "id_paciente" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_clinica" int,
  "id_usuario" int UNIQUE,
  "nombre" varchar(100),
  "apellido" varchar(100),
  "email" varchar(150),
  "fecha_nacimiento" date,
  "telefono" varchar(20),
  "direccion" varchar(255),
  "historial_medico" text,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  CONSTRAINT "pacientes_deleted_chk" CHECK (("deleted"=false AND "deleted_at" IS NULL) OR ("deleted"=true AND "deleted_at" IS NOT NULL)),
  CONSTRAINT "ux_pacientes_tenant" UNIQUE ("id_empresa","id_paciente")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_pacientes_set_updated_at') THEN
    CREATE TRIGGER "tr_pacientes_set_updated_at" BEFORE UPDATE ON "Pacientes" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Consentimientos
CREATE TABLE IF NOT EXISTS "Consentimientos" (
  "id_consentimiento" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_paciente" int NOT NULL,
  "tipo" varchar(100) NOT NULL,
  "estado" "Consentimiento_estado_enum" NOT NULL DEFAULT 'Pendiente',
  "fecha" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consentimientos_tipo_chk" CHECK (length(trim("tipo")) > 0),
  CONSTRAINT "ux_consentimientos_tenant" UNIQUE ("id_empresa","id_consentimiento")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_consentimientos_set_updated_at') THEN
    CREATE TRIGGER "tr_consentimientos_set_updated_at" BEFORE UPDATE ON "Consentimientos" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Citas
CREATE TABLE IF NOT EXISTS "Citas" (
  "id_cita" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_clinica" int,
  "id_paciente" int NOT NULL,
  "id_empleado" int NOT NULL,
  "fecha" date NOT NULL,
  "hora" time NOT NULL,
  "estado" "Citas_estado_enum" NOT NULL DEFAULT 'Pendiente',
  "notas" text,
  "duracion_minutos" int NOT NULL DEFAULT 30,
  "tipo" "Cita_tipo_enum" NOT NULL DEFAULT 'Normal',
  "prioridad" "Cita_prioridad_enum" NOT NULL DEFAULT 'Media',
  "inicio_ts" timestamp GENERATED ALWAYS AS (("fecha" + "hora")) STORED,
  "fin_ts" timestamp GENERATED ALWAYS AS (("fecha" + "hora" + ("duracion_minutos" * interval '1 minute'))) STORED,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  CONSTRAINT "citas_deleted_chk" CHECK (("deleted"=false AND "deleted_at" IS NULL) OR ("deleted"=true AND "deleted_at" IS NOT NULL)),
  CONSTRAINT "citas_duracion_chk" CHECK ("duracion_minutos" > 0),
  CONSTRAINT "ux_citas_tenant" UNIQUE ("id_empresa","id_cita"),
  CONSTRAINT "citas_no_solape_excl" EXCLUDE USING gist (
      "id_empresa" WITH =,
      "id_empleado" WITH =,
      tsrange("inicio_ts","fin_ts",'[)') WITH &&
    ) WHERE ("deleted" = false)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_citas_set_updated_at') THEN
    CREATE TRIGGER "tr_citas_set_updated_at" BEFORE UPDATE ON "Citas" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Disponibilidad
CREATE TABLE IF NOT EXISTS "Disponibilidad" (
  "id_disponibilidad" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_clinica" int,
  "id_empleado" int NOT NULL,
  "dia_semana" "Dia_semana_enum" NOT NULL,
  "hora_inicio" time NOT NULL,
  "hora_fin" time NOT NULL,
  "duracion_slot" int NOT NULL DEFAULT 30,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "disponibilidad_horas_chk" CHECK ("hora_inicio" < "hora_fin"),
  CONSTRAINT "disponibilidad_slot_chk" CHECK ("duracion_slot" > 0),
  CONSTRAINT "ux_disponibilidad_tenant" UNIQUE ("id_empresa","id_disponibilidad")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_disponibilidad_set_updated_at') THEN
    CREATE TRIGGER "tr_disponibilidad_set_updated_at" BEFORE UPDATE ON "Disponibilidad" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Historial
CREATE TABLE IF NOT EXISTS "Historial" (
  "id_historial" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_paciente" int NOT NULL,
  "id_empleado" int NOT NULL,
  "fecha" date NOT NULL,
  "descripcion" text,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  CONSTRAINT "historial_deleted_chk" CHECK (("deleted"=false AND "deleted_at" IS NULL) OR ("deleted"=true AND "deleted_at" IS NOT NULL)),
  CONSTRAINT "ux_historial_tenant" UNIQUE ("id_empresa","id_historial")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_historial_set_updated_at') THEN
    CREATE TRIGGER "tr_historial_set_updated_at" BEFORE UPDATE ON "Historial" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Documentos
CREATE TABLE IF NOT EXISTS "Documentos" (
  "id_documento" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_historial" int NOT NULL,
  "nombre_archivo" varchar(255),
  "url_archivo" text,
  "tipo_documento" varchar(50),
  "fecha_subida" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  CONSTRAINT "documentos_deleted_chk" CHECK (("deleted"=false AND "deleted_at" IS NULL) OR ("deleted"=true AND "deleted_at" IS NOT NULL)),
  CONSTRAINT "ux_documentos_tenant" UNIQUE ("id_empresa","id_documento")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_documentos_set_updated_at') THEN
    CREATE TRIGGER "tr_documentos_set_updated_at" BEFORE UPDATE ON "Documentos" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Tratamientos
CREATE TABLE IF NOT EXISTS "Tratamientos" (
  "id_tratamiento" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "nombre_tratamiento" varchar(150) NOT NULL,
  "descripcion" text,
  "unidades" numeric(10,2),
  "precio" numeric(10,2),
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tratamientos_nombre_chk" CHECK (length(trim("nombre_tratamiento")) > 0),
  CONSTRAINT "tratamientos_unidades_chk" CHECK ("unidades" IS NULL OR "unidades" >= 0),
  CONSTRAINT "tratamientos_precio_chk" CHECK ("precio" IS NULL OR "precio" >= 0),
  CONSTRAINT "ux_tratamientos_tenant" UNIQUE ("id_empresa","id_tratamiento")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_tratamientos_set_updated_at') THEN
    CREATE TRIGGER "tr_tratamientos_set_updated_at" BEFORE UPDATE ON "Tratamientos" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Productos
CREATE TABLE IF NOT EXISTS "Productos" (
  "id_producto" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "nombre_producto" varchar(150) NOT NULL,
  "precio" numeric(10,2),
  "coste" numeric(10,2),
  "vendible" boolean NOT NULL DEFAULT true,
  "stock_actual" int NOT NULL DEFAULT 0,
  "stock_minimo" int NOT NULL DEFAULT 0,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "productos_nombre_chk" CHECK (length(trim("nombre_producto")) > 0),
  CONSTRAINT "productos_precio_chk" CHECK ("precio" IS NULL OR "precio" >= 0),
  CONSTRAINT "productos_coste_chk" CHECK ("coste" IS NULL OR "coste" >= 0),
  CONSTRAINT "productos_stock_actual_chk" CHECK ("stock_actual" >= 0),
  CONSTRAINT "productos_stock_minimo_chk" CHECK ("stock_minimo" >= 0),
  CONSTRAINT "ux_productos_tenant" UNIQUE ("id_empresa","id_producto")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_productos_set_updated_at') THEN
    CREATE TRIGGER "tr_productos_set_updated_at" BEFORE UPDATE ON "Productos" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Productos_Tratamientos
CREATE TABLE IF NOT EXISTS "Productos_Tratamientos" (
  "id_producto_tratamiento" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_producto" int NOT NULL,
  "id_tratamiento" int NOT NULL,
  "unidades" int,
  "consumible" boolean NOT NULL DEFAULT true,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "productos_tratamientos_unidades_chk" CHECK ("unidades" IS NULL OR "unidades" > 0),
  CONSTRAINT "ux_productos_tratamientos_tenant" UNIQUE ("id_empresa","id_producto","id_tratamiento")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_productos_tratamientos_set_updated_at') THEN
    CREATE TRIGGER "tr_productos_tratamientos_set_updated_at" BEFORE UPDATE ON "Productos_Tratamientos" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Productos_Lotes
CREATE TABLE IF NOT EXISTS "Productos_Lotes" (
  "id_lote" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_producto" int NOT NULL,
  "numero_lote" varchar(100) NOT NULL,
  "fecha_caducidad" date,
  "stock_lote" int NOT NULL,
  "coste_unitario" numeric(10,2),
  "fecha_entrada" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz,
  CONSTRAINT "productos_lotes_deleted_chk" CHECK (("deleted"=false AND "deleted_at" IS NULL) OR ("deleted"=true AND "deleted_at" IS NOT NULL)),
  CONSTRAINT "productos_lotes_numero_chk" CHECK (length(trim("numero_lote")) > 0),
  CONSTRAINT "productos_lotes_stock_chk" CHECK ("stock_lote" >= 0),
  CONSTRAINT "productos_lotes_coste_chk" CHECK ("coste_unitario" IS NULL OR "coste_unitario" >= 0),
  CONSTRAINT "ux_productos_lotes_tenant" UNIQUE ("id_empresa","id_lote")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_productos_lotes_set_updated_at') THEN
    CREATE TRIGGER "tr_productos_lotes_set_updated_at" BEFORE UPDATE ON "Productos_Lotes" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- MovimientosStock
CREATE TABLE IF NOT EXISTS "MovimientosStock" (
  "id_movimiento" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_clinica" int,
  "id_producto" int NOT NULL,
  "id_lote" int,
  "tipo" "Movimiento_stock_tipo_enum" NOT NULL,
  "cantidad" int NOT NULL,
  "fecha" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "motivo" text,
  "id_usuario" int,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "movimientos_stock_cantidad_chk" CHECK ("cantidad" > 0),
  CONSTRAINT "ux_movimientos_stock_tenant" UNIQUE ("id_empresa","id_movimiento")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_movimientos_stock_set_updated_at') THEN
    CREATE TRIGGER "tr_movimientos_stock_set_updated_at" BEFORE UPDATE ON "MovimientosStock" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Proveedores
CREATE TABLE IF NOT EXISTS "Proveedores" (
  "id_proveedor" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "nombre" varchar(150) NOT NULL,
  "contacto" varchar(100),
  "email" varchar(150),
  "telefono" varchar(20),
  "direccion" varchar(255),
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "proveedores_nombre_chk" CHECK (length(trim("nombre")) > 0),
  CONSTRAINT "ux_proveedores_tenant" UNIQUE ("id_empresa","id_proveedor")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_proveedores_set_updated_at') THEN
    CREATE TRIGGER "tr_proveedores_set_updated_at" BEFORE UPDATE ON "Proveedores" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- PedidosProveedores
CREATE TABLE IF NOT EXISTS "PedidosProveedores" (
  "id_pedido" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_proveedor" int NOT NULL,
  "fecha_pedido" date NOT NULL,
  "fecha_entrega" date,
  "estado" "Estado_pedido_enum" NOT NULL DEFAULT 'Pendiente',
  "total" numeric(10,2),
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pedidos_total_chk" CHECK ("total" IS NULL OR "total" >= 0),
  CONSTRAINT "pedidos_fechas_chk" CHECK ("fecha_entrega" IS NULL OR "fecha_entrega" >= "fecha_pedido"),
  CONSTRAINT "ux_pedidos_tenant" UNIQUE ("id_empresa","id_pedido")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_pedidos_set_updated_at') THEN
    CREATE TRIGGER "tr_pedidos_set_updated_at" BEFORE UPDATE ON "PedidosProveedores" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- PedidoProducto
CREATE TABLE IF NOT EXISTS "PedidoProducto" (
  "id_detalle" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_pedido" int NOT NULL,
  "id_producto" int NOT NULL,
  "cantidad" int NOT NULL,
  "precio_unitario" numeric(10,2),
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pedido_producto_cantidad_chk" CHECK ("cantidad" > 0),
  CONSTRAINT "pedido_producto_precio_chk" CHECK ("precio_unitario" IS NULL OR "precio_unitario" >= 0),
  CONSTRAINT "ux_pedido_producto_tenant" UNIQUE ("id_empresa","id_pedido","id_producto")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_pedido_producto_set_updated_at') THEN
    CREATE TRIGGER "tr_pedido_producto_set_updated_at" BEFORE UPDATE ON "PedidoProducto" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Presupuestos
CREATE TABLE IF NOT EXISTS "Presupuestos" (
  "id_presupuesto" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_clinica" int,
  "id_paciente" int NOT NULL,
  "id_tratamiento" int,
  "fecha_emision" date NOT NULL,
  "importe_total" numeric(10,2) NOT NULL,
  "descuento" numeric(10,2) NOT NULL DEFAULT 0,
  "estado" "Facturacion_pago_status_enum" NOT NULL DEFAULT 'Pendiente',
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "presupuestos_importe_chk" CHECK ("importe_total" >= 0),
  CONSTRAINT "presupuestos_descuento_chk" CHECK ("descuento" >= 0 AND "descuento" <= "importe_total"),
  CONSTRAINT "ux_presupuestos_tenant" UNIQUE ("id_empresa","id_presupuesto")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_presupuestos_set_updated_at') THEN
    CREATE TRIGGER "tr_presupuestos_set_updated_at" BEFORE UPDATE ON "Presupuestos" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Presupuesto_Tratamientos
CREATE TABLE IF NOT EXISTS "Presupuesto_Tratamientos" (
  "id" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_presupuesto" int NOT NULL,
  "id_tratamiento" int NOT NULL,
  "unidades" int NOT NULL DEFAULT 1,
  "precio_unitario" numeric(10,2),
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pres_trat_unidades_chk" CHECK ("unidades" > 0),
  CONSTRAINT "pres_trat_precio_chk" CHECK ("precio_unitario" IS NULL OR "precio_unitario" >= 0),
  CONSTRAINT "ux_presupuesto_trat_tenant" UNIQUE ("id_empresa","id_presupuesto","id_tratamiento")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_pres_trat_set_updated_at') THEN
    CREATE TRIGGER "tr_pres_trat_set_updated_at" BEFORE UPDATE ON "Presupuesto_Tratamientos" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Facturacion
CREATE TABLE IF NOT EXISTS "Facturacion" (
  "id_factura" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_clinica" int,
  "id_paciente" int NOT NULL,
  "id_cita" int,
  "id_presupuesto" int,
  "fecha_emision" date NOT NULL,
  "importe_total" numeric(10,2) NOT NULL,
  "descuento" numeric(10,2) NOT NULL DEFAULT 0,
  "pago_status" "Facturacion_pago_status_enum" NOT NULL DEFAULT 'Pendiente',
  "tipo_pago" "Tipo_pago_enum" NOT NULL,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "facturacion_importe_chk" CHECK ("importe_total" >= 0),
  CONSTRAINT "facturacion_descuento_chk" CHECK ("descuento" >= 0 AND "descuento" <= "importe_total"),
  CONSTRAINT "ux_facturacion_tenant" UNIQUE ("id_empresa","id_factura")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_facturacion_set_updated_at') THEN
    CREATE TRIGGER "tr_facturacion_set_updated_at" BEFORE UPDATE ON "Facturacion" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- PagosFactura
CREATE TABLE IF NOT EXISTS "PagosFactura" (
  "id_pago" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_factura" int NOT NULL,
  "monto" numeric(10,2) NOT NULL,
  "fecha" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tipo_pago" "Tipo_pago_enum" NOT NULL,
  "id_usuario" int,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pagos_factura_monto_chk" CHECK ("monto" > 0)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_pagos_factura_set_updated_at') THEN
    CREATE TRIGGER "tr_pagos_factura_set_updated_at" BEFORE UPDATE ON "PagosFactura" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Factura_Tratamientos
CREATE TABLE IF NOT EXISTS "Factura_Tratamientos" (
  "id" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_factura" int NOT NULL,
  "id_tratamiento" int NOT NULL,
  "unidades" int NOT NULL DEFAULT 1,
  "precio_unitario" numeric(10,2),
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "factura_trat_unidades_chk" CHECK ("unidades" > 0),
  CONSTRAINT "factura_trat_precio_chk" CHECK ("precio_unitario" IS NULL OR "precio_unitario" >= 0),
  CONSTRAINT "ux_factura_trat_tenant" UNIQUE ("id_empresa","id_factura","id_tratamiento")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_factura_trat_set_updated_at') THEN
    CREATE TRIGGER "tr_factura_trat_set_updated_at" BEFORE UPDATE ON "Factura_Tratamientos" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Citas_Tratamientos
CREATE TABLE IF NOT EXISTS "Citas_Tratamientos" (
  "id_cita_tratamiento" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_cita" int NOT NULL,
  "id_tratamiento" int NOT NULL,
  "unidades" int NOT NULL DEFAULT 1,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "citas_trat_unidades_chk" CHECK ("unidades" > 0),
  CONSTRAINT "ux_citas_trat_tenant" UNIQUE ("id_empresa","id_cita","id_tratamiento")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_citas_trat_set_updated_at') THEN
    CREATE TRIGGER "tr_citas_trat_set_updated_at" BEFORE UPDATE ON "Citas_Tratamientos" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Citas_Productos_Usados
CREATE TABLE IF NOT EXISTS "Citas_Productos_Usados" (
  "id" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_cita" int NOT NULL,
  "id_producto" int NOT NULL,
  "id_lote" int NOT NULL,
  "cantidad" int NOT NULL,
  "fecha" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "citas_prod_usados_cantidad_chk" CHECK ("cantidad" > 0),
  CONSTRAINT "ux_citas_prod_usados" UNIQUE ("id_empresa","id_cita","id_producto","id_lote")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_citas_prod_usados_set_updated_at') THEN
    CREATE TRIGGER "tr_citas_prod_usados_set_updated_at" BEFORE UPDATE ON "Citas_Productos_Usados" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Notificaciones
CREATE TABLE IF NOT EXISTS "Notificaciones" (
  "id_notificacion" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_usuario" int NOT NULL,
  "id_paciente" int,
  "titulo" varchar(255) NOT NULL,
  "mensaje" text NOT NULL,
  "leida" boolean NOT NULL DEFAULT false,
  "fecha_envio" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notificaciones_titulo_chk" CHECK (length(trim("titulo")) > 0)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_notificaciones_set_updated_at') THEN
    CREATE TRIGGER "tr_notificaciones_set_updated_at" BEFORE UPDATE ON "Notificaciones" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- Recordatorios
CREATE TABLE IF NOT EXISTS "Recordatorios" (
  "id_recordatorio" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "id_empresa" int NOT NULL,
  "id_paciente" int NOT NULL,
  "id_cita" int,
  "tipo_mensaje" "Tipo_mensaje_enum" NOT NULL,
  "estado" "Recordatorio_estado_enum" NOT NULL DEFAULT 'Pendiente',
  "fecha_envio_programada" timestamptz NOT NULL,
  "fecha_envio_real" timestamptz,
  "mensaje" text,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recordatorios_mensaje_chk" CHECK (length(trim("mensaje")) > 0)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_recordatorios_set_updated_at') THEN
    CREATE TRIGGER "tr_recordatorios_set_updated_at" BEFORE UPDATE ON "Recordatorios" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- =========================================================
-- 4) INYECCIÓN DE DATOS POR DEFECTO (SAFE DATA INSERTION)
-- =========================================================
DO $$
DECLARE
    role_id int;
    empresa_id int;
    clinica_id int;
    user_id int;
    -- Password: 'Admin123!' (hash)
    user_hashed_pass varchar := '$2y$12$BJWgQbPtt7r1IArX8Mzi0eS5eAo2vvs02ewd22XaGeWFONhwAheva'; 
BEGIN
    -- 4.1. Create Role 'superadmin' if not exists
    IF NOT EXISTS (SELECT 1 FROM "Roles" WHERE "nombre_role" = 'superadmin') THEN
        INSERT INTO "Roles" ("nombre_role", "descripcion", "tipo")
        VALUES ('superadmin', 'Super Administrator', 'sistema')
        RETURNING "id_role" INTO role_id;
    ELSE
        SELECT "id_role" INTO role_id FROM "Roles" WHERE "nombre_role" = 'superadmin';
    END IF;

    -- 4.1.1. Ensure base roles exist (admin, empleado, usuario)
    IF NOT EXISTS (SELECT 1 FROM "Roles" WHERE "nombre_role" = 'admin') THEN
        INSERT INTO "Roles" ("nombre_role", "descripcion", "tipo")
        VALUES ('admin', 'Administrador del sistema', 'empleado');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Roles" WHERE "nombre_role" = 'empleado') THEN
        INSERT INTO "Roles" ("nombre_role", "descripcion", "tipo")
        VALUES ('empleado', 'Empleado de la clÃ­nica', 'empleado');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Roles" WHERE "nombre_role" = 'usuario') THEN
        INSERT INTO "Roles" ("nombre_role", "descripcion", "tipo")
        VALUES ('usuario', 'Usuario estÃ¡ndar', 'usuario');
    END IF;

    -- 4.2. Create Company 'DentalMate HQ'
    IF NOT EXISTS (SELECT 1 FROM "Empresas" WHERE "nombre" = 'DentalMate HQ') THEN
        INSERT INTO "Empresas" ("nombre", "nif", "email", "telefono")
        VALUES ('DentalMate HQ', 'A12345678', 'info@dentalmate.com', '+34 900 123 456')
        RETURNING "id_empresa" INTO empresa_id;
    ELSE
        SELECT "id_empresa" INTO empresa_id FROM "Empresas" WHERE "nombre" = 'DentalMate HQ';
    END IF;

    -- 4.3. Create Clinic 'Clínica Central'
    IF NOT EXISTS (SELECT 1 FROM "Clinicas" WHERE "nombre" = 'Clínica Central' AND "id_empresa" = empresa_id) THEN
        INSERT INTO "Clinicas" ("id_empresa", "nombre", "telefono", "direccion")
        VALUES (empresa_id, 'Clínica Central', '+34 900 123 456', 'Calle Principal, 123, Madrid')
        RETURNING "id_clinica" INTO clinica_id;
    ELSE
        SELECT "id_clinica" INTO clinica_id FROM "Clinicas" WHERE "nombre" = 'Clínica Central' AND "id_empresa" = empresa_id;
    END IF;

    -- 4.4. Create User 'Super Admin'
    IF NOT EXISTS (SELECT 1 FROM "Usuarios" WHERE "email" = 'admin@dentalmate.com') THEN
        INSERT INTO "Usuarios" ("nombre", "apellido", "email", "password", "estado", "id_role")
        VALUES ('Super', 'Admin', 'admin@dentalmate.com', user_hashed_pass, 'activo', role_id)
        RETURNING "id_usuario" INTO user_id;
    ELSE
        SELECT "id_usuario" INTO user_id FROM "Usuarios" WHERE "email" = 'admin@dentalmate.com';
    END IF;

    -- 4.5. Associate User to Company (Owner)
    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Empresas" WHERE "id_usuario" = user_id AND "id_empresa" = empresa_id) THEN
        INSERT INTO "Usuarios_Empresas" ("id_usuario", "id_empresa", "rol")
        VALUES (user_id, empresa_id, 'owner');
    END IF;

    -- 4.6. Associate User to Clinic (Owner)
    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = user_id AND "id_clinica" = clinica_id) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica", "rol")
        VALUES (empresa_id, user_id, clinica_id, 'owner');
    END IF;

    -- 4.7. Create Employee Record
    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = user_id) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_id, clinica_id, user_id, 'Administración');
    END IF;

END $$;

COMMIT;
