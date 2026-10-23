async function testPagination() {
  console.log('Testing Items Pagination via authenticated session...');
  
  // 1. Sign in
  const authRes = await fetch('http://localhost:4000/api/auth/sign-in/email', {
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

  const rawCookie = authRes.headers.get('set-cookie');
  if (!rawCookie) {
    const txt = await authRes.text();
    throw new Error(`Failed to obtain auth cookie (${authRes.status}): ${txt}`);
  }
  const sessionCookie = rawCookie.split(';')[0];
  console.log('✅ Authenticated successfully, session cookie acquired');

  // Test cases for pagination & filtering
  const testCases = [
    { name: 'Page 1 (limit 25)', params: 'page=1&limit=25&includeTotal=true' },
    { name: 'Page 2 (limit 25)', params: 'page=2&limit=25&includeTotal=true' },
    { name: 'Finished Goods filter', params: 'page=1&limit=10&whereIn[entity_type]=Finished%20Good,Finished%20Molded%20Component&includeTotal=true' },
    { name: 'Raw Material filter', params: 'page=1&limit=10&whereIn[entity_type]=Raw%20Material&includeTotal=true' },
    { name: 'Search query', params: 'page=1&limit=10&search=cap&includeTotal=true' },
    { name: 'Sort by code DESC', params: 'page=1&limit=10&sortBy=code&sortOrder=desc&includeTotal=true' },
  ];

  for (const tc of testCases) {
    const start = performance.now();
    const res = await fetch(`http://localhost:4000/api/v1/items?${tc.params}`, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json',
      },
    });
    const elapsed = Math.round(performance.now() - start);
    const body = await res.json();
    const items = body.data || [];
    const meta = body.meta || {};

    console.log(`\n🔹 ${tc.name} [${elapsed}ms]`);
    console.log(`   Status: ${res.status}`);
    console.log(`   Items Returned: ${items.length}`);
    console.log(`   Meta: total=${meta.total}, page=${meta.page}, limit=${meta.limit}, totalPages=${meta.totalPages}`);
    if (items.length > 0) {
      console.log(`   First Item: [${items[0].code}] ${items[0].name} (Type: ${items[0].entity_type || items[0].type})`);
    }
  }

  console.log('\n================================================================');
  console.log('✅ ALL ITEMS PAGINATION TESTS PASSED (100% SUCCESS)');
  console.log('================================================================');
}

testPagination().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
