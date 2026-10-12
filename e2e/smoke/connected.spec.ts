import { test, expect } from '@playwright/test';
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USER } from '../global-setup';

test.describe('Connected Smoke Test Suite (Web -> API -> Postgres)', () => {
  test('C0-01: Connected smoke lifecycle: sign in -> open Items -> create item -> reload -> item persists -> sign out', async ({ page }) => {
    // Unique item code for this run
    const testCode = `SMK-${Date.now().toString().slice(-6)}`;
    const testName = `Connected Smoke Test Part ${testCode}`;

    // 1. Sign In
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-username', { timeout: 15000 });
    await page.fill('#login-username', E2E_ADMIN_USER);
    await page.fill('#login-password', E2E_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for the workspace header/shell to mount
    await expect(page.locator('header')).toBeVisible({ timeout: 20000 });

    // 2. Open Items
    // Navigate to itemList view
    await page.evaluate(() => {
      localStorage.setItem('reboot_active_view', 'itemList');
      window.dispatchEvent(new CustomEvent('reboot_navigate', { detail: { view: 'itemList' } }));
    });
    // Ensure Item Master view is active or click navigation
    const itemCatalogHeading = page.locator('text=Item Master').first();
    if (!await itemCatalogHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Trigger navigation via sidebar / search if needed
      await page.goto('/#itemList');
    }

    // 3. Create an item
    const createItemBtn = page.locator('button:has-text("Create Item")').first();
    await expect(createItemBtn).toBeVisible({ timeout: 10000 });
    await createItemBtn.click();

    // Fill Item details in Wizard
    await page.waitForSelector('input#item-code-input, input[placeholder*="Item Code"], input[name="code"]', { timeout: 10000 })
      .catch(() => null);

    // If modal inputs exist, fill code and name
    const codeInput = page.locator('input#item-code-input, input[placeholder*="Item Code"], input[name="code"]').first();
    if (await codeInput.isVisible()) {
      await codeInput.fill(testCode);
    }

    const nameInput = page.locator('input#item-name-input, input[placeholder*="Item Name"], input[name="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(testName);
    }

    // Save item
    const saveBtn = page.locator('button:has-text("Save Item"), button:has-text("Create SKU"), button:has-text("Submit")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }

    // 4. Reload page & verify persistence from Database
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('header')).toBeVisible({ timeout: 20000 });

    // Verify created item persists
    const persistedItem = page.locator(`text=${testCode}`).first();
    await expect(persistedItem).toBeVisible({ timeout: 15000 });

    // 5. Sign Out
    const userMenuButton = page.locator('header').locator('button').last();
    await userMenuButton.click();

    const signOutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Lock Terminal")').first();
    await expect(signOutBtn).toBeVisible({ timeout: 5000 });
    await signOutBtn.click();

    // Verify back to login
    await expect(page.locator('#login-username')).toBeVisible({ timeout: 10000 });
  });
});
