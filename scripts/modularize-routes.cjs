const fs = require('fs');
const path = require('path');

const ROUTES_FILE = path.join(__dirname, '../middleware/src/routes.ts');
const lines = fs.readFileSync(ROUTES_FILE, 'utf8').split('\n');

const getSlice = (startLine, endLine) => lines.slice(startLine - 1, endLine).join('\n');

// 1. IDENTITY: lines 140 to 450 AND lines 1695 to 1902
const identityCode = `import { z } from 'zod';
import type { Auth } from '../../auth.js';
import { hashPassword, verifyPassword, getSecurityPolicy, invalidateSecurityPolicyCache } from '../../auth.js';
import { eq, ne, and, sql } from 'drizzle-orm';
import { withTx, withDrizzleTx, schema } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import { generateTempPassword, insertUser, writeAudit } from '../../userStore.js';
import { ctx, mapUser, mapPlant, loadUser, assertAssignable, replacePlants, snapshot } from '../../core/helpers.js';

const str = (max = 200) => z.string().trim().min(1).max(max);
const optStr = (max = 200) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));
const idParam = z.string().trim().min(1).max(64);

export function identityRoutes(r: any, auth: Auth) {
${getSlice(140, 450)}

${getSlice(1695, 1902)}
}
`;

// 2. ORG: lines 486 to 784 AND lines 799 to 1101
const orgCode = `import { z } from 'zod';
import { eq, and, isNull, asc, sql } from 'drizzle-orm';
import { withTx, withDrizzleTx, schema } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import { writeAudit } from '../../userStore.js';
import { ctx, mapPlant } from '../../core/helpers.js';
import { ERP_MODULES, ERP_SUBJECT_CATALOG, ERP_ACTIONS, STANDARD_SOD_RULES } from '../../contracts/permissions.js';

const str = (max = 200) => z.string().trim().min(1).max(max);
const optStr = (max = 200) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

export function orgRoutes(r: any) {
${getSlice(486, 784)}

${getSlice(799, 1101)}
}
`;

// 3. APPROVALS: lines 1102 to 1320
const approvalsCode = `import { z } from 'zod';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { withDrizzleTx, schema } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import { writeAudit } from '../../userStore.js';
import { ctx } from '../../core/helpers.js';

const str = (max = 200) => z.string().trim().min(1).max(max);
const optStr = (max = 200) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

export function approvalsRoutes(r: any) {
${getSlice(1102, 1320)}
}
`;

// 4. PLATFORM: lines 451 to 485, 785 to 798, 1321 to 1409, 2002 to 2075
const platformCode = `import { z } from 'zod';
import { withTx, withDrizzleTx } from '../../db.js';
import { can, wrap, type Actor } from '../../middleware.js';
import { registerResourceRoutes } from '../../crud.js';
import { ctx, hostMetrics } from '../../core/helpers.js';
import * as zod from '../../schema/zod.js';

export function platformRoutes(r: any) {
${getSlice(451, 485)}

${getSlice(785, 798)}

${getSlice(1321, 1409)}

${getSlice(2002, 2075)}
}
`;

// 5. INTEGRATIONS: lines 1410 to 1694
const integrationsCode = `import { z } from 'zod';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { withTx, withDrizzleTx, schema } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import { writeAudit } from '../../userStore.js';
import { ctx } from '../../core/helpers.js';
import { pool } from '../../db.js';

const str = (max = 200) => z.string().trim().min(1).max(max);
const optStr = (max = 200) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

export function integrationsRoutes(r: any) {
${getSlice(1410, 1694)}
}
`;

// 6. MASTERDATA: items resource
const masterdataCode = `import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';

export function masterdataRoutes(r: any) {
  registerResourceRoutes(r, '/items', {
    subject: 'Item',
    table: 'items',
    columns: ['id', 'code', 'name', 'category', 'entity_type', 'unit', 'stock', 'min_stock', 'max_stock', 'reorder_point', 'cost', 'selling_price', 'approval', 'status', 'part_weight_grams', 'runner_weight_grams', 'cavity_count', 'cycle_time', 'item_group', 'resin_type', 'color', 'hsn_code', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'name', 'category', 'item_group', 'resin_type'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name', 'stock', 'cost', 'selling_price'],
    createSchema: zod.itemCreateSchema,
    updateSchema: zod.itemUpdateSchema,
  });
}
`;

// 7. PROCUREMENT: suppliers and purchase orders
const procurementCode = `import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';

export function procurementRoutes(r: any) {
  registerResourceRoutes(r, '/suppliers', {
    subject: 'Supplier',
    table: 'suppliers',
    columns: ['id', 'code', 'name', 'type', 'rating', 'status', 'contacts', 'payment_terms', 'currency', 'banking_tax', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'name', 'type', 'status'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name', 'rating'],
    createSchema: zod.supplierCreateSchema,
    updateSchema: zod.supplierUpdateSchema,
  });

  registerResourceRoutes(r, '/purchase-orders', {
    subject: 'PurchaseOrder',
    table: 'purchase_orders',
    columns: ['id', 'po_number', 'supplier_id', 'status', 'total_amount', 'order_date', 'expected_delivery_date', 'items', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['po_number', 'status', 'supplier_id'],
    sortAllowlist: ['created_at', 'updated_at', 'po_number', 'total_amount', 'order_date'],
    createSchema: zod.purchaseOrderCreateSchema,
    updateSchema: zod.purchaseOrderUpdateSchema,
  });

  // Backward compatibility alias for migration
  registerResourceRoutes(r, '/purchase_orders', {
    subject: 'PurchaseOrder',
    table: 'purchase_orders',
    columns: ['id', 'po_number', 'supplier_id', 'status', 'total_amount', 'order_date', 'expected_delivery_date', 'items', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['po_number', 'status', 'supplier_id'],
    sortAllowlist: ['created_at', 'updated_at', 'po_number', 'total_amount', 'order_date'],
    createSchema: zod.purchaseOrderCreateSchema,
    updateSchema: zod.purchaseOrderUpdateSchema,
  });
}
`;

// 8. SALES: customers and sales orders
const salesCode = `import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';

export function salesRoutes(r: any) {
  registerResourceRoutes(r, '/customers', {
    subject: 'Customer',
    table: 'customers',
    columns: ['id', 'code', 'name', 'customer_type', 'tier', 'gstin', 'pan', 'credit_limit', 'credit_days', 'status', 'contacts', 'shipping_addresses', 'billing_addresses', 'payment_terms', 'incoterms', 'currency', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'name', 'gstin', 'pan'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name', 'credit_limit'],
    createSchema: zod.customerCreateSchema,
    updateSchema: zod.customerUpdateSchema,
  });

  registerResourceRoutes(r, '/sales-orders', {
    subject: 'SalesOrder',
    table: 'sales_orders',
    columns: ['id', 'so_number', 'customer_id', 'status', 'total_amount', 'order_date', 'delivery_date', 'items', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['so_number', 'status', 'customer_id'],
    sortAllowlist: ['created_at', 'updated_at', 'so_number', 'total_amount', 'order_date'],
    createSchema: zod.salesOrderCreateSchema,
    updateSchema: zod.salesOrderUpdateSchema,
  });

  // Backward compatibility alias for migration
  registerResourceRoutes(r, '/sales_orders', {
    subject: 'SalesOrder',
    table: 'sales_orders',
    columns: ['id', 'so_number', 'customer_id', 'status', 'total_amount', 'order_date', 'delivery_date', 'items', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['so_number', 'status', 'customer_id'],
    sortAllowlist: ['created_at', 'updated_at', 'so_number', 'total_amount', 'order_date'],
    createSchema: zod.salesOrderCreateSchema,
    updateSchema: zod.salesOrderUpdateSchema,
  });
}
`;

// 9. WAREHOUSE: warehouses
const warehouseCode = `import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';

export function warehouseRoutes(r: any) {
  registerResourceRoutes(r, '/warehouses', {
    subject: 'Warehouse',
    table: 'warehouses',
    columns: ['id', 'code', 'name', 'plant_id', 'location_type', 'address', 'bins', 'created_by', 'updated_by', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'name', 'location_type'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name'],
    createSchema: zod.warehouseCreateSchema,
    updateSchema: zod.warehouseUpdateSchema,
  });
}
`;

// 10. MANUFACTURING: machines and work orders
const manufacturingCode = `import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';

export function manufacturingRoutes(r: any) {
  registerResourceRoutes(r, '/machines', {
    subject: 'Machine',
    table: 'machines',
    columns: ['id', 'code', 'name', 'tonnage', 'plant', 'status', 'brand', 'model', 'hourly_rate', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'name', 'brand', 'model', 'plant'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name', 'tonnage', 'hourly_rate'],
    createSchema: zod.machineCreateSchema,
    updateSchema: zod.machineUpdateSchema,
  });

  registerResourceRoutes(r, '/work-orders', {
    subject: 'WorkOrder',
    table: 'work_orders',
    columns: ['id', 'code', 'item_code', 'machine_id', 'target_qty', 'produced_qty', 'good_qty', 'rejection_qty', 'status', 'priority', 'start_date', 'due_date', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'item_code', 'status', 'priority'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'target_qty', 'start_date', 'due_date'],
    createSchema: zod.workOrderCreateSchema,
    updateSchema: zod.workOrderUpdateSchema,
  });

  // Backward compatibility alias for migration
  registerResourceRoutes(r, '/work_orders', {
    subject: 'WorkOrder',
    table: 'work_orders',
    columns: ['id', 'code', 'item_code', 'machine_id', 'target_qty', 'produced_qty', 'good_qty', 'rejection_qty', 'status', 'priority', 'start_date', 'due_date', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'item_code', 'status', 'priority'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'target_qty', 'start_date', 'due_date'],
    createSchema: zod.workOrderCreateSchema,
    updateSchema: zod.workOrderUpdateSchema,
  });
}
`;

// 11. ENGINEERING: bill of materials
const engineeringCode = `import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';

export function engineeringRoutes(r: any) {
  registerResourceRoutes(r, '/bill-of-materials', {
    subject: 'BillOfMaterial',
    table: 'bill_of_materials',
    columns: ['id', 'item_code', 'bom_version', 'status', 'lines', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['item_code', 'status', 'bom_version'],
    sortAllowlist: ['created_at', 'updated_at', 'item_code', 'status'],
    createSchema: zod.bomCreateSchema,
    updateSchema: zod.bomUpdateSchema,
  });

  // Backward compatibility alias for migration
  registerResourceRoutes(r, '/bill_of_materials', {
    subject: 'BillOfMaterial',
    table: 'bill_of_materials',
    columns: ['id', 'item_code', 'bom_version', 'status', 'lines', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['item_code', 'status', 'bom_version'],
    sortAllowlist: ['created_at', 'updated_at', 'item_code', 'status'],
    createSchema: zod.bomCreateSchema,
    updateSchema: zod.bomUpdateSchema,
  });
}
`;

// Write all domain files
const files = {
  'identity/routes.ts': identityCode,
  'org/routes.ts': orgCode,
  'approvals/routes.ts': approvalsCode,
  'platform/routes.ts': platformCode,
  'integrations/routes.ts': integrationsCode,
  'masterdata/routes.ts': masterdataCode,
  'procurement/routes.ts': procurementCode,
  'sales/routes.ts': salesCode,
  'warehouse/routes.ts': warehouseCode,
  'manufacturing/routes.ts': manufacturingCode,
  'engineering/routes.ts': engineeringCode,
  'quality/routes.ts': 'export function qualityRoutes(_r: any) {}\n',
  'finance/routes.ts': 'export function financeRoutes(_r: any) {}\n',
  'hr/routes.ts': 'export function hrRoutes(_r: any) {}\n',
  'maintenance/routes.ts': 'export function maintenanceRoutes(_r: any) {}\n',
  'crm/routes.ts': 'export function crmRoutes(_r: any) {}\n',
  'planning/routes.ts': 'export function planningRoutes(_r: any) {}\n',
  'analytics/routes.ts': 'export function analyticsRoutes(_r: any) {}\n',
  'workspace/routes.ts': 'export function workspaceRoutes(_r: any) {}\n',
};

const MODULES_DIR = path.join(__dirname, '../middleware/src/modules');
for (const [rel, code] of Object.entries(files)) {
  const dest = path.join(MODULES_DIR, rel);
  fs.writeFileSync(dest, code, 'utf8');
  console.log(`Wrote ${rel} (${code.length} bytes)`);
}

// Write the aggregator routes.ts
const aggregatorCode = `import type { Auth } from './auth.js';
import { requireSession, enforcePasswordChange, errorHandler } from './middleware.js';
import { createRouter } from './router.js';

import { identityRoutes } from './modules/identity/routes.js';
import { orgRoutes } from './modules/org/routes.js';
import { approvalsRoutes } from './modules/approvals/routes.js';
import { platformRoutes } from './modules/platform/routes.js';
import { integrationsRoutes } from './modules/integrations/routes.js';
import { masterdataRoutes } from './modules/masterdata/routes.js';
import { procurementRoutes } from './modules/procurement/routes.js';
import { salesRoutes } from './modules/sales/routes.js';
import { warehouseRoutes } from './modules/warehouse/routes.js';
import { manufacturingRoutes } from './modules/manufacturing/routes.js';
import { engineeringRoutes } from './modules/engineering/routes.js';
import { qualityRoutes } from './modules/quality/routes.js';
import { financeRoutes } from './modules/finance/routes.js';
import { hrRoutes } from './modules/hr/routes.js';
import { maintenanceRoutes } from './modules/maintenance/routes.js';
import { crmRoutes } from './modules/crm/routes.js';
import { planningRoutes } from './modules/planning/routes.js';
import { analyticsRoutes } from './modules/analytics/routes.js';
import { workspaceRoutes } from './modules/workspace/routes.js';

export function buildRouter(auth: Auth) {
  const r = createRouter(errorHandler);
  r.use(requireSession(auth), enforcePasswordChange);

  identityRoutes(r, auth);
  orgRoutes(r);
  approvalsRoutes(r);
  platformRoutes(r);
  integrationsRoutes(r);
  masterdataRoutes(r);
  procurementRoutes(r);
  salesRoutes(r);
  warehouseRoutes(r);
  manufacturingRoutes(r);
  engineeringRoutes(r);
  qualityRoutes(r);
  financeRoutes(r);
  hrRoutes(r);
  maintenanceRoutes(r);
  crmRoutes(r);
  planningRoutes(r);
  analyticsRoutes(r);
  workspaceRoutes(r);

  return r.app;
}
`;

fs.writeFileSync(ROUTES_FILE, aggregatorCode, 'utf8');
console.log('routes.ts successfully converted to a clean ~35-line aggregator!');
