// task-check
import { test, expect } from "@playwright/test";

// Base URL for the CRA dev server
const BASE_URL = "http://localhost:3000";

test.describe("UniGear Micro-task Flow", () => {

  test("User can view the micro-task page and navigate to task posting", async ({ page }) => {

    // Go to Micro-task page
    await page.goto(`${BASE_URL}/micro-tasks`);

    // Wait page load
    await page.waitForLoadState("networkidle");

    //  Check page loaded
    await expect(page.locator("body")).toContainText("Micro");

    // Click "Post Task" button
    await page.getByRole("button", { name: /post task/i }).click();

    // User should land on the task posting page
    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.locator("text=Post a New Task")).toBeVisible();

  });

  test("Unauthenticated user is redirected to login when submitting a task", async ({ page }) => {

    // Directly go to task page
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState("networkidle");

    // Fill the task form
    await page.fill('textarea[name="description"]', "Deliver book to library");
    await page.selectOption('select[name="category"]', "Delivery");
    await page.fill('input[name="budget"]', "1000");
    await page.fill('input[name="deadline"]', "2030-12-31T12:00");
    await page.fill('input[name="location"]', "Main Library");

    // Submit form
    await page.getByRole("button", { name: /post task/i }).click();

    // Should redirect to auth page because the user is not signed in
    await expect(page).toHaveURL(/auth|login/);
    await expect(page.locator("text=Sign in with your university email")).toBeVisible();

  });

});