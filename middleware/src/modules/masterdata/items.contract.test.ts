import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { itemRepository } from './items.repository.js';
import * as schema from '../../schema/erp.js';

export async function runItemContractTests() {
  console.log('🧪 [Contract Test] Starting Item Master Contract & OCC Verification...');
  const t0 = performance.now();

  const pglite = new PGlite();
  const db = drizzle(pglite, { schema }) as any;

  // DDL schema in-memory via PGlite
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
  const actor = 'contract-test-runner';

  // 1. Contract: Create item with default version = 1
  const item = await itemRepository.create(
    db,
    tenantA,
    {
      code: 'CONTRACT-TEST-01',
      name: 'High Precision Cap 28mm',
      category: 'Finished Good',
      entityType: 'Finished Molded Component',
      unit: 'NOS',
      stock: '250',
      minStock: '50',
      cost: '0.5200',
      sellingPrice: '0.9500',
      partWeightGrams: '12.40',
      runnerWeightGrams: '1.20',
      cavityCount: 8,
      cycleTimeSeconds: '18.50',
      moldCode: 'MOLD-CAP-08',
      approval: 'approved',
      status: 'active',
    },
    actor
  );

  assert.ok(item.id, 'Item must have generated UUID');
  assert.equal(item.version, 1, 'Initial version must be 1');
  assert.equal(item.tenantId, tenantA);
  console.log('  ✔ Contract 1: Item created with version = 1 and tenant isolation');

  // 2. Contract: Read item by code
  const byCode = await itemRepository.findByCode(db, tenantA, 'CONTRACT-TEST-01');
  assert.ok(byCode);
  assert.equal(byCode?.id, item.id);
  assert.equal(byCode?.code, 'CONTRACT-TEST-01');
  console.log('  ✔ Contract 2: Read item by code (GET 200 equivalent)');

  // 3. Contract: Multi-tenant boundary
  const crossTenant = await itemRepository.findByCode(db, tenantB, 'CONTRACT-TEST-01');
  assert.equal(crossTenant, null, 'Tenant B must NOT access Tenant A records');
  console.log('  ✔ Contract 3: Multi-tenant boundary verified');

  // 4. Contract: OCC Atomic Update (version 1 -> 2)
  const updated = await itemRepository.update(
    db,
    tenantA,
    item.id,
    1, // Expected current version
    {
      name: 'High Precision Cap 28mm Revision B',
      cycleTimeSeconds: '17.80',
    },
    actor
  );

  assert.ok(updated, 'Valid OCC update must return updated entity');
  assert.equal(updated.version, 2, 'Version must increment from 1 to 2');
  assert.equal(updated.name, 'High Precision Cap 28mm Revision B');
  console.log('  ✔ Contract 4: Atomic OCC update (PATCH 200, version 1 -> 2)');

  // 5. Contract: Stale OCC Rejection (stale version 1 on version 2 entity)
  const staleAttempt = await itemRepository.update(
    db,
    tenantA,
    item.id,
    1, // Stale version! (DB is at 2)
    { name: 'Stale attempt that must fail' },
    actor
  );

  assert.equal(staleAttempt, null, 'Stale OCC update must return null (409 Conflict equivalent)');
  console.log('  ✔ Contract 5: Stale OCC update rejected (409 CONCURRENCY_CONFLICT equivalent)');

  // 6. Contract: Pagination & selective filters
  const page = await itemRepository.findPaginated(db, tenantA, { page: 1, limit: 10 });
  assert.equal(page.meta.total, 1);
  assert.equal(page.data[0].version, 2);
  console.log('  ✔ Contract 6: Paginated list envelope verified');

  // 7. Contract: Soft delete governance
  const deleted = await itemRepository.softDelete(db, tenantA, item.id, actor);
  assert.equal(deleted, true);
  const afterDelete = await itemRepository.findByCode(db, tenantA, 'CONTRACT-TEST-01');
  assert.equal(afterDelete, null, 'Soft-deleted items must be excluded');
  console.log('  ✔ Contract 7: Soft delete exclusion verified');

  const dur = Math.round(performance.now() - t0);
  console.log(`\n🎉 ALL 7 CONTRACT TESTS PASSED in ${dur}ms!\n`);
}

runItemContractTests().catch((err) => {
  console.error('❌ Contract test failed:', err);
  process.exit(1);
});
