# Playwright Examples

Seven production-ready examples demonstrating common Playwright patterns. Copy and
customize for your project.

## Running Examples

### Run all examples

```bash
npx playwright test --grep @example
```

### Run specific example

```bash
npx playwright test examples/01-basic-navigation.ts
npx playwright test --grep "navigate to page and verify title"
```

### View results

```bash
npx playwright test
npx playwright show-report
```

### Debug a test

```bash
npx playwright test --debug examples/01-basic-navigation.ts
```

## Examples Overview

### 1. Basic Navigation (`01-basic-navigation.ts`)

Learn the fundamentals: navigate, click, type, wait, assert.

**Covers:**
- `page.goto()` — navigate to URL
- `page.click()` — click elements
- `page.fill()` — type in inputs
- `page.waitForSelector()` — wait for elements
- `expect(page).toHaveTitle()` — assertions
- `page.isVisible()`, `page.isEnabled()` — element state checks

**When to use:**
- Smoke tests
- Basic user flows
- Navigation verification

**Example test:**
```typescript
test('click and navigate', async ({ page }) => {
  await page.goto('https://example.com');
  await page.click('text=More information');
  expect(page).toHaveURL(/details/);
});
```

---

### 2. Form Submission (`02-form-submission.ts`)

Fill forms, validate, handle errors, test multi-step flows.

**Covers:**
- `page.fill()` — text input
- `page.selectOption()` — dropdowns
- `page.check()` — checkboxes
- `page.click()` for radio buttons
- `page.locator('input[type="file"]').setInputFiles()` — file upload
- Error message validation
- Multi-step form handling
- Form submission with network monitoring

**When to use:**
- Login/signup flows
- Checkout processes
- Survey forms
- Dynamic forms with conditional fields

**Example test:**
```typescript
test('login with valid credentials', async ({ page }) => {
  await page.fill('input[name="username"]', 'testuser@example.com');
  await page.fill('input[name="password"]', 'SecurePassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  expect(page).toHaveURL(/dashboard/);
});
```

---

### 3. Web Scraping (`03-web-scraping.ts`)

Extract data from pages: products, listings, tables, articles.

**Covers:**
- `page.locator('.class').all()` — get multiple elements
- `element.textContent()` — extract text
- `element.getAttribute()` — get attributes
- Pagination handling
- Table data extraction
- JSON rendering
- Multiple pages/contexts
- Error handling with fallbacks

**When to use:**
- Price monitoring
- Data extraction
- Content validation
- Multi-page scraping

**Example test:**
```typescript
test('scrape product listings', async ({ page }) => {
  await page.goto('https://example.com/products');
  const products = await page.locator('.product-card').all();

  for (const product of products) {
    const name = await product.locator('.product-name').textContent();
    const price = await product.locator('.product-price').textContent();
    console.log(name, price);
  }
});
```

---

### 4. API Interception (`04-api-intercept.ts`)

Mock APIs, intercept requests, verify payloads, simulate network conditions.

**Covers:**
- `page.on('request')` — listen to requests
- `page.route()` — intercept and mock
- `route.abort()` — block requests
- `route.fulfill()` — provide custom response
- POST request verification
- GraphQL request handling
- Response headers
- Failed request tracking

**When to use:**
- Offline testing
- API error scenarios
- Testing without backend
- Request/response verification
- Performance testing

**Example test:**
```typescript
test('provide custom API response', async ({ page }) => {
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ]),
    });
  });

  await page.goto('https://example.com/users');
  const userElements = await page.locator('.user-item').all();
  expect(userElements.length).toBe(2);
});
```

---

### 5. Mobile Testing (`05-mobile-testing.ts`)

Test responsive design, touch interactions, mobile viewports.

**Covers:**
- `page.setViewportSize()` — custom viewport
- `browser.newContext({ ...devices['iPhone 12'] })` — predefined devices
- Touch events and gestures
- Swipe simulation
- Mobile menu testing
- Form submission on mobile
- Geolocation
- Mobile user agents

**When to use:**
- Responsive design testing
- Mobile-specific features
- Touch interaction testing
- Cross-device compatibility

**Example test:**
```typescript
test('mobile viewport test', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://example.com');

  // Verify mobile layout
  const navbar = page.locator('.navbar-mobile');
  await expect(navbar).toBeVisible();
});
```

---

### 6. Visual Regression (`06-visual-regression.ts`)

Screenshot comparisons, detect visual regressions, compare across states.

**Covers:**
- `expect(page).toHaveScreenshot()` — full page
- `expect(element).toHaveScreenshot()` — component
- Screenshots across viewports
- Masking dynamic content
- Dark mode comparison
- State screenshots (hover, focus, active)
- Animation screenshots

**When to use:**
- Design regression detection
- Cross-browser visual testing
- UI state validation
- Animation verification

**Example test:**
```typescript
test('full page screenshot', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveScreenshot('homepage.png');
});

test('element state screenshots', async ({ page }) => {
  await page.goto('https://example.com/interactive');
  const button = page.locator('button.interactive');

  // Normal state
  await expect(button).toHaveScreenshot('button-normal.png');

  // Hover state
  await button.hover();
  await expect(button).toHaveScreenshot('button-hover.png');
});
```

**Update snapshots when design changes:**
```bash
npx playwright test --update-snapshots
```

---

### 7. Performance (`07-performance.ts`)

Measure load times, Core Web Vitals, resource timing, API response times.

**Covers:**
- Page load time
- Time to Interactive (TTI)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)
- Resource timing
- API response times
- Memory usage
- Cached vs fresh load comparison

**When to use:**
- Performance budgets
- Core Web Vitals monitoring
- Load time verification
- API performance testing
- Memory leak detection

**Example test:**
```typescript
test('measure page load time', async ({ page }) => {
  const navigationStart = Date.now();
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  const navigationEnd = Date.now();
  const loadTime = navigationEnd - navigationStart;

  console.log(`Page load time: ${loadTime}ms`);
  expect(loadTime).toBeLessThan(10000);
});

test('measure Largest Contentful Paint (LCP)', async ({ page }) => {
  const lcp = await page.evaluate(() => {
    return new Promise<number>(resolve => {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      setTimeout(() => resolve(0), 25000);
    });
  });

  console.log(`LCP: ${lcp.toFixed(2)}ms`);
  expect(lcp).toBeLessThan(2500); // Google's recommended threshold
});
```

---

## Customization Guide

### Adapting examples for your app

**1. Change the URL**
```typescript
// From
await page.goto('https://example.com');

// To your app
await page.goto('http://localhost:3000');
```

**2. Use your selectors**
```typescript
// Find elements in your app
await page.click('[data-testid="login-button"]');
await page.fill('[data-testid="email"]', 'test@example.com');
```

**3. Use test data fixtures**
```typescript
// Create fixtures/testData.ts
export const testUser = {
  email: 'test@example.com',
  password: 'SecurePassword123!',
};

// Use in tests
await page.fill('input[name="email"]', testUser.email);
```

**4. Reuse setup**
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');
});

test('valid login', async ({ page }) => {
  // page already at login page
  await page.fill('input[name="email"]', 'test@example.com');
});
```

---

## Best Practices

### ✅ DO

- Use `[data-testid]` attributes for stable selectors
- Wait for elements explicitly: `waitForSelector`, `waitForURL`
- Test user behavior, not implementation details
- Keep tests focused: one scenario per test
- Use fixtures for reusable setup
- Clear test names describing what is verified

### ❌ DON'T

- Use `setTimeout` for waiting (use `waitForSelector` instead)
- Rely on CSS classes that change frequently
- Test multiple scenarios in one test
- Hard-code test data in test files
- Click before element is ready
- Ignore error messages

---

## Claude Code Integration

Ask Claude Code to generate tests using these examples as reference:

```
Write a Playwright test for:
- Navigate to /checkout
- Fill customer info
- Submit form
- Verify order confirmation

Use patterns from penny-playwright examples/02-form-submission.ts
Reference selectors: [data-testid="email"], [data-testid="submit"]
```

The agent will generate test code following the established patterns.

---

## Troubleshooting

### Test times out
```typescript
test.setTimeout(60000); // 60 seconds

await page.waitForSelector('.content', { timeout: 30000 });
```

### Element not found
Debug with:
```bash
npx playwright test --debug
# Or record
npx playwright codegen http://localhost:3000
```

### Flaky tests
Use explicit waits:
```typescript
await page.click('button');
await page.waitForURL(/success/);  // Don't just wait time
```

---

## Running in CI/CD

```bash
# In GitHub Actions
npm install -D @playwright/test
npx playwright install
npx playwright test --reporter=github
```

```yaml
# .github/workflows/test.yml
- run: npx playwright test
  env:
    CI: true
```

---

## Resources

- **Playwright Docs**: https://playwright.dev
- **Selector Playground**: `npx playwright codegen`
- **Test Report**: `npx playwright show-report`
- **Debugging**: `npx playwright test --debug`

---

**Next step**: Copy an example to your project and customize for your app.
