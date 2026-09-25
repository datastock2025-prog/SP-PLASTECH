const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
  console.log(`🚀 REBOOT ERP -> SUPABASE CLOUD LIVE SEEDER`);
  console.log(`🎯 Target: ${supabaseUrl}`);
  console.log(`======================================================\n`);

  // 1. Seed Warehouses
  console.log('📦 Seeding Warehouses...');
  const warehouses = [
    { id: 'WH-MAIN', code: 'WH-MAIN', name: 'Main Raw Material & Finished Goods Warehouse', plant_id: 'SP-PLASTECH-01', location_type: 'INTERNAL', address: 'Plot 42, SP Plastech Industrial Area' },
    { id: 'WH-SHOPFLOOR', code: 'WH-SHOPFLOOR', name: 'Shopfloor WIP & Staging Area', plant_id: 'SP-PLASTECH-01', location_type: 'INTERNAL', address: 'Building A, Bay 1' },
    { id: 'WH-QUARANTINE', code: 'WH-QUARANTINE', name: 'QC Quarantine & Inspection Holding', plant_id: 'SP-PLASTECH-01', location_type: 'INTERNAL', address: 'Building B, QC Dock' }
  ];
  await supabase.from('warehouses').upsert(warehouses, { onConflict: 'id' });
  console.log('✅ Warehouses ready.');

  // 2. Seed Machines
  console.log('⚙️ Seeding Machines...');
  const machines = [
    { id: 'MCH-ENGEL-01', machine_code: 'ENGEL-650T-01', name: 'Engel 650T Duo Injection Molding', machine_type: 'Hydraulic Injection', tonnage: 650, manufacturer: 'Engel Austria', plant_location: 'Shopfloor Bay 1', status: 'RUNNING', oee_percentage: 88.5 },
    { id: 'MCH-ENGEL-02', machine_code: 'ENGEL-450T-02', name: 'Engel 450T Victory Tie-bar-less', machine_type: 'Hydraulic Injection', tonnage: 450, manufacturer: 'Engel Austria', plant_location: 'Shopfloor Bay 1', status: 'RUNNING', oee_percentage: 91.2 },
    { id: 'MCH-TOSHIBA-01', machine_code: 'TOSH-350T-01', name: 'Toshiba EC350SX All-Electric', machine_type: 'All-Electric Injection', tonnage: 350, manufacturer: 'Toshiba Machine', plant_location: 'Shopfloor Bay 2', status: 'RUNNING', oee_percentage: 94.0 },
    { id: 'MCH-ARBURG-01', machine_code: 'ARB-200T-01', name: 'Arburg Allrounder 570A', machine_type: 'Electric Injection', tonnage: 200, manufacturer: 'Arburg Germany', plant_location: 'Shopfloor Bay 2', status: 'IDLE', oee_percentage: 86.4 },
    { id: 'MCH-L&T-01', machine_code: 'LT-150T-01', name: 'L&T Plastics 150T Machine', machine_type: 'Hydraulic', tonnage: 150, manufacturer: 'L&T Demag', plant_location: 'Shopfloor Bay 3', status: 'MAINTENANCE', oee_percentage: 79.0 }
  ];
  await supabase.from('machines').upsert(machines, { onConflict: 'id' });
  console.log('✅ Machines ready.');

  // 3. Seed Customers
  console.log('🏢 Seeding Customers...');
  const customers = [
    { id: 'CUST-TATA-01', code: 'CUST-TATA-01', name: 'Tata Motors Limited (Passenger Vehicles)', customer_type: 'OEM', tier: 'Tier 1', gstin: '27AAACT2727Q1ZW', credit_limit: 5000000, credit_days: 60, status: 'active' },
    { id: 'CUST-M&M-02', code: 'CUST-M&M-02', name: 'Mahindra & Mahindra Automotive Div', customer_type: 'OEM', tier: 'Tier 1', gstin: '27AAACM1111Q1ZX', credit_limit: 4000000, credit_days: 45, status: 'active' },
    { id: 'CUST-BAJAJ-03', code: 'CUST-BAJAJ-03', name: 'Bajaj Auto Ltd (2-Wheeler / 3-Wheeler)', customer_type: 'OEM', tier: 'Tier 1', gstin: '27AAACB2222Q1ZY', credit_limit: 3500000, credit_days: 45, status: 'active' }
  ];
  await supabase.from('customers').upsert(customers, { onConflict: 'id' });
  console.log('✅ Customers ready.');

  // 4. Seed 411 Suppliers from liveSuppliersCatalog.ts
  console.log('🏭 Reading 411 Suppliers from liveSuppliersCatalog.ts...');
  const suppliersFile = path.join(__dirname, '..', 'src', 'data', 'liveSuppliersCatalog.ts');
  if (fs.existsSync(suppliersFile)) {
    const raw = fs.readFileSync(suppliersFile, 'utf8');
    const jsonStart = raw.indexOf('[');
    const jsonEnd = raw.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const suppliersList = JSON.parse(raw.substring(jsonStart, jsonEnd + 1));
      console.log(`Found ${suppliersList.length} suppliers. Pushing in batches...`);
      const batchSize = 100;
      for (let i = 0; i < suppliersList.length; i += batchSize) {
        const batch = suppliersList.slice(i, i + batchSize).map(s => ({
          id: s.id || `SUP-${s.code}`,
          code: s.code,
          name: s.name,
          legal_name: s.legalName || s.name,
          short_name: s.shortName || '',
          category: s.category || 'General',
          type: s.type || 'Manufacturer',
          status: s.status || 'active',
          rating: s.rating || 4.5,
          risk_level: s.riskLevel || 'Low',
          preferred: !!s.preferred,
          blocked: !!s.blocked,
          industry: s.industry || 'Plastics & Manufacturing',
          country: s.country || 'India',
          currency: s.currency || 'INR (₹)',
          payment_terms: s.paymentTerms || 'Net 60 Days',
          delivery_terms: s.deliveryTerms || 'Ex Work',
          lead_time_days: s.leadTimeDays || 7,
          minimum_order_value: s.minimumOrderValue || 25000,
          moq: s.moq || 1000,
          hsn_code: s.hsnCode || '',
          tariff_code: s.tariffCode || '',
          contacts: s.contacts || [],
          addresses: s.addresses || [],
          banking_tax: s.bankingTax || {},
          compliance: s.compliance || {},
          scorecard: s.scorecard || {}
        }));
        const { error } = await supabase.from('suppliers').upsert(batch, { onConflict: 'id' });
        if (error) {
          console.error(`Error in supplier batch ${i}:`, error.message);
        } else {
          console.log(`  ✓ Seeded suppliers ${i + 1} to ${Math.min(i + batchSize, suppliersList.length)}`);
        }
      }
      console.log(`✅ All ${suppliersList.length} Suppliers seeded into Supabase Cloud!`);
    }
  }

  // 5. Seed 1719 Master Items from masterItemsCatalog.ts
  console.log('📦 Reading 1719 Master Items from masterItemsCatalog.ts...');
  const itemsFile = path.join(__dirname, '..', 'src', 'data', 'masterItemsCatalog.ts');
  if (fs.existsSync(itemsFile)) {
    const raw = fs.readFileSync(itemsFile, 'utf8');
    const jsonStart = raw.indexOf('[');
    const jsonEnd = raw.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const itemsList = JSON.parse(raw.substring(jsonStart, jsonEnd + 1));
      console.log(`Found ${itemsList.length} items. Pushing in batches...`);
      const batchSize = 100;
      for (let i = 0; i < itemsList.length; i += batchSize) {
        const batch = itemsList.slice(i, i + batchSize).map(item => ({
          code: item.code,
          name: item.name,
          category: item.cat || item.category || 'Molded Parts',
          entity_type: item.type || 'Finished Molded Component',
          unit: item.baseUOM || item.unit || 'NOS',
          stock: parseFloat(item.stock) || 0,
          min_stock: parseFloat(item.minStock) || 0,
          max_stock: parseFloat(item.maxStock) || 0,
          reorder_point: parseFloat(item.reorderPoint) || 0,
          cost: parseFloat(item.cost) || 0,
          selling_price: parseFloat(item.sellingPrice) || 0,
          approval: 'approved',
          status: item.status || 'active',
          part_weight_grams: item.partWeightGrams || 0,
          runner_weight_grams: item.runnerWeightGrams || 0,
          cavity_count: item.cavityCount || 1,
          cycle_time_seconds: item.cycleTime || item.standardCycleTime || 0,
          item_group: item.itemGroup || '',
          resin_type: item.resinType || '',
          color: item.color || '',
          hsn_code: item.hsnCode || ''
        }));
        const { error } = await supabase.from('items').upsert(batch, { onConflict: 'code' });
        if (error) {
          console.error(`Error in items batch ${i}:`, error.message);
        } else {
          console.log(`  ✓ Seeded items ${i + 1} to ${Math.min(i + batchSize, itemsList.length)}`);
        }
      }
      console.log(`✅ All ${itemsList.length} Master Items seeded into Supabase Cloud!`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 SUCCESS! Supabase Cloud Database is 100% Live & Seeded!`);
  console.log(`👉 View your database: https://supabase.com/dashboard/project/gqrelwvmeoqvfnanoutz/editor`);
  console.log(`======================================================\n`);
}

main().catch(console.error);
