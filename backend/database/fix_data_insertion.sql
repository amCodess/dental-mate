
-- =========================================================
-- FIX: Safe Data Insertion (No ON CONFLICT dependency)
-- =========================================================
BEGIN;

DO $$
DECLARE
    role_id int;
    empresa_id int;
    clinica_id int;
    user_id int;
    user_hashed_pass varchar := '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; 
BEGIN
    -- 1. Create Role 'superadmin' if not exists
    IF NOT EXISTS (SELECT 1 FROM "Roles" WHERE "nombre_role" = 'superadmin') THEN
        INSERT INTO "Roles" ("nombre_role", "descripcion", "tipo")
        VALUES ('superadmin', 'Super Administrator', 'empleado')
        RETURNING "id_role" INTO role_id;
    ELSE
        SELECT "id_role" INTO role_id FROM "Roles" WHERE "nombre_role" = 'superadmin';
    END IF;

    -- 2. Create Company 'DentalMate HQ'
    IF NOT EXISTS (SELECT 1 FROM "Empresas" WHERE "nombre" = 'DentalMate HQ') THEN
        INSERT INTO "Empresas" ("nombre", "nif", "email", "telefono")
        VALUES ('DentalMate HQ', 'A12345678', 'info@dentalmate.com', '+34 900 123 456')
        RETURNING "id_empresa" INTO empresa_id;
    ELSE
        SELECT "id_empresa" INTO empresa_id FROM "Empresas" WHERE "nombre" = 'DentalMate HQ';
    END IF;

    -- 3. Create Clinic 'Clínica Central'
    IF NOT EXISTS (SELECT 1 FROM "Clinicas" WHERE "nombre" = 'Clínica Central' AND "id_empresa" = empresa_id) THEN
        INSERT INTO "Clinicas" ("id_empresa", "nombre", "telefono", "direccion")
        VALUES (empresa_id, 'Clínica Central', '+34 900 123 456', 'Calle Principal, 123, Madrid')
        RETURNING "id_clinica" INTO clinica_id;
    ELSE
        SELECT "id_clinica" INTO clinica_id FROM "Clinicas" WHERE "nombre" = 'Clínica Central' AND "id_empresa" = empresa_id;
    END IF;

    -- 4. Create User 'Super Admin'
    IF NOT EXISTS (SELECT 1 FROM "Usuarios" WHERE "email" = 'admin@dentalmate.com') THEN
        INSERT INTO "Usuarios" ("nombre", "apellido", "email", "password", "estado", "id_role")
        VALUES ('Super', 'Admin', 'admin@dentalmate.com', user_hashed_pass, 'activo', role_id)
        RETURNING "id_usuario" INTO user_id;
    ELSE
        SELECT "id_usuario" INTO user_id FROM "Usuarios" WHERE "email" = 'admin@dentalmate.com';
    END IF;

    -- 5. Associate User to Company (Owner)
    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Empresas" WHERE "id_usuario" = user_id AND "id_empresa" = empresa_id) THEN
        INSERT INTO "Usuarios_Empresas" ("id_usuario", "id_empresa", "rol")
        VALUES (user_id, empresa_id, 'owner');
    END IF;

    -- 6. Associate User to Clinic (Owner)
    IF NOT EXISTS (SELECT 1 FROM "Usuarios_Clinicas" WHERE "id_usuario" = user_id AND "id_clinica" = clinica_id) THEN
        INSERT INTO "Usuarios_Clinicas" ("id_empresa", "id_usuario", "id_clinica", "rol")
        VALUES (empresa_id, user_id, clinica_id, 'owner');
    END IF;

    -- 7. Create Employee Record
    IF NOT EXISTS (SELECT 1 FROM "Empleados" WHERE "id_usuario" = user_id) THEN
        INSERT INTO "Empleados" ("id_empresa", "id_clinica", "id_usuario", "especialidad")
        VALUES (empresa_id, clinica_id, user_id, 'Administración');
    END IF;

END $$;

COMMIT;
