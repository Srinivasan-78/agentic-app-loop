import { test, expect } from '@playwright/test';

test.describe('Performance @example', () => {
  test('measure page load time', async ({ page }) => {
    const navigationTiming = await page.evaluate(() =>
      JSON.stringify(window.performance.timing)
    );

    const navigationStart = Date.now();

    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

    const navigationEnd = Date.now();
    const loadTime = navigationEnd - navigationStart;

    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Should load in less than 10s
  });

  test('measure Time to Interactive (TTI)', async ({ page }) => {
    const startTime = performance.now();

    await page.goto('https://example.com', { waitUntil: 'networkidle' });

    const endTime = performance.now();
    const tti = endTime - startTime;

    console.log(`Time to Interactive: ${tti.toFixed(2)}ms`);
    expect(tti).toBeLessThan(10000);
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

        // Stop observing after 25s
        setTimeout(() => resolve(0), 25000);
      });
    });

    console.log(`Largest Contentful Paint: ${lcp.toFixed(2)}ms`);
    expect(lcp).toBeLessThan(2500); // Google recommends < 2.5s
  });

  test('measure Cumulative Layout Shift (CLS)', async ({ page }) => {
    let cls = 0;

    await page.evaluate(() => {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            (window as any).cls = ((window as any).cls || 0) + (entry as any).value;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    });

    await page.goto('https://example.com');

    cls = await page.evaluate(() => (window as any).cls || 0);

    console.log(`Cumulative Layout Shift: ${cls.toFixed(3)}`);
    expect(cls).toBeLessThan(0.1); // Google recommends < 0.1
  });

  test('measure First Input Delay (FID)', async ({ page }) => {
    const fid = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const firstInputEntry = entries[0];
          resolve(firstInputEntry.processingStart - firstInputEntry.startTime);
        });

        observer.observe({ entryTypes: ['first-input'] });

        // Stop after 30s
        setTimeout(() => resolve(0), 30000);
      });
    });

    console.log(`First Input Delay: ${fid.toFixed(2)}ms`);
    expect(fid).toBeLessThan(100); // Google recommends < 100ms
  });

  test('measure resource timing', async ({ page }) => {
    await page.goto('https://example.com');

    const resources = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .map(r => ({
          name: r.name,
          duration: (r as PerformanceResourceTiming).duration,
          size: (r as any).transferSize,
          type: (r as PerformanceResourceTiming).initiatorType,
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10); // Top 10 slowest resources
    });

    console.table(resources);
    expect(resources.length).toBeGreaterThan(0);
  });

  test('measure API response times', async ({ page }) => {
    const apiTimes: any[] = [];

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const request = response.request();
        const timing = response.timing();

        apiTimes.push({
          url: response.url(),
          status: response.status(),
          duration: timing.responseEnd - timing.requestStart,
        });
      }
    });

    await page.goto('https://example.com');

    if (apiTimes.length > 0) {
      console.table(apiTimes);
      const slowestApi = apiTimes.sort((a, b) => b.duration - a.duration)[0];
      expect(slowestApi.duration).toBeLessThan(5000);
    }
  });

  test('measure JavaScript execution time', async ({ page }) => {
    await page.goto('https://example.com');

    const jsMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('measure');
      const measures = entries
        .filter(e => e.name.includes('React'))
        .map(e => ({
          name: e.name,
          duration: e.duration,
        }));

      return {
        totalMeasures: measures.length,
        measures,
      };
    });

    console.log('JavaScript metrics:', jsMetrics);
    expect(typeof jsMetrics.totalMeasures).toBe('number');
  });

  test('memory usage check', async ({ page }) => {
    await page.goto('https://example.com');

    const memoryMetrics = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (memoryMetrics) {
      const usedMB = (memoryMetrics.usedJSHeapSize / 1048576).toFixed(2);
      console.log(`Memory used: ${usedMB}MB`);
    }
  });

  test('performance comparison - cached vs fresh', async ({ page }) => {
    // First visit (fresh)
    const firstVisitStart = performance.now();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
    const firstVisitTime = performance.now() - firstVisitStart;

    // Reload (cached)
    const secondVisitStart = performance.now();
    await page.reload({ waitUntil: 'domcontentloaded' });
    const secondVisitTime = performance.now() - secondVisitStart;

    console.log(`First visit: ${firstVisitTime.toFixed(2)}ms`);
    console.log(`Cached visit: ${secondVisitTime.toFixed(2)}ms`);
    console.log(`Cache improvement: ${((firstVisitTime - secondVisitTime) / firstVisitTime * 100).toFixed(1)}%`);

    expect(secondVisitTime).toBeLessThan(firstVisitTime);
  });
});
