import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { itemRepository } from './items.repository.js';
import * as schema from '../../schema/erp.js';

async function runPilotItemPGliteSuite() {
  console.log('🚀 [PGlite Test] Starting Item Master Drizzle Test Suite...');
  const t0 = performance.now();

  // 1. In-memory WASM Postgres instance (Zero Docker needed)
  const pglite = new PGlite();
  const db = drizzle(pglite, { schema }) as any;

  // 2. Provision items DDL schema in-memory via exec (multi-statement DDL)
  await pglite.exec(`
    CREATE TABLE items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      entity_type TEXT DEFAULT 'Finished Molded Component',
      unit TEXT DEFAULT 'NOS',
      stock NUMERIC(12, 2) DEFAULT 0,
      min_stock NUMERIC(12, 2) DEFAULT 0,
      max_stock NUMERIC(12, 2) DEFAULT 0,
      reorder_point NUMERIC(12, 2) DEFAULT 0,
      cost NUMERIC(12, 4) DEFAULT 0,
      selling_price NUMERIC(12, 4) DEFAULT 0,
      approval TEXT DEFAULT 'approved',
      status TEXT DEFAULT 'active',
      part_weight_grams NUMERIC(8, 2) DEFAULT 0,
      runner_weight_grams NUMERIC(8, 2) DEFAULT 0,
      cavity_count INTEGER DEFAULT 1,
      cycle_time NUMERIC(6, 2) DEFAULT 0,
      cycle_time_seconds NUMERIC(8, 2) DEFAULT 0,
      mold_code TEXT,
      safety_stock NUMERIC(12, 2) DEFAULT 0,
      valuation_method TEXT DEFAULT 'FIFO',
      description TEXT,
      item_group TEXT,
      resin_type TEXT,
      color TEXT,
      hsn_code TEXT,
      supplier TEXT,
      lead_time TEXT,
      routing_destination TEXT DEFAULT 'WIP',
      image_url TEXT,
      technical_doc_url TEXT,
      processing_method TEXT,
      default_warehouse TEXT,
      default_bin TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      tenant_id UUID NOT NULL,
      plant_id UUID,
      created_by TEXT,
      updated_by TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );
  `);

  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tenantB = '22222222-2222-2222-2222-222222222222';
  const actorId = 'user-admin-01';

  // --- Test 1: Create Item & Multi-Tenant Scoping ---
  const itemA = await itemRepository.create(
    db,
    tenantA,
    {
      code: 'CAP-28MM-BLUE',
      name: '28mm Beverage Cap Blue',
      category: 'Finished Good',
      entityType: 'Finished Molded Component',
      unit: 'NOS',
      stock: '500',
      minStock: '100',
      reorderPoint: '150',
      cost: '0.4500',
      sellingPrice: '0.8500',
      moldCode: 'MOLD-CAP-04',
      status: 'active',
      approval: 'approved',
    },
    actorId
  );

  assert.ok(itemA.id, 'Item ID must be generated');
  assert.equal(itemA.code, 'CAP-28MM-BLUE');
  assert.equal(itemA.tenantId, tenantA);
  assert.equal(itemA.version, 1, 'Initial version must be 1');
  console.log('  ✔ Test 1: Item created with UUID, tenant scoping & version 1');

  // --- Test 2: Multi-Tenant Isolation ---
  const crossTenantSearch = await itemRepository.findById(db, tenantB, itemA.id);
  assert.equal(crossTenantSearch, null, 'Tenant B must NOT see Tenant A item');
  console.log('  ✔ Test 2: Multi-tenant isolation verified');

  // --- Test 3: Pagination & Search Filtering ---
  // Create a second raw material item for Tenant A
  await itemRepository.create(
    db,
    tenantA,
    {
      code: 'RESIN-PP-HOMO',
      name: 'Polypropylene Homopolymer H110MA',
      category: 'Raw Material',
      entityType: 'Raw Material',
      unit: 'KG',
      stock: '25',
      minStock: '50',
      reorderPoint: '60',
      status: 'active',
      approval: 'approved',
    },
    actorId
  );

  const searchRes = await itemRepository.findPaginated(db, tenantA, {
    search: 'Beverage',
    page: 1,
    limit: 10,
  });
  assert.equal(searchRes.data.length, 1);
  assert.equal(searchRes.data[0].code, 'CAP-28MM-BLUE');
  assert.equal(searchRes.meta.total, 1);
  console.log('  ✔ Test 3: Paginated search filtered accurately');

  // --- Test 4: Optimistic Concurrency Control (OCC) ---
  const updatedItem = await itemRepository.update(
    db,
    tenantA,
    itemA.id,
    itemA.version, // version = 1
    {
      name: '28mm Beverage Cap Deep Blue',
      cost: '0.4800',
    },
    actorId
  );
  assert.ok(updatedItem, 'Update should succeed');
  assert.equal(updatedItem.name, '28mm Beverage Cap Deep Blue');
  assert.equal(updatedItem.version, 2, 'Version must increment to 2');

  // Attempt concurrent update with stale version 1 (should fail)
  const staleUpdate = await itemRepository.update(
    db,
    tenantA,
    itemA.id,
    1, // Stale version!
    { name: 'Stale overwrite' },
    actorId
  );
  assert.equal(staleUpdate, null, 'Stale OCC update must return null / conflict');
  console.log('  ✔ Test 4: OCC version checking and conflict prevention verified');

  // --- Test 5: Single Round-Trip Summary Metrics ---
  const summary = await itemRepository.getSummary(db, tenantA);
  assert.equal(summary.total, 2, 'Tenant A has 2 items');
  assert.equal(summary.finishedGoods, 1);
  assert.equal(summary.rawMaterials, 1);
  assert.equal(summary.lowStock, 1, 'RESIN-PP has stock 25 <= minStock 50, so lowStock = 1');
  assert.equal(summary.active, 2);
  console.log('  ✔ Test 5: Single round-trip summary metrics verified:', summary);

  // --- Test 6: Soft Delete ---
  const deleted = await itemRepository.softDelete(db, tenantA, itemA.id, actorId);
  assert.equal(deleted, true);
  const afterDelete = await itemRepository.findById(db, tenantA, itemA.id);
  assert.equal(afterDelete, null, 'Soft-deleted item must not be returned');
  console.log('  ✔ Test 6: Soft delete verified');

  const dur = Math.round(performance.now() - t0);
  console.log(`\n🎉 ALL 6 TESTS PASSED in ${dur}ms using in-memory PGlite!`);
}

runPilotItemPGliteSuite().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
