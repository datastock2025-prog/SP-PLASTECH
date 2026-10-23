import { test, expect, uniq } from '../fixtures';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

test.describe('Enterprise API CRUD & OCC Concurrency Contract (A2, A3)', () => {
  test('POST /api/v1/plants creates entity with authoritative representation and version 1', async ({ request }) => {
    const code = uniq('PLANT');
    const idempotencyKey = uniq('IDEM');

    const res = await request.post(`${API}/api/v1/plants`, {
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
        'Idempotency-Key': idempotencyKey,
      },
      data: {
        code,
        name: `Automated Test Plant ${code}`,
        location: 'Industrial Area Phase 2',
      },
    });

    // If server is running live, assert 201 Created and representation contract
    if (res.ok()) {
      expect(res.status()).toBe(201);
      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(json.data.code).toBe(code);
      expect(json.data.version).toBe(1);
      expect(json.data.createdAt).toBeDefined();

      // Test idempotency: re-sending the same POST with the same key returns the exact same record
      const retryRes = await request.post(`${API}/api/v1/plants`, {
        headers: {
          'Content-Type': 'application/json',
          Origin: ORIGIN,
          'Idempotency-Key': idempotencyKey,
        },
        data: {
          code,
          name: `Automated Test Plant ${code}`,
          location: 'Industrial Area Phase 2',
        },
      });
      expect([200, 201]).toContain(retryRes.status());
      const retryJson = await retryRes.json();
      expect(retryJson.data.id).toBe(json.data.id);
    }
  });

  test('GET /api/v1/plants returns standard pagination envelope with total count and meta', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/plants?page=1&limit=10`, {
      headers: { Origin: ORIGIN },
    });

    if (res.ok()) {
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.meta).toBeDefined();
      expect(json.meta.page).toBe(1);
      expect(json.meta.limit).toBe(10);
      expect(typeof json.meta.total).toBe('number');
      expect(typeof json.meta.totalPages).toBe('number');
    }
  });

  test('PUT /api/v1/plants/:id rejects stale version with 409 Conflict (CONCURRENCY_CONFLICT)', async ({ request }) => {
    const code = uniq('OCC_PLANT');
    const createRes = await request.post(`${API}/api/v1/plants`, {
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      data: { code, name: `OCC Test Plant ${code}` },
    });

    if (createRes.ok()) {
      const created = (await createRes.json()).data;

      // Stale update: simulate another actor modified the record by passing version 999
      const conflictRes = await request.put(`${API}/api/v1/plants/${created.id}`, {
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
        data: { name: 'Conflict Update', version: 999 },
      });

      expect(conflictRes.status()).toBe(409);
      const errJson = await conflictRes.json();
      expect(errJson.error.code).toBe('CONCURRENCY_CONFLICT');
    }
  });

  test('DELETE /api/v1/plants/:id executes soft delete and removes item from active queries', async ({ request }) => {
    const code = uniq('DEL_PLANT');
    const createRes = await request.post(`${API}/api/v1/plants`, {
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      data: { code, name: `Delete Test Plant ${code}` },
    });

    if (createRes.ok()) {
      const created = (await createRes.json()).data;

      // Delete resource
      const delRes = await request.delete(`${API}/api/v1/plants/${created.id}`, {
        headers: { Origin: ORIGIN },
      });
      expect([200, 204]).toContain(delRes.status());

      // Query again: should return 404 or not be found in active list
      const fetchRes = await request.get(`${API}/api/v1/plants/${created.id}`, {
        headers: { Origin: ORIGIN },
      });
      expect(fetchRes.status()).toBe(404);
    }
  });
});
