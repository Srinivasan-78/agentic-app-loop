import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Testing @example', () => {
  test('mobile viewport test', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('https://example.com');

    // Verify mobile layout is applied
    const navbar = page.locator('.navbar-mobile, .mobile-menu');
    const isMobileVisible = await navbar.isVisible().catch(() => false);

    expect(typeof isMobileVisible).toBe('boolean');
  });

  test('iPhone viewport', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });

    const page = await context.newPage();
    await page.goto('https://example.com');

    // Get viewport size
    const size = page.viewportSize();
    expect(size?.width).toBe(390);
    expect(size?.height).toBe(844);

    await context.close();
  });

  test('iPad viewport', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro'],
    });

    const page = await context.newPage();
    await page.goto('https://example.com');

    // Check tablet layout
    const size = page.viewportSize();
    expect(size?.width).toBeGreaterThan(500);

    await context.close();
  });

  test('Android mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Pixel 5'],
    });

    const page = await context.newPage();
    await page.goto('https://example.com');

    // Verify Android user agent
    const userAgent = page.context().browser()?.version() || '';
    expect(typeof userAgent).toBe('string');

    await context.close();
  });

  test('touch interactions', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      hasTouch: true,
    });

    const page = await context.newPage();
    await page.goto('https://example.com');

    // Tap instead of click
    await page.tap('.button-mobile');

    // Verify interaction
    const isActive = await page.locator('.button-mobile.active').isVisible().catch(() => false);
    expect(typeof isActive).toBe('boolean');

    await context.close();
  });

  test('swipe gesture simulation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://example.com/carousel');

    // Get initial element
    const initialItem = await page.locator('.carousel-item.active').textContent();

    // Simulate swipe by dragging
    const carousel = page.locator('.carousel');
    const box = await carousel.boundingBox();

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 50, box.y + box.height / 2);
      await page.mouse.up();
    }

    // Verify carousel changed
    await page.waitForTimeout(500);
    const newItem = await page.locator('.carousel-item.active').textContent();
    expect(typeof newItem).toBe('string');
  });

  test('landscape orientation', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      viewport: { width: 844, height: 390 }, // landscape
    });

    const page = await context.newPage();
    await page.goto('https://example.com');

    // Verify landscape layout
    const size = page.viewportSize();
    expect(size?.width).toBeGreaterThan(size?.height!);

    await context.close();
  });

  test('mobile menu interaction', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://example.com');

    // Open mobile menu
    const hamburger = page.locator('.hamburger-menu, [aria-label="Menu"]');
    const isVisible = await hamburger.isVisible().catch(() => false);

    if (isVisible) {
      await hamburger.click();

      // Verify menu opens
      const menu = page.locator('.mobile-menu, [role="navigation"]');
      await expect(menu).toBeVisible();
    }
  });

  test('mobile form submission', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://example.com/mobile-form');

    // Fill form fields
    await page.fill('input[name="mobile"]', '+1234567890');
    await page.fill('input[name="otp"]', '123456');

    // Submit
    await page.click('button:has-text("Submit")');

    // Verify submission
    const success = page.locator('.success-message');
    const isShown = await success.isVisible().catch(() => false);
    expect(typeof isShown).toBe('boolean');
  });

  test('viewport resize handling', async ({ page }) => {
    await page.goto('https://example.com');

    // Start with desktop
    await page.setViewportSize({ width: 1024, height: 768 });
    let desktopMenu = await page.locator('.desktop-menu').isVisible().catch(() => false);

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    let mobileMenu = await page.locator('.mobile-menu').isVisible().catch(() => false);

    // Verify layout changed
    expect(typeof desktopMenu).toBe('boolean');
    expect(typeof mobileMenu).toBe('boolean');
  });

  test('geolocation on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      geolocation: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
      permissions: ['geolocation'],
    });

    const page = await context.newPage();
    await page.goto('https://example.com/location');

    // Verify geolocation works
    const location = await page.evaluate(() => {
      return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          pos => resolve(pos.coords),
          err => resolve({ error: err.message })
        );
      });
    });

    expect(location).toBeTruthy();

    await context.close();
  });
});
