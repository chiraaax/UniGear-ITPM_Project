import { test, expect } from '@playwright/test';

const API = 'http://localhost:5000/api';

test.describe('Rental API', () => {

  //Get all rental items
  test('GET /rentals/items returns active items array', async ({ request }) => {
    const res = await request.get(`${API}/rentals/items`);

    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  //Test: Invalid item ID
  test('GET /rentals/items/:id/availability rejects invalid id', async ({ request }) => {
    const res = await request.get(`${API}/rentals/items/some-id/availability`);

    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.message).toContain('Invalid item id');
  });

  //Test: Upload non-image file
  test('POST /upload/generate-url rejects non-image files', async ({ request }) => {
    const res = await request.post(`${API}/upload/generate-url`, {
      data: {
        fileName: 'hack.pdf',
        fileType: 'application/pdf',
      },
    });

    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.message).toContain('Only image files are allowed');
  });
});