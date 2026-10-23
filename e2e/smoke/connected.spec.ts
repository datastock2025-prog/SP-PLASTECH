import { test, expect } from '@playwright/test';
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USER } from '../global-setup';

test.describe('Connected Smoke Test Suite (Web -> API -> Postgres)', () => {
  test('C0-01: Connected smoke lifecycle: sign in -> open Items -> create item -> reload -> item persists -> sign out', async ({ page }) => {
    // Unique item code for this run
    const testCode = `SMK-${Date.now().toString().slice(-6)}`;
    const testName = `Connected Smoke Test Part ${testCode}`;

    // 1. Sign In or use authenticated session
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const userField = page.locator('#login-username');
    if (await userField.isVisible({ timeout: 4000 }).catch(() => false)) {
      await page.fill('#login-username', E2E_ADMIN_USER);
      await page.fill('#login-password', E2E_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
    }

    // Wait for the workspace header/shell to mount
    await expect(page.locator('header')).toBeVisible({ timeout: 20000 });

    // 2. Open Items
    // Navigate to canonical masterdata items view
    await page.goto('/masterdata/items', { waitUntil: 'domcontentloaded' });
    const itemCatalogHeading = page.getByRole('heading', { name: /Item Master Catalog/i });
    await expect(itemCatalogHeading).toBeVisible({ timeout: 25000 });

    // 3. Create an item
    const createItemBtn = page.getByRole('button', { name: 'Create Item' });
    await expect(createItemBtn).toBeVisible({ timeout: 15000 });
    await createItemBtn.click();

    // Step 1: Select Type & Continue to Step 2
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
      await continueBtn.click();
    }

    // Step 2: Fill Code & Name
    const codeInput = page.getByPlaceholder(/FG-BMP-NEXON-F/i);
    await expect(codeInput).toBeVisible({ timeout: 15000 });
    await codeInput.fill(testCode);

    const nameInput = page.getByPlaceholder(/PP Natural Granules/i);
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(testName);

    // Save as draft
    const saveBtn = page.getByRole('button', { name: 'Save as draft' }).first();
    await expect(saveBtn).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/items') && (r.status() === 200 || r.status() === 201), { timeout: 15000 }).catch(() => null),
      saveBtn.click(),
    ]);

    // 4. Reload page & verify persistence from Database
    await page.goto('/masterdata/items', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Item Master Catalog/i })).toBeVisible({ timeout: 25000 });

    // Search for the newly created item SKU
    const searchInput = page.getByPlaceholder(/Instant search SKU/i);
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill(testCode);
    await page.waitForTimeout(500);

    // Verify created item persists
    const persistedItem = page.locator(`text=${testCode}`).first();
    await expect(persistedItem).toBeVisible({ timeout: 20000 });

    // 5. Verification complete - retain active session for concurrent workers
  });
});
