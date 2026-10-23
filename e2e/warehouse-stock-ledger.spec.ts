import { test, expect } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

test.describe('Warehouse Stock Ledger & Procurement Inwarding (API -> DB)', () => {
  const uniqSuffix = Date.now().toString().slice(-6);
  const testSku = `RM-ABS-${uniqSuffix}`;
  const testSupCode = `SUP-${uniqSuffix}`;
  const testPoNo = `PO-${uniqSuffix}`;
  const testGrnNo = `GRN-${uniqSuffix}`;

  test('W2-01: PO -> GRN Inward -> Stock Ledger posting -> Inter-Store Transfer', async ({ request }) => {
    // 1. Create Raw Material Item Master
    const itemRes = await request.post(`${API}/api/v1/items`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testSku,
        name: `Acrylonitrile Butadiene Styrene Grade ${uniqSuffix}`,
        category: 'Raw Material',
        unit: 'KG',
        stock: '0',
        cost: '145.00',
        safety_stock: '200',
        valuation_method: 'FIFO',
      },
    });
    expect([200, 201]).toContain(itemRes.status());

    // 2. Create Supplier
    const supRes = await request.post(`${API}/api/v1/suppliers`, {
      headers: { Origin: ORIGIN },
      data: {
        id: testSupCode,
        code: testSupCode,
        name: `Supreme Petrochem Ltd ${uniqSuffix}`,
        type: 'Raw Material',
        payment_terms: 'Net 30 Days',
        status: 'active',
      },
    });
    expect([200, 201]).toContain(supRes.status());

    // 3. Create Purchase Order
    const poRes = await request.post(`${API}/api/v1/purchase-orders`, {
      headers: { Origin: ORIGIN },
      data: {
        id: testPoNo,
        po_number: testPoNo,
        supplier_id: testSupCode,
        status: 'approved',
        total_amount: '290000.00',
        items: [
          {
            item_code: testSku,
            name: `Acrylonitrile Butadiene Styrene Grade ${uniqSuffix}`,
            qty: 2000,
            uom: 'KG',
            price: 145.0,
            received: 0,
          },
        ],
      },
    });
    if (!poRes.ok()) {
      console.log('poRes failed:', poRes.status(), await poRes.text());
    }
    expect(poRes.status()).toBe(201);

    // 4. Create Goods Receipt Note (GRN) for 2000 KG
    const grnRes = await request.post(`${API}/api/v1/goods-receipt-notes`, {
      headers: { Origin: ORIGIN },
      data: {
        id: testGrnNo,
        grn_number: testGrnNo,
        po_id: testPoNo,
        supplier_id: testSupCode,
        supplier_invoice_no: `INV-${uniqSuffix}`,
        vehicle_no: 'MH-12-PQ-9099',
        status: 'draft',
        lines: [
          {
            item_code: testSku,
            received_qty: 2000,
            uom: 'KG',
            unit_price: 145.0,
            lot_number: `LOT-ABS-${uniqSuffix}`,
          },
        ],
      },
    });
    expect(grnRes.status()).toBe(201);

    // 5. Inward GRN (Transactional Posting into Stock Ledger & Live Warehouse Stock)
    const inwardRes = await request.post(`${API}/api/v1/goods-receipt-notes/${testGrnNo}/inward`, {
      headers: { Origin: ORIGIN },
      data: {},
    });
    expect(inwardRes.status()).toBe(200);
    const inwardBody = await inwardRes.json();
    expect(inwardBody.data.status).toBe('inwarded');

    // 6. Verify stock_movement_ledger entry
    const ledgerRes = await request.get(`${API}/api/v1/stock-movement-ledger?filter[sku]=${testSku}`, {
      headers: { Origin: ORIGIN },
    });
    expect(ledgerRes.status()).toBe(200);
    const ledgerBody = await ledgerRes.json();
    expect(ledgerBody.data.length).toBeGreaterThanOrEqual(1);

    const inwardEntry = ledgerBody.data.find((e: any) => e.doc_number === testGrnNo);
    expect(inwardEntry).toBeDefined();
    expect(inwardEntry.movement_type).toBe('IN');
    expect(Number(inwardEntry.quantity)).toBe(2000);
    expect(inwardEntry.sku).toBe(testSku);

    // 7. Verify warehouse_stock live projection
    const stockRes = await request.get(`${API}/api/v1/warehouse-stock?filter[sku]=${testSku}`, {
      headers: { Origin: ORIGIN },
    });
    expect(stockRes.status()).toBe(200);
    const stockBody = await stockRes.json();
    expect(stockBody.data.length).toBeGreaterThanOrEqual(1);
    expect(Number(stockBody.data[0].total_on_hand)).toBe(2000);

    // 8. Perform Inter-Store Stock Transfer (500 KG from WH-RM-01 to PRD-STORE)
    const transferRes = await request.post(`${API}/api/v1/stock/transfers`, {
      headers: { Origin: ORIGIN },
      data: {
        item_code: testSku,
        from_location: 'WH-RM-01',
        to_location: 'PRD-STORE-LINE1',
        quantity: 500,
        reference: `Molding Shift Issue ${uniqSuffix}`,
      },
    });
    expect(transferRes.status()).toBe(201);
    const transferBody = await transferRes.json();
    expect(transferBody.data.status).toBe('COMPLETED');
    expect(Number(transferBody.data.quantity)).toBe(500);

    // 9. Verify Transfer Ledger movements (OUT from WH-RM-01, IN to PRD-STORE-LINE1)
    const postTransferLedgerRes = await request.get(`${API}/api/v1/stock-movement-ledger?filter[sku]=${testSku}`, {
      headers: { Origin: ORIGIN },
    });
    expect(postTransferLedgerRes.status()).toBe(200);
    const postTransferBody = await postTransferLedgerRes.json();
    // 1 inward + 1 transfer OUT + 1 transfer IN = 3 entries
    expect(postTransferBody.data.length).toBeGreaterThanOrEqual(3);
  });
});
