/**
 * DevTools API Inspection & Screen Network Test Harness (with Full Auth Session)
 */

async function runAuthenticatedTests() {
  console.log('================================================================');
  console.log('🔍 SP-PLASTECH DEVTOOLS AUTHENTICATED API TEST');
  console.log('================================================================\n');

  // Step 1: Sign In via Better Auth
  console.log('1. Authenticating as admin@spplastech.com...');
  const t0 = performance.now();
  const signInRes = await fetch('http://localhost:4000/api/auth/sign-in/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
    },
    body: JSON.stringify({
      email: 'admin@spplastech.com',
      password: 'Plas!Tech#Boot91',
    }),
  });

  const signInLatency = Math.round(performance.now() - t0);
  const cookieHeader = signInRes.headers.get('set-cookie');
  console.log(`SignIn Status: ${signInRes.status} (${signInLatency}ms)`);
  if (!signInRes.ok) {
    const txt = await signInRes.text();
    console.error('Sign-in failed:', txt);
    return;
  }

  // Extract session cookie
  const cookies = cookieHeader ? cookieHeader.split(';')[0] : '';
  console.log('Session Cookie Acquired:', cookies ? 'YES' : 'NO');

  // Step 2: Test all domain APIs with cookie
  const authEndpoints = [
    { name: 'Identity Me (/api/v1/me)', path: '/api/v1/me' },
    { name: 'Items Catalog (/api/v1/items?limit=10)', path: '/api/v1/items?limit=10' },
    { name: 'Items Catalog Summary (/api/v1/items/summary)', path: '/api/v1/items/summary' },
    { name: 'BOMs Catalog (/api/v1/boms?limit=5)', path: '/api/v1/boms?limit=5' },
    { name: 'Machines Master (/api/v1/machines?limit=5)', path: '/api/v1/machines?limit=5' },
    { name: 'Work Orders (/api/v1/work-orders?limit=5)', path: '/api/v1/work-orders?limit=5' },
    { name: 'Sales Orders (/api/v1/sales-orders?limit=5)', path: '/api/v1/sales-orders?limit=5' },
    { name: 'Customers Directory (/api/v1/customers?limit=5)', path: '/api/v1/customers?limit=5' },
    { name: 'Purchase Orders (/api/v1/purchase-orders?limit=5)', path: '/api/v1/purchase-orders?limit=5' },
    { name: 'Suppliers Directory (/api/v1/suppliers?limit=5)', path: '/api/v1/suppliers?limit=5' },
    { name: 'Warehouse Stock (/api/v1/stock?limit=5)', path: '/api/v1/stock?limit=5' },
    { name: 'Quality NCRs (/api/v1/ncrs?limit=5)', path: '/api/v1/ncrs?limit=5' },
  ];

  console.log('\n2. Testing Domain REST Endpoints:');
  const results: any[] = [];

  for (const ep of authEndpoints) {
    const tStart = performance.now();
    try {
      const res = await fetch(`http://localhost:4000${ep.path}`, {
        headers: {
          'Cookie': cookies,
          'Origin': 'http://localhost:3000',
        },
      });
      const latencyMs = Math.round(performance.now() - tStart);
      const body = await res.json().catch(() => ({}));

      const isSuccess = res.status >= 200 && res.status < 300;
      let summary = '';
      if (isSuccess) {
        if (Array.isArray(body?.data)) {
          summary = `${body.data.length} items (total: ${body.meta?.total ?? 'N/A'})`;
        } else if (body?.data) {
          summary = `Object: ${Object.keys(body.data).slice(0, 4).join(', ')}`;
        } else {
          summary = 'OK';
        }
      } else {
        summary = body?.error?.message || `HTTP ${res.status}`;
      }

      results.push({ name: ep.name, path: ep.path, status: res.status, latencyMs, isSuccess, summary });
      const icon = isSuccess ? '✅' : '❌';
      console.log(`${icon} [${res.status}] ${ep.name} (${latencyMs}ms) -> ${summary}`);
    } catch (err: any) {
      console.log(`❌ [ERROR] ${ep.name} -> ${err.message}`);
    }
  }

  console.log('\n================================================================');
  console.log('📊 AUTHENTICATED DOMAIN RESULTS:');
  console.log(`Total: ${results.length} | Passed: ${results.filter(r => r.isSuccess).length} | Failed: ${results.filter(r => !r.isSuccess).length}`);
  console.log('================================================================\n');
}

runAuthenticatedTests().catch(console.error);
