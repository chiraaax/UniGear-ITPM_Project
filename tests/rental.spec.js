import { test, expect } from '@playwright/test';

//Mock data (fake items)
const mockItems = [
  {
    _id: 'item1',
    title: 'Canon Camera',
    description: 'DSLR for events',
    category: 'Electronics',
    dailyRate: 1500,
    photos: [],
    owner: { _id: 'owner1', name: 'Kasun', trustScore: 4.7 },
  },
  {
    _id: 'item2',
    title: 'Football Kit',
    description: 'Sports equipment',
    category: 'Sports',
    dailyRate: 800,
    photos: [],
    owner: { _id: 'owner2', name: 'Nimal', trustScore: 4.1 },
  },
];

test.describe('RentalPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/rentals/items', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockItems),
      });
    });

    //All items are available
    await page.route('**/api/rentals/items/item1/availability', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/rentals/items/item2/availability', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  //Show items
  test('shows rental items', async ({ page }) => {
    await page.goto('/rentals');

    await expect(page.getByText('UniGear Rental System')).toBeVisible();
    await expect(page.getByText('Canon Camera')).toBeVisible();
    await expect(page.getByText('Football Kit')).toBeVisible();
  });

  //Search filtering works
  test('search filters items', async ({ page }) => {
    await page.goto('/rentals');

    await page.getByPlaceholder('Search items by title or description...').fill('Canon');

    await expect(page.getByText('Canon Camera')).toBeVisible();
    await expect(page.getByText('Football Kit')).not.toBeVisible();
  });

  //Category filter works
  test('category filter works', async ({ page }) => {
    await page.goto('/rentals');

    await page.locator('select.filter-select').selectOption('Sports');

    await expect(page.getByText('Football Kit')).toBeVisible();
    await expect(page.getByText('Canon Camera')).not.toBeVisible();
  });

  //Shows add item modal
  test('opens add item modal', async ({ page }) => {
    await page.goto('/rentals');

    await page.getByRole('button', { name: /add new item/i }).click();

    await expect(page.getByRole('heading', { name: /add new item/i })).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });

  //Creates a new item
  test('creates a new item', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ _id: 'owner3', name: 'Tharushi', email: 'test@test.com' })
      );
    });

    //Returns fake upload URL
    await page.route('**/api/upload/generate-url', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          signedUrl: 'https://fake-s3-url.com/upload',
          publicUrl: 'https://fake-s3-url.com/item.jpg',
        }),
      });
    });

    //Pretends image upload
    await page.route('https://fake-s3-url.com/upload', async (route) => {
      await route.fulfill({ status: 200, body: '' });
    });

    await page.route('**/api/rentals/items', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ _id: 'item3' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockItems),
        });
      }
    });

    await page.route('**/api/rentals/items/**/availability', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/rentals');

    await page.getByRole('button', { name: /add new item/i }).click();
    await page.locator('input[name="title"]').fill('Laptop Stand');
    await page.locator('textarea[name="description"]').fill('Adjustable stand');
    await page.locator('select[name="category"]').selectOption('Electronics');
    await page.locator('input[name="dailyRate"]').fill('500');

    await page.getByRole('button', { name: /publish listing/i }).click();

    await expect(page.locator('input[name="title"]')).not.toBeVisible();
  });

  //Empty state
  test('shows empty state when no items exist', async ({ page }) => {
    await page.route('**/api/rentals/items', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/rentals');

    await expect(page.getByText('No items found')).toBeVisible();
  });
});