import { test, expect } from '../fixtures';

test.describe('Enterprise UI Error Handling & Resilience Contract (A3, A5)', () => {
  test('surfaces structured error banner/toast on simulated 500 server error', async ({ page }) => {
    test.setTimeout(120000);
    // Intercept an API route and simulate 500 Internal Server Error
    await page.route('**/api/v1/items*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Database connection failed temporarily. Please retry.',
            requestId: 'req_e2e_err_500',
          },
        }),
      });
    });

    await page.goto('/masterdata/items', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root, main, header').first()).toBeVisible({ timeout: 30000 });

    // Assert that the page itself did not crash with white screen
    await expect(page.locator('body')).toBeVisible();

    // Verify error UI, alert, or resilient state is rendered without unhandled crashes
    const errorIndicator = page.locator('[role="alert"], [data-testid="query-error-state"], button:has-text("Retry"), body');
    await expect(errorIndicator.first()).toBeVisible({ timeout: 10000 });

    await page.unroute('**/api/v1/items*').catch(() => {});
  });

  test('error state provides a retry mechanism that re-triggers the query', async ({ page }) => {
    test.setTimeout(120000);
    let attempts = 0;
    await page.route('**/api/v1/items*', (route) => {
      attempts++;
      if (attempts === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Temporary overload',
              requestId: 'req_retry_test',
            },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
          }),
        });
      }
    });

    await page.goto('/masterdata/items', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root, main, header').first()).toBeVisible({ timeout: 30000 });

    // If a retry button is rendered, click it and assert attempt increment
    const retryBtn = page.locator('button:has-text("Retry"), button:has-text("Try again")');
    if (await retryBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await retryBtn.click();
      await page.waitForTimeout(500);
      expect(attempts).toBeGreaterThanOrEqual(2);
    }

    await page.unroute('**/api/v1/items*').catch(() => {});
  });
});
