import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import * as identity from './identity.js';
import * as erp from './erp.js';

// Identity & Access Zod Schemas
export const selectTenantSchema = createSelectSchema(identity.tenants);
export const insertTenantSchema = createInsertSchema(identity.tenants).strict();
export const updateTenantSchema = createInsertSchema(identity.tenants).partial().extend({ version: z.number().int().min(1) }).strict();

export const selectPlantSchema = createSelectSchema(identity.plants);
export const insertPlantSchema = createInsertSchema(identity.plants).strict();
export const updatePlantSchema = createInsertSchema(identity.plants).partial().extend({ version: z.number().int().min(1) }).strict();

export const selectRoleSchema = createSelectSchema(identity.roles);
export const insertRoleSchema = createInsertSchema(identity.roles).strict();
export const updateRoleSchema = createInsertSchema(identity.roles).partial().extend({ version: z.number().int().min(1) }).strict();

export const selectUserProfileSchema = createSelectSchema(identity.userProfiles);
export const insertUserProfileSchema = createInsertSchema(identity.userProfiles).strict();
export const updateUserProfileSchema = createInsertSchema(identity.userProfiles).partial().extend({ version: z.number().int().min(1) }).strict();

export const selectUserPreferencesSchema = createSelectSchema(identity.userPreferences);
export const insertUserPreferencesSchema = createInsertSchema(identity.userPreferences).strict();
export const updateUserPreferencesSchema = createInsertSchema(identity.userPreferences).partial().extend({ version: z.number().int().min(1) }).strict();

// ERP Core Zod Schemas — Delegated to Authoritative Drizzle Contract (Option B)
import {
  itemSelectSchema as contractSelectItemSchema,
  itemInsertSchema as contractInsertItemSchema,
  itemUpdateSchema as contractUpdateItemSchema,
  normalizeItemContractInput,
} from '../contracts/items.js';

export const selectItemSchema = contractSelectItemSchema;
export const insertItemSchema = contractInsertItemSchema;
export const updateItemSchema = contractUpdateItemSchema;
export const normalizeItemInput = normalizeItemContractInput;

export const selectSupplierSchema = createSelectSchema(erp.suppliers);

const normalizeSupplierInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.paymentTerms !== undefined && out.payment_terms === undefined) out.payment_terms = out.paymentTerms;
  if (out.bankingTax !== undefined && out.banking_tax === undefined) out.banking_tax = out.bankingTax;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.paymentTerms;
  delete out.bankingTax;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  delete out.hsnCode;
  delete out.moq;
  delete out.leadTimeDays;
  delete out.contactPerson;
  delete out.email;
  delete out.phone;
  delete out.version;
  return out;
};

const rawInsertSupplierSchema = z.object({
  id: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  type: z.string().trim().optional().default('Raw Material'),
  category: z.string().trim().optional().default('Raw Material'),
  rating: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('4.0'),
  status: z.string().trim().optional().default('active'),
  contacts: z.any().optional().default([]),
  payment_terms: z.string().trim().optional().default('Net 30 Days'),
  currency: z.string().trim().optional().default('INR (₹)'),
  banking_tax: z.any().optional().default({}),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const insertSupplierSchema = z.preprocess((val: any) => {
  const normalized = normalizeSupplierInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertSupplierSchema);

export const updateSupplierSchema = z.preprocess(
  normalizeSupplierInput,
  rawInsertSupplierSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

export const selectCustomerSchema = createSelectSchema(erp.customers);

const normalizeCustomerInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.customerType !== undefined && out.customer_type === undefined) out.customer_type = out.customerType;
  if (out.creditLimit !== undefined && out.credit_limit === undefined) out.credit_limit = out.creditLimit;
  if (out.creditDays !== undefined && out.credit_days === undefined) out.credit_days = out.creditDays;
  if (out.shippingAddresses !== undefined && out.shipping_addresses === undefined) out.shipping_addresses = out.shippingAddresses;
  if (out.billingAddresses !== undefined && out.billing_addresses === undefined) out.billing_addresses = out.billingAddresses;
  if (out.paymentTerms !== undefined && out.payment_terms === undefined) out.payment_terms = out.paymentTerms;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.customerType;
  delete out.creditLimit;
  delete out.creditDays;
  delete out.shippingAddresses;
  delete out.billingAddresses;
  delete out.paymentTerms;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertCustomerSchema = z.object({
  id: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  customer_type: z.string().trim().optional().default('OEM'),
  tier: z.string().trim().optional().default('Tier 1'),
  gstin: z.string().trim().optional().nullable(),
  pan: z.string().trim().optional().nullable(),
  credit_limit: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('1000000'),
  credit_days: z.coerce.number().int().optional().default(30),
  status: z.string().trim().optional().default('active'),
  contacts: z.any().optional().default([]),
  shipping_addresses: z.any().optional().default([]),
  billing_addresses: z.any().optional().default([]),
  payment_terms: z.string().trim().optional().default('Net 30 Days'),
  incoterms: z.string().trim().optional().default('DAP'),
  currency: z.string().trim().optional().default('INR (₹)'),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const insertCustomerSchema = z.preprocess((val: any) => {
  const normalized = normalizeCustomerInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertCustomerSchema);

export const updateCustomerSchema = z.preprocess(
  normalizeCustomerInput,
  rawInsertCustomerSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

export const selectWarehouseSchema = createSelectSchema(erp.warehouses);

const normalizeWarehouseInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  if (out.locationType !== undefined && out.location_type === undefined) out.location_type = out.locationType;
  delete out.plantId;
  delete out.locationType;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  delete out.zone;
  delete out.plantScope;
  delete out.version;
  return out;
};

const rawInsertWarehouseSchema = z.object({
  id: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  plant_id: z.string().trim().optional().nullable(),
  location_type: z.string().trim().min(1).default('Storage'),
  address: z.string().trim().optional().nullable(),
  bins: z.any().optional().default([]),
}).strict();

export const insertWarehouseSchema = z.preprocess((val: any) => {
  const normalized = normalizeWarehouseInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertWarehouseSchema);

export const updateWarehouseSchema = z.preprocess(
  normalizeWarehouseInput,
  rawInsertWarehouseSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

export const selectMachineSchema = createSelectSchema(erp.machines);

const normalizeMachineInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.hourlyRate !== undefined && out.hourly_rate === undefined) out.hourly_rate = out.hourlyRate;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.hourlyRate;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertMachineSchema = z.object({
  id: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  tonnage: z.coerce.number().int().min(1),
  plant: z.string().trim().min(1).default('Plant 1'),
  status: z.string().trim().optional().default('running'),
  brand: z.string().trim().optional().nullable(),
  model: z.string().trim().optional().nullable(),
  hourly_rate: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('850.0'),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const insertMachineSchema = z.preprocess((val: any) => {
  const normalized = normalizeMachineInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertMachineSchema);

export const updateMachineSchema = z.preprocess(
  normalizeMachineInput,
  rawInsertMachineSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

export const selectBillOfMaterialsSchema = createSelectSchema(erp.billOfMaterials);

const normalizeBomInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.itemCode !== undefined && out.item_code === undefined) out.item_code = out.itemCode;
  if (out.bomVersion !== undefined && out.bom_version === undefined) out.bom_version = out.bomVersion;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.itemCode;
  delete out.bomVersion;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertBomSchema = z.object({
  id: z.string().trim().min(1).optional(),
  item_code: z.string().trim().min(1).max(100),
  bom_version: z.string().trim().optional().default('v1.0'),
  status: z.string().trim().optional().default('draft'),
  lines: z.any().optional().default([]),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const insertBillOfMaterialsSchema = z.preprocess((val: any) => {
  const normalized = normalizeBomInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertBomSchema);

export const updateBillOfMaterialsSchema = z.preprocess(
  normalizeBomInput,
  rawInsertBomSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeBomLineInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.bomId !== undefined && out.bom_id === undefined) out.bom_id = out.bomId;
  if (out.lineNo !== undefined && out.line_no === undefined) out.line_no = out.lineNo;
  if (out.componentItemCode !== undefined && out.component_item_code === undefined) out.component_item_code = out.componentItemCode;
  if (out.componentItemName !== undefined && out.component_item_name === undefined) out.component_item_name = out.componentItemName;
  if (out.quantityPerUnit !== undefined && out.quantity_per_unit === undefined) out.quantity_per_unit = out.quantityPerUnit;
  if (out.scrapPct !== undefined && out.scrap_pct === undefined) out.scrap_pct = out.scrapPct;
  if (out.isCritical !== undefined && out.is_critical === undefined) out.is_critical = out.isCritical;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.bomId;
  delete out.lineNo;
  delete out.componentItemCode;
  delete out.componentItemName;
  delete out.quantityPerUnit;
  delete out.scrapPct;
  delete out.isCritical;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertBomLineSchema = z.object({
  id: z.string().uuid().optional(),
  bom_id: z.string().trim().min(1),
  line_no: z.coerce.number().int().min(1),
  component_item_code: z.string().trim().min(1).max(100),
  component_item_name: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable().default('Raw Material'),
  quantity_per_unit: z.union([z.number(), z.string()]).transform((v) => String(v)),
  uom: z.string().trim().optional().default('PCS'),
  scrap_pct: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  is_critical: z.boolean().optional().default(false),
  notes: z.string().trim().optional().nullable(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectBomLineSchema = createSelectSchema(erp.bomLines);
export const insertBomLineSchema = z.preprocess((val: any) => {
  const normalized = normalizeBomLineInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertBomLineSchema);

export const updateBomLineSchema = z.preprocess(
  normalizeBomLineInput,
  rawInsertBomLineSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

export const selectWorkOrderSchema = createSelectSchema(erp.workOrders);

const normalizeWorkOrderInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.itemCode !== undefined && out.item_code === undefined) out.item_code = out.itemCode;
  if (out.machineId !== undefined && out.machine_id === undefined) out.machine_id = out.machineId;
  if (out.machine !== undefined && out.machine_id === undefined) out.machine_id = out.machine;
  if (out.targetQty !== undefined && out.target_qty === undefined) out.target_qty = out.targetQty;
  if (out.producedQty !== undefined && out.produced_qty === undefined) out.produced_qty = out.producedQty;
  if (out.goodQty !== undefined && out.good_qty === undefined) out.good_qty = out.goodQty;
  if (out.rejectionQty !== undefined && out.rejection_qty === undefined) out.rejection_qty = out.rejectionQty;
  if (out.scrapQty !== undefined && out.rejection_qty === undefined) out.rejection_qty = out.scrapQty;
  if (out.startDate !== undefined && out.start_date === undefined) out.start_date = out.startDate;
  if (out.dueDate !== undefined && out.due_date === undefined) out.due_date = out.dueDate;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.itemCode;
  delete out.machineId;
  delete out.machine;
  delete out.targetQty;
  delete out.producedQty;
  delete out.goodQty;
  delete out.rejectionQty;
  delete out.scrapQty;
  delete out.startDate;
  delete out.dueDate;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertWorkOrderSchema = z.object({
  id: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).max(100),
  item_code: z.string().trim().min(1).max(100),
  machine_id: z.string().trim().optional().nullable(),
  target_qty: z.coerce.number().int().min(1),
  produced_qty: z.coerce.number().int().optional().default(0),
  good_qty: z.coerce.number().int().optional().default(0),
  rejection_qty: z.coerce.number().int().optional().default(0),
  status: z.string().trim().optional().default('planned'),
  priority: z.string().trim().optional().default('normal'),
  start_date: z.union([z.string(), z.date()]).optional().nullable(),
  due_date: z.union([z.string(), z.date()]).optional().nullable(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const insertWorkOrderSchema = z.preprocess((val: any) => {
  const normalized = normalizeWorkOrderInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertWorkOrderSchema);

export const updateWorkOrderSchema = z.preprocess(
  normalizeWorkOrderInput,
  rawInsertWorkOrderSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeSalesOrderInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.soNumber !== undefined && out.so_number === undefined) out.so_number = out.soNumber;
  if (out.customerId !== undefined && out.customer_id === undefined) out.customer_id = out.customerId;
  if (out.totalAmount !== undefined && out.total_amount === undefined) out.total_amount = out.totalAmount;
  if (out.orderDate !== undefined && out.order_date === undefined) out.order_date = out.orderDate;
  if (out.deliveryDate !== undefined && out.delivery_date === undefined) out.delivery_date = out.deliveryDate;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.soNumber;
  delete out.customerId;
  delete out.totalAmount;
  delete out.orderDate;
  delete out.deliveryDate;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertSalesOrderSchema = z.object({
  id: z.string().trim().min(1).optional(),
  so_number: z.string().trim().min(1).max(100),
  customer_id: z.string().trim().min(1),
  status: z.string().trim().optional().default('confirmed'),
  total_amount: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  order_date: z.union([z.string(), z.date()]).optional().nullable(),
  delivery_date: z.union([z.string(), z.date()]).optional().nullable(),
  items: z.any().optional().default([]),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectSalesOrderSchema = createSelectSchema(erp.salesOrders);
export const insertSalesOrderSchema = z.preprocess((val: any) => {
  const normalized = normalizeSalesOrderInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertSalesOrderSchema);

export const updateSalesOrderSchema = z.preprocess(
  normalizeSalesOrderInput,
  rawInsertSalesOrderSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeSalesOrderLineInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.soId !== undefined && out.so_id === undefined) out.so_id = out.soId;
  if (out.lineNo !== undefined && out.line_no === undefined) out.line_no = out.lineNo;
  if (out.itemCode !== undefined && out.item_code === undefined) out.item_code = out.itemCode;
  if (out.itemName !== undefined && out.item_name === undefined) out.item_name = out.itemName;
  if (out.dispatchedQty !== undefined && out.dispatched_qty === undefined) out.dispatched_qty = out.dispatchedQty;
  if (out.unitPrice !== undefined && out.unit_price === undefined) out.unit_price = out.unitPrice;
  if (out.totalPrice !== undefined && out.total_price === undefined) out.total_price = out.totalPrice;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.soId;
  delete out.lineNo;
  delete out.itemCode;
  delete out.itemName;
  delete out.dispatchedQty;
  delete out.unitPrice;
  delete out.totalPrice;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertSalesOrderLineSchema = z.object({
  id: z.string().uuid().optional(),
  so_id: z.string().trim().min(1),
  line_no: z.coerce.number().int().min(1),
  item_code: z.string().trim().min(1).max(100),
  item_name: z.string().trim().optional().nullable(),
  quantity: z.union([z.number(), z.string()]).transform((v) => String(v)),
  dispatched_qty: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  unit_price: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  total_price: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  uom: z.string().trim().optional().default('PCS'),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectSalesOrderLineSchema = createSelectSchema(erp.salesOrderLines);
export const insertSalesOrderLineSchema = z.preprocess((val: any) => {
  const normalized = normalizeSalesOrderLineInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertSalesOrderLineSchema);

export const updateSalesOrderLineSchema = z.preprocess(
  normalizeSalesOrderLineInput,
  rawInsertSalesOrderLineSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeDeliveryChallanInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.challanNumber !== undefined && out.challan_number === undefined) out.challan_number = out.challanNumber;
  if (out.soId !== undefined && out.so_id === undefined) out.so_id = out.soId;
  if (out.customerId !== undefined && out.customer_id === undefined) out.customer_id = out.customerId;
  if (out.vehicleNo !== undefined && out.vehicle_no === undefined) out.vehicle_no = out.vehicleNo;
  if (out.lrNumber !== undefined && out.lr_number === undefined) out.lr_number = out.lrNumber;
  if (out.dispatchDate !== undefined && out.dispatch_date === undefined) out.dispatch_date = out.dispatchDate;
  if (out.totalAmount !== undefined && out.total_amount === undefined) out.total_amount = out.totalAmount;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.challanNumber;
  delete out.soId;
  delete out.customerId;
  delete out.vehicleNo;
  delete out.lrNumber;
  delete out.dispatchDate;
  delete out.totalAmount;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertDeliveryChallanSchema = z.object({
  id: z.string().trim().min(1).optional(),
  challan_number: z.string().trim().min(1).max(100),
  so_id: z.string().trim().min(1),
  customer_id: z.string().trim().min(1),
  vehicle_no: z.string().trim().optional().nullable(),
  transporter: z.string().trim().optional().nullable(),
  lr_number: z.string().trim().optional().nullable(),
  dispatch_date: z.union([z.string(), z.date()]).optional(),
  status: z.string().trim().optional().default('draft'),
  lines: z.any().optional().default([]),
  total_amount: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectDeliveryChallanSchema = createSelectSchema(erp.deliveryChallans);
export const insertDeliveryChallanSchema = z.preprocess((val: any) => {
  const normalized = normalizeDeliveryChallanInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertDeliveryChallanSchema);

export const updateDeliveryChallanSchema = z.preprocess(
  normalizeDeliveryChallanInput,
  rawInsertDeliveryChallanSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeMrpRunInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.runNumber !== undefined && out.run_number === undefined) out.run_number = out.runNumber;
  if (out.totalSoProcessed !== undefined && out.total_so_processed === undefined) out.total_so_processed = out.totalSoProcessed;
  if (out.totalItemsPlanned !== undefined && out.total_items_planned === undefined) out.total_items_planned = out.totalItemsPlanned;
  if (out.totalPrsGenerated !== undefined && out.total_prs_generated === undefined) out.total_prs_generated = out.totalPrsGenerated;
  if (out.generatedPrIds !== undefined && out.generated_pr_ids === undefined) out.generated_pr_ids = out.generatedPrIds;
  if (out.grossRequirements !== undefined && out.gross_requirements === undefined) out.gross_requirements = out.grossRequirements;
  if (out.netRequirements !== undefined && out.net_requirements === undefined) out.net_requirements = out.netRequirements;
  if (out.executedAt !== undefined && out.executed_at === undefined) out.executed_at = out.executedAt;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.runNumber;
  delete out.totalSoProcessed;
  delete out.totalItemsPlanned;
  delete out.totalPrsGenerated;
  delete out.generatedPrIds;
  delete out.grossRequirements;
  delete out.netRequirements;
  delete out.executedAt;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertMrpRunSchema = z.object({
  id: z.string().uuid().optional(),
  run_number: z.string().trim().min(1).max(100),
  status: z.string().trim().optional().default('COMPLETED'),
  total_so_processed: z.coerce.number().int().optional().default(0),
  total_items_planned: z.coerce.number().int().optional().default(0),
  total_prs_generated: z.coerce.number().int().optional().default(0),
  generated_pr_ids: z.any().optional().default([]),
  gross_requirements: z.any().optional().default([]),
  net_requirements: z.any().optional().default([]),
  executed_at: z.union([z.string(), z.date()]).optional(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectMrpRunSchema = createSelectSchema(erp.mrpRuns);
export const insertMrpRunSchema = z.preprocess((val: any) => {
  const normalized = normalizeMrpRunInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertMrpRunSchema);

export const updateMrpRunSchema = z.preprocess(
  normalizeMrpRunInput,
  rawInsertMrpRunSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

export const selectPurchaseOrderSchema = createSelectSchema(erp.purchaseOrders);

const normalizePoInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.poNumber !== undefined && out.po_number === undefined) out.po_number = out.poNumber;
  if (out.supplierId !== undefined && out.supplier_id === undefined) out.supplier_id = out.supplierId;
  if (out.supplier !== undefined && out.supplier_id === undefined) out.supplier_id = out.supplier;
  if (out.totalAmount !== undefined && out.total_amount === undefined) out.total_amount = out.totalAmount;
  if (out.orderDate !== undefined && out.order_date === undefined) out.order_date = out.orderDate;
  if (out.expectedDate !== undefined && out.expected_delivery_date === undefined) out.expected_delivery_date = out.expectedDate;
  if (out.expectedDeliveryDate !== undefined && out.expected_delivery_date === undefined) out.expected_delivery_date = out.expectedDeliveryDate;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  if (out.lines !== undefined && out.items === undefined) out.items = out.lines;
  delete out.poNumber;
  delete out.supplierId;
  delete out.supplier;
  delete out.totalAmount;
  delete out.orderDate;
  delete out.expectedDate;
  delete out.expectedDeliveryDate;
  delete out.plantId;
  delete out.lines;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertPurchaseOrderSchema = z.object({
  id: z.string().trim().min(1).optional(),
  po_number: z.string().trim().min(1).max(100),
  supplier_id: z.string().trim().min(1),
  status: z.string().trim().optional().default('open'),
  total_amount: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  order_date: z.string().optional().nullable(),
  expected_delivery_date: z.string().optional().nullable(),
  items: z.any().optional().default([]),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const insertPurchaseOrderSchema = z.preprocess((val: any) => {
  const normalized = normalizePoInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertPurchaseOrderSchema);

export const updatePurchaseOrderSchema = z.preprocess(
  normalizePoInput,
  rawInsertPurchaseOrderSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeWarehouseStockInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.storeType !== undefined && out.store_type === undefined) out.store_type = out.storeType;
  if (out.subCategory !== undefined && out.sub_category === undefined) out.sub_category = out.subCategory;
  if (out.resinGrade !== undefined && out.resin_grade === undefined) out.resin_grade = out.resinGrade;
  if (out.primaryWarehouse !== undefined && out.primary_warehouse === undefined) out.primary_warehouse = out.primaryWarehouse;
  if (out.primaryBin !== undefined && out.primary_bin === undefined) out.primary_bin = out.primaryBin;
  if (out.totalOnHand !== undefined && out.total_on_hand === undefined) out.total_on_hand = out.totalOnHand;
  if (out.allocatedToProduction !== undefined && out.allocated_to_production === undefined) out.allocated_to_production = out.allocatedToProduction;
  if (out.reservedForOrders !== undefined && out.reserved_for_orders === undefined) out.reserved_for_orders = out.reservedForOrders;
  if (out.availableToPromise !== undefined && out.available_to_promise === undefined) out.available_to_promise = out.availableToPromise;
  if (out.inTransitFromVendors !== undefined && out.in_transit_from_vendors === undefined) out.in_transit_from_vendors = out.inTransitFromVendors;
  if (out.unitCostInr !== undefined && out.unit_cost_inr === undefined) out.unit_cost_inr = out.unitCostInr;
  if (out.totalValuationInr !== undefined && out.total_valuation_inr === undefined) out.total_valuation_inr = out.totalValuationInr;
  if (out.reorderPointKg !== undefined && out.reorder_point_kg === undefined) out.reorder_point_kg = out.reorderPointKg;
  if (out.safetyStockKg !== undefined && out.safety_stock_kg === undefined) out.safety_stock_kg = out.safetyStockKg;
  if (out.maximumStockKg !== undefined && out.maximum_stock_kg === undefined) out.maximum_stock_kg = out.maximumStockKg;
  if (out.leadTimeDays !== undefined && out.lead_time_days === undefined) out.lead_time_days = out.leadTimeDays;
  if (out.abcClassification !== undefined && out.abc_classification === undefined) out.abc_classification = out.abcClassification;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.storeType;
  delete out.subCategory;
  delete out.resinGrade;
  delete out.primaryWarehouse;
  delete out.primaryBin;
  delete out.totalOnHand;
  delete out.allocatedToProduction;
  delete out.reservedForOrders;
  delete out.availableToPromise;
  delete out.inTransitFromVendors;
  delete out.unitCostInr;
  delete out.totalValuationInr;
  delete out.reorderPointKg;
  delete out.safetyStockKg;
  delete out.maximumStockKg;
  delete out.leadTimeDays;
  delete out.abcClassification;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertWarehouseStockSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  category: z.string().trim().optional().default('Virgin Polymer'),
  store_type: z.string().trim().optional().default('RM'),
  sub_category: z.string().trim().optional().default(''),
  resin_grade: z.string().trim().optional().nullable(),
  primary_warehouse: z.string().trim().optional().default('WH-RM-01'),
  primary_bin: z.string().trim().optional().default('A1'),
  total_on_hand: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  allocated_to_production: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  reserved_for_orders: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  available_to_promise: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  in_transit_from_vendors: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  uom: z.string().trim().optional().default('KG'),
  unit_cost_inr: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  total_valuation_inr: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  reorder_point_kg: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  safety_stock_kg: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  maximum_stock_kg: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('50000'),
  status: z.string().trim().optional().default('in_stock'),
  lead_time_days: z.coerce.number().int().optional().default(7),
  abc_classification: z.string().trim().optional().default('A'),
  lots: z.any().optional().default([]),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectWarehouseStockSchema = createSelectSchema(erp.warehouseStock);
export const insertWarehouseStockSchema = z.preprocess((val: any) => {
  const normalized = normalizeWarehouseStockInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertWarehouseStockSchema);

export const updateWarehouseStockSchema = z.preprocess(
  normalizeWarehouseStockInput,
  rawInsertWarehouseStockSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeStockMovementLedgerInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.ledgerDate !== undefined && out.ledger_date === undefined) out.ledger_date = out.ledgerDate;
  if (out.docType !== undefined && out.doc_type === undefined) out.doc_type = out.docType;
  if (out.docNumber !== undefined && out.doc_number === undefined) out.doc_number = out.docNumber;
  if (out.locationType !== undefined && out.location_type === undefined) out.location_type = out.locationType;
  if (out.itemName !== undefined && out.item_name === undefined) out.item_name = out.itemName;
  if (out.lotNumber !== undefined && out.lot_number === undefined) out.lot_number = out.lotNumber;
  if (out.unitPrice !== undefined && out.unit_price === undefined) out.unit_price = out.unitPrice;
  if (out.parentDocType !== undefined && out.parent_doc_type === undefined) out.parent_doc_type = out.parentDocType;
  if (out.parentDocNumber !== undefined && out.parent_doc_number === undefined) out.parent_doc_number = out.parentDocNumber;
  if (out.referenceNumber !== undefined && out.reference_number === undefined) out.reference_number = out.referenceNumber;
  if (out.qtyPerUom !== undefined && out.qty_per_uom === undefined) out.qty_per_uom = out.qtyPerUom;
  if (out.movementType !== undefined && out.movement_type === undefined) out.movement_type = out.movementType;
  if (out.qtyIn !== undefined && out.qty_in === undefined) out.qty_in = out.qtyIn;
  if (out.qtyOut !== undefined && out.qty_out === undefined) out.qty_out = out.qtyOut;
  if (out.sourceType !== undefined && out.source_type === undefined) out.source_type = out.sourceType;
  if (out.sourceOrigin !== undefined && out.source_origin === undefined) out.source_origin = out.sourceOrigin;
  if (out.sourceReference !== undefined && out.source_reference === undefined) out.source_reference = out.sourceReference;
  if (out.sourceLocation !== undefined && out.source_location === undefined) out.source_location = out.sourceLocation;
  if (out.purposeType !== undefined && out.purpose_type === undefined) out.purpose_type = out.purposeType;
  if (out.purposeDescription !== undefined && out.purpose_description === undefined) out.purpose_description = out.purposeDescription;
  if (out.destinationStore !== undefined && out.destination_store === undefined) out.destination_store = out.destinationStore;
  if (out.outwardReference !== undefined && out.outward_reference === undefined) out.outward_reference = out.outwardReference;
  if (out.authorizedBy !== undefined && out.authorized_by === undefined) out.authorized_by = out.authorizedBy;
  if (out.runningBalance !== undefined && out.running_balance === undefined) out.running_balance = out.runningBalance;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.ledgerDate;
  delete out.docType;
  delete out.docNumber;
  delete out.locationType;
  delete out.itemName;
  delete out.lotNumber;
  delete out.unitPrice;
  delete out.parentDocType;
  delete out.parentDocNumber;
  delete out.referenceNumber;
  delete out.qtyPerUom;
  delete out.movementType;
  delete out.qtyIn;
  delete out.qtyOut;
  delete out.sourceType;
  delete out.sourceOrigin;
  delete out.sourceReference;
  delete out.sourceLocation;
  delete out.purposeType;
  delete out.purposeDescription;
  delete out.destinationStore;
  delete out.outwardReference;
  delete out.authorizedBy;
  delete out.runningBalance;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertStockMovementLedgerSchema = z.object({
  id: z.string().uuid().optional(),
  timestamp: z.string().optional(),
  ledger_date: z.string().trim().optional().default(() => new Date().toISOString().split('T')[0]),
  doc_type: z.string().trim().min(1),
  doc_number: z.string().trim().min(1),
  location: z.string().trim().min(1),
  location_type: z.string().trim().optional().default('WAREHOUSE'),
  customer: z.string().trim().optional().nullable(),
  supplier: z.string().trim().optional().nullable(),
  sku: z.string().trim().min(1),
  item_name: z.string().trim().min(1),
  lot_number: z.string().trim().optional().nullable(),
  unit_price: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  parent_doc_type: z.string().trim().optional().nullable(),
  parent_doc_number: z.string().trim().optional().nullable(),
  reference_number: z.string().trim().optional().nullable(),
  qty_per_uom: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('1'),
  movement_type: z.string().trim().min(1),
  quantity: z.union([z.number(), z.string()]).transform((v) => String(v)),
  qty_in: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  qty_out: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  uom: z.string().trim().optional().default('KG'),
  status: z.string().trim().optional().default('CLOSED'),
  source_type: z.string().trim().optional().nullable(),
  source_origin: z.string().trim().optional().nullable(),
  source_reference: z.string().trim().optional().nullable(),
  source_location: z.string().trim().optional().nullable(),
  purpose_type: z.string().trim().optional().nullable(),
  purpose_description: z.string().trim().optional().nullable(),
  destination_store: z.string().trim().optional().nullable(),
  outward_reference: z.string().trim().optional().nullable(),
  authorized_by: z.string().trim().optional().default('Store Keeper'),
  running_balance: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  plant: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectStockMovementLedgerSchema = createSelectSchema(erp.stockMovementLedger);
export const insertStockMovementLedgerSchema = z.preprocess((val: any) => {
  const normalized = normalizeStockMovementLedgerInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertStockMovementLedgerSchema);

export const updateStockMovementLedgerSchema = z.preprocess(
  normalizeStockMovementLedgerInput,
  rawInsertStockMovementLedgerSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizePrInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.prNumber !== undefined && out.pr_number === undefined) out.pr_number = out.prNumber;
  if (out.requiredDate !== undefined && out.required_date === undefined) out.required_date = out.requiredDate;
  if (out.totalEstimatedAmount !== undefined && out.total_estimated_amount === undefined) out.total_estimated_amount = out.totalEstimatedAmount;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.prNumber;
  delete out.requiredDate;
  delete out.totalEstimatedAmount;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertPrSchema = z.object({
  id: z.string().trim().min(1).optional(),
  pr_number: z.string().trim().min(1).max(100),
  department: z.string().trim().optional().default('Production'),
  required_date: z.string().optional().nullable(),
  priority: z.string().trim().optional().default('Normal'),
  status: z.string().trim().optional().default('draft'),
  lines: z.any().optional().default([]),
  total_estimated_amount: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  notes: z.string().trim().optional().nullable(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectPurchaseRequisitionSchema = createSelectSchema(erp.purchaseRequisitions);
export const insertPurchaseRequisitionSchema = z.preprocess((val: any) => {
  const normalized = normalizePrInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertPrSchema);

export const updatePurchaseRequisitionSchema = z.preprocess(
  normalizePrInput,
  rawInsertPrSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeGrnInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.grnNumber !== undefined && out.grn_number === undefined) out.grn_number = out.grnNumber;
  if (out.poId !== undefined && out.po_id === undefined) out.po_id = out.poId;
  if (out.supplierId !== undefined && out.supplier_id === undefined) out.supplier_id = out.supplierId;
  if (out.supplierInvoiceNo !== undefined && out.supplier_invoice_no === undefined) out.supplier_invoice_no = out.supplierInvoiceNo;
  if (out.vehicleNo !== undefined && out.vehicle_no === undefined) out.vehicle_no = out.vehicleNo;
  if (out.receivedDate !== undefined && out.received_date === undefined) out.received_date = out.receivedDate;
  if (out.totalAmount !== undefined && out.total_amount === undefined) out.total_amount = out.totalAmount;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.grnNumber;
  delete out.poId;
  delete out.supplierId;
  delete out.supplierInvoiceNo;
  delete out.vehicleNo;
  delete out.receivedDate;
  delete out.totalAmount;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertGrnSchema = z.object({
  id: z.string().trim().min(1).optional(),
  grn_number: z.string().trim().min(1).max(100),
  po_id: z.string().trim().min(1),
  supplier_id: z.string().trim().min(1),
  supplier_invoice_no: z.string().trim().optional().nullable(),
  vehicle_no: z.string().trim().optional().nullable(),
  received_date: z.string().optional().nullable(),
  status: z.string().trim().optional().default('draft'),
  lines: z.any().optional().default([]),
  total_amount: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  notes: z.string().trim().optional().nullable(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectGoodsReceiptNoteSchema = createSelectSchema(erp.goodsReceiptNotes);
export const insertGoodsReceiptNoteSchema = z.preprocess((val: any) => {
  const normalized = normalizeGrnInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertGrnSchema);

export const updateGoodsReceiptNoteSchema = z.preprocess(
  normalizeGrnInput,
  rawInsertGrnSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

// --- Wave 3: Manufacturing, Quality & Maintenance Schemas ---

const normalizeProductionEntryInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out: Record<string, any> = { ...val };
  if (out.workOrderId && !out.work_order_id) out.work_order_id = out.workOrderId;
  if (out.machineId && !out.machine_id) out.machine_id = out.machineId;
  if (out.operatorId && !out.operator_id) out.operator_id = out.operatorId;
  if (out.operator && !out.operator_id) out.operator_id = out.operator;
  if (out.shiftId && !out.shift_id) out.shift_id = out.shiftId;
  if (out.shift && !out.shift_id) out.shift_id = out.shift;
  if (out.goodQty !== undefined && out.good_qty === undefined) out.good_qty = out.goodQty;
  if (out.rejectedQty !== undefined && out.rejected_qty === undefined) out.rejected_qty = out.rejectedQty;
  if (out.scrapQty !== undefined && out.rejected_qty === undefined) out.rejected_qty = out.scrapQty;
  if (out.shotsProduced !== undefined && out.shots_produced === undefined) out.shots_produced = out.shotsProduced;
  if (out.rejectionReasonCode && !out.rejection_reason_code) out.rejection_reason_code = out.rejectionReasonCode;
  if (out.regrindKgGenerated !== undefined && out.regrind_kg_generated === undefined) out.regrind_kg_generated = out.regrindKgGenerated;
  delete out.workOrderId;
  delete out.machineId;
  delete out.operatorId;
  delete out.operator;
  delete out.shiftId;
  delete out.shift;
  delete out.goodQty;
  delete out.rejectedQty;
  delete out.scrapQty;
  delete out.shotsProduced;
  delete out.rejectionReasonCode;
  delete out.regrindKgGenerated;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deletedAt;
  delete out.created_at;
  delete out.updated_at;
  delete out.deleted_at;
  return out;
};

const rawInsertProductionEntrySchema = z.object({
  id: z.string().uuid().optional(),
  work_order_id: z.string().trim().min(1),
  machine_id: z.string().trim().min(1),
  operator_id: z.string().trim().optional().nullable(),
  shift_id: z.string().trim().optional().nullable(),
  entry_timestamp: z.union([z.string(), z.date()]).optional(),
  shots_produced: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  good_qty: z.union([z.number(), z.string()]).transform((v) => String(v)).default('0'),
  rejected_qty: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  rejection_reason_code: z.string().trim().optional().nullable(),
  regrind_kg_generated: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectProductionEntrySchema = createSelectSchema(erp.productionEntries);
export const insertProductionEntrySchema = z.preprocess((val: any) => {
  const normalized = normalizeProductionEntryInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertProductionEntrySchema);
export const updateProductionEntrySchema = z.preprocess(
  normalizeProductionEntryInput,
  rawInsertProductionEntrySchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeDowntimeInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out: Record<string, any> = { ...val };
  if (out.machineId && !out.machine_id) out.machine_id = out.machineId;
  if (out.startTime && !out.start_time) out.start_time = out.startTime;
  if (out.endTime && !out.end_time) out.end_time = out.endTime;
  if (out.durationMinutes !== undefined && out.duration_minutes === undefined) out.duration_minutes = out.durationMinutes;
  if (out.downtimeMin !== undefined && out.duration_minutes === undefined) out.duration_minutes = out.downtimeMin;
  if (out.reasonCode && !out.reason_code) out.reason_code = out.reasonCode;
  delete out.machineId;
  delete out.startTime;
  delete out.endTime;
  delete out.durationMinutes;
  delete out.downtimeMin;
  delete out.reasonCode;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deletedAt;
  delete out.created_at;
  delete out.updated_at;
  delete out.deleted_at;
  return out;
};

const rawInsertDowntimeLogSchema = z.object({
  id: z.string().uuid().optional(),
  machine_id: z.string().trim().min(1),
  start_time: z.union([z.string(), z.date()]).default(() => new Date().toISOString()),
  end_time: z.union([z.string(), z.date()]).optional().nullable(),
  duration_minutes: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  category: z.string().trim().min(1).default('MECHANICAL'),
  reason_code: z.string().trim().optional().nullable(),
  comments: z.string().trim().optional().nullable(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectDowntimeLogSchema = createSelectSchema(erp.downtimeLogs);
export const insertDowntimeLogSchema = z.preprocess((val: any) => {
  const normalized = normalizeDowntimeInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertDowntimeLogSchema);
export const updateDowntimeLogSchema = z.preprocess(
  normalizeDowntimeInput,
  rawInsertDowntimeLogSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeQcInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out: Record<string, any> = { ...val };
  if (out.inspectionNo && !out.inspection_no) out.inspection_no = out.inspectionNo;
  if (out.docType && !out.doc_type) out.doc_type = out.docType;
  if (out.docId && !out.doc_id) out.doc_id = out.docId;
  if (out.itemCode && !out.item_code) out.item_code = out.itemCode;
  if (out.lotNumber && !out.lot_number) out.lot_number = out.lotNumber;
  if (out.lot && !out.lot_number) out.lot_number = out.lot;
  if (out.inspectedQty !== undefined && out.inspected_qty === undefined) out.inspected_qty = out.inspectedQty;
  if (out.sampleSize !== undefined && out.sample_size === undefined) out.sample_size = out.sampleSize;
  if (out.acceptedQty !== undefined && out.accepted_qty === undefined) out.accepted_qty = out.acceptedQty;
  if (out.rejectedQty !== undefined && out.rejected_qty === undefined) out.rejected_qty = out.rejectedQty;
  if (out.inspectorId && !out.inspector_id) out.inspector_id = out.inspectorId;
  delete out.inspectionNo;
  delete out.docType;
  delete out.docId;
  delete out.itemCode;
  delete out.lotNumber;
  delete out.lot;
  delete out.inspectedQty;
  delete out.sampleSize;
  delete out.acceptedQty;
  delete out.rejectedQty;
  delete out.inspectorId;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deletedAt;
  delete out.created_at;
  delete out.updated_at;
  delete out.deleted_at;
  return out;
};

const rawInsertQcInspectionSchema = z.object({
  id: z.string().uuid().optional(),
  inspection_no: z.string().trim().min(1),
  doc_type: z.string().trim().optional().default('WORK_ORDER'),
  doc_id: z.string().trim().min(1),
  item_code: z.string().trim().min(1),
  lot_number: z.string().trim().optional().nullable(),
  inspected_qty: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  sample_size: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  accepted_qty: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  rejected_qty: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  disposition: z.string().trim().optional().default('ACCEPTED'),
  defects: z.any().optional().default([]),
  inspector_id: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectQcInspectionSchema = createSelectSchema(erp.qcInspections);
export const insertQcInspectionSchema = z.preprocess((val: any) => {
  const normalized = normalizeQcInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertQcInspectionSchema);
export const updateQcInspectionSchema = z.preprocess(
  normalizeQcInput,
  rawInsertQcInspectionSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeMaintenanceScheduleInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out: Record<string, any> = { ...val };
  if (out.machineId && !out.machine_id) out.machine_id = out.machineId;
  if (out.moldId && !out.mold_id) out.mold_id = out.moldId;
  if (out.frequencyType && !out.frequency_type) out.frequency_type = out.frequencyType;
  if (out.thresholdValue !== undefined && out.threshold_value === undefined) out.threshold_value = out.thresholdValue;
  if (out.taskDescription && !out.task_description) out.task_description = out.taskDescription;
  if (out.lastCompletedDate && !out.last_completed_date) out.last_completed_date = out.lastCompletedDate;
  if (out.nextDueDate && !out.next_due_date) out.next_due_date = out.nextDueDate;
  delete out.machineId;
  delete out.moldId;
  delete out.frequencyType;
  delete out.thresholdValue;
  delete out.taskDescription;
  delete out.lastCompletedDate;
  delete out.nextDueDate;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deletedAt;
  delete out.created_at;
  delete out.updated_at;
  delete out.deleted_at;
  return out;
};

const rawInsertMaintenanceScheduleSchema = z.object({
  id: z.string().uuid().optional(),
  machine_id: z.string().trim().min(1),
  mold_id: z.string().trim().optional().nullable(),
  frequency_type: z.string().trim().optional().default('DAYS'),
  threshold_value: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  task_description: z.string().trim().min(1),
  last_completed_date: z.union([z.string(), z.date()]).optional().nullable(),
  next_due_date: z.union([z.string(), z.date()]).optional().nullable(),
  status: z.string().trim().optional().default('ACTIVE'),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectMaintenanceScheduleSchema = createSelectSchema(erp.maintenanceSchedules);
export const insertMaintenanceScheduleSchema = z.preprocess((val: any) => {
  const normalized = normalizeMaintenanceScheduleInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertMaintenanceScheduleSchema);
export const updateMaintenanceScheduleSchema = z.preprocess(
  normalizeMaintenanceScheduleInput,
  rawInsertMaintenanceScheduleSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeBreakdownTicketInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out: Record<string, any> = { ...val };
  if (out.ticketNumber && !out.ticket_number) out.ticket_number = out.ticketNumber;
  if (out.machineId && !out.machine_id) out.machine_id = out.machineId;
  if (out.faultCategory && !out.fault_category) out.fault_category = out.faultCategory;
  if (out.startDowntime && !out.start_downtime) out.start_downtime = out.startDowntime;
  if (out.endDowntime && !out.end_downtime) out.end_downtime = out.endDowntime;
  if (out.actionTaken && !out.action_taken) out.action_taken = out.actionTaken;
  delete out.ticketNumber;
  delete out.machineId;
  delete out.faultCategory;
  delete out.startDowntime;
  delete out.endDowntime;
  delete out.actionTaken;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deletedAt;
  delete out.created_at;
  delete out.updated_at;
  delete out.deleted_at;
  return out;
};

const rawInsertBreakdownTicketSchema = z.object({
  id: z.string().uuid().optional(),
  ticket_number: z.string().trim().min(1),
  machine_id: z.string().trim().min(1),
  fault_category: z.string().trim().min(1),
  symptom: z.string().trim().min(1),
  severity: z.string().trim().optional().default('MEDIUM'),
  start_downtime: z.union([z.string(), z.date()]).optional(),
  end_downtime: z.union([z.string(), z.date()]).optional().nullable(),
  action_taken: z.string().trim().optional().nullable(),
  status: z.string().trim().optional().default('OPEN'),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectBreakdownTicketSchema = createSelectSchema(erp.breakdownTickets);
export const insertBreakdownTicketSchema = z.preprocess((val: any) => {
  const normalized = normalizeBreakdownTicketInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertBreakdownTicketSchema);
export const updateBreakdownTicketSchema = z.preprocess(
  normalizeBreakdownTicketInput,
  rawInsertBreakdownTicketSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

export const selectAuditLogSchema = createSelectSchema(erp.auditLogs);
export const insertAuditLogSchema = createInsertSchema(erp.auditLogs).strict();

// Protocol 1G Administrative Schemas
export const insertReasonCodeSchema = z.object({
  category: z.enum(['SCRAP', 'DOWNTIME', 'REJECTION', 'RETURN', 'ADJUSTMENT']),
  code: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1).max(255),
  is_active: z.boolean().default(true),
}).strict();
export const updateReasonCodeSchema = insertReasonCodeSchema.partial().extend({ version: z.number().int().min(1) }).strict();

export const insertDocumentTemplateSchema = z.object({
  doc_type: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(100),
  subject_template: z.string().trim().optional().nullable(),
  body_template: z.string().min(1),
  header_html: z.string().optional().nullable(),
  footer_html: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
}).strict();
export const updateDocumentTemplateSchema = insertDocumentTemplateSchema.partial().extend({ version: z.number().int().min(1) }).strict();

export const insertSystemParameterSchema = z.object({
  category: z.string().trim().min(1).max(50).default('GENERAL'),
  param_key: z.string().trim().min(1).max(100),
  param_value: z.string().min(1),
  data_type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).default('STRING'),
  description: z.string().optional().nullable(),
  is_read_only: z.boolean().default(false),
}).strict();
export const updateSystemParameterSchema = insertSystemParameterSchema.partial().extend({ version: z.number().int().min(1) }).strict();

export const insertBackupRunSchema = z.object({
  backup_type: z.enum(['FULL', 'SCHEMA_ONLY', 'TRANSACTION_LOGS']).default('FULL'),
  file_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).strict();
export const updateBackupRunSchema = z.object({
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']).optional(),
  error_message: z.string().optional().nullable(),
  version: z.number().int().min(1),
}).strict();

export const insertPrivacyRequestSchema = z.object({
  user_id: z.string().optional().nullable(),
  request_type: z.enum(['DATA_PORTABILITY', 'RIGHT_TO_BE_FORGOTTEN', 'RECTIFICATION']),
  reason: z.string().optional().nullable(),
}).strict();
export const updatePrivacyRequestSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'FULFILLED', 'REJECTED']),
  fulfillment_notes: z.string().optional().nullable(),
  version: z.number().int().min(1).optional(),
}).strict();

// Standard CRUD Schema Aliases
export const itemCreateSchema = insertItemSchema;
export const itemUpdateSchema = updateItemSchema;
export const supplierCreateSchema = insertSupplierSchema;
export const supplierUpdateSchema = updateSupplierSchema;
export const customerCreateSchema = insertCustomerSchema;
export const customerUpdateSchema = updateCustomerSchema;
export const warehouseCreateSchema = insertWarehouseSchema;
export const warehouseUpdateSchema = updateWarehouseSchema;
export const machineCreateSchema = insertMachineSchema;
export const machineUpdateSchema = updateMachineSchema;
export const bomCreateSchema = insertBillOfMaterialsSchema;
export const bomUpdateSchema = updateBillOfMaterialsSchema;
export const bomLineCreateSchema = insertBomLineSchema;
export const bomLineUpdateSchema = updateBomLineSchema;
export const workOrderCreateSchema = insertWorkOrderSchema;
export const workOrderUpdateSchema = updateWorkOrderSchema;
export const salesOrderCreateSchema = insertSalesOrderSchema;
export const salesOrderUpdateSchema = updateSalesOrderSchema;
export const purchaseOrderCreateSchema = insertPurchaseOrderSchema;
export const purchaseOrderUpdateSchema = updatePurchaseOrderSchema;
export const warehouseStockCreateSchema = insertWarehouseStockSchema;
export const warehouseStockUpdateSchema = updateWarehouseStockSchema;
export const stockLedgerCreateSchema = insertStockMovementLedgerSchema;
export const stockLedgerUpdateSchema = updateStockMovementLedgerSchema;
export const prCreateSchema = insertPurchaseRequisitionSchema;
export const prUpdateSchema = updatePurchaseRequisitionSchema;
export const grnCreateSchema = insertGoodsReceiptNoteSchema;
export const grnUpdateSchema = updateGoodsReceiptNoteSchema;
export const salesOrderLineCreateSchema = insertSalesOrderLineSchema;
export const salesOrderLineUpdateSchema = updateSalesOrderLineSchema;
export const deliveryChallanCreateSchema = insertDeliveryChallanSchema;
export const deliveryChallanUpdateSchema = updateDeliveryChallanSchema;
export const mrpRunCreateSchema = insertMrpRunSchema;
export const mrpRunUpdateSchema = updateMrpRunSchema;

// --- Wave 5: Finance & Double-Entry Accounting Schemas ---

const normalizeGlAccountInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.code !== undefined && out.account_code === undefined) out.account_code = out.code;
  if (out.accountCode !== undefined && out.account_code === undefined) out.account_code = out.accountCode;
  if (out.name !== undefined && out.account_name === undefined) out.account_name = out.name;
  if (out.accountName !== undefined && out.account_name === undefined) out.account_name = out.accountName;
  if (out.type !== undefined && out.account_type === undefined) out.account_type = out.type;
  if (out.accountType !== undefined && out.account_type === undefined) out.account_type = out.accountType;
  if (out.group !== undefined && out.account_group === undefined) out.account_group = out.group;
  if (out.accountGroup !== undefined && out.account_group === undefined) out.account_group = out.accountGroup;
  if (out.parentAccountId !== undefined && out.parent_account_id === undefined) out.parent_account_id = out.parentAccountId;
  if (out.isPostable !== undefined && out.is_postable === undefined) out.is_postable = out.isPostable;
  if (out.isActive !== undefined && out.is_active === undefined) out.is_active = out.isActive;
  if (out.openingBalance !== undefined && out.opening_balance === undefined) out.opening_balance = out.openingBalance;
  if (out.currentBalance !== undefined && out.current_balance === undefined) out.current_balance = out.currentBalance;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.code;
  delete out.accountCode;
  delete out.name;
  delete out.accountName;
  delete out.type;
  delete out.accountType;
  delete out.group;
  delete out.accountGroup;
  delete out.parentAccountId;
  delete out.isPostable;
  delete out.isActive;
  delete out.openingBalance;
  delete out.currentBalance;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertGlAccountSchema = z.object({
  id: z.string().uuid().optional(),
  account_code: z.string().trim().min(1).max(50),
  account_name: z.string().trim().min(1).max(255),
  account_type: z.string().trim().min(1).max(50),
  account_group: z.string().trim().optional().nullable(),
  parent_account_id: z.string().uuid().optional().nullable(),
  is_postable: z.coerce.boolean().optional().default(true),
  is_active: z.coerce.boolean().optional().default(true),
  currency: z.string().trim().optional().default('INR'),
  opening_balance: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  current_balance: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectGlAccountSchema = createSelectSchema(erp.glAccounts);
export const insertGlAccountSchema = z.preprocess((val: any) => {
  const normalized = normalizeGlAccountInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertGlAccountSchema);
export const updateGlAccountSchema = z.preprocess(
  normalizeGlAccountInput,
  rawInsertGlAccountSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeJournalEntryInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.jeNumber !== undefined && out.je_number === undefined) out.je_number = out.jeNumber;
  if (out.jeDate !== undefined && out.je_date === undefined) out.je_date = out.jeDate;
  if (out.date !== undefined && out.je_date === undefined) out.je_date = out.date;
  if (out.fiscalYear !== undefined && out.fiscal_year === undefined) out.fiscal_year = out.fiscalYear;
  if (out.jeType !== undefined && out.je_type === undefined) out.je_type = out.jeType;
  if (out.referenceType !== undefined && out.reference_type === undefined) out.reference_type = out.referenceType;
  if (out.referenceId !== undefined && out.reference_id === undefined) out.reference_id = out.referenceId;
  if (out.referenceNumber !== undefined && out.reference_number === undefined) out.reference_number = out.referenceNumber;
  if (out.totalDebit !== undefined && out.total_debit === undefined) out.total_debit = out.totalDebit;
  if (out.totalCredit !== undefined && out.total_credit === undefined) out.total_credit = out.totalCredit;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.jeNumber;
  delete out.jeDate;
  delete out.date;
  delete out.fiscalYear;
  delete out.jeType;
  delete out.referenceType;
  delete out.referenceId;
  delete out.referenceNumber;
  delete out.totalDebit;
  delete out.totalCredit;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertJournalEntrySchema = z.object({
  id: z.string().uuid().optional(),
  je_number: z.string().trim().min(1).max(100),
  je_date: z.union([z.string(), z.date()]).optional(),
  period: z.string().trim().optional().nullable(),
  fiscal_year: z.coerce.number().int().optional().default(2026),
  je_type: z.string().trim().optional().default('MANUAL'),
  status: z.string().trim().optional().default('DRAFT'),
  reference_type: z.string().trim().optional().nullable(),
  reference_id: z.string().trim().optional().nullable(),
  reference_number: z.string().trim().optional().nullable(),
  description: z.string().trim().min(1),
  total_debit: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  total_credit: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  lines: z.any().optional().default([]),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectJournalEntrySchema = createSelectSchema(erp.journalEntries);
export const insertJournalEntrySchema = z.preprocess((val: any) => {
  const normalized = normalizeJournalEntryInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertJournalEntrySchema);
export const updateJournalEntrySchema = z.preprocess(
  normalizeJournalEntryInput,
  rawInsertJournalEntrySchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeJournalLineInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.jeId !== undefined && out.je_id === undefined) out.je_id = out.jeId;
  if (out.lineNo !== undefined && out.line_no === undefined) out.line_no = out.lineNo;
  if (out.accountId !== undefined && out.account_id === undefined) out.account_id = out.accountId;
  if (out.accountCode !== undefined && out.account_code === undefined) out.account_code = out.accountCode;
  if (out.accountName !== undefined && out.account_name === undefined) out.account_name = out.accountName;
  if (out.debitAmount !== undefined && out.debit_amount === undefined) out.debit_amount = out.debitAmount;
  if (out.debit !== undefined && out.debit_amount === undefined) out.debit_amount = out.debit;
  if (out.creditAmount !== undefined && out.credit_amount === undefined) out.credit_amount = out.creditAmount;
  if (out.credit !== undefined && out.credit_amount === undefined) out.credit_amount = out.credit;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.jeId;
  delete out.lineNo;
  delete out.accountId;
  delete out.accountCode;
  delete out.accountName;
  delete out.debitAmount;
  delete out.debit;
  delete out.creditAmount;
  delete out.credit;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertJournalLineSchema = z.object({
  id: z.string().uuid().optional(),
  je_id: z.string().uuid(),
  line_no: z.coerce.number().int().min(1),
  account_id: z.string().uuid().optional().nullable(),
  account_code: z.string().trim().min(1),
  account_name: z.string().trim().optional().nullable(),
  debit_amount: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  credit_amount: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  description: z.string().trim().optional().nullable(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectJournalLineSchema = createSelectSchema(erp.journalLines);
export const insertJournalLineSchema = z.preprocess((val: any) => {
  const normalized = normalizeJournalLineInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertJournalLineSchema);
export const updateJournalLineSchema = z.preprocess(
  normalizeJournalLineInput,
  rawInsertJournalLineSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeApInvoiceInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.invoiceNumber !== undefined && out.invoice_number === undefined) out.invoice_number = out.invoiceNumber;
  if (out.supplierId !== undefined && out.supplier_id === undefined) out.supplier_id = out.supplierId;
  if (out.poId !== undefined && out.po_id === undefined) out.po_id = out.poId;
  if (out.grnId !== undefined && out.grn_id === undefined) out.grn_id = out.grnId;
  if (out.invoiceDate !== undefined && out.invoice_date === undefined) out.invoice_date = out.invoiceDate;
  if (out.dueDate !== undefined && out.due_date === undefined) out.due_date = out.dueDate;
  if (out.totalAmount !== undefined && out.total_amount === undefined) out.total_amount = out.totalAmount;
  if (out.taxAmount !== undefined && out.tax_amount === undefined) out.tax_amount = out.taxAmount;
  if (out.matchStatus !== undefined && out.match_status === undefined) out.match_status = out.matchStatus;
  if (out.matchNotes !== undefined && out.match_notes === undefined) out.match_notes = out.matchNotes;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.invoiceNumber;
  delete out.supplierId;
  delete out.poId;
  delete out.grnId;
  delete out.invoiceDate;
  delete out.dueDate;
  delete out.totalAmount;
  delete out.taxAmount;
  delete out.matchStatus;
  delete out.matchNotes;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertApInvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_number: z.string().trim().min(1).max(100),
  supplier_id: z.string().trim().min(1),
  po_id: z.string().trim().optional().nullable(),
  grn_id: z.string().trim().optional().nullable(),
  invoice_date: z.union([z.string(), z.date()]).optional(),
  due_date: z.union([z.string(), z.date()]).optional().nullable(),
  total_amount: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  tax_amount: z.union([z.number(), z.string()]).transform((v) => String(v)).optional().default('0'),
  status: z.string().trim().optional().default('PENDING'),
  match_status: z.string().trim().optional().default('UNMATCHED'),
  match_notes: z.string().trim().optional().nullable(),
  lines: z.any().optional().default([]),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectApInvoiceSchema = createSelectSchema(erp.apInvoices);
export const insertApInvoiceSchema = z.preprocess((val: any) => {
  const normalized = normalizeApInvoiceInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertApInvoiceSchema);
export const updateApInvoiceSchema = z.preprocess(
  normalizeApInvoiceInput,
  rawInsertApInvoiceSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

export const accountCreateSchema = insertGlAccountSchema;
export const accountUpdateSchema = updateGlAccountSchema;
export const glAccountCreateSchema = insertGlAccountSchema;
export const glAccountUpdateSchema = updateGlAccountSchema;
export const journalEntryCreateSchema = insertJournalEntrySchema;
export const journalEntryUpdateSchema = updateJournalEntrySchema;
export const journalLineCreateSchema = insertJournalLineSchema;
export const journalLineUpdateSchema = updateJournalLineSchema;
export const apInvoiceCreateSchema = insertApInvoiceSchema;
export const apInvoiceUpdateSchema = updateApInvoiceSchema;
export const apCreateSchema = insertApInvoiceSchema;
export const apUpdateSchema = updateApInvoiceSchema;

// --- Wave 6: HR, Operator Skills, Workspace Tasks & Notifications Schemas ---

const normalizeEmployeeInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.employeeCode !== undefined && out.employee_code === undefined) out.employee_code = out.employeeCode;
  if (out.firstName !== undefined && out.first_name === undefined) out.first_name = out.firstName;
  if (out.lastName !== undefined && out.last_name === undefined) out.last_name = out.lastName;
  if (out.employmentType !== undefined && out.employment_type === undefined) out.employment_type = out.employmentType;
  if (out.dateOfJoining !== undefined && out.date_of_joining === undefined) out.date_of_joining = out.dateOfJoining;
  if (out.joiningDate !== undefined && out.date_of_joining === undefined) out.date_of_joining = out.joiningDate;
  if (out.aadhaarMasked !== undefined && out.aadhaar_masked === undefined) out.aadhaar_masked = out.aadhaarMasked;
  if (out.nationalIdMasked !== undefined && out.aadhaar_masked === undefined) out.aadhaar_masked = out.nationalIdMasked;
  if (out.panMasked !== undefined && out.pan_masked === undefined) out.pan_masked = out.panMasked;
  if (out.bankAccountMasked !== undefined && out.bank_account_masked === undefined) out.bank_account_masked = out.bankAccountMasked;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.employeeCode;
  delete out.firstName;
  delete out.lastName;
  delete out.employmentType;
  delete out.dateOfJoining;
  delete out.joiningDate;
  delete out.aadhaarMasked;
  delete out.nationalIdMasked;
  delete out.panMasked;
  delete out.bankAccountMasked;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertEmployeeSchema = z.object({
  id: z.string().uuid().optional(),
  employee_code: z.string().trim().min(1).max(50),
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  department: z.string().trim().min(1).max(100),
  designation: z.string().trim().min(1).max(100),
  employment_type: z.string().trim().optional().default('PERMANENT'),
  status: z.string().trim().optional().default('ACTIVE'),
  date_of_joining: z.union([z.string(), z.date()]).optional(),
  aadhaar_masked: z.string().trim().optional().nullable(),
  pan_masked: z.string().trim().optional().nullable(),
  bank_account_masked: z.string().trim().optional().nullable(),
  skills: z.any().optional().default([]),
  certifications: z.any().optional().default([]),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectEmployeeSchema = createSelectSchema(erp.employees);
export const insertEmployeeSchema = z.preprocess((val: any) => {
  const normalized = normalizeEmployeeInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertEmployeeSchema);
export const updateEmployeeSchema = z.preprocess(
  normalizeEmployeeInput,
  rawInsertEmployeeSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeAttendanceRecordInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.employeeId !== undefined && out.employee_id === undefined) out.employee_id = out.employeeId;
  if (out.employeeName !== undefined && out.employee_name === undefined) out.employee_name = out.employeeName;
  if (out.checkIn !== undefined && out.check_in === undefined) out.check_in = out.checkIn;
  if (out.checkOut !== undefined && out.check_out === undefined) out.check_out = out.checkOut;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.employeeId;
  delete out.employeeName;
  delete out.checkIn;
  delete out.checkOut;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertAttendanceRecordSchema = z.object({
  id: z.string().uuid().optional(),
  employee_id: z.string().trim().min(1),
  employee_name: z.string().trim().optional().nullable(),
  date: z.string().trim().optional().default(() => new Date().toISOString().split('T')[0]),
  check_in: z.union([z.string(), z.date()]).optional().nullable(),
  check_out: z.union([z.string(), z.date()]).optional().nullable(),
  status: z.string().trim().optional().default('PRESENT'),
  shift: z.string().trim().optional().nullable(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectAttendanceRecordSchema = createSelectSchema(erp.attendanceRecords);
export const insertAttendanceRecordSchema = z.preprocess((val: any) => {
  const normalized = normalizeAttendanceRecordInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertAttendanceRecordSchema);
export const updateAttendanceRecordSchema = z.preprocess(
  normalizeAttendanceRecordInput,
  rawInsertAttendanceRecordSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeShiftRosterInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.employeeId !== undefined && out.employee_id === undefined) out.employee_id = out.employeeId;
  if (out.employeeName !== undefined && out.employee_name === undefined) out.employee_name = out.employeeName;
  if (out.weekStartDate !== undefined && out.week_start_date === undefined) out.week_start_date = out.weekStartDate;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.employeeId;
  delete out.employeeName;
  delete out.weekStartDate;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertShiftRosterSchema = z.object({
  id: z.string().uuid().optional(),
  employee_id: z.string().trim().min(1),
  employee_name: z.string().trim().optional().nullable(),
  week_start_date: z.string().trim().min(1),
  schedule: z.any().optional().default({}),
  status: z.string().trim().optional().default('PUBLISHED'),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectShiftRosterSchema = createSelectSchema(erp.shiftRosters);
export const insertShiftRosterSchema = z.preprocess((val: any) => {
  const normalized = normalizeShiftRosterInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertShiftRosterSchema);
export const updateShiftRosterSchema = z.preprocess(
  normalizeShiftRosterInput,
  rawInsertShiftRosterSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeOperatorSkillInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.operatorId !== undefined && out.operator_id === undefined) out.operator_id = out.operatorId;
  if (out.machineId !== undefined && out.machine_id === undefined) out.machine_id = out.machineId;
  if (out.skillName !== undefined && out.skill_name === undefined) out.skill_name = out.skillName;
  if (out.competencyLevel !== undefined && out.competency_level === undefined) out.competency_level = out.competencyLevel;
  if (out.isCertified !== undefined && out.is_certified === undefined) out.is_certified = out.isCertified;
  if (out.certifiedDate !== undefined && out.certified_date === undefined) out.certified_date = out.certifiedDate;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.operatorId;
  delete out.machineId;
  delete out.skillName;
  delete out.competencyLevel;
  delete out.isCertified;
  delete out.certifiedDate;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertOperatorSkillSchema = z.object({
  id: z.string().uuid().optional(),
  operator_id: z.string().trim().min(1),
  machine_id: z.string().trim().optional().nullable(),
  skill_name: z.string().trim().min(1).max(100),
  competency_level: z.coerce.number().int().min(1).max(5).optional().default(1),
  is_certified: z.coerce.boolean().optional().default(true),
  certified_date: z.union([z.string(), z.date()]).optional(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectOperatorSkillSchema = createSelectSchema(erp.operatorSkills);
export const insertOperatorSkillSchema = z.preprocess((val: any) => {
  const normalized = normalizeOperatorSkillInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertOperatorSkillSchema);
export const updateOperatorSkillSchema = z.preprocess(
  normalizeOperatorSkillInput,
  rawInsertOperatorSkillSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeWorkspaceTaskInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.assignedTo !== undefined && out.assigned_to === undefined) out.assigned_to = out.assignedTo;
  if (out.dueDate !== undefined && out.due_date === undefined) out.due_date = out.dueDate;
  if (out.plantId !== undefined && out.plant_id === undefined) out.plant_id = out.plantId;
  delete out.assignedTo;
  delete out.dueDate;
  delete out.plantId;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  delete out.createdBy;
  delete out.updatedBy;
  delete out.created_by;
  delete out.updated_by;
  return out;
};

const rawInsertWorkspaceTaskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().optional().nullable(),
  status: z.string().trim().optional().default('TODO'),
  priority: z.string().trim().optional().default('MEDIUM'),
  assigned_to: z.string().trim().optional().nullable(),
  due_date: z.union([z.string(), z.date()]).optional().nullable(),
  plant_id: z.string().uuid().optional().nullable(),
}).strict();

export const selectWorkspaceTaskSchema = createSelectSchema(erp.workspaceTasks);
export const insertWorkspaceTaskSchema = z.preprocess((val: any) => {
  const normalized = normalizeWorkspaceTaskInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertWorkspaceTaskSchema);
export const updateWorkspaceTaskSchema = z.preprocess(
  normalizeWorkspaceTaskInput,
  rawInsertWorkspaceTaskSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeNotificationInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.userId !== undefined && out.user_id === undefined) out.user_id = out.userId;
  if (out.isRead !== undefined && out.is_read === undefined) out.is_read = out.isRead;
  delete out.userId;
  delete out.isRead;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  return out;
};

const rawInsertNotificationSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().trim().min(1),
  type: z.string().trim().optional().default('INFO'),
  title: z.string().trim().min(1).max(255),
  message: z.string().trim().min(1),
  is_read: z.coerce.boolean().optional().default(false),
  link: z.string().trim().optional().nullable(),
}).strict();

export const selectNotificationSchema = createSelectSchema(erp.notifications);
export const insertNotificationSchema = z.preprocess((val: any) => {
  const normalized = normalizeNotificationInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertNotificationSchema);
export const updateNotificationSchema = z.preprocess(
  normalizeNotificationInput,
  rawInsertNotificationSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

const normalizeWorkspacePresetInput = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out = { ...val };
  if (out.userId !== undefined && out.user_id === undefined) out.user_id = out.userId;
  if (out.viewName !== undefined && out.view_name === undefined) out.view_name = out.viewName;
  if (out.presetName !== undefined && out.preset_name === undefined) out.preset_name = out.presetName;
  if (out.isDefault !== undefined && out.is_default === undefined) out.is_default = out.isDefault;
  delete out.userId;
  delete out.viewName;
  delete out.presetName;
  delete out.isDefault;
  delete out.tenantId;
  delete out.tenant_id;
  delete out.created_at;
  delete out.updated_at;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.deleted_at;
  delete out.deletedAt;
  return out;
};

const rawInsertWorkspacePresetSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().trim().min(1),
  view_name: z.string().trim().min(1).max(100),
  preset_name: z.string().trim().min(1).max(100),
  filters: z.any().optional().default({}),
  columns: z.any().optional().default([]),
  is_default: z.coerce.boolean().optional().default(false),
}).strict();

export const selectWorkspacePresetSchema = createSelectSchema(erp.workspacePresets);
export const insertWorkspacePresetSchema = z.preprocess((val: any) => {
  const normalized = normalizeWorkspacePresetInput(val);
  if (normalized && typeof normalized === 'object') {
    delete normalized.version;
  }
  return normalized;
}, rawInsertWorkspacePresetSchema);
export const updateWorkspacePresetSchema = z.preprocess(
  normalizeWorkspacePresetInput,
  rawInsertWorkspacePresetSchema.partial().extend({ version: z.coerce.number().int().min(1).optional() }).strict()
);

// Standard Aliases
export const employeeCreateSchema = insertEmployeeSchema;
export const employeeUpdateSchema = updateEmployeeSchema;
export const attendanceRecordCreateSchema = insertAttendanceRecordSchema;
export const attendanceRecordUpdateSchema = updateAttendanceRecordSchema;
export const shiftRosterCreateSchema = insertShiftRosterSchema;
export const shiftRosterUpdateSchema = updateShiftRosterSchema;
export const operatorSkillCreateSchema = insertOperatorSkillSchema;
export const operatorSkillUpdateSchema = updateOperatorSkillSchema;
export const workspaceTaskCreateSchema = insertWorkspaceTaskSchema;
export const workspaceTaskUpdateSchema = updateWorkspaceTaskSchema;
export const notificationCreateSchema = insertNotificationSchema;
export const notificationUpdateSchema = updateNotificationSchema;
export const workspacePresetCreateSchema = insertWorkspacePresetSchema;
export const workspacePresetUpdateSchema = updateWorkspacePresetSchema;

export const warehouseBinCreateSchema = z.object({
  id: z.string().uuid().optional(),
  warehouse_id: z.string().trim().min(1),
  bin_code: z.string().trim().min(1),
  zone: z.string().trim().optional(),
  aisle: z.string().trim().optional(),
  rack: z.string().trim().optional(),
  shelf: z.string().trim().optional(),
  capacity_kg: z.coerce.number().positive().default(1000),
  is_active: z.boolean().default(true),
});
export const warehouseBinUpdateSchema = warehouseBinCreateSchema.partial();



