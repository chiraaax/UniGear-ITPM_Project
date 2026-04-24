import { test, expect } from '@playwright/test';

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const dayAfter = new Date();
dayAfter.setDate(dayAfter.getDate() + 3);

const fmt = (d) => d.toISOString().split('T')[0];

test.describe('Booking flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('unigear_token', 'fake-token');
      localStorage.setItem(
        'unigear_user',
        JSON.stringify({
          _id: 'borrower1',
          name: 'Test User',
          email: 'test@test.com',
        })
      );
    });

    await page.route('**/api/rentals/items', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'item1',
            title: 'Canon Camera',
            description: 'DSLR for events',
            category: 'Electronics',
            dailyRate: 1500,
            photos: [],
            owner: { _id: 'owner1', name: 'Kasun', trustScore: 4.7 },
          },
        ]),
      });
    });

    await page.route('**/api/rentals/items/item1/availability', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('books an item successfully', async ({ page }) => {
    await page.route('**/api/rentals/items/item1/bookings', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          booking: { _id: 'booking1', item: 'item1' },
          transaction: { _id: 'tx1', status: 'Pending' },
        }),
      });
    });

    await page.goto('/rentals');

    await page.locator('input[type="date"]').nth(0).fill(fmt(tomorrow));
    await page.locator('input[type="date"]').nth(1).fill(fmt(dayAfter));

    await page.getByRole('button', { name: /book now/i }).click();

    await expect(page.getByText(/booking successful/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('prevents booking without dates', async ({ page }) => {
    await page.goto('/rentals');

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Please select dates');
      await dialog.accept();
    });

    await page.getByRole('button', { name: /book now/i }).click();
  });

  test('prevents end date before start date', async ({ page }) => {
    const later = new Date();
    later.setDate(later.getDate() + 5);

    const earlier = new Date();
    earlier.setDate(earlier.getDate() + 2);

    await page.goto('/rentals');

    await page.locator('input[type="date"]').nth(0).fill(fmt(later));
    await page.locator('input[type="date"]').nth(1).fill(fmt(earlier));

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('End date must be after start date');
      await dialog.accept();
    });

    await page.getByRole('button', { name: /book now/i }).click();
  });

  test('shows backend overlap error', async ({ page }) => {
    await page.route('**/api/rentals/items/item1/bookings', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Item already booked for selected dates',
        }),
      });
    });

    await page.goto('/rentals');

    await page.locator('input[type="date"]').nth(0).fill(fmt(tomorrow));
    await page.locator('input[type="date"]').nth(1).fill(fmt(dayAfter));

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Item already booked for selected dates');
      await dialog.accept();
    });

    await page.getByRole('button', { name: /book now/i }).click();
  });
});