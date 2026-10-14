import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { DOCUMENT_SUPPLIER_PRICE_LISTS } from '../src/data/liveSupplierPriceLists';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gqrelwvmeoqvfnanoutz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_RN013pGcuejquwnEeW-n3Q_Ly2qVu2R';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log(`\n======================================================`);
  console.log(`🚀 REBOOT ERP -> SEEDING SUPPLIER PRICE LISTS & CONTRACTS`);
  console.log(`🎯 Target: ${supabaseUrl}`);
  console.log(`📄 Records to seed: ${DOCUMENT_SUPPLIER_PRICE_LISTS.length}`);
  console.log(`======================================================\n`);

  const batchSize = 50;
  for (let i = 0; i < DOCUMENT_SUPPLIER_PRICE_LISTS.length; i += batchSize) {
    const batch = DOCUMENT_SUPPLIER_PRICE_LISTS.slice(i, i + batchSize).map(p => ({
      id: p.id,
      price_list_id: p.priceListId,
      supplier_id: p.supplierId,
      supplier_name: p.supplierName,
      group_category: p.groupCategory,
      item_code: p.itemCode,
      item_name: p.itemName,
      uom: p.uom,
      currency: p.currency,
      unit_price: p.unitPrice,
      effective_from: p.effectiveFrom,
      effective_to: p.effectiveTo,
      moq: p.moq,
      lead_time_days: p.leadTimeDays,
      price_type: p.priceType,
      index_reference: p.indexReference,
      base_index_value: p.baseIndexValue,
      adjustment_formula: p.adjustmentFormula,
      freight_included: p.freightIncluded,
      packing_included: p.packingIncluded,
      tax_pct: p.taxPct,
      status: p.status,
      tiers: p.tiers || []
    }));

    const { error } = await supabase.from('supplier_price_lists').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.warn(`  Batch ${i} note:`, error.message);
    } else {
      console.log(`  ✓ Seeded price lists ${i + 1} to ${Math.min(i + batchSize, DOCUMENT_SUPPLIER_PRICE_LISTS.length)}`);
    }
  }

  console.log(`\n🎉 Supplier Price Lists seeding completed!`);
}

main().catch(console.error);
