import { test, expect } from '@playwright/test';

test.describe('StatusDashboard - rentals part', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('unigear_token', 'fake-token');
      localStorage.setItem(
        'unigear_user',
        JSON.stringify({
          _id: 'user1',
          name: 'Tharushi',
          email: 'th@test.com',
        })
      );
    });

    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'user1',
          name: 'Tharushi',
          email: 'th@test.com',
          trustScore: 4.5,
        }),
      });
    });

    await page.route('**/api/rentals/my-items', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'item1',
            title: 'Canon Camera',
            category: 'Electronics',
            dailyRate: 1500,
          },
        ]),
      });
    });

    await page.route('**/api/tasks/my-tasks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/transactions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/rentals/my-bookings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'booking1',
            status: 'active',
            startDate: '2026-04-25T00:00:00.000Z',
            endDate: '2026-04-27T00:00:00.000Z',
            item: {
              _id: 'item2',
              title: 'Projector',
              category: 'Electronics',
              dailyRate: 2000,
              photos: [],
            },
          },
        ]),
      });
    });
  });

  test('shows my rentals section', async ({ page }) => {
    await page.goto('/me');

    await expect(page.getByText('My UniGear activity')).toBeVisible();
    await expect(page.getByText('My Rentals')).toBeVisible();
    await expect(page.getByText('Canon Camera')).toBeVisible();
    await expect(page.getByText('LKR 1500')).toBeVisible();
  });

  test('shows my bookings section', async ({ page }) => {
    await page.goto('/me');

    await expect(page.getByText('My UniGear activity')).toBeVisible();
    await expect(page.getByText('My Bookings')).toBeVisible();
    await expect(page.getByText('Projector')).toBeVisible();
    await expect(page.getByText(/LKR 2000\/day/i)).toBeVisible();
  });

  test('returns an item successfully', async ({ page }) => {
    let returned = false;

    await page.route('**/api/rentals/bookings/booking1/return', async (route) => {
      returned = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Item returned successfully.' }),
      });
    });

    await page.route('**/api/rentals/my-bookings', async (route) => {
      const body = returned
        ? [
            {
              _id: 'booking1',
              status: 'returned',
              startDate: '2026-04-25T00:00:00.000Z',
              endDate: '2026-04-27T00:00:00.000Z',
              item: {
                _id: 'item2',
                title: 'Projector',
                category: 'Electronics',
                dailyRate: 2000,
                photos: [],
              },
            },
          ]
        : [
            {
              _id: 'booking1',
              status: 'active',
              startDate: '2026-04-25T00:00:00.000Z',
              endDate: '2026-04-27T00:00:00.000Z',
              item: {
                _id: 'item2',
                title: 'Projector',
                category: 'Electronics',
                dailyRate: 2000,
                photos: [],
              },
            },
          ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await page.goto('/me');

    await expect(page.getByText('My UniGear activity')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Return' })).toBeVisible();

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Item returned successfully');
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Return' }).click();

    await expect(page.getByText(/returned/i)).toBeVisible();
  });

  test('shows empty state when no bookings', async ({ page }) => {
    await page.route('**/api/rentals/my-bookings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/me');

    await expect(page.getByText('My UniGear activity')).toBeVisible();
    await expect(page.getByText('No bookings yet')).toBeVisible();
  });
});