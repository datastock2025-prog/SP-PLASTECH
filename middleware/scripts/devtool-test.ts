/**
 * DevTools API Inspection & Screen Network Test Harness
 * Tests all backend REST endpoints and Vite frontend proxy endpoints.
 */

interface EndpointTest {
  name: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
}

const ENDPOINTS: EndpointTest[] = [
  // Core Infrastructure
  { name: 'Backend Health Check', url: 'http://localhost:4000/health' },
  { name: 'OpenAPI Schema', url: 'http://localhost:4000/api/v1/openapi.json' },
  { name: 'Frontend Proxy Health', url: 'http://localhost:3000/api/health' },
  
  // Master Data & Catalog
  { name: 'Items Catalog (Unauthenticated check)', url: 'http://localhost:4000/api/v1/items?limit=5' },
  { name: 'Items Summary Stats', url: 'http://localhost:4000/api/v1/items/summary' },
  { name: 'BOMs Catalog', url: 'http://localhost:4000/api/v1/boms?limit=5' },
  { name: 'Machines Master', url: 'http://localhost:4000/api/v1/machines?limit=5' },
  
  // Production & Manufacturing
  { name: 'Work Orders', url: 'http://localhost:4000/api/v1/work-orders?limit=5' },
  
  // Commercial & Sales
  { name: 'Sales Orders', url: 'http://localhost:4000/api/v1/sales-orders?limit=5' },
  { name: 'Customers Directory', url: 'http://localhost:4000/api/v1/customers?limit=5' },
  
  // Procurement
  { name: 'Purchase Orders', url: 'http://localhost:4000/api/v1/purchase-orders?limit=5' },
  { name: 'Suppliers Directory', url: 'http://localhost:4000/api/v1/suppliers?limit=5' },

  // Warehouse
  { name: 'Warehouse Stock', url: 'http://localhost:4000/api/v1/stock?limit=5' },

  // Quality
  { name: 'Quality NCRs', url: 'http://localhost:4000/api/v1/ncrs?limit=5' },
];

async function runTests() {
  console.log('================================================================');
  console.log('🔍 SP-PLASTECH DEVTOOLS NETWORK & API HARNESS TEST');
  console.log('================================================================\n');

  const results: any[] = [];

  for (const ep of ENDPOINTS) {
    const t0 = performance.now();
    try {
      const res = await fetch(ep.url, {
        method: ep.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(ep.headers || {}),
        },
      });
      const latencyMs = Math.round(performance.now() - t0);
      let bodyText = await res.text();
      let bodyJson: any = null;
      try {
        bodyJson = JSON.parse(bodyText);
      } catch {}

      const isSuccess = res.status >= 200 && res.status < 300;
      const isAuthProtected = res.status === 401;

      results.push({
        name: ep.name,
        url: ep.url,
        status: res.status,
        latencyMs,
        isSuccess,
        isAuthProtected,
        summary: isSuccess
          ? (Array.isArray(bodyJson?.data) ? `${bodyJson.data.length} records returned` : 'OK')
          : (bodyJson?.error?.code || bodyJson?.message || bodyText.slice(0, 80)),
      });

      const icon = isSuccess ? '✅' : (isAuthProtected ? '🔒' : '❌');
      console.log(`${icon} [${res.status}] ${ep.name} (${latencyMs}ms) -> ${results[results.length - 1].summary}`);
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      results.push({
        name: ep.name,
        url: ep.url,
        status: 'FETCH_ERROR',
        latencyMs,
        error: err.message,
      });
      console.log(`❌ [FETCH_ERROR] ${ep.name} (${latencyMs}ms) -> ${err.message}`);
    }
  }

  console.log('\n================================================================');
  console.log('📊 SUMMARY REPORT:');
  const total = results.length;
  const passed = results.filter(r => r.isSuccess).length;
  const authProtected = results.filter(r => r.isAuthProtected).length;
  const failed = results.filter(r => !r.isSuccess && !r.isAuthProtected).length;

  console.log(`Total Endpoints Tested: ${total}`);
  console.log(`Passing (Public/Open): ${passed}`);
  console.log(`Protected (Require Session Cookie): ${authProtected}`);
  console.log(`Failed / Unreachable: ${failed}`);
  console.log('================================================================\n');
}

runTests().catch(console.error);
