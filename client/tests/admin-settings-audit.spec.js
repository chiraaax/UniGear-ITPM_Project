const { test, expect } = require('@playwright/test');
const { adminUser, installAdminApiMocks } = require('./helpers/mockApi');

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    localStorage.setItem('unigear_token', 'fake-admin-token');
    localStorage.setItem('unigear_user', JSON.stringify(user));
  }, adminUser);
  await installAdminApiMocks(page);
});

test('saves system settings', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: /^Settings$/i }).click();

  await expect(page.getByText('System Settings')).toBeVisible();
  await page.locator('input[type="number"]').first().fill('45');
  await page.getByRole('button', { name: /Save All Settings/i }).click();
  await expect(page.getByText('System settings updated successfully.')).toBeVisible();
});

test('loads and deletes audit log entry', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: /Audit Logs/i }).click();

  await expect(page.getByText('ADMIN_LOGIN')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTitle('Delete Audit Log').first().click();
  await expect(page.getByText('Audit log deleted successfully.')).toBeVisible();
});
