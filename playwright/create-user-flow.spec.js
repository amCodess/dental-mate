const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.DM_BASE_URL || 'http://localhost:5173';
const ADMIN_EMAIL = process.env.DM_ADMIN_EMAIL || 'admin@dentalmate.com';
const ADMIN_PASSWORD = process.env.DM_ADMIN_PASSWORD || 'Admin123!';
const DEFAULT_COMPANY = process.env.DM_COMPANY || 'DentalMate HQ';
const DEFAULT_CLINIC = process.env.DM_CLINIC || 'Clínica Central';

test('alta y listado de usuario', async ({ page }) => {
  const timestamp = Date.now();
  const newUserEmail = process.env.DM_NEW_USER_EMAIL || `qa+${timestamp}@example.com`;

  await page.goto(`${BASE_URL}/login`);

  await page.getByLabel('Correo electrónico').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page).toHaveURL(/select-clinic/);

  const companySelect = page.locator('select').first();
  const clinicSelect = page.locator('select').nth(1);

  await companySelect.selectOption({ label: DEFAULT_COMPANY });
  await expect(clinicSelect).toBeEnabled();
  await clinicSelect.selectOption({ label: DEFAULT_CLINIC });
  await page.getByRole('button', { name: 'Entrar' }).click();

  await page.waitForURL(/dashboard/);

  await page.getByRole('link', { name: 'Usuarios' }).click();
  await page.waitForURL(/users/);

  await page.getByRole('button', { name: 'Nuevo usuario' }).click();
  await expect(page.getByRole('heading', { name: /Crear nuevo usuario|Editar usuario/ })).toBeVisible();

  await page.getByLabel('Nombre').fill('QA');
  await page.getByLabel('Apellido').fill('Playwright');
  await page.getByLabel('Correo electrónico').fill(newUserEmail);
  const roleSelect = page.locator('form select').first();
  await roleSelect.selectOption({ label: 'admin' });
  await page.getByLabel(/Contraseña/).fill('Test123!');

  await page.getByRole('button', { name: /Crear usuario|Guardar cambios/ }).click();

  await expect(page.getByText(newUserEmail)).toBeVisible({ timeout: 10000 });
});
