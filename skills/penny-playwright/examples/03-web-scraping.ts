import { test, expect, chromium } from '@playwright/test';

test.describe('Web Scraping @example', () => {
  test('scrape product listings', async ({ page }) => {
    await page.goto('https://example.com/products');

    // Get all product cards
    const products = await page.locator('.product-card').all();
    expect(products.length).toBeGreaterThan(0);

    // Extract data from each product
    const productData = [];
    for (const product of products) {
      const name = await product.locator('.product-name').textContent();
      const price = await product.locator('.product-price').textContent();
      const rating = await product.locator('.rating').getAttribute('data-value');

      productData.push({
        name: name?.trim(),
        price: price?.trim(),
        rating: parseFloat(rating || '0'),
      });
    }

    expect(productData.length).toBeGreaterThan(0);
    expect(productData[0]).toHaveProperty('name');
    expect(productData[0]).toHaveProperty('price');
  });

  test('scrape with pagination', async ({ page }) => {
    await page.goto('https://example.com/listings?page=1');

    const allItems = [];
    let currentPage = 1;
    const maxPages = 3;

    while (currentPage <= maxPages) {
      // Get items on current page
      const items = await page.locator('[data-item]').all();

      for (const item of items) {
        const text = await item.textContent();
        allItems.push(text?.trim());
      }

      // Check for next page button
      const nextButton = page.locator('a:has-text("Next")');
      const isDisabled = await nextButton.isDisabled();

      if (isDisabled) break;

      await nextButton.click();
      await page.waitForURL(`**/page=${currentPage + 1}`);
      currentPage++;
    }

    expect(allItems.length).toBeGreaterThan(0);
  });

  test('scrape table data', async ({ page }) => {
    await page.goto('https://example.com/data-table');

    // Get all rows
    const rows = await page.locator('table tbody tr').all();

    const tableData = [];
    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      tableData.push({
        id: cells[0],
        name: cells[1],
        status: cells[2],
        date: cells[3],
      });
    }

    expect(tableData.length).toBeGreaterThan(0);
    expect(tableData[0]).toHaveProperty('id');
  });

  test('scrape with headers and attributes', async ({ page }) => {
    await page.goto('https://example.com/articles');

    const articles = [];

    const articleElements = await page.locator('.article').all();
    for (const element of articleElements) {
      const title = await element.locator('h2').textContent();
      const author = await element.locator('.author').textContent();
      const date = await element.getAttribute('data-published');
      const link = await element.locator('a').getAttribute('href');

      articles.push({
        title: title?.trim(),
        author: author?.trim(),
        date,
        url: link,
      });
    }

    expect(articles.length).toBeGreaterThan(0);
  });

  test('scrape using multiple tabs/pages', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto('https://example.com/data1');
    await page2.goto('https://example.com/data2');

    const data1 = await page1.locator('.data-point').textContent();
    const data2 = await page2.locator('.data-point').textContent();

    expect(data1).toBeTruthy();
    expect(data2).toBeTruthy();

    await context.close();
  });

  test('scrape with JavaScript rendering', async ({ page }) => {
    await page.goto('https://example.com/dynamic');

    // Wait for JavaScript to render content
    await page.waitForSelector('.rendered-content');

    // Now scrape the rendered content
    const content = await page.locator('.rendered-content').textContent();
    expect(content).toBeTruthy();

    // Get all rendered list items
    const items = await page.locator('.rendered-list li').allTextContents();
    expect(items.length).toBeGreaterThan(0);
  });

  test('scrape and export data', async ({ page }) => {
    await page.goto('https://example.com/export-data');

    // Get all data
    const rows = await page.locator('[data-export-row]').all();
    const exportData = [];

    for (const row of rows) {
      const cells = await row.locator('[data-cell]').allTextContents();
      exportData.push(cells);
    }

    // Log as JSON (in real app, write to file)
    console.log(JSON.stringify(exportData, null, 2));
    expect(exportData.length).toBeGreaterThan(0);
  });

  test('scrape with error handling', async ({ page }) => {
    await page.goto('https://example.com/unreliable');

    try {
      // Wait with timeout
      await page.waitForSelector('.content', { timeout: 5000 });

      const content = await page.locator('.content').textContent();
      expect(content).toBeTruthy();
    } catch (error) {
      console.log('Content did not load:', error.message);
      // Fall back to alternative selector
      const fallback = await page.locator('.fallback-content').textContent();
      expect(fallback).toBeTruthy();
    }
  });
});
