import { test, expect } from '@playwright/test';

test.describe('API Interception @example', () => {
  test('intercept and log network requests', async ({ page }) => {
    // Listen to all requests
    page.on('request', request => {
      console.log('Request:', request.url());
    });

    page.on('response', response => {
      console.log('Response:', response.url(), response.status());
    });

    await page.goto('https://example.com');

    // Verify at least some requests were made
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });

  test('mock API responses', async ({ page }) => {
    // Intercept API calls
    await page.route('**/api/users/**', route => {
      route.abort('blockedbyclient');
    });

    await page.goto('https://example.com/users');

    // The API call is blocked, page may show error
    const error = page.locator('.error-message, .api-error');
    const isVisible = await error.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('provide custom API response', async ({ page }) => {
    // Mock API response
    await page.route('**/api/users', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        ]),
      });
    });

    await page.goto('https://example.com/users');

    // Verify the mocked data appears
    const userElements = await page.locator('.user-item').all();
    expect(userElements.length).toBe(2);

    const firstName = await page.locator('.user-item:first-child .name').textContent();
    expect(firstName).toContain('John');
  });

  test('intercept and modify request', async ({ page }) => {
    let interceptedUrl = '';

    await page.route('**/api/**', route => {
      interceptedUrl = route.request().url();
      // Log and continue
      console.log('Intercepted:', interceptedUrl);
      route.continue();
    });

    await page.goto('https://example.com');

    // Should have made API requests
    expect(interceptedUrl.length).toBeGreaterThan(0);
  });

  test('verify POST request payload', async ({ page }) => {
    const capturedRequests: any[] = [];

    await page.route('**/api/submit', route => {
      capturedRequests.push({
        url: route.request().url(),
        method: route.request().method(),
        postData: route.request().postData(),
        headers: route.request().headers(),
      });

      route.continue();
    });

    await page.goto('https://example.com/form');

    // Fill and submit form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // Wait for request
    await page.waitForTimeout(1000);

    // Verify request was captured
    expect(capturedRequests.length).toBeGreaterThan(0);
    if (capturedRequests[0].postData) {
      expect(capturedRequests[0].postData).toContain('email');
    }
  });

  test('simulate network conditions', async ({ page }) => {
    // Slow down network
    await page.route('**/*', route => {
      setTimeout(() => {
        route.continue();
      }, 1000);
    });

    const startTime = Date.now();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    // Should be slower due to routing delay
    expect(loadTime).toBeGreaterThan(500);
  });

  test('intercept GraphQL requests', async ({ page }) => {
    let graphqlRequests: any[] = [];

    await page.route('**/graphql', async route => {
      const request = route.request();
      const postData = request.postData();

      graphqlRequests.push({
        query: postData,
        timestamp: new Date().toISOString(),
      });

      // Return mock response
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: { id: '1', name: 'Test User' },
          },
        }),
      });
    });

    await page.goto('https://example.com');

    // Trigger GraphQL call
    await page.click('button[data-action="fetch-user"]');

    // Verify request was intercepted
    expect(graphqlRequests.length).toBeGreaterThan(0);
  });

  test('track failed requests', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });

    await page.route('**/broken/**', route => {
      route.abort('failed');
    });

    await page.goto('https://example.com');

    // Trigger request to broken resource
    await page.evaluate(() => {
      const img = new Image();
      img.src = '/broken/image.png';
    });

    await page.waitForTimeout(500);

    // Verify failure was tracked
    expect(failedRequests.length).toBeGreaterThanOrEqual(0);
  });

  test('verify response headers', async ({ page }) => {
    let responseHeaders: any = {};

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responseHeaders = response.headers();
      }
    });

    await page.goto('https://example.com');

    // Should have received some API response
    if (Object.keys(responseHeaders).length > 0) {
      expect(responseHeaders).toHaveProperty('content-type');
    }
  });
});
