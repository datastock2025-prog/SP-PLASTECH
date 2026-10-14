import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import * as identity from './identity.js';
import * as erp from './erp.js';

// Identity & Access Zod Schemas
export const selectTenantSchema = createSelectSchema(identity.tenants);
export const insertTenantSchema = createInsertSchema(identity.tenants);

export const selectPlantSchema = createSelectSchema(identity.plants);
export const insertPlantSchema = createInsertSchema(identity.plants);

export const selectRoleSchema = createSelectSchema(identity.roles);
export const insertRoleSchema = createInsertSchema(identity.roles);

export const selectUserProfileSchema = createSelectSchema(identity.userProfiles);
export const insertUserProfileSchema = createInsertSchema(identity.userProfiles);

export const selectUserPreferencesSchema = createSelectSchema(identity.userPreferences);
export const insertUserPreferencesSchema = createInsertSchema(identity.userPreferences);

// ERP Core Zod Schemas
export const selectItemSchema = createSelectSchema(erp.items);
export const insertItemSchema = createInsertSchema(erp.items);

export const selectSupplierSchema = createSelectSchema(erp.suppliers);
export const insertSupplierSchema = createInsertSchema(erp.suppliers);

export const selectCustomerSchema = createSelectSchema(erp.customers);
export const insertCustomerSchema = createInsertSchema(erp.customers);

export const selectWarehouseSchema = createSelectSchema(erp.warehouses);
export const insertWarehouseSchema = createInsertSchema(erp.warehouses);

export const selectMachineSchema = createSelectSchema(erp.machines);
export const insertMachineSchema = createInsertSchema(erp.machines);

export const selectBillOfMaterialsSchema = createSelectSchema(erp.billOfMaterials);
export const insertBillOfMaterialsSchema = createInsertSchema(erp.billOfMaterials);

export const selectWorkOrderSchema = createSelectSchema(erp.workOrders);
export const insertWorkOrderSchema = createInsertSchema(erp.workOrders);

export const selectSalesOrderSchema = createSelectSchema(erp.salesOrders);
export const insertSalesOrderSchema = createInsertSchema(erp.salesOrders);

export const selectPurchaseOrderSchema = createSelectSchema(erp.purchaseOrders);
export const insertPurchaseOrderSchema = createInsertSchema(erp.purchaseOrders);

export const selectAuditLogSchema = createSelectSchema(erp.auditLogs);
export const insertAuditLogSchema = createInsertSchema(erp.auditLogs);
