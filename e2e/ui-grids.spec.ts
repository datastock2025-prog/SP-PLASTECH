import { test, expect } from '@playwright/test';
import { loginAndNavigate } from './test-helpers';

test.describe('UI Grid Alignment, Responsiveness & Text Overflow Suite', () => {
  test('TC-GRID-03: Item Master uses server pagination across the full catalog', async ({ page }) => {
    const catalog = Array.from({ length: 60 }, (_, index) => {
      const number = String(index + 1).padStart(3, '0');
      return {
        id: `GRID-${number}`,
        code: `GRID-ITEM-${number}`,
        name: `Grid Test Item ${number}`,
        category: 'INJECTION MOLDING',
        entity_type: 'Finished Good',
        unit: 'PCS',
        stock: 0,
        cost: 1,
        selling_price: 2,
        approval: 'approved',
        status: 'active',
        created_at: new Date(2026, 0, index + 1).toISOString(),
        updated_at: new Date(2026, 0, index + 1).toISOString(),
      };
    });
    catalog[0].entity_type = 'Finished Molded Component';
    catalog[1].approval = 'released';

    await page.route(/(rest|api)\/v1\/items/, async (route) => {
      const request = route.request();
      const requestUrl = new URL(request.url());
      if (request.method() === 'HEAD') {
        await route.fulfill({
          status: 200,
          headers: {
            'content-range': `0-${catalog.length - 1}/${catalog.length}`,
            'access-control-expose-headers': 'Content-Range',
          },
          body: '',
        });
        return;
      }

      if (requestUrl.pathname.endsWith('/count')) {
        await route.fulfill({
          status: 200,
          json: { data: { count: catalog.length }, count: catalog.length },
        });
        return;
      }

      if (request.method() === 'GET') {
        const isApi = requestUrl.pathname.includes('/api/');
        const limit = Number(requestUrl.searchParams.get('limit') || 25);
        let start = 0;
        if (requestUrl.searchParams.has('offset')) {
          start = Number(requestUrl.searchParams.get('offset') || 0);
        } else if (requestUrl.searchParams.has('page')) {
          start = (Number(requestUrl.searchParams.get('page')) - 1) * limit;
        }
        const pageNum = Math.floor(start / limit) + 1;
        const end = start + limit - 1;
        const rows = catalog.slice(start, end + 1);

        if (isApi) {
          await route.fulfill({
            status: 200,
            json: {
              data: rows,
              meta: { page: pageNum, limit, total: catalog.length, totalPages: Math.ceil(catalog.length / limit) },
            },
          });
        } else {
          await route.fulfill({
            status: 200,
            headers: { 'content-range': `${start}-${start + rows.length - 1}/${catalog.length}` },
            json: rows,
          });
        }
        return;
      }

      await route.continue();
    });

    await loginAndNavigate(page, 'itemList');
    await expect(page.getByText('60 Registered SKUs')).toBeVisible();
    await expect(page.getByTestId('item-kpi-total-items').getByText('60', { exact: true })).toBeVisible();
    await expect(page.getByTestId('item-kpi-finished-goods').getByText('60', { exact: true })).toBeVisible();
    await expect(page.getByTestId('item-kpi-active-catalog').getByText('60', { exact: true })).toBeVisible();
    await expect(page.locator('tbody tr').filter({ hasText: 'GRID-ITEM-001' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(25);

    const nextPage = page.locator('button[title="Next Page"]');
    await expect(nextPage).toBeEnabled();
    await nextPage.click();
    await expect(page.locator('tbody tr').filter({ hasText: 'GRID-ITEM-026' })).toBeVisible();
    await expect(page.locator('tbody tr').filter({ hasText: 'GRID-ITEM-001' })).toHaveCount(0);
    await expect(page.locator('tbody tr')).toHaveCount(25);

    await nextPage.click();
    await expect(page.locator('tbody tr').filter({ hasText: 'GRID-ITEM-051' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(10);
    await expect(page.locator('button[title="Next Page"]')).toBeDisabled();
  });

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
