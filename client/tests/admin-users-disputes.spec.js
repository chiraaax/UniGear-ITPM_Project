const { test, expect } = require('@playwright/test');
const { adminUser, installAdminApiMocks } = require('./helpers/mockApi');

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    localStorage.setItem('unigear_token', 'fake-admin-token');
    localStorage.setItem('unigear_user', JSON.stringify(user));
  }, adminUser);
  await installAdminApiMocks(page);
});

test('updates user role and suspension in Users tab', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: /Users/i }).first().click();

  await page.getByRole('button', { name: /Make Admin/i }).click();
  await expect(page.getByText('Role updated')).toBeVisible();

  await page.getByRole('button', { name: /Suspend/i }).click();
  await expect(page.getByText('User updated')).toBeVisible();
});

test('admin dispute flow: chat, resolve, dismiss and delete', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: /Disputes/i }).first().click();

  await page.getByPlaceholder('Type a message to the user...').first().fill('Please upload image evidence.');
  await page.getByRole('button', { name: 'Send' }).first().click();
  await expect(page.getByText('Please upload image evidence.')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept('Issue verified.'));
  await page.getByRole('button', { name: /Resolve in favor of Reporter/i }).first().click();
  await expect(page.getByText('Dispute marked as resolved')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept('Not enough proof.'));
  await page.getByRole('button', { name: /Dismiss Dispute/i }).first().click();
  await expect(page.getByText('Dispute marked as dismissed')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTitle('Delete Complete Dispute').first().click();
  await expect(page.getByText('Dispute deleted successfully')).toBeVisible();
});
