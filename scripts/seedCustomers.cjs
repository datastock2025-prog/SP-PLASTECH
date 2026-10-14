const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log(`\n======================================================`);
  console.log(`🚀 SP PLASTECH CUSTOMER MASTER -> SUPABASE DB UPLOADER`);
  console.log(`🎯 Target Supabase: ${supabaseUrl}`);
  console.log(`======================================================\n`);

  // Load liveCustomersCatalog
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'liveCustomersCatalog.ts');
  if (!fs.existsSync(catalogPath)) {
    console.error('❌ liveCustomersCatalog.ts not found.');
    process.exit(1);
  }

  const raw = fs.readFileSync(catalogPath, 'utf8');
  const jsonStart = raw.indexOf('[');
  const jsonEnd = raw.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd === -1) {
    console.error('❌ Failed to parse catalog array.');
    process.exit(1);
  }

  // Parse items safely using evaluation of the array literal
  const catalogArrayCode = raw.substring(jsonStart, jsonEnd + 1);
  const customersList = eval(`(${catalogArrayCode})`);
  console.log(`📋 Found ${customersList.length} customers to upload.`);

  const formattedCustomers = customersList.map(c => ({
    id: c.id || `CUST-${c.code}`,
    code: c.code,
    name: c.name,
    customer_type: c.customerType || 'OEM',
    tier: c.tier || 'Tier 1',
    gstin: c.gstin || null,
    credit_limit: c.creditLimit || 1000000,
    credit_days: c.creditDays || 45,
    status: c.status || 'active',
    contacts: [
      {
        name: c.contactPerson || 'Commercial Officer',
        role: 'Primary Contact',
        email: c.email || '',
        phone: c.mobile || '',
        isPrimary: true
      }
    ],
    addresses: [
      {
        type: 'Billing',
        address: c.address || '',
        city: c.destination || 'Hosur',
        state: c.state || 'Tamil Nadu',
        country: 'India',
        isDefault: true
      }
    ]
  }));

  const batchSize = 40;
  for (let i = 0; i < formattedCustomers.length; i += batchSize) {
    const batch = formattedCustomers.slice(i, i + batchSize);
    console.log(`Uploading batch ${i + 1} to ${Math.min(i + batchSize, formattedCustomers.length)}...`);
    const { error } = await supabase
      .from('customers')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Batch error:`, error.message);
    } else {
      console.log(`✅ Batch ${i + 1} - ${Math.min(i + batchSize, formattedCustomers.length)} uploaded successfully.`);
    }
  }

  // Verify total count in Supabase
  const { count, error: countErr } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.warn('⚠️ Count error:', countErr.message);
  } else {
    console.log(`\n🎉 Total Customers in Supabase DB: ${count}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
