import { test, expect } from '@playwright/test';
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USER } from '../global-setup';

test.describe('Item Master Comprehensive Verification (Tasks 1-5)', () => {
  test('Item Master KPIs, Filter Pills, Detail View with 10 Tabs, and Clean Wizard', async ({ page }) => {
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

    // 3. Verify KPI cards
    const totalItemsCard = page.locator('[data-testid="item-kpi-total-items"]');
    const fgCard = page.locator('[data-testid="item-kpi-finished-goods"]');
    const activeCard = page.locator('[data-testid="item-kpi-active-catalog"]');

    await expect(totalItemsCard).toBeVisible({ timeout: 10000 });
    await expect(fgCard).toBeVisible({ timeout: 10000 });
    await expect(activeCard).toBeVisible({ timeout: 10000 });

    // Dismiss Cookie Banner if visible
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 4000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(500);
    }

    // 4. Test Filter Pills
    const fgPill = page.getByRole('button', { name: /Finished Goods/i });
    await expect(fgPill).toBeVisible({ timeout: 5000 });
    await fgPill.click();
    await page.waitForTimeout(800);

    // 5. Click the first item code cell to open Item Detail
    const itemCodeCell = page.locator('tr.item-master-grid-row td:nth-child(2)').first();
    await expect(itemCodeCell).toBeVisible({ timeout: 10000 });
    await itemCodeCell.click();

    // 6. Verify Item Detail view opens without "Item Not Found in Catalog"
    await expect(page.getByText('Back to Item Master')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Item Not Found in Catalog')).not.toBeVisible();

    // 7. Verify action buttons
    await expect(page.getByRole('button', { name: /Quick Modify/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /10-Step Wizard/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Change Ledger/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Print Label/i })).toBeVisible({ timeout: 5000 });

    // 8. Test Tabs (Purchasing & Quality)
    const purchasingTab = page.locator('.tab', { hasText: 'Purchasing' });
    await expect(purchasingTab).toBeVisible({ timeout: 5000 });
    await purchasingTab.click();
    await expect(page.getByText('Procurement & Vendor Supply Chain Parameters')).toBeVisible({ timeout: 5000 });

    const qualityTab = page.locator('.tab', { hasText: 'Quality' });
    await expect(qualityTab).toBeVisible({ timeout: 5000 });
    await qualityTab.click();
    await expect(page.getByText('Quality Assurance & Inbound Inspection Standards')).toBeVisible({ timeout: 5000 });

    // 9. Back to Item Master
    await page.getByText('Back to Item Master').click();
    await expect(itemCatalogHeading).toBeVisible({ timeout: 15000 });

    // 10. Open Create Item Wizard
    const createBtn = page.getByRole('button', { name: /Create Item/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Advance to Step 2
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
      await continueBtn.click();
    }

    // Verify Step 2 is active
    await expect(page.getByRole('heading', { name: /Basic information/i })).toBeVisible({ timeout: 10000 });

    // Verify all removed master data links are NOT visible in Step 2
    await expect(page.getByText('+ New Master Code')).not.toBeVisible();
    await expect(page.getByText('+ New Master Data Record')).not.toBeVisible();
    await expect(page.getByText('+ Register in Master Data')).not.toBeVisible();
  });
});
