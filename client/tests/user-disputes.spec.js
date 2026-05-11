const { test, expect } = require('@playwright/test');
const { studentUser, installUserDisputeApiMocks } = require('./helpers/mockApi');

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    localStorage.setItem('unigear_token', 'fake-student-token');
    localStorage.setItem('unigear_user', JSON.stringify(user));
  }, studentUser);
  await installUserDisputeApiMocks(page);
});

test('student creates dispute from booking and sees it immediately', async ({ page }) => {
  await page.goto('/me');

  await expect(page.getByText('My Active Disputes')).toBeVisible();
  await expect(page.getByText('Need escalation')).toBeVisible();

  await page.getByRole('button', { name: /Report/i }).first().click();
  await expect(page.getByText('Open Dispute')).toBeVisible();

  await page.getByPlaceholder('E.g., The item was damaged upon receipt...').fill('Rental item battery failed immediately.');
  await page.getByRole('button', { name: /Submit Dispute/i }).click();

  await expect(page.getByText('Rental item battery failed immediately.')).toBeVisible();
});

test('student chat message appears immediately in dispute modal', async ({ page }) => {
  await page.goto('/me');
  await page.getByRole('button', { name: /Open Chat/i }).first().click();

  await expect(page.getByText(/No messages yet/i)).toBeVisible();
  await page.getByPlaceholder('Type your message to Admin...').fill('Any update from admin?');
  await page.locator('form').filter({ has: page.getByPlaceholder('Type your message to Admin...') }).getByRole('button').click();

  await expect(page.getByText('Any update from admin?')).toBeVisible();
});
