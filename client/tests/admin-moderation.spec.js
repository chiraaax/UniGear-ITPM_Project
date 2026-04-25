const { test, expect } = require('@playwright/test');
const { adminUser, installAdminApiMocks } = require('./helpers/mockApi');

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    localStorage.setItem('unigear_token', 'fake-admin-token');
    localStorage.setItem('unigear_user', JSON.stringify(user));
  }, adminUser);
  await installAdminApiMocks(page);
});

test('approves multiple pending entries from Pending tab', async ({ page }) => {
  await page.goto('/admin');

  await expect(page.getByText('Pending Rentals (2)')).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).first().click();
  await expect(page.getByText('Successfully approved rental.')).toBeVisible();

  const taskCard = page.locator('div').filter({ hasText: 'Fix lab PC setup' }).first();
  await taskCard.locator('button:has-text("Approve"):visible').first().click();
  await expect(page.getByText(/Successfully approved (rental|task)\./)).toBeVisible();
});

test('bulk approves rentals from Pending tab', async ({ page }) => {
  await page.goto('/admin');
  await page.getByText('Select All').first().click();
  await page.getByRole('button', { name: /Approve Selected/i }).click();
  await expect(page.getByText(/Successfully approved 2 items/i)).toBeVisible();
});
