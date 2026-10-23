import { test, expect } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

test.describe('Sales, Dispatch & MRP Calculation Engine Lifecycle (Wave 4)', () => {
  const uniqSuffix = Date.now().toString().slice(-6);
  const testCustCode = `CUST-${uniqSuffix}`;
  const testFgSku = `FG-CAP-${uniqSuffix}`;
  const testRmSku = `RM-POLY-${uniqSuffix}`;
  const testBomId = `BOM-CAP-${uniqSuffix}`;
  const testSoNumber = `SO-${uniqSuffix}`;
  const testDcNumber = `DC-${uniqSuffix}`;

  test('W4-01: Sales Order -> Delivery Challan -> Outward Stock Deduction -> Server-Side MRP Run & PR Generation', async ({ request }) => {
    // 1. Create Customer
    const custRes = await request.post(`${API}/api/v1/customers`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testCustCode,
        name: `Acme Automotive Components ${uniqSuffix}`,
        customer_type: 'OEM',
        tier: 'Tier 1',
        gstin: '27AABCA1234A1Z5',
        credit_limit: '5000000.00',
        payment_terms: 'Net 30 Days',
        incoterms: 'DAP',
        status: 'active',
      },
    });
    expect([200, 201]).toContain(custRes.status());

    // 2. Create Raw Material Item Master
    const rmRes = await request.post(`${API}/api/v1/items`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testRmSku,
        name: `Polypropylene Homopolymer Grade ${uniqSuffix}`,
        category: 'Raw Material',
        unit: 'KG',
        stock: '5.00', // Low stock to trigger MRP deficit
        cost: '120.00',
        safety_stock: '10.00',
        valuation_method: 'FIFO',
      },
    });
    expect([200, 201]).toContain(rmRes.status());

    // Also populate warehouse_stock for Raw Material
    const rmWsRes = await request.post(`${API}/api/v1/warehouse-stock`, {
      headers: { Origin: ORIGIN },
      data: {
        sku: testRmSku,
        name: `Polypropylene Homopolymer Grade ${uniqSuffix}`,
        category: 'Raw Material',
        store_type: 'RM',
        primary_warehouse: 'WH-RM-01',
        total_on_hand: '5.00',
        available_to_promise: '5.00',
        uom: 'KG',
        unit_cost_inr: '120.00',
      },
    });
    expect([200, 201]).toContain(rmWsRes.status());

    // 3. Create Finished Good Item Master
    const fgRes = await request.post(`${API}/api/v1/items`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testFgSku,
        name: `28mm Tamper-Evident Cap ${uniqSuffix}`,
        category: 'Finished Goods',
        unit: 'PCS',
        stock: '500.00', // Initial stock on hand
        cost: '2.50',
        selling_price: '4.50',
        safety_stock: '200.00',
        valuation_method: 'FIFO',
      },
    });
    expect([200, 201]).toContain(fgRes.status());

    // Populate initial warehouse_stock for FG
    const fgWsRes = await request.post(`${API}/api/v1/warehouse-stock`, {
      headers: { Origin: ORIGIN },
      data: {
        sku: testFgSku,
        name: `28mm Tamper-Evident Cap ${uniqSuffix}`,
        category: 'Finished Goods',
        store_type: 'FG',
        primary_warehouse: 'WH-FG-01',
        total_on_hand: '500.00',
        available_to_promise: '500.00',
        uom: 'PCS',
        unit_cost_inr: '2.50',
      },
    });
    expect([200, 201]).toContain(fgWsRes.status());

    // 4. Create Bill of Materials (BOM) linking FG to RM
    const bomRes = await request.post(`${API}/api/v1/bill-of-materials`, {
      headers: { Origin: ORIGIN },
      data: {
        id: testBomId,
        item_code: testFgSku,
        bom_version: 'v1.0',
        status: 'approved',
      },
    });
    expect([200, 201]).toContain(bomRes.status());

    // Add BOM Line: 0.05 KG of RM per Cap
    const bomLineRes = await request.post(`${API}/api/v1/bom-lines`, {
      headers: { Origin: ORIGIN },
      data: {
        bom_id: testBomId,
        line_no: 1,
        component_item_code: testRmSku,
        component_item_name: `Polypropylene Homopolymer Grade ${uniqSuffix}`,
        category: 'Raw Material',
        quantity_per_unit: '0.05',
        uom: 'KG',
        scrap_pct: '2.0',
      },
    });
    expect([200, 201]).toContain(bomLineRes.status());

    // 5. Create Sales Order
    const soRes = await request.post(`${API}/api/v1/sales-orders`, {
      headers: { Origin: ORIGIN },
      data: {
        so_number: testSoNumber,
        customer_id: testCustCode,
        status: 'confirmed',
        total_amount: '4500.00',
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      },
    });
    expect([200, 201]).toContain(soRes.status());
    const soJson = await soRes.json();
    const createdSo = soJson.data;
    expect(createdSo.so_number).toBe(testSoNumber);

    // 6. Create Sales Order Line (Demand: 1000 units of FG)
    const solRes = await request.post(`${API}/api/v1/sales-order-lines`, {
      headers: { Origin: ORIGIN },
      data: {
        so_id: createdSo.id,
        line_no: 1,
        item_code: testFgSku,
        item_name: `28mm Tamper-Evident Cap ${uniqSuffix}`,
        quantity: '1000.00',
        unit_price: '4.50',
        total_price: '4500.00',
        uom: 'PCS',
      },
    });
    expect([200, 201]).toContain(solRes.status());
    const solJson = await solRes.json();
    const createdSol = solJson.data;
    expect(Number(createdSol.quantity)).toBe(1000);
    expect(Number(createdSol.dispatched_qty)).toBe(0);

    // 7. Create Delivery Challan for Partial Dispatch (200 units)
    const dcId = `DC-REC-${uniqSuffix}`;
    const dcRes = await request.post(`${API}/api/v1/delivery-challans`, {
      headers: { Origin: ORIGIN },
      data: {
        id: dcId,
        challan_number: testDcNumber,
        so_id: createdSo.id,
        customer_id: testCustCode,
        vehicle_no: 'MH-14-GH-1234',
        transporter: 'VRL Logistics',
        lr_number: `LR-${uniqSuffix}`,
        status: 'draft',
        lines: [
          {
            item_code: testFgSku,
            item_name: `28mm Tamper-Evident Cap ${uniqSuffix}`,
            quantity: 200,
            unit_price: 4.5,
            uom: 'PCS',
          },
        ],
        total_amount: '900.00',
      },
    });
    expect([200, 201]).toContain(dcRes.status());

    // 8. Execute Transactional Outward Dispatch (POST /delivery-challans/:id/dispatch)
    const dispatchRes = await request.post(`${API}/api/v1/delivery-challans/${dcId}/dispatch`, {
      headers: { Origin: ORIGIN },
    });
    expect(dispatchRes.status()).toBe(200);
    const dispatchJson = await dispatchRes.json();
    expect(dispatchJson.data.status).toBe('dispatched');

    // 9. Verify Automatic Stock Deduction:
    // a. warehouse_stock on hand should decrease from 500 to 300
    const fgWsGet = await request.get(`${API}/api/v1/warehouse-stock?sku=${testFgSku}`);
    expect(fgWsGet.status()).toBe(200);
    const fgWsData = await fgWsGet.json();
    const fgStockItem = fgWsData.data[0];
    expect(Number(fgStockItem.total_on_hand)).toBe(300);

    // b. items master stock should decrease from 500 to 300
    const fgItemGet = await request.get(`${API}/api/v1/items/${testFgSku}`);
    expect(fgItemGet.status()).toBe(200);
    const fgItemData = await fgItemGet.json();
    expect(Number(fgItemData.data.stock)).toBe(300);

    // c. stock_movement_ledger should contain the OUT movement
    const ledgerGet = await request.get(`${API}/api/v1/stock-movement-ledger?doc_number=${testDcNumber}`);
    expect(ledgerGet.status()).toBe(200);
    const ledgerData = await ledgerGet.json();
    expect(ledgerData.data.length).toBeGreaterThan(0);
    expect(ledgerData.data[0].movement_type).toBe('OUT');
    expect(Number(ledgerData.data[0].qty_out)).toBe(200);

    // d. sales_order_lines dispatched_qty should be updated to 200
    const solGet = await request.get(`${API}/api/v1/sales-order-lines?so_id=${createdSo.id}`);
    expect(solGet.status()).toBe(200);
    const solData = await solGet.json();
    const updatedLine = solData.data.find((l: any) => l.item_code === testFgSku);
    expect(Number(updatedLine.dispatched_qty)).toBe(200);

    // 10. Execute Server-Side MRP Calculation Engine (POST /api/v1/mrp/runs)
    // Remaining demand: 1000 - 200 = 800 caps
    // Raw material requirement: 800 * 0.05 * 1.02 (scrap) = 40.8 KG
    // On hand RM stock: 5.00 KG -> Net Deficit: ~35.8 KG
    const mrpRes = await request.post(`${API}/api/v1/mrp/runs`, {
      headers: { Origin: ORIGIN },
      data: {
        so_ids: [createdSo.id],
      },
    });
    expect(mrpRes.status()).toBe(200);
    const mrpJson = await mrpRes.json();
    const mrpRun = mrpJson.data;

    expect(mrpRun.status).toBe('COMPLETED');
    expect(mrpRun.run_number).toMatch(/^MRP-/);
    expect(mrpRun.total_so_processed).toBeGreaterThanOrEqual(1);
    expect(mrpRun.total_prs_generated).toBeGreaterThanOrEqual(1);

    // Verify gross requirements computed
    const grossList = Array.isArray(mrpRun.gross_requirements) ? mrpRun.gross_requirements : JSON.parse(mrpRun.gross_requirements);
    const rmGross = grossList.find((g: any) => g.item_code === testRmSku);
    expect(rmGross).toBeDefined();
    expect(Number(rmGross.gross_qty)).toBeGreaterThan(35);

    // Verify net requirements computed with deficit
    const netList = Array.isArray(mrpRun.net_requirements) ? mrpRun.net_requirements : JSON.parse(mrpRun.net_requirements);
    const rmNet = netList.find((n: any) => n.item_code === testRmSku);
    expect(rmNet).toBeDefined();
    expect(Number(rmNet.net_deficit)).toBeGreaterThan(30);

    // 11. Verify Automated Purchase Requisition generated
    const prIds = Array.isArray(mrpRun.generated_pr_ids) ? mrpRun.generated_pr_ids : JSON.parse(mrpRun.generated_pr_ids);
    expect(prIds.length).toBeGreaterThanOrEqual(1);

    const prGet = await request.get(`${API}/api/v1/purchase-requisitions/${prIds[0]}`);
    expect(prGet.status()).toBe(200);
    const prData = await prGet.json();
    expect(prData.data.status).toBe('draft');
    expect(prData.data.department).toBe('Materials Planning');
    const prLines = Array.isArray(prData.data.lines) ? prData.data.lines : JSON.parse(prData.data.lines);
    expect(prLines[0].item_code).toBe(testRmSku);

    // 12. Verify Atomic /sales/summary KPI endpoint
    const summaryRes = await request.get(`${API}/api/v1/sales/summary`, {
      headers: { Origin: ORIGIN },
    });
    expect(summaryRes.status()).toBe(200);
    const summaryData = await summaryRes.json();
    expect(summaryData.data.totalOrders).toBeGreaterThanOrEqual(1);
    expect(summaryData.data.totalCustomers).toBeGreaterThanOrEqual(1);
  });
});
