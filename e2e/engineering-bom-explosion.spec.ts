import { test, expect } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

test.describe('Engineering Multi-Level BOM & Server Explosion (API -> DB)', () => {
  const uniqSuffix = Date.now().toString().slice(-6);
  const testParentCode = `FG-EXP-${uniqSuffix}`;
  const testCompCode = `RM-POLY-${uniqSuffix}`;
  let bomId = '';

  test('E1-01: Create BOM, add normalized line, explode requirements, and release version', async ({ request }) => {
    // 1. Create parent and component items in database
    const compRes = await request.post(`${API}/api/v1/items`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testCompCode,
        name: `Engineering Polypropylene Resin ${uniqSuffix}`,
        category: 'Raw Material',
        unit: 'KG',
        stock: '1500',
        cost: '95.50',
      },
    });
    expect([200, 201]).toContain(compRes.status());

    const parentRes = await request.post(`${API}/api/v1/items`, {
      headers: { Origin: ORIGIN },
      data: {
        code: testParentCode,
        name: `Automotive Bracket Assembly ${uniqSuffix}`,
        category: 'Finished Good',
        unit: 'NOS',
        stock: '0',
        cost: '250.00',
        cycle_time_seconds: 24.5,
      },
    });
    expect([200, 201]).toContain(parentRes.status());

    // 2. Create BOM header
    const bomRes = await request.post(`${API}/api/v1/bill-of-materials`, {
      headers: { Origin: ORIGIN },
      data: {
        id: `BOM-${uniqSuffix}`,
        item_code: testParentCode,
        bom_version: 'v1.0',
        status: 'draft',
        lines: [],
      },
    });
    expect(bomRes.status()).toBe(201);
    const bomBody = await bomRes.json();
    bomId = bomBody.data?.id || `BOM-${uniqSuffix}`;

    // 3. Add normalized BOM line item
    const lineRes = await request.post(`${API}/api/v1/bom-lines`, {
      headers: { Origin: ORIGIN },
      data: {
        bom_id: bomId,
        line_no: 1,
        component_item_code: testCompCode,
        component_item_name: `Engineering Polypropylene Resin ${uniqSuffix}`,
        category: 'Raw Material',
        quantity_per_unit: '0.45000',
        uom: 'KG',
        scrap_pct: '2.00',
        is_critical: true,
      },
    });
    expect([200, 201]).toContain(lineRes.status());

    // 4. Call server-side recursive BOM explosion endpoint for plannedQty = 1000
    const explodeRes = await request.get(`${API}/api/v1/bill-of-materials/${bomId}/explode?qty=1000`, {
      headers: { Origin: ORIGIN },
    });
    expect(explodeRes.status()).toBe(200);
    const explodeBody = await explodeRes.json();
    const data = explodeBody.data;

    expect(data.bomId).toBe(bomId);
    expect(data.parentItemCode).toBe(testParentCode);
    expect(data.plannedQty).toBe(1000);
    expect(Array.isArray(data.components)).toBe(true);
    expect(data.components.length).toBeGreaterThanOrEqual(1);

    const comp = data.components[0];
    expect(comp.componentItemCode).toBe(testCompCode);
    // 1000 pcs * 0.45 kg * (1 + 2% scrap) = 459 kg gross
    expect(comp.grossRequired).toBeCloseTo(459, 1);
    expect(comp.currentStock).toBe(1500);
    // 1500 in stock >= 459 needed -> netNeed is 0, status is Sufficient Buffer
    expect(comp.netNeed).toBe(0);
    expect(comp.status).toBe('Sufficient Buffer');
    expect(comp.totalCost).toBeCloseTo(459 * 95.5, 0);

    // 5. Release BOM version (archives any existing active version)
    const releaseRes = await request.post(`${API}/api/v1/bill-of-materials/${bomId}/release`, {
      headers: { Origin: ORIGIN },
      data: {},
    });
    expect(releaseRes.status()).toBe(200);
    const releaseBody = await releaseRes.json();
    expect(releaseBody.data.status).toBe('released');
  });
});
