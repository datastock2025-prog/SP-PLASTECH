import { test, expect } from '@playwright/test';
import { loginAndNavigate } from './test-helpers';

test.describe('Item Master Catalog — Full CRUD Lifecycle Suite (Create, Read, Update, Delete)', () => {

  test('TC-CRUD-FULL: Complete End-to-End Test for Create, Read, Update, Delete with Single API Calls & Direct DB Verification', async ({ page }) => {
    const capturedApiRequests: { url: string; method: string; postData?: string }[] = [];
    
    // Monitor all Supabase REST API requests
    page.on('request', (req) => {
      if (req.url().includes('/rest/v1/') || req.url().includes('supabase.co/rest/')) {
        capturedApiRequests.push({
          url: req.url(),
          method: req.method(),
          postData: req.postData() || undefined,
        });
      }
    });

    await loginAndNavigate(page, 'itemList');
    const headerTitle = page.locator('h1', { hasText: 'Item Master Catalog' });
    await expect(headerTitle).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    const testItemCode = `AUTO-CRUD-${Date.now().toString().slice(-6)}`;
    const initialItemPayload = {
      code: testItemCode,
      name: `Playwright Part Alpha ${testItemCode}`,
      type: 'Finished Good',
      category: 'INJECTION MOLDING',
      wh: 'FG_WH_A',
      plant: 'Plant 1 - Pimpri Auto-Hub',
      stock: '250',
      avail: '250',
      cost: 45.0,
      sellingPrice: 85.0,
      approval: 'approved',
      status: 'active',
      baseUOM: 'PCS',
    };

    // =========================================================================
    // 1. CREATE OPERATION
    // =========================================================================
    console.log(`\n======================================================`);
    console.log(`[CRUD TEST - STEP 1: CREATE] SKU: ${testItemCode}`);
    console.log(`======================================================`);
    capturedApiRequests.length = 0; // Reset request logger

    const createResult = await page.evaluate(async (payload) => {
      const service = (window as any).__ERP_ITEM_SERVICE__ || (await import('../src/services/itemService')).itemService;
      return await service.saveItem(payload as any, 'Playwright Test Runner');
    }, initialItemPayload);

    const itemCreateRequests = capturedApiRequests.filter((r) => r.url.includes('/rest/v1/items') && r.method === 'POST');
    console.log('[CREATE - ITEMS API CALLS COUNT]:', itemCreateRequests.length);
    itemCreateRequests.forEach((r, i) => console.log(`  Call #${i + 1}: ${r.method} ${r.url}`));

    // Assert single API call for creation
    expect(itemCreateRequests.length).toBe(1);
    expect(itemCreateRequests[0].method).toBe('POST');
    expect(itemCreateRequests[0].url).toContain('/rest/v1/items');

    // =========================================================================
    // 2. READ OPERATION
    // =========================================================================
    console.log(`\n======================================================`);
    console.log(`[CRUD TEST - STEP 2: READ] Checking UI & Direct Database`);
    console.log(`======================================================`);

    // Verify UI Search & Display
    const searchInput = page.locator('input[placeholder*="Instant search" i]');
    await searchInput.fill(testItemCode);

    const skuCellInUi = page.locator('td', { hasText: testItemCode }).first();
    await expect(skuCellInUi).toBeVisible({ timeout: 10000 });
    console.log(`[READ - UI VERIFY] SKU ${testItemCode} visible in catalog table.`);

    // Read directly from Supabase PostgreSQL Database
    const dbReadResult = await page.evaluate(async (code) => {
      // @ts-ignore
      const mod = await import('../src/shared/supabaseClient');
      const { data, error } = await mod.supabase.from('items').select('*').eq('code', code).maybeSingle();
      return { data, error: error?.message || null };
    }, testItemCode);

    console.log('[READ - DATABASE RESULT]:', {
      foundInDb: !!dbReadResult.data,
      dbCode: dbReadResult.data?.code,
      dbName: dbReadResult.data?.name,
      dbUnit: dbReadResult.data?.unit,
      dbCost: dbReadResult.data?.cost,
      dbSellingPrice: dbReadResult.data?.selling_price,
    });

    expect(dbReadResult.data).not.toBeNull();
    expect(dbReadResult.data?.code).toBe(testItemCode);
    expect(dbReadResult.data?.name).toBe(initialItemPayload.name);

    // =========================================================================
    // 3. UPDATE OPERATION
    // =========================================================================
    console.log(`\n======================================================`);
    console.log(`[CRUD TEST - STEP 3: UPDATE] Updating SKU Attributes`);
    console.log(`======================================================`);
    capturedApiRequests.length = 0;

    const updatedItemPayload = {
      ...initialItemPayload,
      name: `Playwright Part Alpha [UPDATED] ${testItemCode}`,
      cost: 62.5,
      sellingPrice: 110.0,
      stock: '500',
      avail: '500',
    };

    const updateResult = await page.evaluate(async (payload) => {
      const service = (window as any).__ERP_ITEM_SERVICE__ || (await import('../src/services/itemService')).itemService;
      return await service.saveItem(payload as any, 'Playwright Test Runner');
    }, updatedItemPayload);

    console.log('[UPDATE - SERVICE RESULT]:', {
      code: updateResult.code,
      updatedName: updateResult.name,
      updatedCost: updateResult.cost,
      updatedSellingPrice: updateResult.sellingPrice,
    });
    const itemUpdateRequests = capturedApiRequests.filter((r) => r.url.includes('/rest/v1/items') && r.method === 'POST');
    console.log('[UPDATE - ITEMS API CALLS COUNT]:', itemUpdateRequests.length);
    itemUpdateRequests.forEach((r, i) => console.log(`  Call #${i + 1}: ${r.method} ${r.url}`));

    // Assert single API call for update
    expect(itemUpdateRequests.length).toBe(1);
    expect(itemUpdateRequests[0].method).toBe('POST');

    // Read updated values directly from Supabase Database
    const dbPostUpdateResult = await page.evaluate(async (code) => {
      // @ts-ignore
      const mod = await import('../src/shared/supabaseClient');
      const { data } = await mod.supabase.from('items').select('*').eq('code', code).maybeSingle();
      return data;
    }, testItemCode);

    console.log('[UPDATE - DATABASE VERIFY]:', {
      dbName: dbPostUpdateResult?.name,
      dbCost: dbPostUpdateResult?.cost,
      dbSellingPrice: dbPostUpdateResult?.selling_price,
    });

    expect(dbPostUpdateResult?.name).toBe(updatedItemPayload.name);
    expect(Number(dbPostUpdateResult?.cost)).toBe(62.5);
    expect(Number(dbPostUpdateResult?.selling_price)).toBe(110.0);

    // =========================================================================
    // 4. DELETE OPERATION
    // =========================================================================
    console.log(`\n======================================================`);
    console.log(`[CRUD TEST - STEP 4: DELETE] Permanently Purging SKU`);
    console.log(`======================================================`);
    capturedApiRequests.length = 0;

    const deleteResult = await page.evaluate(async (code) => {
      const service = (window as any).__ERP_ITEM_SERVICE__ || (await import('../src/services/itemService')).itemService;
      return await service.deleteItem(code, 'Playwright Test Runner');
    }, testItemCode);

    console.log('[DELETE - SERVICE RESULT]: Success =', deleteResult);
    const itemDeleteRequests = capturedApiRequests.filter((r) => r.url.includes('/rest/v1/items') && r.method === 'DELETE');
    console.log('[DELETE - ITEMS API CALLS COUNT]:', itemDeleteRequests.length);
    itemDeleteRequests.forEach((r, i) => console.log(`  Call #${i + 1}: ${r.method} ${r.url}`));

    // Assert single API call for delete
    expect(itemDeleteRequests.length).toBe(1);
    expect(itemDeleteRequests[0].method).toBe('DELETE');
    expect(itemDeleteRequests[0].url).toContain(`/rest/v1/items?code=eq.${testItemCode}`);

    // Verify deletion directly in Supabase Database
    const dbPostDeleteResult = await page.evaluate(async (code) => {
      // @ts-ignore
      const mod = await import('../src/shared/supabaseClient');
      const { data } = await mod.supabase.from('items').select('*').eq('code', code).maybeSingle();
      return { foundInDb: !!data };
    }, testItemCode);

    console.log('[DELETE - DATABASE VERIFY]:', {
      foundInDb: dbPostDeleteResult.foundInDb,
      isCleanlyPurged: !dbPostDeleteResult.foundInDb,
    });

    expect(dbPostDeleteResult.foundInDb).toBe(false);

    // =========================================================================
    // 5. POST-DELETE BROWSER REFRESH & PERSISTENCE VERIFICATION
    // =========================================================================
    console.log(`\n======================================================`);
    console.log(`[CRUD TEST - STEP 5: BROWSER REFRESH] Verify Stable State`);
    console.log(`======================================================`);
    capturedApiRequests.length = 0;

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(headerTitle).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    const searchInputAfterReload = page.locator('input[placeholder*="Instant search" i]');
    await searchInputAfterReload.fill(testItemCode);
    await page.waitForTimeout(1000);

    const isVisibleAfterDeleteAndReload = await page.locator('td', { hasText: testItemCode }).first().isVisible();
    console.log(`[REFRESH - VERIFY] Deleted SKU visible in UI after reload (should be false):`, isVisibleAfterDeleteAndReload);
    expect(isVisibleAfterDeleteAndReload).toBe(false);

    console.log(`\n======================================================`);
    console.log(`[CRUD TEST - SUMMARY]: ALL 4 CRUD OPERATIONS (C, R, U, D) PASSED WITH SINGLE API CALLS & 100% DB INTEGRITY!`);
    console.log(`======================================================\n`);
  });

});
