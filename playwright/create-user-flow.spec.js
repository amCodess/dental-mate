const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.DM_BASE_URL || 'http://localhost:5173';
const ADMIN_EMAIL = process.env.DM_ADMIN_EMAIL || 'admin@dentalmate.com';
const ADMIN_PASSWORD = process.env.DM_ADMIN_PASSWORD || 'Admin123!';
const DEFAULT_COMPANY = process.env.DM_COMPANY || 'DentalMate HQ';
const DEFAULT_CLINIC = process.env.DM_CLINIC || 'Clinica Central';

test.describe('Usuarios con menus completos', () => {
  test.use({ baseURL: BASE_URL });

  const navAssertions = async (page, { expectVisible = [], expectHidden = [] }) => {
    for (const label of expectVisible) {
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    }
    for (const label of expectHidden) {
      await expect(page.getByRole('link', { name: label })).toHaveCount(0);
    }
  };

  const loginAndEnterClinic = async (page, email, password) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/select-clinic/);
    const companySelect = page.locator('select').first();
    const clinicSelect = page.locator('select').nth(1);

    await companySelect.selectOption({ label: DEFAULT_COMPANY });
    await expect(clinicSelect).toBeEnabled();
    await clinicSelect.selectOption({ label: DEFAULT_CLINIC });
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(/dashboard/);
  };

  test('todos los usuarios ven todos los menus (excepto superadmin system)', async ({ page, context }) => {
    const timestamp = Date.now();
    const employeeEmail = process.env.DM_NEW_USER_EMAIL || `qa+empleado+${timestamp}@example.com`;
    const employeePassword = 'Test123!';

    // Admin login
    await loginAndEnterClinic(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Admin debería ver todos los menus (incluye Usuarios)
    await navAssertions(page, {
      expectVisible: ['Citas', 'Pacientes', 'Facturación', 'Productos', 'Proveedores', 'Tratamientos', 'Usuarios'],
    });

    // Crear usuario (sin roles ni checkboxes)
    await page.getByRole('link', { name: 'Usuarios' }).click();
    await page.waitForURL(/users/);
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    await expect(page.getByRole('heading', { name: /Crear nuevo usuario/ })).toBeVisible();

    await page.getByLabel('Nombre').fill('QA');
    await page.getByLabel('Apellido').fill('Empleado');
    await page.getByLabel('Correo electrónico').fill(employeeEmail);
    await page.getByLabel('Contraseña').fill(employeePassword);

    await page.getByRole('button', { name: /Crear usuario/ }).click();
    await expect(page.getByText(employeeEmail)).toBeVisible({ timeout: 10000 });

    // Logout admin
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await page.waitForURL(/login/);

    // Login con el nuevo usuario y comprobar visibilidad
    const employeePage = context.pages().length > 1 ? context.pages()[1] : page;
    await loginAndEnterClinic(employeePage, employeeEmail, employeePassword);

    await navAssertions(employeePage, {
      expectVisible: ['Citas', 'Pacientes', 'Facturación', 'Productos', 'Proveedores', 'Tratamientos', 'Usuarios'],
    });
  });

  test('muestra diálogo de correo duplicado', async ({ page }) => {
    const duplicateEmail = process.env.DM_DUP_EMAIL || `qa+dup@example.com`;

    await loginAndEnterClinic(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.getByRole('link', { name: 'Usuarios' }).click();
    await page.waitForURL(/users/);
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();

    await page.getByLabel('Nombre').fill('QA');
    await page.getByLabel('Apellido').fill('Duplicado');
    await page.getByLabel('Correo electrónico').fill(duplicateEmail);
    await page.getByLabel('Contraseña').fill('Test123!');

    // Primer intento (crea o reutiliza usuario). Si ya existe, veremos feedback.
    await page.getByRole('button', { name: /Crear usuario/ }).click();
    await Promise.race([
      page.waitForSelector(`text=${duplicateEmail}`, { timeout: 10000 }),
      page.waitForSelector('text=Correo ya registrado', { timeout: 10000 }),
    ]);

    // Segundo intento debe disparar el diálogo de correo duplicado
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    await page.getByLabel('Nombre').fill('QA');
    await page.getByLabel('Apellido').fill('Duplicado');
    await page.getByLabel('Correo electrónico').fill(duplicateEmail);
    await page.getByLabel('Contraseña').fill('Test123!');
    await page.getByRole('button', { name: /Crear usuario/ }).click();

    await expect(page.getByText('Correo ya registrado')).toBeVisible({ timeout: 5000 });
  });
});
