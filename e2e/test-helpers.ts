import { Page, expect } from '@playwright/test';
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USER } from './global-setup';

export async function loginAndNavigate(page: Page, targetView: string = 'home') {
  await page.addInitScript((view) => {
    localStorage.setItem('reboot_active_view', view);
  }, targetView);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.fill('#login-username', E2E_ADMIN_USER);
  await page.fill('#login-password', E2E_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page.locator('header')).toBeVisible({ timeout: 20000 });
}
