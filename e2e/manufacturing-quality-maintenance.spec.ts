import { test, expect } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

test.describe('Manufacturing, Quality & Maintenance Lifecycle (API -> DB)', () => {
  const uniqSuffix = Date.now().toString().slice(-6);
  const testFgSku = `FG-BOTTLE-${uniqSuffix}`;
  const testMachCode = `IMM-${uniqSuffix}`;
  const testWoCode = `WO-${uniqSuffix}`;
  const testQcNo = `QC-${uniqSuffix}`;
  const testTicketNo = `BRK-${uniqSuffix}`;

  test('M3-01: WO Lifecycle -> Production Entry -> Stock Ledger Post -> QC Inspection -> Maintenance & Downtime', async ({ request }) => {
    // 1. Create Finished Goods Item Master
    const itemRes = await request.post(`${API}/api/v1/items`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testFgSku,
        name: `500ml HDPE Bottle ${uniqSuffix}`,
        category: 'Finished Goods',
        unit: 'PCS',
        stock: '0',
        cost: '12.50',
        safety_stock: '1000',
        valuation_method: 'FIFO',
      },
    });
    expect([200, 201]).toContain(itemRes.status());

    // 2. Create Injection Molding Machine
    const machRes = await request.post(`${API}/api/v1/machines`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testMachCode,
        name: `Ferromatik Milacron 250T ${uniqSuffix}`,
        tonnage: '250',
        plant: 'Main Plant Pune',
        status: 'idle',
        brand: 'Milacron',
        model: 'Maxima 250',
        hourly_rate: '1500.00',
      },
    });
    expect([200, 201]).toContain(machRes.status());

    // 3. Create Work Order
    const woRes = await request.post(`${API}/api/v1/work-orders`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testWoCode,
        item_code: testFgSku,
        machine_id: testMachCode,
        target_qty: 1000,
        status: 'planned',
        priority: 'High',
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      },
    });
    expect(woRes.status()).toBe(201);
    const woBody = await woRes.json();
    const woId = woBody.data.id;
    expect(woId).toBeDefined();

    // 4. Release Work Order to Shop Floor
    const releaseRes = await request.post(`${API}/api/v1/work-orders/${woId}/release`, {
      headers: { Origin: ORIGIN },
      data: {},
    });
    expect(releaseRes.status()).toBe(200);
    const releaseBody = await releaseRes.json();
    expect(releaseBody.data.status).toBe('in_progress');

    // 5. Post Shift Production Entry (600 Good + 25 Rejection)
    const prodRes = await request.post(`${API}/api/v1/production-entries`, {
      headers: { Origin: ORIGIN },
      data: {
        work_order_id: woId,
        machine_id: testMachCode,
        good_qty: 600,
        rejected_qty: 25,
        shots_produced: 625,
        shift_id: 'SHIFT-A',
        operator_id: 'OP-Ramesh',
        rejection_reason_code: 'SHORT_SHOT',
        regrind_kg_generated: 4.5,
      },
    });
    if (!prodRes.ok()) {
      console.log('prodRes failed:', prodRes.status(), await prodRes.text());
    }
    expect(prodRes.status()).toBe(201);

    // 6. Verify Work Order quantities updated atomically
    const woCheckRes = await request.get(`${API}/api/v1/work-orders/${woId}`, {
      headers: { Origin: ORIGIN },
    });
    expect(woCheckRes.status()).toBe(200);
    const woCheckBody = await woCheckRes.json();
    expect(Number(woCheckBody.data.good_qty)).toBe(600);
    expect(Number(woCheckBody.data.rejection_qty)).toBe(25);
    expect(Number(woCheckBody.data.produced_qty)).toBe(625);

    // 7. Verify stock_movement_ledger received 600 Finished Goods
    const ledgerRes = await request.get(`${API}/api/v1/stock-movement-ledger?filter[sku]=${testFgSku}`, {
      headers: { Origin: ORIGIN },
    });
    expect(ledgerRes.status()).toBe(200);
    const ledgerBody = await ledgerRes.json();
    expect(ledgerBody.data.length).toBeGreaterThanOrEqual(1);

    const fgEntry = ledgerBody.data.find((e: any) => e.sku === testFgSku);
    expect(fgEntry).toBeDefined();
    expect(fgEntry.movement_type).toBe('IN');
    expect(Number(fgEntry.quantity)).toBe(600);

    // 8. Verify live warehouse_stock projection has 600 on hand
    const stockRes = await request.get(`${API}/api/v1/warehouse-stock?filter[sku]=${testFgSku}`, {
      headers: { Origin: ORIGIN },
    });
    expect(stockRes.status()).toBe(200);
    const stockBody = await stockRes.json();
    expect(stockBody.data.length).toBeGreaterThanOrEqual(1);
    expect(Number(stockBody.data[0].total_on_hand)).toBe(600);

    // 9. Post Quality Inspection (QC Inspection)
    const qcRes = await request.post(`${API}/api/v1/qc-inspections`, {
      headers: { Origin: ORIGIN },
      data: {
        inspection_no: testQcNo,
        doc_type: 'WORK_ORDER',
        doc_id: woId,
        item_code: testFgSku,
        lot_number: `LOT-FG-${uniqSuffix}`,
        inspected_qty: 600,
        sample_size: 50,
        accepted_qty: 580,
        rejected_qty: 20,
        disposition: 'ACCEPTED',
        inspector_id: 'QC-Lead-Anita',
        notes: 'Visual & dimensional parameters within 0.05mm tolerance',
      },
    });
    expect(qcRes.status()).toBe(201);
    const qcBody = await qcRes.json();
    const qcId = qcBody.data.id;

    // 10. Update QC Disposition via custom action endpoint
    const dispRes = await request.post(`${API}/api/v1/qc-inspections/${qcId}/disposition`, {
      headers: { Origin: ORIGIN },
      data: {
        disposition: 'QUARANTINE',
        notes: 'Quarantined pending leak test confirmation',
      },
    });
    expect(dispRes.status()).toBe(200);
    const dispBody = await dispRes.json();
    expect(dispBody.data.disposition).toBe('QUARANTINE');

    // 11. Log Machine Downtime
    const downRes = await request.post(`${API}/api/v1/downtime-logs`, {
      headers: { Origin: ORIGIN },
      data: {
        machine_id: testMachCode,
        category: 'MECHANICAL',
        reason_code: 'NOZZLE_CLOG',
        duration_minutes: 45,
        comments: 'Purged nozzle and adjusted temperature zone 2',
      },
    });
    expect(downRes.status()).toBe(201);

    // 12. Create Preventive Maintenance Schedule
    const pmRes = await request.post(`${API}/api/v1/maintenance-schedules`, {
      headers: { Origin: ORIGIN },
      data: {
        machine_id: testMachCode,
        frequency_type: 'DAYS',
        threshold_value: 30,
        task_description: 'Hydraulic Oil Filter Replacement & Toggle Lubrication',
        status: 'ACTIVE',
      },
    });
    expect(pmRes.status()).toBe(201);

    // 13. Create & Close Breakdown Ticket
    const brkRes = await request.post(`${API}/api/v1/breakdown-tickets`, {
      headers: { Origin: ORIGIN },
      data: {
        ticket_number: testTicketNo,
        machine_id: testMachCode,
        fault_category: 'ELECTRICAL',
        symptom: 'Heater band 3 open circuit error',
        severity: 'HIGH',
        status: 'OPEN',
      },
    });
    expect(brkRes.status()).toBe(201);
    const brkBody = await brkRes.json();
    const brkId = brkBody.data.id;

    const closeBrkRes = await request.post(`${API}/api/v1/breakdown-tickets/${brkId}/close`, {
      headers: { Origin: ORIGIN },
      data: {
        action_taken: 'Replaced ceramic heater band and recalibrated PID controller',
      },
    });
    expect(closeBrkRes.status()).toBe(200);
    const closeBrkBody = await closeBrkRes.json();
    expect(closeBrkBody.data.status).toBe('CLOSED');
    expect(closeBrkBody.data.action_taken).toContain('Replaced ceramic heater band');
  });
});
