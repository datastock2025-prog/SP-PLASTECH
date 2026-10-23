import assert from 'node:assert/strict';
import { itemInsertSchema, itemUpdateSchema, normalizeItemContractInput } from './items.js';

console.log('🧪 Testing Item Drizzle-Zod contract schema...');

// Test 1: CamelCase input bridges to database snake_case columns
const camelInput = {
  code: 'SKU-001',
  name: 'Precision Gear 50T',
  category: 'Finished Good',
  entityType: 'Finished Molded Component',
  unit: 'PCS',
  partWeightGrams: 45.2,
  cavityCount: 4,
  cycleTimeSeconds: 22.5,
  defaultWarehouse: 'WH-MAIN',
  stock: 100,
  cost: 2.5,
  sellingPrice: 5.0,
};

const parsedCamel = itemInsertSchema.parse(camelInput);
assert.equal(parsedCamel.code, 'SKU-001');
assert.equal(parsedCamel.name, 'Precision Gear 50T');
assert.equal(parsedCamel.part_weight_grams, '45.2');
assert.equal(parsedCamel.cavity_count, 4);
assert.equal(parsedCamel.cycle_time_seconds, '22.5');
assert.equal(parsedCamel.default_warehouse, 'WH-MAIN');
console.log('  ✔ Test 1: CamelCase input accurately mapped to database columns');

// Test 2: Native snake_case input
const snakeInput = {
  code: 'SKU-002',
  name: 'Flange Adapter',
  category: 'Finished Good',
  entity_type: 'Finished Molded Component',
  part_weight_grams: '18.4',
  runner_weight_grams: '2.1',
  cycle_time_seconds: '14.0',
  default_warehouse: 'WH-RAW',
  cost: 1.25,
  selling_price: 3.0,
};

const parsedSnake = itemInsertSchema.parse(snakeInput);
assert.equal(parsedSnake.code, 'SKU-002');
assert.equal(parsedSnake.entity_type, 'Finished Molded Component');
assert.equal(parsedSnake.part_weight_grams, '18.4');
assert.equal(parsedSnake.runner_weight_grams, '2.1');
assert.equal(parsedSnake.cycle_time_seconds, '14.0');
assert.equal(parsedSnake.default_warehouse, 'WH-RAW');
console.log('  ✔ Test 2: Native snake_case input parsed directly');

// Test 3: Update schema with OCC version
const updatePayload = {
  name: 'Flange Adapter Rev 2',
  cycleTimeSeconds: 13.5,
  version: 2,
};

const parsedUpdate = itemUpdateSchema.parse(updatePayload);
assert.equal(parsedUpdate.name, 'Flange Adapter Rev 2');
assert.equal(parsedUpdate.cycle_time_seconds, '13.5');
assert.equal(parsedUpdate.version, 2);
console.log('  ✔ Test 3: Update schema maps fields and preserves OCC version');

console.log('\n🎉 ALL ITEM CONTRACT SCHEMA TESTS PASSED!\n');
