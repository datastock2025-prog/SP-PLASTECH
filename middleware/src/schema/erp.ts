import { pgTable, text, timestamp, uuid, integer, numeric, jsonb, date } from 'drizzle-orm/pg-core';

export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').default('Raw Material'),
  rating: numeric('rating', { precision: 2, scale: 1 }).default('4.0'),
  status: text('status').default('active'),
  contacts: jsonb('contacts').default([]),
  paymentTerms: text('payment_terms').default('Net 30 Days'),
  currency: text('currency').default('INR (₹)'),
  gstin: text('gstin'),
  pan: text('pan'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const items = pgTable('items', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subCategory: text('sub_category'),
  uom: text('uom').default('NOS'),
  status: text('status').default('active'),
  stock: numeric('stock', { precision: 12, scale: 2 }).default('0'),
  minStock: numeric('min_stock', { precision: 12, scale: 2 }).default('0'),
  maxStock: numeric('max_stock', { precision: 12, scale: 2 }).default('0'),
  reorderLevel: numeric('reorder_level', { precision: 12, scale: 2 }).default('0'),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).default('0'),
  sellingPrice: numeric('selling_price', { precision: 12, scale: 2 }).default('0'),
  specifications: jsonb('specifications').default({}),
  leadTimeDays: integer('lead_time_days').default(7),
  hsnCode: text('hsn_code'),
  tenantId: text('tenant_id').default('SP-PLASTECH'),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  version: integer('version').default(1),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  customerType: text('customer_type').default('OEM'),
  tier: text('tier').default('Tier 1'),
  gstin: text('gstin'),
  pan: text('pan'),
  creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }).default('1000000'),
  creditDays: integer('credit_days').default(30),
  status: text('status').default('active'),
  contacts: jsonb('contacts').default([]),
  shippingAddresses: jsonb('shipping_addresses').default([]),
  billingAddresses: jsonb('billing_addresses').default([]),
  paymentTerms: text('payment_terms').default('Net 30 Days'),
  incoterms: text('incoterms').default('DAP'),
  currency: text('currency').default('INR (₹)'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const warehouses = pgTable('warehouses', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  plantId: text('plant_id').notNull(),
  locationType: text('location_type').notNull(),
  address: text('address'),
  bins: jsonb('bins').default([]),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const machines = pgTable('machines', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  tonnage: integer('tonnage').notNull(),
  plant: text('plant').notNull(),
  status: text('status').default('running'),
  brand: text('brand'),
  model: text('model'),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }).default('850.0'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const billOfMaterials = pgTable('bill_of_materials', {
  id: text('id').primaryKey(),
  itemCode: text('item_code').notNull().references(() => items.code),
  version: text('version').notNull(),
  status: text('status').default('approved'),
  lines: jsonb('lines').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const workOrders = pgTable('work_orders', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  itemCode: text('item_code').notNull(),
  machineId: text('machine_id'),
  targetQty: integer('target_qty').notNull(),
  producedQty: integer('produced_qty').default(0),
  goodQty: integer('good_qty').default(0),
  rejectionQty: integer('rejection_qty').default(0),
  status: text('status').default('pending'),
  priority: text('priority').default('normal'),
  startDate: timestamp('start_date', { withTimezone: true, mode: 'date' }),
  dueDate: timestamp('due_date', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const salesOrders = pgTable('sales_orders', {
  id: text('id').primaryKey(),
  soNumber: text('so_number').notNull().unique(),
  customerId: text('customer_id').notNull(),
  status: text('status').default('confirmed'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0'),
  orderDate: date('order_date').defaultNow(),
  deliveryDate: date('delivery_date'),
  items: jsonb('items').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: text('id').primaryKey(),
  poNumber: text('po_number').notNull().unique(),
  supplierId: text('supplier_id').notNull(),
  status: text('status').default('open'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0'),
  orderDate: date('order_date').defaultNow(),
  expectedDeliveryDate: date('expected_delivery_date'),
  items: jsonb('items').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  changedFields: text('changed_fields').array().notNull().default([]),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  performedBy: text('performed_by'),
  ipAddress: text('ip_address'),
  performedAt: timestamp('performed_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});
