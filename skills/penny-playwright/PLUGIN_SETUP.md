# Playwright Plugin Setup Guide

This guide explains how to install and use the Playwright plugin with Pennywright.

## Installation

### Via Pennywright Plugin (Recommended)

```bash
# Install Pennywright plugin
/plugin marketplace add Srinivasan-78/pennywright
/plugin install pennywright

# This includes the Playwright skill automatically
```

Then run setup:

```bash
/penny-setup     # Configures all skills including Playwright
/penny-doctor    # Verifies installation
```

### Manual Installation

If installing manually, copy the skill to your skills directory:

```bash
# Claude Code
cp -r skills/penny-playwright ~/.claude/skills/

# Or project-specific
cp -r skills/penny-playwright .claude/skills/
```

Export the plugin root:

```bash
export AGENT_KIT="/path/to/pennywright"
```

## Quick Start

### 1. Create a Playwright project

```bash
mkdir my-tests && cd my-tests
npm init -y
npm install -D @playwright/test
npx playwright install
```

### 2. Create your first test

Create `tests/example.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('https://example.com');
  expect(page).toHaveTitle(/example/i);
});
```

### 3. Ask Claude Code to help

Use the Playwright skill by asking:

```
Write a Playwright test for:
- Navigate to /checkout
- Fill in customer info
- Submit form
- Verify success message
```

The agent will generate test code using the patterns from `examples/`.

## Plugin Features

### Available Commands

```
/penny-playwright help        # Show this guide
/penny-setup                  # Install and configure
/penny-doctor                 # Verify installation
```

### Playwright Skills

The plugin includes these integrated skills:

- **penny-playwright** — Setup, verification, and testing patterns
- **miser-tools** — Optimize tool schemas and reduce context
- **miser-read** — Efficient test file reading strategies

### Examples Included

Seven production-ready example files demonstrating:

1. **01-basic-navigation.ts** — Click, type, navigate, assert
2. **02-form-submission.ts** — Login, validation, multi-step forms
3. **03-web-scraping.ts** — Extract data, pagination, tables
4. **04-api-intercept.ts** — Mock APIs, intercept requests
5. **05-mobile-testing.ts** — Responsive, touch, gestures
6. **06-visual-regression.ts** — Screenshots, comparisons
7. **07-performance.ts** — Metrics, timing, memory

Copy any example to your test directory:

```bash
cp skills/penny-playwright/examples/01-basic-navigation.ts tests/
npx playwright test tests/01-basic-navigation.ts
```

## Configuration

### settings.json

Add to your `.claude/settings.json`:

```json
{
  "allowedCommands": [
    "npx playwright",
    "npm run test"
  ],
  "env": {
    "PLAYWRIGHT_HEADLESS": "true",
    "BROWSER_TIMEOUT": "30000",
    "PLAYWRIGHT_DEBUG": "false"
  }
}
```

### playwright.config.ts

Basic config for Claude Code usage:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

## Usage Patterns

### Pattern 1: Test Generation

Ask Claude Code to generate tests for a feature:

```
Write a Playwright test suite for the payment form:
- Address fields
- Payment method selection
- Error handling
Use the patterns from penny-playwright examples.
```

The agent will generate tests following the established patterns.

### Pattern 2: Test Repair

If a test is flaky:

```
This test flakes on the button click step.
Make it reliable by:
- Waiting for the button to be enabled
- Using waitForNavigation if needed
- Adding better selectors
```

### Pattern 3: Performance Testing

```
Add performance assertions to this test:
- Page load < 2 seconds
- API response < 500ms
- No layout shifts
```

### Pattern 4: Cross-browser Testing

```
Modify this test to run on:
- Chrome (Linux)
- Firefox
- WebKit
```

## Common Commands

```bash
# List all tests
npx playwright test --list

# Run tests with grep
npx playwright test --grep "button click"

# Run specific file
npx playwright test tests/01-basic-navigation.ts

# Run with debugging
npx playwright test --debug

# Update snapshots
npx playwright test --update-snapshots

# Run headful (see the browser)
PLAYWRIGHT_HEADLESS=false npx playwright test

# View HTML report
npx playwright show-report

# Record a new test
npx playwright codegen http://example.com
```

## Project Structure

Recommended layout:

```
my-project/
├── tests/
│   ├── 01-basic-navigation.ts
│   ├── 02-form-submission.ts
│   └── fixtures/
│       └── auth.ts
├── playwright.config.ts
├── package.json
└── .env
```

## Working with Claude Code

### Best Practices

1. **Use skill patterns** — Ask to follow the examples in `penny-playwright/examples/`
2. **Clear test names** — Describe what the test verifies
3. **Small tests** — One scenario per test; use fixtures for setup
4. **Wait explicitly** — Use `waitForSelector`, `waitForURL`, not `setTimeout`
5. **Use data attributes** — Prefer `[data-testid]` over brittle selectors

### Example Request

```
Write a Playwright test for checkout flow:

Test name: "completes purchase with valid details"

Steps:
1. Navigate to /checkout
2. Fill in shipping address (use fixtures/testData.ts)
3. Select UPS shipping method
4. Enter card 4111111111111111, exp 12/25, cvv 123
5. Click "Complete Order"
6. Assert redirect to /order-confirmation
7. Verify order number displays

Use the patterns from penny-playwright examples.
Use page.fill(), page.selectOption(), expect(page).toHaveURL()
```

The agent will generate production-ready test code.

## Troubleshooting

### Playwright not found

```bash
npm install -D @playwright/test
npx playwright install
```

### Timeout errors

Increase timeout in test:

```typescript
test.setTimeout(60000); // 60 seconds

test('slow operation', async ({ page }) => {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
});
```

### Flaky tests

Use explicit waits:

```typescript
// Bad
await page.click('button');

// Good
await page.click('button');
await page.waitForURL(/success/);
```

### Element not found

Debug with:

```bash
npx playwright test --debug
# Or inspect selector in codegen
npx playwright codegen http://localhost:3000
```

## Next Steps

1. Run `/penny-playwright help` for more options
2. Copy examples to your test directory
3. Customize `playwright.config.ts` for your app
4. Use Claude Code to generate tests for your features
5. Check `/miser-audit` if tests get slow

## Support

- **Playwright docs**: https://playwright.dev
- **Pennywright repo**: https://github.com/Srinivasan-78/pennywright
- **Report issues**: https://github.com/Srinivasan-78/pennywright/issues

---

**Next command**: `/penny-setup` to configure everything at once.
