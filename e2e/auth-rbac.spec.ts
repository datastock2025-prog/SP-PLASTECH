import { test, expect } from '@playwright/test';
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USER } from './global-setup';

test.describe('Authentication & Authorization E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-username', { timeout: 10000 });
  });

  test('TC-AUTH-01: Invalid credentials are rejected', async ({ page }) => {
    await expect(page.locator('select')).toHaveCount(0);
    await page.fill('#login-username', 'invalid_unregistered_user_99');
    await page.fill('#login-password', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('header')).toHaveCount(0);
  });

  test('TC-AUTH-02: Admin login mounts the main header without a plant/shift picker', async ({ page }) => {
    await expect(page.locator('select')).toHaveCount(0);
    await page.fill('#login-username', E2E_ADMIN_USER);
    await page.fill('#login-password', E2E_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.locator('header')).toBeVisible({ timeout: 20000 });
  });
});
