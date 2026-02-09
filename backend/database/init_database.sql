
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
-- 0) EXTENSIONS
-- =========================================================
DO $$
BEGIN
  -- Roles de base de datos para propietario/usuario de app (se conservan)
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
-- 0.1) LEGACY CLEANUP (roles/visibility leftovers)
-- =========================================================
DO $$
BEGIN
  -- Drop legacy role columns if they still exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Usuarios') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Usuarios' AND column_name = 'id_role'
    ) THEN
      ALTER TABLE "Usuarios" DROP COLUMN "id_role";
    END IF;

    -- Add superadmin flag if missing (only if table already exists)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Usuarios' AND column_name = 'is_superadmin'
    ) THEN
      ALTER TABLE "Usuarios" ADD COLUMN "is_superadmin" boolean NOT NULL DEFAULT false;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Usuarios_Clinicas' AND column_name = 'rol'
  ) THEN
    ALTER TABLE "Usuarios_Clinicas" DROP COLUMN "rol";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Usuarios_Empresas' AND column_name = 'rol'
  ) THEN
    ALTER TABLE "Usuarios_Empresas" DROP COLUMN "rol";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'Roles'
  ) THEN
    DROP TABLE "Roles";
  END IF;
END$$;

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

-- Usuarios
CREATE TABLE IF NOT EXISTS "Usuarios" (
  "id_usuario" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "nombre" varchar(100) NOT NULL,
  "apellido" varchar(100) NOT NULL,
  "email" varchar(150) NOT NULL,
  "password" varchar(255) NOT NULL,
  "estado" "Estado_usuario_enum" NOT NULL DEFAULT 'activo',
  "is_superadmin" boolean NOT NULL DEFAULT false,
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
  "menu_citas" boolean NOT NULL DEFAULT true,
  "menu_pacientes" boolean NOT NULL DEFAULT true,
  "menu_facturacion" boolean NOT NULL DEFAULT true,
  "menu_productos" boolean NOT NULL DEFAULT true,
  "menu_proveedores" boolean NOT NULL DEFAULT true,
  "menu_tratamientos" boolean NOT NULL DEFAULT true,
  "menu_usuarios" boolean NOT NULL DEFAULT true,
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
  "motivo" text,
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
  "duracion_minima" int,
  "fecha_creacion" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tratamientos_nombre_chk" CHECK (length(trim("nombre_tratamiento")) > 0),
  CONSTRAINT "tratamientos_unidades_chk" CHECK ("unidades" IS NULL OR "unidades" >= 0),
  CONSTRAINT "tratamientos_precio_chk" CHECK ("precio" IS NULL OR "precio" >= 0),
  CONSTRAINT "tratamientos_duracion_chk" CHECK ("duracion_minima" IS NULL OR "duracion_minima" > 0),
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
-- 3.9) INDEXES (PERFORMANCE)
-- =========================================================
-- Usuarios
CREATE INDEX IF NOT EXISTS "idx_usuarios_email" ON "Usuarios" ("email");
CREATE INDEX IF NOT EXISTS "idx_usuarios_deleted" ON "Usuarios" ("deleted");

-- Pacientes
CREATE INDEX IF NOT EXISTS "idx_pacientes_id_empresa" ON "Pacientes" ("id_empresa");
CREATE INDEX IF NOT EXISTS "idx_pacientes_id_clinica" ON "Pacientes" ("id_clinica");
CREATE INDEX IF NOT EXISTS "idx_pacientes_nombre" ON "Pacientes" ("nombre");
CREATE INDEX IF NOT EXISTS "idx_pacientes_apellido" ON "Pacientes" ("apellido");
CREATE INDEX IF NOT EXISTS "idx_pacientes_email" ON "Pacientes" ("email");
CREATE INDEX IF NOT EXISTS "idx_pacientes_telefono" ON "Pacientes" ("telefono");
CREATE INDEX IF NOT EXISTS "idx_pacientes_fecha_creacion" ON "Pacientes" ("fecha_creacion" DESC);
CREATE INDEX IF NOT EXISTS "idx_pacientes_deleted" ON "Pacientes" ("deleted");

-- Facturacion
CREATE INDEX IF NOT EXISTS "idx_facturacion_id_empresa" ON "Facturacion" ("id_empresa");
CREATE INDEX IF NOT EXISTS "idx_facturacion_id_paciente" ON "Facturacion" ("id_paciente");
CREATE INDEX IF NOT EXISTS "idx_facturacion_fecha_emision" ON "Facturacion" ("fecha_emision" DESC);
CREATE INDEX IF NOT EXISTS "idx_facturacion_pago_status" ON "Facturacion" ("pago_status");

-- Clinicas
CREATE INDEX IF NOT EXISTS "idx_clinicas_id_empresa" ON "Clinicas" ("id_empresa");

-- Usuarios_Clinicas
CREATE INDEX IF NOT EXISTS "idx_usuarios_clinicas_id_empresa" ON "Usuarios_Clinicas" ("id_empresa");
CREATE INDEX IF NOT EXISTS "idx_usuarios_clinicas_id_usuario" ON "Usuarios_Clinicas" ("id_usuario");
CREATE INDEX IF NOT EXISTS "idx_usuarios_clinicas_id_clinica" ON "Usuarios_Clinicas" ("id_clinica");

-- Usuarios_Empresas
CREATE INDEX IF NOT EXISTS "idx_usuarios_empresas_id_usuario" ON "Usuarios_Empresas" ("id_usuario");
CREATE INDEX IF NOT EXISTS "idx_usuarios_empresas_id_empresa" ON "Usuarios_Empresas" ("id_empresa");

-- Citas
CREATE INDEX IF NOT EXISTS "idx_citas_id_empresa" ON "Citas" ("id_empresa");
CREATE INDEX IF NOT EXISTS "idx_citas_id_paciente" ON "Citas" ("id_paciente");
CREATE INDEX IF NOT EXISTS "idx_citas_id_empleado" ON "Citas" ("id_empleado");
CREATE INDEX IF NOT EXISTS "idx_citas_fecha" ON "Citas" ("fecha");
CREATE INDEX IF NOT EXISTS "idx_citas_deleted" ON "Citas" ("deleted");

-- Notificaciones
CREATE INDEX IF NOT EXISTS "idx_notificaciones_id_usuario" ON "Notificaciones" ("id_usuario");
CREATE INDEX IF NOT EXISTS "idx_notificaciones_id_empresa" ON "Notificaciones" ("id_empresa");
CREATE INDEX IF NOT EXISTS "idx_notificaciones_leida" ON "Notificaciones" ("leida");

-- 4) INYECCIÓN DE DATOS POR DEFECTO (SAFE DATA INSERTION)
-- =========================================================
DO $$
DECLARE
    empresa_id int;
    clinica_id int;
    user_id int;
    -- Password por defecto para cuentas seed: 'Admin123!'
    -- Generado con: php -r "echo password_hash('Admin123!', PASSWORD_BCRYPT, ['cost' => 12]);"
    user_hashed_pass varchar := '$2y$12$m0FhaDn7GL5W/I4Ok65hR.OzGetKwqR4lwVU/6JEiBJ/pd.yfWnvC'; 
BEGIN
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
        INSERT INTO "Usuarios" ("nombre", "apellido", "email", "password", "estado", "is_superadmin")
        VALUES ('Super', 'Admin', 'admin@dentalmate.com', user_hashed_pass, 'activo', true)
        RETURNING "id_usuario" INTO user_id;
    ELSE
        SELECT "id_usuario" INTO user_id FROM "Usuarios" WHERE "email" = 'admin@dentalmate.com';
        UPDATE "Usuarios" 
            SET "is_superadmin" = true, "deleted" = false, "deleted_at" = NULL
        WHERE "id_usuario" = user_id;
    END IF;

    -- 4.5. Associate User to Company (Owner)
    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Empresas" WHERE "id_usuario" = user_id AND "id_empresa" = empresa_id) THEN
        INSERT INTO "Usuarios_Empresas" ("id_usuario", "id_empresa")
        VALUES (user_id, empresa_id);
    END IF;

    -- 4.6. Associate User to Clinic (Owner)
    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = user_id AND "id_clinica" = clinica_id) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica")
        VALUES (empresa_id, user_id, clinica_id);
    END IF;

    -- 4.7. Create Employee Record
    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = user_id) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_id, clinica_id, user_id, 'Administración');
    END IF;

END $$;

-- 4.8) Datos adicionales: empresas, clinicas, usuarios y pacientes
DO $$
DECLARE
    empresa_hq int;
    empresa_sonrisa int;
    empresa_mundo int;
    empresa_bright int;
    clinica_hq_central int;
    clinica_hq_norte int;
    clinica_sonrisa_mad int;
    clinica_sonrisa_bcn int;
    clinica_mundo_val int;
    clinica_mundo_sev int;
    clinica_bright_bil int;
    clinica_bright_zar int;
    -- empleados
    emp_sonrisa_owner int;
    emp_sonrisa_owner_bcn int;
    emp_sonrisa_staff int;
    emp_mundo_owner int;
    emp_mundo_owner_sev int;
    emp_mundo_staff int;
    emp_bright_owner int;
    emp_bright_owner_zar int;
    emp_bright_staff int;
    emp_hq_owner int;
    -- pacientes
    pac_sonrisa_mad int;
    pac_sonrisa_bcn int;
    pac_mundo_val int;
    pac_mundo_sev int;
    pac_bright_bil int;
    pac_bright_zar int;
    pac_hq_central int;
    pac_hq_norte int;
    -- proveedores / productos / tratamientos / citas / facturas
    prov_id int;
    prod_id int;
    trat_id int;
    cita_id int;
    factura_id int;
    tmp_user_id int;
    user_hashed_pass varchar := '$2y$12$BJWgQbPtt7r1IArX8Mzi0eS5eAo2vvs02ewd22XaGeWFONhwAheva';
BEGIN
    SELECT "id_empresa" INTO empresa_hq FROM "Empresas" WHERE "nombre" = 'DentalMate HQ';

    -- Empresas adicionales
    IF NOT EXISTS (SELECT 1 FROM "Empresas" WHERE "nombre" = 'Sonrisa Plus') THEN
        INSERT INTO "Empresas" ("nombre", "nif", "email", "telefono")
        VALUES ('Sonrisa Plus', 'B11223344', 'contacto@sonrisaplus.com', '+34 910 111 222')
        RETURNING "id_empresa" INTO empresa_sonrisa;
    ELSE
        SELECT "id_empresa" INTO empresa_sonrisa FROM "Empresas" WHERE "nombre" = 'Sonrisa Plus';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Empresas" WHERE "nombre" = 'Mundo Dental') THEN
        INSERT INTO "Empresas" ("nombre", "nif", "email", "telefono")
        VALUES ('Mundo Dental', 'C22334455', 'hola@mundodental.com', '+34 960 333 444')
        RETURNING "id_empresa" INTO empresa_mundo;
    ELSE
        SELECT "id_empresa" INTO empresa_mundo FROM "Empresas" WHERE "nombre" = 'Mundo Dental';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Empresas" WHERE "nombre" = 'BrightSmiles Group') THEN
        INSERT INTO "Empresas" ("nombre", "nif", "email", "telefono")
        VALUES ('BrightSmiles Group', 'D33445566', 'team@brightsmiles.com', '+34 944 555 666')
        RETURNING "id_empresa" INTO empresa_bright;
    ELSE
        SELECT "id_empresa" INTO empresa_bright FROM "Empresas" WHERE "nombre" = 'BrightSmiles Group';
    END IF;

    -- Clinicas por empresa
    -- DentalMate HQ adicionales
    SELECT "id_clinica" INTO clinica_hq_central FROM "Clinicas" WHERE "nombre" = 'Clinica Central' AND "id_empresa" = empresa_hq;
    IF clinica_hq_central IS NULL THEN
        SELECT "id_clinica" INTO clinica_hq_central FROM "Clinicas" WHERE "nombre" = 'Clinica Central' AND "id_empresa" = empresa_hq;
    END IF;
    IF clinica_hq_central IS NULL THEN
        SELECT "id_clinica" INTO clinica_hq_central FROM "Clinicas" WHERE "id_empresa" = empresa_hq LIMIT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "Clinicas" WHERE "nombre" = 'Clinica Norte HQ' AND "id_empresa" = empresa_hq) THEN
        INSERT INTO "Clinicas" ("id_empresa", "nombre", "telefono", "direccion")
        VALUES (empresa_hq, 'Clinica Norte HQ', '+34 900 555 111', 'Av. de la Paz 45, Madrid')
        RETURNING "id_clinica" INTO clinica_hq_norte;
    ELSE
        SELECT "id_clinica" INTO clinica_hq_norte FROM "Clinicas" WHERE "nombre" = 'Clinica Norte HQ' AND "id_empresa" = empresa_hq;
    END IF;
    -- garantizar empleado superadmin en ambas clinicas HQ
    SELECT "id_usuario" INTO tmp_user_id FROM "Usuarios" WHERE "email" = 'admin@dentalmate.com';
    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = tmp_user_id) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_hq, clinica_hq_central, tmp_user_id, 'Administracion')
        ON CONFLICT ("id_usuario") DO NOTHING;
    END IF;
    SELECT "id_empleado" INTO emp_hq_owner FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_hq_central;

    -- Sonrisa Plus
    IF NOT EXISTS (SELECT 1 FROM "Clinicas" WHERE "nombre" = 'Clinica Sonrisa Madrid' AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Clinicas" ("id_empresa", "nombre", "telefono", "direccion")
        VALUES (empresa_sonrisa, 'Clinica Sonrisa Madrid', '+34 910 333 111', 'Calle Serrano 22, Madrid')
        RETURNING "id_clinica" INTO clinica_sonrisa_mad;
    ELSE
        SELECT "id_clinica" INTO clinica_sonrisa_mad FROM "Clinicas" WHERE "nombre" = 'Clinica Sonrisa Madrid' AND "id_empresa" = empresa_sonrisa;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Clinicas" WHERE "nombre" = 'Clinica Sonrisa Barcelona' AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Clinicas" ("id_empresa", "nombre", "telefono", "direccion")
        VALUES (empresa_sonrisa, 'Clinica Sonrisa Barcelona', '+34 933 200 210', 'Passeig de Gracia 58, Barcelona')
        RETURNING "id_clinica" INTO clinica_sonrisa_bcn;
    ELSE
        SELECT "id_clinica" INTO clinica_sonrisa_bcn FROM "Clinicas" WHERE "nombre" = 'Clinica Sonrisa Barcelona' AND "id_empresa" = empresa_sonrisa;
    END IF;

    -- Mundo Dental
    IF NOT EXISTS (SELECT 1 FROM "Clinicas" WHERE "nombre" = 'Mundo Dental Valencia' AND "id_empresa" = empresa_mundo) THEN
        INSERT INTO "Clinicas" ("id_empresa", "nombre", "telefono", "direccion")
        VALUES (empresa_mundo, 'Mundo Dental Valencia', '+34 960 440 550', 'Av. del Puerto 12, Valencia')
        RETURNING "id_clinica" INTO clinica_mundo_val;
    ELSE
        SELECT "id_clinica" INTO clinica_mundo_val FROM "Clinicas" WHERE "nombre" = 'Mundo Dental Valencia' AND "id_empresa" = empresa_mundo;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Clinicas" WHERE "nombre" = 'Mundo Dental Sevilla' AND "id_empresa" = empresa_mundo) THEN
        INSERT INTO "Clinicas" ("id_empresa", "nombre", "telefono", "direccion")
        VALUES (empresa_mundo, 'Mundo Dental Sevilla', '+34 955 770 880', 'Av. de la Constitucion 14, Sevilla')
        RETURNING "id_clinica" INTO clinica_mundo_sev;
    ELSE
        SELECT "id_clinica" INTO clinica_mundo_sev FROM "Clinicas" WHERE "nombre" = 'Mundo Dental Sevilla' AND "id_empresa" = empresa_mundo;
    END IF;

    -- BrightSmiles Group
    IF NOT EXISTS (SELECT 1 FROM "Clinicas" WHERE "nombre" = 'BrightSmiles Bilbao' AND "id_empresa" = empresa_bright) THEN
        INSERT INTO "Clinicas" ("id_empresa", "nombre", "telefono", "direccion")
        VALUES (empresa_bright, 'BrightSmiles Bilbao', '+34 944 880 990', 'Gran Via 80, Bilbao')
        RETURNING "id_clinica" INTO clinica_bright_bil;
    ELSE
        SELECT "id_clinica" INTO clinica_bright_bil FROM "Clinicas" WHERE "nombre" = 'BrightSmiles Bilbao' AND "id_empresa" = empresa_bright;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Clinicas" WHERE "nombre" = 'BrightSmiles Zaragoza' AND "id_empresa" = empresa_bright) THEN
        INSERT INTO "Clinicas" ("id_empresa", "nombre", "telefono", "direccion")
        VALUES (empresa_bright, 'BrightSmiles Zaragoza', '+34 976 770 660', 'Paseo Independencia 20, Zaragoza')
        RETURNING "id_clinica" INTO clinica_bright_zar;
    ELSE
        SELECT "id_clinica" INTO clinica_bright_zar FROM "Clinicas" WHERE "nombre" = 'BrightSmiles Zaragoza' AND "id_empresa" = empresa_bright;
    END IF;

    -- Usuarios y asignaciones
    -- Sonrisa Plus Admin
    IF NOT EXISTS (SELECT 1 FROM "Usuarios" WHERE "email" = 'laura.admin@sonrisaplus.com') THEN
        INSERT INTO "Usuarios" ("nombre", "apellido", "email", "password", "estado")
        VALUES ('Laura', 'Admin', 'laura.admin@sonrisaplus.com', user_hashed_pass, 'activo')
        RETURNING "id_usuario" INTO tmp_user_id;
    ELSE
        SELECT "id_usuario" INTO tmp_user_id FROM "Usuarios" WHERE "email" = 'laura.admin@sonrisaplus.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Empresas" WHERE "id_usuario" = tmp_user_id AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Usuarios_Empresas" ("id_usuario", "id_empresa")
        VALUES (tmp_user_id, empresa_sonrisa);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_sonrisa_mad) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica")
        VALUES (empresa_sonrisa, tmp_user_id, clinica_sonrisa_mad);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_sonrisa_bcn) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica")
        VALUES (empresa_sonrisa, tmp_user_id, clinica_sonrisa_bcn);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = tmp_user_id) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_sonrisa, clinica_sonrisa_mad, tmp_user_id, 'Administracion')
        ON CONFLICT ("id_usuario") DO NOTHING;
    END IF;
    SELECT "id_empleado" INTO emp_sonrisa_owner FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_sonrisa_mad;
    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_sonrisa_bcn) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_sonrisa, clinica_sonrisa_bcn, tmp_user_id, 'Administracion')
        ON CONFLICT ("id_usuario") DO NOTHING;
    END IF;
    SELECT "id_empleado" INTO emp_sonrisa_owner_bcn FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_sonrisa_bcn;

    -- Sonrisa Plus Staff
    IF NOT EXISTS (SELECT 1 FROM "Usuarios" WHERE "email" = 'pablo.staff@sonrisaplus.com') THEN
        INSERT INTO "Usuarios" ("nombre", "apellido", "email", "password", "estado")
        VALUES ('Pablo', 'Staff', 'pablo.staff@sonrisaplus.com', user_hashed_pass, 'activo')
        RETURNING "id_usuario" INTO tmp_user_id;
    ELSE
        SELECT "id_usuario" INTO tmp_user_id FROM "Usuarios" WHERE "email" = 'pablo.staff@sonrisaplus.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Empresas" WHERE "id_usuario" = tmp_user_id AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Usuarios_Empresas" ("id_usuario", "id_empresa")
        VALUES (tmp_user_id, empresa_sonrisa);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_sonrisa_mad) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica")
        VALUES (empresa_sonrisa, tmp_user_id, clinica_sonrisa_mad);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = tmp_user_id) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_sonrisa, clinica_sonrisa_mad, tmp_user_id, 'Higienista')
        ON CONFLICT ("id_usuario") DO NOTHING;
    END IF;
    SELECT "id_empleado" INTO emp_sonrisa_staff FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_sonrisa_mad;

    -- Mundo Dental Manager
    IF NOT EXISTS (SELECT 1 FROM "Usuarios" WHERE "email" = 'marta.manager@mundodental.com') THEN
        INSERT INTO "Usuarios" ("nombre", "apellido", "email", "password", "estado")
        VALUES ('Marta', 'Manager', 'marta.manager@mundodental.com', user_hashed_pass, 'activo')
        RETURNING "id_usuario" INTO tmp_user_id;
    ELSE
        SELECT "id_usuario" INTO tmp_user_id FROM "Usuarios" WHERE "email" = 'marta.manager@mundodental.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Empresas" WHERE "id_usuario" = tmp_user_id AND "id_empresa" = empresa_mundo) THEN
        INSERT INTO "Usuarios_Empresas" ("id_usuario", "id_empresa")
        VALUES (tmp_user_id, empresa_mundo);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_mundo_val) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica")
        VALUES (empresa_mundo, tmp_user_id, clinica_mundo_val);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_mundo_sev) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica")
        VALUES (empresa_mundo, tmp_user_id, clinica_mundo_sev);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = tmp_user_id) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_mundo, clinica_mundo_val, tmp_user_id, 'Gestion')
        ON CONFLICT ("id_usuario") DO NOTHING;
    END IF;
    SELECT "id_empleado" INTO emp_mundo_owner FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_mundo_val;
    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_mundo_sev) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_mundo, clinica_mundo_sev, tmp_user_id, 'Gestion')
        ON CONFLICT ("id_usuario") DO NOTHING;
    END IF;
    SELECT "id_empleado" INTO emp_mundo_owner_sev FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_mundo_sev;

    -- Mundo Dental Staff
    IF NOT EXISTS (SELECT 1 FROM "Usuarios" WHERE "email" = 'carlos.staff@mundodental.com') THEN
        INSERT INTO "Usuarios" ("nombre", "apellido", "email", "password", "estado")
        VALUES ('Carlos', 'Staff', 'carlos.staff@mundodental.com', user_hashed_pass, 'activo')
        RETURNING "id_usuario" INTO tmp_user_id;
    ELSE
        SELECT "id_usuario" INTO tmp_user_id FROM "Usuarios" WHERE "email" = 'carlos.staff@mundodental.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Empresas" WHERE "id_usuario" = tmp_user_id AND "id_empresa" = empresa_mundo) THEN
        INSERT INTO "Usuarios_Empresas" ("id_usuario", "id_empresa")
        VALUES (tmp_user_id, empresa_mundo);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_mundo_val) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica")
        VALUES (empresa_mundo, tmp_user_id, clinica_mundo_val);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = tmp_user_id) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_mundo, clinica_mundo_val, tmp_user_id, 'Asistente')
        ON CONFLICT ("id_usuario") DO NOTHING;
    END IF;
    SELECT "id_empleado" INTO emp_mundo_staff FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_mundo_val;

    -- BrightSmiles Admin
    IF NOT EXISTS (SELECT 1 FROM "Usuarios" WHERE "email" = 'ana.admin@brightsmiles.com') THEN
        INSERT INTO "Usuarios" ("nombre", "apellido", "email", "password", "estado")
        VALUES ('Ana', 'Admin', 'ana.admin@brightsmiles.com', user_hashed_pass, 'activo')
        RETURNING "id_usuario" INTO tmp_user_id;
    ELSE
        SELECT "id_usuario" INTO tmp_user_id FROM "Usuarios" WHERE "email" = 'ana.admin@brightsmiles.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Empresas" WHERE "id_usuario" = tmp_user_id AND "id_empresa" = empresa_bright) THEN
        INSERT INTO "Usuarios_Empresas" ("id_usuario", "id_empresa")
        VALUES (tmp_user_id, empresa_bright);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_bright_bil) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica")
        VALUES (empresa_bright, tmp_user_id, clinica_bright_bil);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_bright_zar) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica")
        VALUES (empresa_bright, tmp_user_id, clinica_bright_zar);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = tmp_user_id) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_bright, clinica_bright_bil, tmp_user_id, 'Coordinacion')
        ON CONFLICT ("id_usuario") DO NOTHING;
    END IF;
    SELECT "id_empleado" INTO emp_bright_owner FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_bright_bil;
    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_bright_zar) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_bright, clinica_bright_zar, tmp_user_id, 'Coordinacion')
        ON CONFLICT ("id_usuario") DO NOTHING;
    END IF;
    SELECT "id_empleado" INTO emp_bright_owner_zar FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_bright_zar;

    -- BrightSmiles Staff
    IF NOT EXISTS (SELECT 1 FROM "Usuarios" WHERE "email" = 'eva.higienista@brightsmiles.com') THEN
        INSERT INTO "Usuarios" ("nombre", "apellido", "email", "password", "estado")
        VALUES ('Eva', 'Higienista', 'eva.higienista@brightsmiles.com', user_hashed_pass, 'activo')
        RETURNING "id_usuario" INTO tmp_user_id;
    ELSE
        SELECT "id_usuario" INTO tmp_user_id FROM "Usuarios" WHERE "email" = 'eva.higienista@brightsmiles.com';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Empresas" WHERE "id_usuario" = tmp_user_id AND "id_empresa" = empresa_bright) THEN
        INSERT INTO "Usuarios_Empresas" ("id_usuario", "id_empresa")
        VALUES (tmp_user_id, empresa_bright);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_bright_bil) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica")
        VALUES (empresa_bright, tmp_user_id, clinica_bright_bil);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = tmp_user_id) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_bright, clinica_bright_bil, tmp_user_id, 'Higienista')
        ON CONFLICT ("id_usuario") DO NOTHING;
    END IF;
    SELECT "id_empleado" INTO emp_bright_staff FROM "Empleados" WHERE "id_usuario" = tmp_user_id AND "id_clinica" = clinica_bright_bil;

    -- Pacientes de ejemplo
    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'lucia.perez@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa", "id_clinica", "nombre", "apellido", "email", "fecha_nacimiento", "telefono", "direccion")
        VALUES (empresa_sonrisa, clinica_sonrisa_mad, 'Lucia', 'Perez', 'lucia.perez@pacientes.com', '1990-02-14', '+34 611 100 200', 'Calle Mayor 10, Madrid');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'diego.romero@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa", "id_clinica", "nombre", "apellido", "email", "fecha_nacimiento", "telefono", "direccion")
        VALUES (empresa_sonrisa, clinica_sonrisa_bcn, 'Diego', 'Romero', 'diego.romero@pacientes.com', '1985-07-09', '+34 622 300 400', 'Carrer de Balmes 15, Barcelona');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'maria.lago@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa", "id_clinica", "nombre", "apellido", "email", "fecha_nacimiento", "telefono", "direccion")
        VALUES (empresa_mundo, clinica_mundo_val, 'Maria', 'Lago', 'maria.lago@pacientes.com', '1992-11-21', '+34 633 500 600', 'Av. Reino de Valencia 3, Valencia');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'javier.torres@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa", "id_clinica", "nombre", "apellido", "email", "fecha_nacimiento", "telefono", "direccion")
        VALUES (empresa_mundo, clinica_mundo_sev, 'Javier', 'Torres', 'javier.torres@pacientes.com', '1988-04-02', '+34 644 700 800', 'Calle San Fernando 12, Sevilla');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'nerea.iglesias@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa", "id_clinica", "nombre", "apellido", "email", "fecha_nacimiento", "telefono", "direccion")
        VALUES (empresa_bright, clinica_bright_bil, 'Nerea', 'Iglesias', 'nerea.iglesias@pacientes.com', '1996-06-18', '+34 655 880 990', 'Calle Diputacion 40, Bilbao');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'sergio.campos@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa", "id_clinica", "nombre", "apellido", "email", "fecha_nacimiento", "telefono", "direccion")
        VALUES (empresa_bright, clinica_bright_zar, 'Sergio', 'Campos', 'sergio.campos@pacientes.com', '1983-09-30', '+34 666 100 120', 'Paseo Sagasta 25, Zaragoza');
    END IF;

    -- Pacientes para HQ
    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'carmen.lopez@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa", "id_clinica", "nombre", "apellido", "email", "fecha_nacimiento", "telefono", "direccion")
        VALUES (empresa_hq, clinica_hq_central, 'Carmen', 'Lopez', 'carmen.lopez@pacientes.com', '1991-01-11', '+34 677 800 900', 'Calle Alcala 20, Madrid');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'alberto.marin@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa", "id_clinica", "nombre", "apellido", "email", "fecha_nacimiento", "telefono", "direccion")
        VALUES (empresa_hq, clinica_hq_norte, 'Alberto', 'Marin', 'alberto.marin@pacientes.com', '1987-12-05', '+34 688 321 654', 'Av. Europa 14, Alcobendas');
    END IF;

    -- Mapear pacientes a variables
    SELECT "id_paciente" INTO pac_sonrisa_mad FROM "Pacientes" WHERE "email" = 'lucia.perez@pacientes.com';
    SELECT "id_paciente" INTO pac_sonrisa_bcn FROM "Pacientes" WHERE "email" = 'diego.romero@pacientes.com';
    SELECT "id_paciente" INTO pac_mundo_val FROM "Pacientes" WHERE "email" = 'maria.lago@pacientes.com';
    SELECT "id_paciente" INTO pac_mundo_sev FROM "Pacientes" WHERE "email" = 'javier.torres@pacientes.com';
    SELECT "id_paciente" INTO pac_bright_bil FROM "Pacientes" WHERE "email" = 'nerea.iglesias@pacientes.com';
    SELECT "id_paciente" INTO pac_bright_zar FROM "Pacientes" WHERE "email" = 'sergio.campos@pacientes.com';
    SELECT "id_paciente" INTO pac_hq_central FROM "Pacientes" WHERE "email" = 'carmen.lopez@pacientes.com';
    SELECT "id_paciente" INTO pac_hq_norte FROM "Pacientes" WHERE "email" = 'alberto.marin@pacientes.com';

    -- Datos clinicos para todas las clinicas
    -- Proveedores, productos, tratamientos, citas y facturacion

    -- Helper: proveedor/producto/tratamiento para HQ Central
    IF NOT EXISTS (SELECT 1 FROM "Proveedores" WHERE "nombre" = 'Dental Supplies HQ' AND "id_empresa" = empresa_hq) THEN
        INSERT INTO "Proveedores" ("id_empresa","nombre","contacto","email","telefono","direccion")
        VALUES (empresa_hq, 'Dental Supplies HQ', 'Laura Proveedor', 'proveedor@hq.com', '+34 900 800 900', 'Calle Comercio 1, Madrid')
        RETURNING "id_proveedor" INTO prov_id;
    ELSE
        SELECT "id_proveedor" INTO prov_id FROM "Proveedores" WHERE "nombre" = 'Dental Supplies HQ' AND "id_empresa" = empresa_hq;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Kit Higiene HQ' AND "id_empresa" = empresa_hq) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_hq, 'Kit Higiene HQ', 45.00, 18.00, true, 50, 10)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Kit Higiene HQ' AND "id_empresa" = empresa_hq;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Limpieza Premium HQ' AND "id_empresa" = empresa_hq) THEN
        INSERT INTO "Tratamientos" ("id_empresa","nombre_tratamiento","descripcion","unidades","precio","duracion_minima")
        VALUES (empresa_hq, 'Limpieza Premium HQ', 'Limpieza y profilaxis completa', 1, 80.00, 45)
        RETURNING "id_tratamiento" INTO trat_id;
    ELSE
        SELECT "id_tratamiento" INTO trat_id FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Limpieza Premium HQ' AND "id_empresa" = empresa_hq;
        UPDATE "Tratamientos" SET "duracion_minima" = COALESCE("duracion_minima",45) WHERE "id_tratamiento" = trat_id;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento")
        VALUES (empresa_hq, prod_id, trat_id)
        ON CONFLICT DO NOTHING;
    END IF;
    -- Producto adicional para limpieza
    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Pulidor dental HQ' AND "id_empresa" = empresa_hq) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_hq, 'Pulidor dental HQ', 20.00, 8.00, false, 120, 20)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Pulidor dental HQ' AND "id_empresa" = empresa_hq;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento","unidades")
        VALUES (empresa_hq, prod_id, trat_id, 1)
        ON CONFLICT DO NOTHING;
    END IF;

    IF emp_hq_owner IS NOT NULL AND pac_hq_central IS NOT NULL THEN
        INSERT INTO "Citas" ("id_empresa","id_clinica","id_paciente","id_empleado","fecha","hora","estado","notas","duracion_minutos","tipo","prioridad")
        SELECT empresa_hq, clinica_hq_central, pac_hq_central, emp_hq_owner, CURRENT_DATE + 1, '10:00', 'Confirmada', 'Control general', 45, 'Normal', 'Media'
        WHERE NOT EXISTS (SELECT 1 FROM "Citas" WHERE "id_paciente" = pac_hq_central AND "fecha" = CURRENT_DATE + 1 AND "id_clinica" = clinica_hq_central)
        RETURNING "id_cita" INTO cita_id;
        IF cita_id IS NULL THEN
            SELECT "id_cita" INTO cita_id FROM "Citas" WHERE "id_paciente" = pac_hq_central AND "id_clinica" = clinica_hq_central ORDER BY "id_cita" DESC LIMIT 1;
        END IF;

        INSERT INTO "Facturacion" ("id_empresa","id_clinica","id_paciente","id_cita","fecha_emision","importe_total","descuento","pago_status","tipo_pago")
        SELECT empresa_hq, clinica_hq_central, pac_hq_central, cita_id, CURRENT_DATE, 80.00, 0, 'Pagado', 'Tarjeta'
        WHERE NOT EXISTS (SELECT 1 FROM "Facturacion" WHERE "id_cita" = cita_id AND "id_paciente" = pac_hq_central);
    END IF;

    -- Sonrisa Madrid
    IF NOT EXISTS (SELECT 1 FROM "Proveedores" WHERE "nombre" = 'Sonrisa Insumos' AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Proveedores" ("id_empresa","nombre","contacto","email","telefono","direccion")
        VALUES (empresa_sonrisa, 'Sonrisa Insumos', 'Proveedor SM', 'stock@sonrisaplus.com', '+34 910 555 777', 'C/ Comercio 15, Madrid')
        RETURNING "id_proveedor" INTO prov_id;
    ELSE
        SELECT "id_proveedor" INTO prov_id FROM "Proveedores" WHERE "nombre" = 'Sonrisa Insumos' AND "id_empresa" = empresa_sonrisa;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Blanqueamiento Plus' AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_sonrisa, 'Blanqueamiento Plus', 120.00, 40.00, true, 30, 5)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Blanqueamiento Plus' AND "id_empresa" = empresa_sonrisa;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Blanqueamiento LED' AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Tratamientos" ("id_empresa","nombre_tratamiento","descripcion","unidades","precio","duracion_minima")
        VALUES (empresa_sonrisa, 'Blanqueamiento LED', 'Sesion de blanqueamiento intensivo', 1, 190.00, 60)
        RETURNING "id_tratamiento" INTO trat_id;
    ELSE
        SELECT "id_tratamiento" INTO trat_id FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Blanqueamiento LED' AND "id_empresa" = empresa_sonrisa;
        UPDATE "Tratamientos" SET "duracion_minima" = COALESCE("duracion_minima",60) WHERE "id_tratamiento" = trat_id;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento")
        VALUES (empresa_sonrisa, prod_id, trat_id)
        ON CONFLICT DO NOTHING;
    END IF;
    -- Producto auxiliar para blanqueamiento
    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Gel blanqueador avanzado' AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_sonrisa, 'Gel blanqueador avanzado', 45.00, 15.00, false, 60, 10)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Gel blanqueador avanzado' AND "id_empresa" = empresa_sonrisa;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento","unidades")
        VALUES (empresa_sonrisa, prod_id, trat_id, 1)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Asegurar que todos los tratamientos tengan duración mínima
    UPDATE "Tratamientos"
    SET "duracion_minima" = COALESCE("duracion_minima", 45)
    WHERE "duracion_minima" IS NULL;

    -- Tratamientos con duración mínima y combos de productos
    -- HQ: Ortodoncia invisible (90 min) con múltiples productos
    IF NOT EXISTS (SELECT 1 FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Ortodoncia invisible' AND "id_empresa" = empresa_hq) THEN
        INSERT INTO "Tratamientos" ("id_empresa","nombre_tratamiento","descripcion","unidades","precio","duracion_minima")
        VALUES (empresa_hq, 'Ortodoncia invisible', 'Plan de alineadores con revisiones', 1, 3000.00, 90)
        RETURNING "id_tratamiento" INTO trat_id;
    ELSE
        SELECT "id_tratamiento" INTO trat_id FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Ortodoncia invisible' AND "id_empresa" = empresa_hq;
        UPDATE "Tratamientos" SET "duracion_minima" = 90 WHERE "id_tratamiento" = trat_id AND ("duracion_minima" IS NULL OR "duracion_minima" < 90);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Kit de alineadores' AND "id_empresa" = empresa_hq) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_hq, 'Kit de alineadores', 800.00, 300.00, true, 25, 5)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Kit de alineadores' AND "id_empresa" = empresa_hq;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento")
        VALUES (empresa_hq, prod_id, trat_id) ON CONFLICT DO NOTHING;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Attachments estéticos' AND "id_empresa" = empresa_hq) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_hq, 'Attachments estéticos', 120.00, 40.00, false, 200, 30)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Attachments estéticos' AND "id_empresa" = empresa_hq;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento")
        VALUES (empresa_hq, prod_id, trat_id) ON CONFLICT DO NOTHING;
    END IF;

    -- Sonrisa: Implante unitario (75 min) con kit quirúrgico
    IF NOT EXISTS (SELECT 1 FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Implante unitario' AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Tratamientos" ("id_empresa","nombre_tratamiento","descripcion","unidades","precio","duracion_minima")
        VALUES (empresa_sonrisa, 'Implante unitario', 'Colocación de implante con corona provisional', 1, 1200.00, 75)
        RETURNING "id_tratamiento" INTO trat_id;
    ELSE
        SELECT "id_tratamiento" INTO trat_id FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Implante unitario' AND "id_empresa" = empresa_sonrisa;
        UPDATE "Tratamientos" SET "duracion_minima" = 75 WHERE "id_tratamiento" = trat_id AND ("duracion_minima" IS NULL OR "duracion_minima" < 75);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Kit quirúrgico implante' AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_sonrisa, 'Kit quirúrgico implante', 350.00, 140.00, false, 40, 10)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Kit quirúrgico implante' AND "id_empresa" = empresa_sonrisa;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento")
        VALUES (empresa_sonrisa, prod_id, trat_id) ON CONFLICT DO NOTHING;
    END IF;
    -- Segundo producto para implante
    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Pilar de titanio' AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_sonrisa, 'Pilar de titanio', 180.00, 70.00, false, 80, 15)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Pilar de titanio' AND "id_empresa" = empresa_sonrisa;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento","unidades")
        VALUES (empresa_sonrisa, prod_id, trat_id, 1) ON CONFLICT DO NOTHING;
    END IF;

    -- Proveedores adicionales
    IF NOT EXISTS (SELECT 1 FROM "Proveedores" WHERE "nombre" = 'Ortho Supplies Europe' AND "id_empresa" = empresa_hq) THEN
        INSERT INTO "Proveedores" ("id_empresa","nombre","contacto","email","telefono","direccion")
        VALUES (empresa_hq, 'Ortho Supplies Europe', 'Beatriz Proveedora', 'ventas@orthosupplies.eu', '+34 910 223 445', 'Av. Industria 12, Madrid');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Proveedores" WHERE "nombre" = 'BioImplant Iberia' AND "id_empresa" = empresa_sonrisa) THEN
        INSERT INTO "Proveedores" ("id_empresa","nombre","contacto","email","telefono","direccion")
        VALUES (empresa_sonrisa, 'BioImplant Iberia', 'Carlos Implantes', 'contacto@bioimplant.es', '+34 932 445 667', 'C/ Marina 55, Barcelona');
    END IF;

    -- Pacientes adicionales
    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'laura.fernandez@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa","id_clinica","nombre","apellido","email","fecha_nacimiento","telefono","direccion")
        VALUES (empresa_hq, clinica_hq_central, 'Laura', 'Fernández', 'laura.fernandez@pacientes.com', '1990-04-12', '+34 699 112 233', 'Gran Vía 10, Madrid');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'martin.garcia@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa","id_clinica","nombre","apellido","email","fecha_nacimiento","telefono","direccion")
        VALUES (empresa_hq, clinica_hq_norte, 'Martín', 'García', 'martin.garcia@pacientes.com', '1985-08-22', '+34 678 554 221', 'Av. Olímpica 3, Alcobendas');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'ines.lopez@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa","id_clinica","nombre","apellido","email","fecha_nacimiento","telefono","direccion")
        VALUES (empresa_sonrisa, clinica_sonrisa_mad, 'Inés', 'López', 'ines.lopez@pacientes.com', '1994-02-17', '+34 622 334 556', 'C/ Serrano 45, Madrid');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Pacientes" WHERE "email" = 'pablo.ruiz@pacientes.com') THEN
        INSERT INTO "Pacientes" ("id_empresa","id_clinica","nombre","apellido","email","fecha_nacimiento","telefono","direccion")
        VALUES (empresa_sonrisa, clinica_sonrisa_bcn, 'Pablo', 'Ruiz', 'pablo.ruiz@pacientes.com', '1989-03-29', '+34 633 778 990', 'C/ Balmes 200, Barcelona');
    END IF;

    IF emp_sonrisa_owner IS NOT NULL AND pac_sonrisa_mad IS NOT NULL THEN
        INSERT INTO "Citas" ("id_empresa","id_clinica","id_paciente","id_empleado","fecha","hora","estado","notas","duracion_minutos","tipo","prioridad")
        SELECT empresa_sonrisa, clinica_sonrisa_mad, pac_sonrisa_mad, emp_sonrisa_owner, CURRENT_DATE + 2, '11:30', 'Confirmada', 'Blanqueamiento inicial', 60, 'Normal', 'Alta'
        WHERE NOT EXISTS (SELECT 1 FROM "Citas" WHERE "id_paciente" = pac_sonrisa_mad AND "id_clinica" = clinica_sonrisa_mad);
        SELECT "id_cita" INTO cita_id FROM "Citas" WHERE "id_paciente" = pac_sonrisa_mad AND "id_clinica" = clinica_sonrisa_mad ORDER BY "id_cita" DESC LIMIT 1;
        IF cita_id IS NOT NULL THEN
            INSERT INTO "Facturacion" ("id_empresa","id_clinica","id_paciente","id_cita","fecha_emision","importe_total","descuento","pago_status","tipo_pago")
            SELECT empresa_sonrisa, clinica_sonrisa_mad, pac_sonrisa_mad, cita_id, CURRENT_DATE, 190.00, 0, 'Pagado', 'Tarjeta'
            WHERE NOT EXISTS (SELECT 1 FROM "Facturacion" WHERE "id_cita" = cita_id AND "id_paciente" = pac_sonrisa_mad);
        END IF;
    END IF;

    IF (emp_sonrisa_owner_bcn IS NOT NULL OR emp_sonrisa_owner IS NOT NULL) AND pac_sonrisa_bcn IS NOT NULL THEN
        INSERT INTO "Citas" ("id_empresa","id_clinica","id_paciente","id_empleado","fecha","hora","estado","notas","duracion_minutos","tipo","prioridad")
        SELECT empresa_sonrisa, clinica_sonrisa_bcn, pac_sonrisa_bcn, COALESCE(emp_sonrisa_owner_bcn, emp_sonrisa_owner), CURRENT_DATE + 3, '09:00', 'Confirmada', 'Revision general', 40, 'Normal', 'Media'
        WHERE NOT EXISTS (SELECT 1 FROM "Citas" WHERE "id_paciente" = pac_sonrisa_bcn AND "id_clinica" = clinica_sonrisa_bcn);
        SELECT "id_cita" INTO cita_id FROM "Citas" WHERE "id_paciente" = pac_sonrisa_bcn AND "id_clinica" = clinica_sonrisa_bcn ORDER BY "id_cita" DESC LIMIT 1;
        IF cita_id IS NOT NULL THEN
            INSERT INTO "Facturacion" ("id_empresa","id_clinica","id_paciente","id_cita","fecha_emision","importe_total","descuento","pago_status","tipo_pago")
            SELECT empresa_sonrisa, clinica_sonrisa_bcn, pac_sonrisa_bcn, cita_id, CURRENT_DATE, 85.00, 0, 'Pagado', 'Tarjeta'
            WHERE NOT EXISTS (SELECT 1 FROM "Facturacion" WHERE "id_cita" = cita_id AND "id_paciente" = pac_sonrisa_bcn);
        END IF;
    END IF;

    -- Mundo Dental
    IF NOT EXISTS (SELECT 1 FROM "Proveedores" WHERE "nombre" = 'Mundo Stocks' AND "id_empresa" = empresa_mundo) THEN
        INSERT INTO "Proveedores" ("id_empresa","nombre","contacto","email","telefono","direccion")
        VALUES (empresa_mundo, 'Mundo Stocks', 'Proveedor MD', 'stocks@mundodental.com', '+34 960 222 333', 'Av. Mar 4, Valencia')
        RETURNING "id_proveedor" INTO prov_id;
    ELSE
        SELECT "id_proveedor" INTO prov_id FROM "Proveedores" WHERE "nombre" = 'Mundo Stocks' AND "id_empresa" = empresa_mundo;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Implante Titanium MD' AND "id_empresa" = empresa_mundo) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_mundo, 'Implante Titanium MD', 900.00, 350.00, true, 15, 3)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Implante Titanium MD' AND "id_empresa" = empresa_mundo;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Implante unitario' AND "id_empresa" = empresa_mundo) THEN
        INSERT INTO "Tratamientos" ("id_empresa","nombre_tratamiento","descripcion","unidades","precio","duracion_minima")
        VALUES (empresa_mundo, 'Implante unitario', 'Colocacion de implante unitario', 1, 1200.00, 75)
        RETURNING "id_tratamiento" INTO trat_id;
    ELSE
        SELECT "id_tratamiento" INTO trat_id FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Implante unitario' AND "id_empresa" = empresa_mundo;
        UPDATE "Tratamientos" SET "duracion_minima" = COALESCE("duracion_minima",75) WHERE "id_tratamiento" = trat_id;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento")
        VALUES (empresa_mundo, prod_id, trat_id)
        ON CONFLICT DO NOTHING;
    END IF;
    -- Segundo producto asociado para implante Mundo
    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Pilar MD' AND "id_empresa" = empresa_mundo) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_mundo, 'Pilar MD', 150.00, 55.00, false, 30, 5)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Pilar MD' AND "id_empresa" = empresa_mundo;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento","unidades")
        VALUES (empresa_mundo, prod_id, trat_id, 1) ON CONFLICT DO NOTHING;
    END IF;

    IF emp_mundo_owner IS NOT NULL AND pac_mundo_val IS NOT NULL THEN
        INSERT INTO "Citas" ("id_empresa","id_clinica","id_paciente","id_empleado","fecha","hora","estado","notas","duracion_minutos","tipo","prioridad")
        SELECT empresa_mundo, clinica_mundo_val, pac_mundo_val, emp_mundo_owner, CURRENT_DATE + 4, '10:30', 'Confirmada', 'Plan implante', 70, 'Normal', 'Alta'
        WHERE NOT EXISTS (SELECT 1 FROM "Citas" WHERE "id_paciente" = pac_mundo_val AND "id_clinica" = clinica_mundo_val);
        SELECT "id_cita" INTO cita_id FROM "Citas" WHERE "id_paciente" = pac_mundo_val AND "id_clinica" = clinica_mundo_val ORDER BY "id_cita" DESC LIMIT 1;
        IF cita_id IS NOT NULL THEN
            INSERT INTO "Facturacion" ("id_empresa","id_clinica","id_paciente","id_cita","fecha_emision","importe_total","descuento","pago_status","tipo_pago")
            SELECT empresa_mundo, clinica_mundo_val, pac_mundo_val, cita_id, CURRENT_DATE, 1200.00, 0, 'Parcial', 'Transferencia'
            WHERE NOT EXISTS (SELECT 1 FROM "Facturacion" WHERE "id_cita" = cita_id AND "id_paciente" = pac_mundo_val);
        END IF;
    END IF;

    IF (emp_mundo_owner_sev IS NOT NULL OR emp_mundo_owner IS NOT NULL) AND pac_mundo_sev IS NOT NULL THEN
        INSERT INTO "Citas" ("id_empresa","id_clinica","id_paciente","id_empleado","fecha","hora","estado","notas","duracion_minutos","tipo","prioridad")
        SELECT empresa_mundo, clinica_mundo_sev, pac_mundo_sev, COALESCE(emp_mundo_owner_sev, emp_mundo_owner), CURRENT_DATE + 5, '12:00', 'Confirmada', 'Revision periodontal', 45, 'Normal', 'Media'
        WHERE NOT EXISTS (SELECT 1 FROM "Citas" WHERE "id_paciente" = pac_mundo_sev AND "id_clinica" = clinica_mundo_sev);
        SELECT "id_cita" INTO cita_id FROM "Citas" WHERE "id_paciente" = pac_mundo_sev AND "id_clinica" = clinica_mundo_sev ORDER BY "id_cita" DESC LIMIT 1;
        IF cita_id IS NOT NULL THEN
            INSERT INTO "Facturacion" ("id_empresa","id_clinica","id_paciente","id_cita","fecha_emision","importe_total","descuento","pago_status","tipo_pago")
            SELECT empresa_mundo, clinica_mundo_sev, pac_mundo_sev, cita_id, CURRENT_DATE, 140.00, 0, 'Pagado', 'Efectivo'
            WHERE NOT EXISTS (SELECT 1 FROM "Facturacion" WHERE "id_cita" = cita_id AND "id_paciente" = pac_mundo_sev);
        END IF;
    END IF;

    -- BrightSmiles
    IF NOT EXISTS (SELECT 1 FROM "Proveedores" WHERE "nombre" = 'Bright Supply' AND "id_empresa" = empresa_bright) THEN
        INSERT INTO "Proveedores" ("id_empresa","nombre","contacto","email","telefono","direccion")
        VALUES (empresa_bright, 'Bright Supply', 'Proveedor BS', 'supply@brightsmiles.com', '+34 944 111 222', 'Gran Via 10, Bilbao')
        RETURNING "id_proveedor" INTO prov_id;
    ELSE
        SELECT "id_proveedor" INTO prov_id FROM "Proveedores" WHERE "nombre" = 'Bright Supply' AND "id_empresa" = empresa_bright;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Ortodoncia Invisible BS' AND "id_empresa" = empresa_bright) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_bright, 'Ortodoncia Invisible BS', 2500.00, 900.00, true, 8, 2)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Ortodoncia Invisible BS' AND "id_empresa" = empresa_bright;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Ortodoncia invisible' AND "id_empresa" = empresa_bright) THEN
        INSERT INTO "Tratamientos" ("id_empresa","nombre_tratamiento","descripcion","unidades","precio","duracion_minima")
        VALUES (empresa_bright, 'Ortodoncia invisible', 'Alineadores transparentes', 1, 3000.00, 80)
        RETURNING "id_tratamiento" INTO trat_id;
    ELSE
        SELECT "id_tratamiento" INTO trat_id FROM "Tratamientos" WHERE "nombre_tratamiento" = 'Ortodoncia invisible' AND "id_empresa" = empresa_bright;
        UPDATE "Tratamientos" SET "duracion_minima" = COALESCE("duracion_minima",80) WHERE "id_tratamiento" = trat_id;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento")
        VALUES (empresa_bright, prod_id, trat_id)
        ON CONFLICT DO NOTHING;
    END IF;
    -- Segundo producto para ortodoncia Bright
    IF NOT EXISTS (SELECT 1 FROM "Productos" WHERE "nombre_producto" = 'Kit revisiones BS' AND "id_empresa" = empresa_bright) THEN
        INSERT INTO "Productos" ("id_empresa","nombre_producto","precio","coste","vendible","stock_actual","stock_minimo")
        VALUES (empresa_bright, 'Kit revisiones BS', 180.00, 60.00, false, 20, 5)
        RETURNING "id_producto" INTO prod_id;
    ELSE
        SELECT "id_producto" INTO prod_id FROM "Productos" WHERE "nombre_producto" = 'Kit revisiones BS' AND "id_empresa" = empresa_bright;
    END IF;
    IF prod_id IS NOT NULL AND trat_id IS NOT NULL THEN
        INSERT INTO "Productos_Tratamientos" ("id_empresa","id_producto","id_tratamiento","unidades")
        VALUES (empresa_bright, prod_id, trat_id, 1) ON CONFLICT DO NOTHING;
    END IF;

    -- fallback: si no tenemos empleado owner para bright, toma cualquiera de la empresa
    IF emp_bright_owner IS NULL THEN
        SELECT "id_empleado" INTO emp_bright_owner
        FROM "Empleados" e
        JOIN "Clinicas" c ON c."id_clinica" = e."id_clinica"
        WHERE c."id_empresa" = empresa_bright
        ORDER BY e."id_empleado" LIMIT 1;
    END IF;
    IF emp_bright_owner_zar IS NULL THEN
        emp_bright_owner_zar := emp_bright_owner;
    END IF;

    IF emp_bright_owner IS NOT NULL AND pac_bright_bil IS NOT NULL THEN
        INSERT INTO "Citas" ("id_empresa","id_clinica","id_paciente","id_empleado","fecha","hora","estado","notas","duracion_minutos","tipo","prioridad")
        SELECT empresa_bright, clinica_bright_bil, pac_bright_bil, emp_bright_owner, CURRENT_DATE + 6, '09:30', 'Confirmada', 'Plan ortodoncia', 60, 'Normal', 'Alta'
        WHERE NOT EXISTS (SELECT 1 FROM "Citas" WHERE "id_paciente" = pac_bright_bil AND "id_clinica" = clinica_bright_bil);
        SELECT "id_cita" INTO cita_id FROM "Citas" WHERE "id_paciente" = pac_bright_bil AND "id_clinica" = clinica_bright_bil ORDER BY "id_cita" DESC LIMIT 1;
        IF cita_id IS NOT NULL THEN
            INSERT INTO "Facturacion" ("id_empresa","id_clinica","id_paciente","id_cita","fecha_emision","importe_total","descuento","pago_status","tipo_pago")
            SELECT empresa_bright, clinica_bright_bil, pac_bright_bil, cita_id, CURRENT_DATE, 3000.00, 0, 'Parcial', 'Tarjeta'
            WHERE NOT EXISTS (SELECT 1 FROM "Facturacion" WHERE "id_cita" = cita_id AND "id_paciente" = pac_bright_bil);
        END IF;
    END IF;

    IF (emp_bright_owner_zar IS NOT NULL OR emp_bright_owner IS NOT NULL) AND pac_bright_zar IS NOT NULL THEN
        INSERT INTO "Citas" ("id_empresa","id_clinica","id_paciente","id_empleado","fecha","hora","estado","notas","duracion_minutos","tipo","prioridad")
        SELECT empresa_bright, clinica_bright_zar, pac_bright_zar, COALESCE(emp_bright_owner_zar, emp_bright_owner), CURRENT_DATE + 7, '12:30', 'Confirmada', 'Revision anual', 40, 'Normal', 'Media'
        WHERE NOT EXISTS (SELECT 1 FROM "Citas" WHERE "id_paciente" = pac_bright_zar AND "id_clinica" = clinica_bright_zar);
        SELECT "id_cita" INTO cita_id FROM "Citas" WHERE "id_paciente" = pac_bright_zar AND "id_clinica" = clinica_bright_zar ORDER BY "id_cita" DESC LIMIT 1;
        IF cita_id IS NOT NULL THEN
            INSERT INTO "Facturacion" ("id_empresa","id_clinica","id_paciente","id_cita","fecha_emision","importe_total","descuento","pago_status","tipo_pago")
            SELECT empresa_bright, clinica_bright_zar, pac_bright_zar, cita_id, CURRENT_DATE, 95.00, 0, 'Pagado', 'Efectivo'
            WHERE NOT EXISTS (SELECT 1 FROM "Facturacion" WHERE "id_cita" = cita_id AND "id_paciente" = pac_bright_zar);
        END IF;
    END IF;

END $$;

COMMIT;
