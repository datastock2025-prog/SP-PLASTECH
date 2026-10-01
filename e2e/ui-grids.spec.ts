import { test, expect } from '@playwright/test';
import { loginAndNavigate } from './test-helpers';

test.describe('UI Grid Alignment, Responsiveness & Text Overflow Suite', () => {
  test('TC-GRID-01: Warehouse Stock Overview Table Columns & Plant Association', async ({ page }) => {
    // Navigate directly to Warehouse Stock Overview view
    await loginAndNavigate(page, 'stockList');

    // Verify Plant / Unit column header is present in Table
    const plantHeader = page.locator('th:has-text("Plant / Unit")');
    await expect(plantHeader).toBeVisible({ timeout: 5000 });

    // Verify Item SKU / Code column is present
    await expect(page.locator('th:has-text("Item SKU / Code")')).toBeVisible();

    // Verify On Hand & Available quantities headers exist
    const onHandHeader = page.locator('th:has-text("On Hand")');
    await expect(onHandHeader).toBeVisible();

    const availHeader = page.locator('th:has-text("Available")');
    await expect(availHeader).toBeVisible();
  });

  test('TC-GRID-02: Sales Orders Grid Alignment & Responsive Containment', async ({ page }) => {
    // Navigate directly to Sales Orders view
    await loginAndNavigate(page, 'soList');

    // Check DOM for uncontained horizontal overflowing blocks
    const uncontainedCount = await page.evaluate(() => {
      let badElements = 0;
      const tables = document.querySelectorAll('table');
      tables.forEach((t) => {
        const parent = t.parentElement;
        if (parent && parent.scrollWidth > parent.clientWidth && !parent.className.includes('overflow')) {
          badElements++;
        }
      });
      return badElements;
    });

    expect(uncontainedCount).toBe(0);
  });
});
