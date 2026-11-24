---
name: penny-playwright
description: >-
  Set up and use Playwright for web automation, testing, and scraping. Includes
  installation, configuration, and practical examples. Use for "set up playwright",
  "playwright examples", "web automation", "browser testing", "playwright help",
  "install playwright".
---

# penny-playwright

Browser automation, end-to-end testing, and web scraping with Playwright. This skill
handles setup, verification, and provides working examples for common use cases.

| Request | Section |
|---------|---------|
| "set up playwright", "install playwright" | §1 Setup |
| "playwright examples", "show me how to use it" | §2 Examples |
| "verify playwright", "playwright doctor" | §3 Verify |

---

## 1. Setup

### Install via npm

```bash
npm install -D @playwright/test
npm install @playwright/test  # or globally
```

### Install browsers

```bash
npx playwright install
# or specific browsers:
npx playwright install chromium firefox webkit
```

### Verify installation

```bash
npx playwright --version
npx playwright test --version
```

### In Claude Code settings

Add Playwright to your project's `.claude/settings.json`:

```json
{
  "env": {
    "PLAYWRIGHT_HEADLESS": "true",
    "BROWSER_TIMEOUT": "30000"
  },
  "allowedCommands": [
    "npx playwright",
    "npm run test:playwright"
  ]
}
```

### Create a config file

Create `playwright.config.ts` in your project root:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 2. Examples

See `examples/` directory for working code:

- **01-basic-navigation.ts** — navigate, click, type, assert
- **02-form-submission.ts** — login, form filling, validation
- **03-api-intercept.ts** — intercept network requests
- **04-web-scraping.ts** — extract data from pages
- **05-mobile-testing.ts** — test on mobile viewports
- **06-visual-regression.ts** — screenshot comparisons
- **07-performance.ts** — measure page load metrics

Run examples:

```bash
npx playwright test --grep @example
npx playwright test examples/01-basic-navigation.ts
```

View test results:

```bash
npx playwright show-report
```

---

## 3. Verify

Check installation and browser compatibility:

```bash
npx playwright test --version
npx playwright test --list  # lists all tests
npx playwright codegen http://example.com  # record user interactions
```

Run a quick smoke test:

```bash
npx playwright test --grep @smoke
```

---

## Common tasks

### Record a test

```bash
npx playwright codegen http://example.com
```

Playwright opens a browser and records your interactions, generating test code.

### Debug a test

```bash
npx playwright test --debug
```

Opens the inspector to step through tests line by line.

### Run headful (see the browser)

```bash
PLAYWRIGHT_HEADLESS=false npx playwright test
```

### Run specific test

```bash
npx playwright test 01-basic
npx playwright test --grep "button click"
```

### Update snapshots

```bash
npx playwright test --update-snapshots
```

### Generate test report

```bash
npx playwright test
npx playwright show-report
```

---

## Quick start for Claude Code

When working with Claude Code, ask the agent to:

1. **Write a test** — "write a Playwright test for the login flow"
2. **Fix flakiness** — "this test flakes on the button click step"
3. **Add assertions** — "verify the page shows success message"
4. **Create fixtures** — "reusable test data and setup"

Example prompt:

```
Write a Playwright test for:
- Navigate to /checkout
- Fill the form with valid payment details
- Submit the form
- Assert redirect to order confirmation page

Use page.fill(), page.click(), expect(page).toHaveURL()
```

The agent will generate test code that integrates with your project.
