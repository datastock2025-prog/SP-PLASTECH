async function testItemSaveAndFetch() {
  console.log('Testing Item POST & GET directly against Hono...');
  
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

  const testSku = `TEST-MOLD-${Date.now().toString().slice(-4)}`;
  const itemPayload = {
    code: testSku,
    name: `Test Mold SKU ${testSku}`,
    category: 'Finished Good',
    entity_type: 'Finished Good',
    unit: 'PCS',
    stock: '100',
    cost: '45.50',
    selling_price: '75.00',
    status: 'active',
    approval: 'approved',
    cavity_count: 4,
    cycle_time: 28.5,
    cycle_time_seconds: 28.5,
    part_weight_grams: 142.5,
    runner_weight_grams: 14.0,
    resin_type: 'PP Copolymer',
  };

  console.log('\n1. Sending POST /api/v1/items...');
  const postRes = await fetch('http://localhost:4000/api/v1/items', {
    method: 'POST',
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
    },
    body: JSON.stringify(itemPayload),
  });

  console.log(`   POST Status: ${postRes.status}`);
  const postJson = await postRes.json();
  console.log('   POST Response:', JSON.stringify(postJson, null, 2));

  console.log('\n2. Sending GET /api/v1/items/' + testSku + '...');
  const getRes = await fetch(`http://localhost:4000/api/v1/items/${testSku}`, {
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json',
    },
  });

  console.log(`   GET Status: ${getRes.status}`);
  const getJson = await getRes.json();
  console.log('   GET Response data:', JSON.stringify(getJson.data, null, 2));
}

testItemSaveAndFetch().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
