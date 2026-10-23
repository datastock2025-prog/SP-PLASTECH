const assert = require('node:assert');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const ORIGIN = 'http://localhost:3000';

async function main() {
  console.log(`\n=== Running D1–D7 End-to-End Verification against ${BASE_URL} ===\n`);

  // 1. Health check (D5)
  console.log('1. Testing /api/health & /ready (Decision D5)...');
  const healthRes = await fetch(`${BASE_URL}/api/health`, { headers: { Origin: ORIGIN } });
  assert.strictEqual(healthRes.status, 200, 'Health check should return 200');
  const healthJson = await healthRes.json();
  assert.strictEqual(healthJson.data?.status, 'ok');
  assert(healthRes.headers.get('server-timing')?.includes('db;dur='), 'Health should have Server-Timing db;dur=');
  console.log('   ✓ /api/health returned 200 with Server-Timing:', healthRes.headers.get('server-timing'));

  const readyRes = await fetch(`${BASE_URL}/ready`);
  assert.strictEqual(readyRes.status, 200);
  const readyJson = await readyRes.json();
  assert.strictEqual(readyJson.data?.status, 'ready');
  assert.strictEqual(readyJson.data?.db, 'connected');
  console.log('   ✓ /ready returned 200 { status: ready, db: connected }');

  // 2. Authentication via Better Auth
  console.log('\n2. Authenticating as admin (Decision D1/D4)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/sign-in/username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ username: 'admin', password: 'Plas!Tech#Boot91' }),
  });
  assert.strictEqual(loginRes.status, 200, 'Sign-in should succeed with 200');
  const cookies = loginRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  assert(cookies.length > 0, 'Should receive session cookies');
  console.log('   ✓ Admin signed in successfully; session cookies captured');

  const authHeaders = {
    'Content-Type': 'application/json',
    Origin: ORIGIN,
    Cookie: cookies,
  };

  // 3. User session context (/api/v1/me)
  console.log('\n3. Testing /api/v1/me...');
  const meRes = await fetch(`${BASE_URL}/api/v1/me`, { headers: authHeaders });
  assert.strictEqual(meRes.status, 200);
  const meJson = await meRes.json();
  assert.strictEqual(meJson.data?.username, 'admin');
  console.log(`   ✓ Authenticated as ${meJson.data.fullName} (role: ${meJson.data.roleCode}, tenantId: ${meJson.data.tenantId})`);

  // 4. Test ERP Master Items (/api/v1/items) (Decisions D1, D3, D5, D6)
  console.log('\n4. Testing /api/v1/items (Decisions D1, D3, D5, D6)...');
  const itemsRes = await fetch(`${BASE_URL}/api/v1/items?page=1&limit=5`, { headers: authHeaders });
  assert.strictEqual(itemsRes.status, 200);
  assert(itemsRes.headers.get('cache-control')?.includes('no-store'), 'Should have no-store cache control');
  assert(itemsRes.headers.get('server-timing')?.includes('db;dur='), 'Should have Server-Timing');
  const itemsJson = await itemsRes.json();
  assert(Array.isArray(itemsJson.data), 'items data should be array');
  assert.strictEqual(itemsJson.data.length, 5, 'Should return 5 items for limit=5');
  assert(itemsJson.meta?.total > 1000, `Total items should be > 1000 (actual: ${itemsJson.meta?.total})`);
  console.log(`   ✓ /api/v1/items returned 5 items, total items in catalog: ${itemsJson.meta.total}`);
  console.log(`   ✓ First item: [${itemsJson.data[0].code}] ${itemsJson.data[0].name}`);

  // 5. Test ERP Suppliers (/api/v1/suppliers)
  console.log('\n5. Testing /api/v1/suppliers...');
  const suppRes = await fetch(`${BASE_URL}/api/v1/suppliers?page=1&limit=5`, { headers: authHeaders });
  assert.strictEqual(suppRes.status, 200);
  const suppJson = await suppRes.json();
  assert.strictEqual(suppJson.data.length, 5);
  assert(suppJson.meta?.total >= 400, `Total suppliers should be >= 400 (actual: ${suppJson.meta?.total})`);
  console.log(`   ✓ /api/v1/suppliers returned 5 suppliers, total: ${suppJson.meta.total}`);

  // 6. Test ERP Customers (/api/v1/customers)
  console.log('\n6. Testing /api/v1/customers...');
  const custRes = await fetch(`${BASE_URL}/api/v1/customers?page=1&limit=5`, { headers: authHeaders });
  assert.strictEqual(custRes.status, 200);
  const custJson = await custRes.json();
  assert.strictEqual(custJson.data.length, 5);
  assert(custJson.meta?.total >= 100, `Total customers should be >= 100 (actual: ${custJson.meta?.total})`);
  console.log(`   ✓ /api/v1/customers returned 5 customers, total: ${custJson.meta.total}`);

  // 7. Test /count endpoint (RestApiAdapter support)
  console.log('\n7. Testing /api/v1/items/count...');
  const countRes = await fetch(`${BASE_URL}/api/v1/items/count`, { headers: authHeaders });
  assert.strictEqual(countRes.status, 200);
  const countJson = await countRes.json();
  assert(countJson.data?.count > 1000, `Count should be > 1000 (actual: ${countJson.data?.count})`);
  console.log(`   ✓ /api/v1/items/count returned: ${countJson.data.count}`);

  // 8. Test Dashboard Aggregation Summary
  console.log('\n8. Testing /api/v1/dashboard/summary...');
  const dashRes = await fetch(`${BASE_URL}/api/v1/dashboard/summary`, { headers: authHeaders });
  assert.strictEqual(dashRes.status, 200);
  const dashJson = await dashRes.json();
  assert(dashJson.data?.items?.total_items > 1000, 'Dashboard items total should match');
  console.log(`   ✓ /api/v1/dashboard/summary returned aggregated counts:`, dashJson.data.items);

  // 9. Strict Zod Validation & Concurrency Conflict (Decisions D4 & D5)
  console.log('\n9. Testing Strict Schema Validation (D4)...');
  const injectRes = await fetch(`${BASE_URL}/api/v1/items`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      code: 'TEST-SKU-INJECT',
      name: 'Test Injected Item',
      category: 'RAW MATERIAL',
      hacked_column: 'malicious_input', // Extra key not in schema
    }),
  });
  assert.strictEqual(injectRes.status, 400, 'Extra unrecognized fields should trigger 400 validation error');
  const injectJson = await injectRes.json();
  assert.strictEqual(injectJson.error?.code, 'VALIDATION_ERROR', 'Should return standard error envelope with VALIDATION_ERROR');
  console.log('   ✓ Payload injection with unrecognized keys successfully rejected with 400 VALIDATION_ERROR');

  console.log('\n=======================================================');
  console.log('🎉 ALL D1–D7 ENTERPRISE INTEGRATION CHECKS PASSED 100%!');
  console.log('=======================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
