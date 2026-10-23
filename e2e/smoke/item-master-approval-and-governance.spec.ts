import { test, expect } from '@playwright/test';
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USER } from '../global-setup';

test.describe('Item Master Enterprise Approval, Governance & Live Audit Ledger', () => {
  test('Item approval workflow, field locking, purchasing wizard, and WIP routing', async ({ page }) => {
    // 1. Sign In
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const userField = page.locator('#login-username');
    if (await userField.isVisible({ timeout: 4000 }).catch(() => false)) {
      await page.fill('#login-username', E2E_ADMIN_USER);
      await page.fill('#login-password', E2E_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
    }

    await expect(page.locator('header')).toBeVisible({ timeout: 20000 });

    // 2. Navigate to Item Master
    await page.goto('/masterdata/items', { waitUntil: 'domcontentloaded' });
    const itemCatalogHeading = page.getByRole('heading', { name: /Item Master Catalog/i });
    await expect(itemCatalogHeading).toBeVisible({ timeout: 25000 });

    // Dismiss Cookie Banner if visible
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 4000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(500);
    }

    // 3. Await Grid Rows loaded from PostgreSQL via TanStack Query
    const firstRow = page.locator('tr.item-master-grid-row').first();
    await expect(firstRow).toBeVisible({ timeout: 20000 });

    // 4. Open first item detail
    const firstRowCode = page.locator('tr.item-master-grid-row td:nth-child(2)').first();
    await expect(firstRowCode).toBeVisible({ timeout: 10000 });
    await firstRowCode.click();

    await expect(page.getByText('Back to Item Master')).toBeVisible({ timeout: 15000 });

    // 5. Test Tab 9: Approval Tab
    const approvalTab = page.locator('.tab', { hasText: 'Approval' });
    await expect(approvalTab).toBeVisible({ timeout: 5000 });
    await approvalTab.click();
    await expect(page.getByText('Enterprise Governance & Lifecycle Approval')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Stage 1: SKU Definition & Mold Tooling Specs')).toBeVisible({ timeout: 5000 });

    // 6. Test Tab 10: Live PostgreSQL Audit History Tab
    const auditTab = page.locator('.tab', { hasText: 'Audit history' });
    await expect(auditTab).toBeVisible({ timeout: 5000 });
    await auditTab.click();
    await expect(page.getByText('Live Immutable Change Audit Logs (PostgreSQL)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Open Full Audit Vault' })).toBeVisible({ timeout: 5000 });

    // 7. Open Full Audit Vault Modal
    await page.getByRole('button', { name: 'Open Full Audit Vault' }).click();
    await expect(page.getByText('Item Master & Catalog Change Ledger')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('IMMUTABLE AUDIT TRAIL')).toBeVisible({ timeout: 5000 });
    // Close modal
    await page.getByRole('button', { name: 'Close Audit Vault' }).first().click();
    await page.waitForTimeout(400);

    // 8. Test Tab 3: Purchasing Tab & Dedicated Purchasing Specs Wizard
    const purchasingTab = page.locator('.tab', { hasText: 'Purchasing' });
    await expect(purchasingTab).toBeVisible({ timeout: 5000 });
    await purchasingTab.click();
    await expect(page.getByRole('button', { name: /Edit Purchasing Specs/i })).toBeVisible({ timeout: 5000 });

    // Open Dedicated Purchasing Specs Modal
    await page.getByRole('button', { name: /Edit Purchasing Specs/i }).click();
    await expect(page.getByText('Edit Purchasing & Supplier Specs')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('#purchasing-supplier-input')).toBeVisible({ timeout: 5000 });
    // Cancel modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(400);

    // 9. Test Quick Modify Modal
    const quickModifyBtn = page.getByRole('button', { name: /Quick Modify/i });
    await expect(quickModifyBtn).toBeVisible({ timeout: 5000 });
    await quickModifyBtn.click();
    await expect(page.getByText('Open in 10-Step Wizard')).toBeVisible({ timeout: 6000 });
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(400);

    // 10. Back to Item Master
    await page.getByText('Back to Item Master').click();
    await expect(itemCatalogHeading).toBeVisible({ timeout: 15000 });
  });

  test('Create Item Wizard Step 10: Submit for Approval succeeds without "Record not found" error', async ({ page }) => {
    // 1. Sign In
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const userField = page.locator('#login-username');
    if (await userField.isVisible({ timeout: 4000 }).catch(() => false)) {
      await page.fill('#login-username', E2E_ADMIN_USER);
      await page.fill('#login-password', E2E_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
    }

    await page.goto('/masterdata/items', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Item Master Catalog/i })).toBeVisible({ timeout: 25000 });

    // Dismiss Cookie Banner if visible
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 4000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(500);
    }

    // 2. Open Create Item Wizard
    const createBtn = page.getByRole('button', { name: /Create Item/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // 3. Step 1: Click Continue
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: /Basic information/i })).toBeVisible({ timeout: 10000 });

    // 4. Step 2: Fill Code and Name
    const uniqueSku = `BOOT-${Date.now().toString().slice(-4)}`;
    const codeInput = page.locator('input[placeholder*="FG-BMP-NEXON-F"], input[placeholder*="search catalog"]').first();
    await codeInput.fill(uniqueSku);

    const nameInput = page.locator('input[placeholder*="PP Natural Granules"]').first();
    await nameInput.fill(`Boot RH Moulded ${uniqueSku}`);

    // 5. Jump directly to Step 10: Review & submit
    const reviewStepBtn = page.getByRole('button', { name: /Review & submit/i });
    await expect(reviewStepBtn).toBeVisible({ timeout: 5000 });
    await reviewStepBtn.click();

    // 6. Verify Step 10 Review & Approval Workflow is visible
    await expect(page.getByText('Review & Approval Workflow')).toBeVisible({ timeout: 10000 });

    // 7. Click "Submit for Approval"
    const submitBtn = page.getByRole('button', { name: /Submit for Approval/i });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();

    // 8. Assert NO "Record not found" error toast appears
    await expect(page.getByText(/Record not found/i)).not.toBeVisible();

    // 9. Assert success toast appears and modal closes
    await expect(page.getByText(new RegExp(`submitted for|saved|SKU ${uniqueSku}`, 'i'))).toBeVisible({ timeout: 15000 });
  });
});
