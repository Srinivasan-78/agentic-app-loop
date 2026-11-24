import { test, expect } from '@playwright/test';

test.describe('Form Submission @example', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.com/login');
  });

  test('login with valid credentials', async ({ page }) => {
    // Fill username
    await page.fill('input[name="username"]', 'testuser@example.com');

    // Fill password
    await page.fill('input[name="password"]', 'SecurePassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation and verify
    await page.waitForURL('**/dashboard');
    expect(page).toHaveURL(/dashboard/);
  });

  test('login validation error', async ({ page }) => {
    // Try without credentials
    await page.click('button[type="submit"]');

    // Check error message
    const error = page.locator('.error-message');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Username is required');
  });

  test('select dropdown options', async ({ page }) => {
    await page.goto('https://example.com/signup');

    // Select by label
    await page.selectOption('select[name="country"]', 'US');

    // Verify selection
    const selected = await page.inputValue('select[name="country"]');
    expect(selected).toBe('US');
  });

  test('checkbox and radio inputs', async ({ page }) => {
    await page.goto('https://example.com/survey');

    // Check a checkbox
    await page.check('input[type="checkbox"][value="agree"]');
    const isChecked = await page.isChecked('input[value="agree"]');
    expect(isChecked).toBeTruthy();

    // Select radio button
    await page.click('input[type="radio"][value="option2"]');
    const isSelected = await page.isChecked('input[value="option2"]');
    expect(isSelected).toBeTruthy();
  });

  test('file upload', async ({ page }) => {
    await page.goto('https://example.com/upload');

    // Upload file
    await page.locator('input[type="file"]').setInputFiles('test-data/sample.pdf');

    // Verify file is set
    const fileInput = page.locator('input[type="file"]');
    const files = await fileInput.inputValue();
    expect(files).toContain('sample.pdf');
  });

  test('multi-step form', async ({ page }) => {
    await page.goto('https://example.com/checkout');

    // Step 1: Shipping
    await page.fill('input[name="address"]', '123 Main St');
    await page.fill('input[name="city"]', 'New York');
    await page.click('button:has-text("Next")');

    // Wait for step 2
    await page.waitForSelector('[data-step="2"]');

    // Step 2: Payment
    await page.fill('input[name="card"]', '4111111111111111');
    await page.fill('input[name="expiry"]', '12/25');
    await page.click('button:has-text("Complete Purchase")');

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('form with dynamic fields', async ({ page }) => {
    await page.goto('https://example.com/dynamic-form');

    // Fill initial field
    await page.fill('input[name="email"]', 'test@example.com');

    // Trigger conditional field
    await page.click('input[value="business"]');

    // Wait for new field to appear
    await page.waitForSelector('input[name="company"]');

    // Fill the new field
    await page.fill('input[name="company"]', 'Acme Corp');

    // Submit
    await page.click('button[type="submit"]');
    await expect(page.locator('.submitted')).toBeVisible();
  });

  test('form submission with network monitoring', async ({ page }) => {
    await page.goto('https://example.com/contact');

    // Listen for POST request
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/contact') && response.status() === 200
    );

    // Fill and submit form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('textarea[name="message"]', 'Test message');
    await page.click('button:has-text("Send")');

    // Verify request was sent
    const response = await responsePromise;
    const data = await response.json();
    expect(data).toHaveProperty('id');
  });
});
