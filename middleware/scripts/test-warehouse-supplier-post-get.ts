async function testWarehouseAndSupplier() {
  console.log('Testing Warehouse & Supplier POST & GET directly against Hono...');

  // 1. Authenticate
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

  const cookieHeader = authRes.headers.get('set-cookie');
  if (!cookieHeader) throw new Error('No auth cookie');
  const sessionCookie = cookieHeader.split(';')[0];
  console.log('✅ Authenticated');

  // 2. Test Warehouse POST & GET
  const testWhCode = `WH-TEST-${Date.now().toString().slice(-4)}`;
  console.log(`\nTesting Warehouse POST /api/v1/warehouses (${testWhCode})...`);
  const whRes = await fetch('http://localhost:4000/api/v1/warehouses', {
    method: 'POST',
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
    },
    body: JSON.stringify({
      code: testWhCode,
      name: `Test Warehouse ${testWhCode}`,
      location_type: 'RAW_MATERIAL',
      address: 'Industrial Sector 5, Pune',
      bins: [],
    }),
  });
  console.log(`   Warehouse POST Status: ${whRes.status}`);
  const whJson = await whRes.json();
  console.log('   Warehouse POST Response:', JSON.stringify(whJson.data, null, 2));

  // 3. Test Supplier POST & GET
  const testSupCode = `SUP-TEST-${Date.now().toString().slice(-4)}`;
  console.log(`\nTesting Supplier POST /api/v1/suppliers (${testSupCode})...`);
  const supRes = await fetch('http://localhost:4000/api/v1/suppliers', {
    method: 'POST',
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
    },
    body: JSON.stringify({
      code: testSupCode,
      name: `Test Supplier Co ${testSupCode}`,
      type: 'Raw Material',
      category: 'Raw Material',
      payment_terms: 'Net 30 Days',
      status: 'active',
    }),
  });
  console.log(`   Supplier POST Status: ${supRes.status}`);
  const supJson = await supRes.json();
  console.log('   Supplier POST Response:', JSON.stringify(supJson.data, null, 2));

  // 4. Test Warehouse GET list
  const whListRes = await fetch('http://localhost:4000/api/v1/warehouses?limit=10', {
    headers: { 'Cookie': sessionCookie },
  });
  const whListJson = await whListRes.json();
  const whFound = (whListJson.data || []).some((w: any) => w.code === testWhCode);
  console.log(`\n✅ Warehouse persisted and verified in list: ${whFound}`);

  // 5. Test Supplier GET list
  const supListRes = await fetch('http://localhost:4000/api/v1/suppliers?limit=10', {
    headers: { 'Cookie': sessionCookie },
  });
  const supListJson = await supListRes.json();
  const supFound = (supListJson.data || []).some((s: any) => s.code === testSupCode);
  console.log(`✅ Supplier persisted and verified in list: ${supFound}`);
}

testWarehouseAndSupplier().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
