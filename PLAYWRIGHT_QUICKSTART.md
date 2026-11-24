# Playwright with Pennywright — Quick Start

Get started with Playwright testing in 5 minutes.

## Installation

### 1. Install the plugin

```bash
/plugin marketplace add Srinivasan-78/pennywright
/plugin install pennywright
```

### 2. Run setup

```bash
/penny-setup     # Configures all skills including Playwright
/penny-doctor    # Verifies installation
```

### 3. Create a Playwright project

```bash
mkdir my-tests && cd my-tests
npm init -y
npm install -D @playwright/test
npx playwright install
```

## Your First Test

### Create `tests/example.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('https://example.com');
  expect(page).toHaveTitle(/example/i);
});
```

### Run it:

```bash
npx playwright test
```

### View results:

```bash
npx playwright show-report
```

## Use Claude Code to Generate Tests

Ask the agent to write tests:

```
Write a Playwright test for:
- Navigate to /checkout
- Fill in customer info
- Submit form
- Verify success message

Use patterns from penny-playwright examples
```

The agent will generate production-ready test code.

## Available Examples

Copy any to your project:

```bash
cp skills/penny-playwright/examples/01-basic-navigation.ts tests/
cp skills/penny-playwright/examples/02-form-submission.ts tests/
cp skills/penny-playwright/examples/03-web-scraping.ts tests/
# ... and 4 more
```

**All 7 examples:**

| File | Purpose |
|------|---------|
| `01-basic-navigation.ts` | Click, navigate, assert basics |
| `02-form-submission.ts` | Login, validation, multi-step forms |
| `03-web-scraping.ts` | Extract data, pagination, tables |
| `04-api-intercept.ts` | Mock APIs, intercept requests |
| `05-mobile-testing.ts` | Responsive, touch, gestures |
| `06-visual-regression.ts` | Screenshots, visual comparisons |
| `07-performance.ts` | Load times, Core Web Vitals |

## Common Commands

```bash
# Run tests with grep
npx playwright test --grep "button click"

# Run specific file
npx playwright test tests/01-basic-navigation.ts

# Run with debugging
npx playwright test --debug

# Update snapshots (after design changes)
npx playwright test --update-snapshots

# Run headful (see the browser)
PLAYWRIGHT_HEADLESS=false npx playwright test

# Record a new test
npx playwright codegen http://example.com

# List all tests
npx playwright test --list
```

## Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

## Next Steps

1. **Copy examples** — `cp skills/penny-playwright/examples/*.ts tests/`
2. **Customize selectors** — Use your app's element IDs/classes
3. **Ask Claude Code** — "Fix this flaky test" or "Add assertions"
4. **Run in CI** — Copy to GitHub Actions or your CI system

## Full Guides

- **Plugin Setup**: `skills/penny-playwright/PLUGIN_SETUP.md`
- **Examples Detailed**: `skills/penny-playwright/examples/README.md`
- **Skill Help**: `/penny-playwright help`

## Resources

- **Playwright Docs**: https://playwright.dev
- **Pennywright**: https://github.com/Srinivasan-78/pennywright
- **Report Issues**: https://github.com/Srinivasan-78/pennywright/issues

---

**Ready?** Create your first test file and ask Claude Code to help you build it out.
