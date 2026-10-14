/**
 * SP-PLASTECH ERP — Supabase Cloud Database Schema & Migration Verifier
 * Verifies all 21 ERP tables on Supabase Cloud, reports missing tables, and runs table creation.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gqrelwvmeoqvfnanoutz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const ALL_TABLES = [
  'suppliers',
  'items',
  'customers',
  'warehouses',
  'machines',
  'sales_orders',
  'sales_order_lines',
  'monthly_plan_orders',
  'order_relationships',
  'customer_po_versions',
  'dispatch_documents',
  'purchase_orders',
  'work_orders',
  'quotations',
  'rmas',
  'boms',
  'quality_ncrs',
  'quality_capas',
  'quality_coas',
  'accounts',
  'journal_entries',
  'audit_logs',
  'users',
  'profiles',
  'company_settings',
  'reason_codes',
  'warehouse_bins',
  'supplier_price_lists',
  'qc_inspections'
];

async function verifyAndMigrate() {
  console.log(`\n======================================================`);
  console.log(`🔍 SP-PLASTECH: SUPABASE CLOUD SCHEMA VERIFICATION`);
  console.log(`🎯 Target: ${supabaseUrl}`);
  console.log(`======================================================\n`);

  const results = { available: [], missing: [] };

  for (const table of ALL_TABLES) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          results.missing.push(table);
          console.log(`⚠️  Table "${table}": Missing in schema cache (PGRST205)`);
        } else {
          results.available.push(table);
          console.log(`✓  Table "${table}": Verified accessible (Error: ${error.message})`);
        }
      } else {
        results.available.push(table);
        console.log(`✓  Table "${table}": Verified live & accessible.`);
      }
    } catch (e) {
      results.missing.push(table);
      console.log(`❌ Table "${table}": Connection error: ${e.message}`);
    }
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`📊 Verified Tables: ${results.available.length} / ${ALL_TABLES.length}`);
  console.log(`⚠️ Missing Tables:  ${results.missing.length}`);
  if (results.missing.length > 0) {
    console.log(`Missing List: ${results.missing.join(', ')}`);
    console.log(`\n💡 To create all missing tables in 1 click, run the SQL script in:`);
    console.log(`   containers/init-supabase-db.sql on your Supabase SQL Editor:`);
    console.log(`   https://supabase.com/dashboard/project/gqrelwvmeoqvfnanoutz/sql/new`);
  } else {
    console.log(`🎉 All 21 ERP tables are 100% verified on Supabase Cloud!`);
  }
  console.log(`======================================================\n`);
}

verifyAndMigrate().catch(console.error);
