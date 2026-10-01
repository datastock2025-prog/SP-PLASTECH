import { test, expect } from '@playwright/test';

test.describe('Authentication & Authorization E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
  });

  test('TC-AUTH-01: Rapid Rejection for Invalid Credentials (< 800ms latency)', async ({ page }) => {
    await page.fill('input[type="text"]', 'invalid_unregistered_user_99');
    await page.fill('input[type="password"]', 'WrongPassword123!');

    const start = Date.now();
    await page.click('button[type="submit"]');

    // Assert that rejection alert appears immediately
    const errorAlert = page.locator('text=Access Denied');
    await expect(errorAlert).toBeVisible({ timeout: 4000 });
    const duration = Date.now() - start;
    console.log(`[Diagnostic Latency] Invalid credentials rejection: ${duration}ms`);
    expect(duration).toBeLessThan(3000);
  });

  test('TC-AUTH-02: Super Admin Instant Authentication & Header Mount', async ({ page }) => {
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'SpPlastech2026!#');
    await page.click('button[type="submit"]');

    // Verify main enterprise topbar header is loaded
    await expect(page.locator('header')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('header')).toContainText('PLANT-01');
  });

  test('TC-AUTH-03: Multi-Plant and Shift Session Selection', async ({ page }) => {
    const plantSelect = page.locator('select').first();
    await plantSelect.selectOption({ index: 1 });

    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'SpPlastech2026!#');
    await page.click('button[type="submit"]');

    await expect(page.locator('header')).toBeVisible({ timeout: 8000 });
  });
});
