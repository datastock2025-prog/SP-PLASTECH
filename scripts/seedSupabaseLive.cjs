const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables or defaults
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:8000';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Supabase Key not found in .env. Please set VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function runSeed() {
  console.log(`🚀 Starting Full End-to-End Database Seeding to ${supabaseUrl}...`);

  // 1. Seed Warehouses
  console.log('📦 Seeding Warehouses...');
  const warehouses = [
    { id: 'WH-MAIN', code: 'WH-MAIN', name: 'Main Raw Material & Finished Goods Warehouse', plant_id: 'SP-PLASTECH-01', location_type: 'INTERNAL', address: 'Plot 42, SP Plastech Industrial Area' },
    { id: 'WH-SHOPFLOOR', code: 'WH-SHOPFLOOR', name: 'Shopfloor WIP & Staging Area', plant_id: 'SP-PLASTECH-01', location_type: 'INTERNAL', address: 'Building A, Bay 1' },
    { id: 'WH-QUARANTINE', code: 'WH-QUARANTINE', name: 'QC Quarantine & Inspection Holding', plant_id: 'SP-PLASTECH-01', location_type: 'INTERNAL', address: 'Building B, QC Dock' }
  ];
  const { error: whErr } = await supabase.from('warehouses').upsert(warehouses, { onConflict: 'id' });
  if (whErr) console.warn('Warehouse upsert warning:', whErr.message);
  else console.log('✅ Warehouses seeded.');

  // 2. Seed Machines
  console.log('⚙️ Seeding Machines...');
  const machines = [
    { id: 'MCH-ENGEL-01', machine_code: 'ENGEL-650T-01', name: 'Engel 650T Duo Injection Molding', machine_type: 'Hydraulic Injection', tonnage: 650, manufacturer: 'Engel Austria', plant_location: 'Shopfloor Bay 1', status: 'RUNNING', oee_percentage: 88.5 },
    { id: 'MCH-ENGEL-02', machine_code: 'ENGEL-450T-02', name: 'Engel 450T Victory Tie-bar-less', machine_type: 'Hydraulic Injection', tonnage: 450, manufacturer: 'Engel Austria', plant_location: 'Shopfloor Bay 1', status: 'RUNNING', oee_percentage: 91.2 },
    { id: 'MCH-TOSHIBA-01', machine_code: 'TOSH-350T-01', name: 'Toshiba EC350SX All-Electric', machine_type: 'All-Electric Injection', tonnage: 350, manufacturer: 'Toshiba Machine', plant_location: 'Shopfloor Bay 2', status: 'RUNNING', oee_percentage: 94.0 },
    { id: 'MCH-ARBURG-01', machine_code: 'ARB-200T-01', name: 'Arburg Allrounder 570A', machine_type: 'Electric Injection', tonnage: 200, manufacturer: 'Arburg Germany', plant_location: 'Shopfloor Bay 2', status: 'IDLE', oee_percentage: 86.4 },
    { id: 'MCH-L&T-01', machine_code: 'LT-150T-01', name: 'L&T Plastics 150T Machine', machine_type: 'Hydraulic', tonnage: 150, manufacturer: 'L&T Demag', plant_location: 'Shopfloor Bay 3', status: 'MAINTENANCE', oee_percentage: 79.0 }
  ];
  const { error: mchErr } = await supabase.from('machines').upsert(machines, { onConflict: 'id' });
  if (mchErr) console.warn('Machines upsert warning:', mchErr.message);
  else console.log('✅ Machines seeded.');

  // 3. Seed Customers
  console.log('🏢 Seeding Customers...');
  const customers = [
    { id: 'CUST-TATA-01', code: 'CUST-TATA-01', name: 'Tata Motors Limited (Passenger Vehicles)', customer_type: 'OEM', tier: 'Tier 1', gstin: '27AAACT2727Q1ZW', credit_limit: 5000000, credit_days: 60, status: 'active' },
    { id: 'CUST-M&M-02', code: 'CUST-M&M-02', name: 'Mahindra & Mahindra Automotive Div', customer_type: 'OEM', tier: 'Tier 1', gstin: '27AAACM1111Q1ZX', credit_limit: 4000000, credit_days: 45, status: 'active' },
    { id: 'CUST-BAJAJ-03', code: 'CUST-BAJAJ-03', name: 'Bajaj Auto Ltd (2-Wheeler / 3-Wheeler)', customer_type: 'OEM', tier: 'Tier 1', gstin: '27AAACB2222Q1ZY', credit_limit: 3500000, credit_days: 45, status: 'active' }
  ];
  const { error: custErr } = await supabase.from('customers').upsert(customers, { onConflict: 'id' });
  if (custErr) console.warn('Customers upsert warning:', custErr.message);
  else console.log('✅ Customers seeded.');

  // 4. Seed Suppliers from liveSuppliersCatalog if available
  try {
    const suppliersFile = path.join(__dirname, '..', 'src', 'data', 'liveSuppliersCatalog.ts');
    if (fs.existsSync(suppliersFile)) {
      const content = fs.readFileSync(suppliersFile, 'utf8');
      const match = content.match(/export const liveSuppliersCatalog:\s*Supplier\[\]\s*=\s*(\[[\s\S]*?\]);/);
      if (match) {
        // Quick parse or batch upsert
        const parsed = JSON.parse(match[1]);
        console.log(`🏭 Found ${parsed.length} live suppliers to seed...`);
        const batchSize = 50;
        for (let i = 0; i < parsed.length; i += batchSize) {
          const batch = parsed.slice(i, i + batchSize).map(s => ({
            id: s.id || s.code,
            code: s.code,
            name: s.name,
            legal_name: s.legalName || s.name,
            category: s.category || 'Raw Materials',
            type: s.type || 'Manufacturer',
            status: s.status || 'active',
            rating: s.rating || 4.5,
            risk_level: s.riskLevel || 'Low',
            country: s.country || 'India',
            currency: s.currency || 'INR (₹)',
            payment_terms: s.paymentTerms || 'Net 60 Days',
            delivery_terms: s.deliveryTerms || 'Ex Work',
            lead_time_days: s.leadTimeDays || 7,
            minimum_order_value: s.minimumOrderValue || 25000,
            moq: s.moq || 1000,
            contacts: s.contacts || [],
            addresses: s.addresses || [],
            banking_tax: s.bankingTax || {},
            compliance: s.compliance || {},
            scorecard: s.scorecard || {}
          }));
          const { error: supErr } = await supabase.from('suppliers').upsert(batch, { onConflict: 'id' });
          if (supErr) console.warn(`Batch ${i} error:`, supErr.message);
        }
        console.log('✅ Live suppliers catalog seeded.');
      }
    }
  } catch (err) {
    console.warn('Suppliers catalog parser note:', err.message);
  }

  // 5. Seed Items from masterItemsCatalog if available
  try {
    const itemsFile = path.join(__dirname, '..', 'src', 'data', 'masterItemsCatalog.ts');
    if (fs.existsSync(itemsFile)) {
      const content = fs.readFileSync(itemsFile, 'utf8');
      const match = content.match(/export const masterItemsCatalog:\s*MasterItem\[\]\s*=\s*(\[[\s\S]*?\]);/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        console.log(`📦 Found ${parsed.length} live master items to seed...`);
        const batchSize = 50;
        for (let i = 0; i < parsed.length; i += batchSize) {
          const batch = parsed.slice(i, i + batchSize).map(item => ({
            code: item.code,
            name: item.name,
            category: item.category || 'Molded Parts',
            entity_type: item.entityType || 'Finished Molded Component',
            unit: item.unit || 'NOS',
            stock: item.stock || 0,
            min_stock: item.minStock || 0,
            max_stock: item.maxStock || 0,
            reorder_point: item.reorderPoint || 0,
            cost: item.cost || 0,
            selling_price: item.sellingPrice || 0,
            approval: 'approved',
            status: item.status || 'active',
            part_weight_grams: item.partWeightGrams || 0,
            runner_weight_grams: item.runnerWeightGrams || 0,
            cavity_count: item.cavityCount || 1,
            cycle_time_seconds: item.cycleTime || 0,
            item_group: item.itemGroup || '',
            resin_type: item.resinType || '',
            color: item.color || '',
            hsn_code: item.hsnCode || ''
          }));
          const { error: itemErr } = await supabase.from('items').upsert(batch, { onConflict: 'code' });
          if (itemErr) console.warn(`Item Batch ${i} error:`, itemErr.message);
        }
        console.log('✅ Master items catalog seeded.');
      }
    }
  } catch (err) {
    console.warn('Master items parser note:', err.message);
  }

  console.log('🎉 Full End-to-End Seeding complete!');
}

runSeed().catch(console.error);
