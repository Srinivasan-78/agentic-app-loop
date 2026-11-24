import { test, expect } from '@playwright/test';

test.describe('Visual Regression @example', () => {
  test('full page screenshot', async ({ page }) => {
    await page.goto('https://example.com');

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('component screenshot', async ({ page }) => {
    await page.goto('https://example.com');

    // Screenshot specific component
    const button = page.locator('button.primary');
    await expect(button).toHaveScreenshot('primary-button.png');
  });

  test('multiple viewport screenshots', async ({ browser }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });

      const page = await context.newPage();
      await page.goto('https://example.com');

      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`);

      await context.close();
    }
  });

  test('screenshot with mask', async ({ page }) => {
    await page.goto('https://example.com');

    // Hide dynamic content before screenshot
    await page.addStyleTag({
      content: '.dynamic-timestamp { display: none; } .ads { opacity: 0; }',
    });

    // Take screenshot with masked areas
    await expect(page).toHaveScreenshot('homepage-masked.png', {
      mask: [page.locator('.banner'), page.locator('.sidebar')],
    });
  });

  test('screenshot with clip', async ({ page }) => {
    await page.goto('https://example.com');

    // Screenshot only viewport
    await expect(page).toHaveScreenshot('viewport-only.png', {
      fullPage: false,
    });
  });

  test('compare header across pages', async ({ page }) => {
    // HomePage
    await page.goto('https://example.com');
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header-homepage.png');

    // Product page
    await page.goto('https://example.com/products/1');
    await expect(header).toHaveScreenshot('header-product.png');
  });

  test('visual regression with animations', async ({ page }) => {
    await page.goto('https://example.com/animations');

    // Wait for animation to complete
    await page.waitForTimeout(2000);

    // Take screenshot after animation
    const element = page.locator('.animated-element');
    await expect(element).toHaveScreenshot('animated-state.png');
  });

  test('dark mode comparison', async ({ browser }) => {
    // Light mode
    const context1 = await browser.newContext({
      colorScheme: 'light',
    });

    const page1 = await context1.newPage();
    await page1.goto('https://example.com');
    await expect(page1).toHaveScreenshot('light-mode.png');
    await context1.close();

    // Dark mode
    const context2 = await browser.newContext({
      colorScheme: 'dark',
    });

    const page2 = await context2.newPage();
    await page2.goto('https://example.com');
    await expect(page2).toHaveScreenshot('dark-mode.png');
    await context2.close();
  });

  test('screenshot with custom timeout', async ({ page }) => {
    await page.goto('https://example.com/slow-load');

    // Wait for lazy-loaded content
    await page.waitForSelector('.lazy-loaded', { timeout: 10000 });

    // Then take screenshot
    await expect(page).toHaveScreenshot('with-lazy-content.png');
  });

  test('element state screenshots', async ({ page }) => {
    await page.goto('https://example.com/interactive');

    const button = page.locator('button.interactive');

    // Normal state
    await expect(button).toHaveScreenshot('button-normal.png');

    // Hover state
    await button.hover();
    await expect(button).toHaveScreenshot('button-hover.png');

    // Active/focused state
    await button.focus();
    await expect(button).toHaveScreenshot('button-focused.png');
  });
});
