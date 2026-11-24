import { test, expect } from '@playwright/test';

test.describe('Basic Navigation @example', () => {
  test('navigate to page and verify title', async ({ page }) => {
    await page.goto('https://example.com');
    expect(page).toHaveTitle(/example/i);
  });

  test('click and navigate', async ({ page }) => {
    await page.goto('https://example.com');

    // Click a link
    await page.click('text=More information');

    // Verify navigation
    expect(page).toHaveURL(/details/);
  });

  test('fill input and submit', async ({ page }) => {
    await page.goto('https://example.com');

    // Fill form field
    await page.fill('input[name="search"]', 'playwright');

    // Click button
    await page.click('button:has-text("Search")');

    // Wait for navigation
    await page.waitForURL(/search/);
    expect(page).toHaveURL(/\?q=playwright/);
  });

  test('wait for element and interact', async ({ page }) => {
    await page.goto('https://example.com');

    // Wait for element to be visible
    await page.waitForSelector('.modal-content');

    // Type in focused element
    await page.type('input', 'test value');

    // Get text content
    const title = await page.textContent('h1');
    expect(title).toBeTruthy();
  });

  test('keyboard shortcuts', async ({ page }) => {
    await page.goto('https://example.com');

    // Keyboard interaction
    await page.press('input', 'Enter');
    await page.keyboard.type('Hello world');

    // Modifier keys
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Control+C');
  });

  test('verify visibility', async ({ page }) => {
    await page.goto('https://example.com');

    // Check if element is visible
    const isVisible = await page.isVisible('button.submit');
    expect(isVisible).toBeTruthy();

    // Check enabled state
    const isEnabled = await page.isEnabled('input[type="text"]');
    expect(isEnabled).toBeTruthy();
  });

  test('multiple assertions', async ({ page }) => {
    await page.goto('https://example.com');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(/Welcome/);
    await expect(heading).toHaveCSS('color', 'rgb(0, 0, 0)');
  });
});
