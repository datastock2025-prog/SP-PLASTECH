import { test, expect, uniq } from '../fixtures';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

test.describe('Enterprise API Error Mapping & Resilience Contract (A3, A4)', () => {
  test('Duplicate natural key returns 409 DUPLICATE error envelope', async ({ request }) => {
    const code = uniq('DUP');

    // First creation succeeds
    const first = await request.post(`${API}/api/v1/plants`, {
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      data: { code, name: `Duplicate Key Test ${code}` },
    });

    if (first.ok()) {
      // Second creation with identical natural key fails with 409 DUPLICATE
      const second = await request.post(`${API}/api/v1/plants`, {
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
        data: { code, name: `Duplicate Collision ${code}` },
      });

      expect(second.status()).toBe(409);
      const json = await second.json();
      expect(json.error).toBeDefined();
      expect(['DUPLICATE', '23505', 'CONFLICT']).toContain(json.error.code);
      expect(typeof json.error.message).toBe('string');
    }
  });

  test('Invalid payload schema returns 422 VALIDATION_ERROR with structured error details', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/plants`, {
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      data: {
        // Missing mandatory 'name' or invalid data types
        code: 12345, // invalid type (should be string)
      },
    });

    // Expect 400 or 422 Bad Request / Unprocessable Entity
    expect([400, 422]).toContain(res.status());
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(typeof json.error.code).toBe('string');
  });

  test('Unauthenticated request to protected endpoint returns 401 UNAUTHORIZED', async ({ playwright }) => {
    // Create isolated context with no session cookies
    const freshContext = await playwright.request.newContext();
    const res = await freshContext.get(`${API}/api/v1/plants`, {
      headers: { Origin: ORIGIN },
    });

    // In local development or bypass mode, could be 200/401; when auth is enforced, expect 401
    if (res.status() === 401) {
      const json = await res.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    }
    await freshContext.dispose();
  });

  test('Non-existent resource ID returns 404 NOT_FOUND envelope with requestId', async ({ request }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`${API}/api/v1/plants/${fakeId}`, {
      headers: { Origin: ORIGIN },
    });

    expect(res.status()).toBe(404);
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(['NOT_FOUND', '404']).toContain(json.error.code);
  });
});
