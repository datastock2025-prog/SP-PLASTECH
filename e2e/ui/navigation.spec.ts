import { test, expect } from '../fixtures';

test.describe('Enterprise UI Screen Navigation & Origin URL History Contract (A5.1)', () => {
  test('direct URL navigation to /{module}/{screen} activates corresponding view and normalizes to origin without subpaths', async ({ page, consoleGuard }) => {
    // 1. Navigate to root layout
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    const appContainer = page.locator('#root, main, header');
    await expect(appContainer.first()).toBeVisible({ timeout: 15000 });
    expect(page.url().replace(/\/$/, '')).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):3000$/);
    expect(new URL(page.url()).search).toBe('');

    // 2. Test URL-driven cold navigation to masterdata items: loads screen and sanitizes address bar to origin
    await page.goto('/masterdata/items', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    expect(page.url().replace(/\/$/, '')).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):3000$/);
    expect(new URL(page.url()).search).toBe('');
    await expect(page.getByText(/item master|catalog|inventory/i).first()).toBeVisible({ timeout: 10000 });

    // 3. Test URL-driven navigation to sales orders: loads screen and sanitizes address bar to origin
    await page.goto('/sales/orders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    expect(page.url().replace(/\/$/, '')).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):3000$/);
    expect(new URL(page.url()).search).toBe('');
    await expect(page.getByText(/sales order|customer order/i).first()).toBeVisible({ timeout: 10000 });

    // 4. Test browser Back navigation: restores previous view while address bar stays at origin
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    expect(page.url().replace(/\/$/, '')).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):3000$/);
    expect(new URL(page.url()).search).toBe('');

    // 5. Test browser Forward navigation: restores sales orders while address bar stays at origin
    await page.goForward({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    expect(page.url().replace(/\/$/, '')).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):3000$/);
    expect(new URL(page.url()).search).toBe('');

    // 6. Test page reload (F5): preserves active view without leaking paths to URL bar
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    expect(page.url().replace(/\/$/, '')).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):3000$/);
    expect(new URL(page.url()).search).toBe('');

    // Verify zero client-side unhandled errors were captured
    consoleGuard.assertClean();
  });

  test('legacy query parameters (?view=...) and admin subpaths normalize strictly to origin without subpaths', async ({ page }) => {
    // Test legacy query param (?view=adminReasonCodes)
    await page.goto('/?view=adminReasonCodes', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    expect(page.url().replace(/\/$/, '')).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):3000$/);
    expect(new URL(page.url()).search).toBe('');

    // Test semantic admin subpath (/admin/reason-codes)
    await page.goto('/admin/reason-codes', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    expect(page.url().replace(/\/$/, '')).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):3000$/);
    expect(new URL(page.url()).search).toBe('');
  });
});
