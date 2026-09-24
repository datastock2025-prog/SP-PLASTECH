import { z } from 'zod';

// ============================================================================
// BOM & ENGINEERING DTOs (Screens 1 – 7)
// ============================================================================

// Screen 1: Item Master (SKUs)
export const CreateItemDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  itemCode: z.string().min(2, 'Item Code is required'),
  itemName: z.string().min(2, 'Item Name is required'),
  itemDescription: z.string().optional(),
  itemType: z.enum(['FG', 'RM', 'MB', 'PKG', 'WIP', 'TOOLING', 'CONSUMABLE', 'SERVICE']).default('FG'),
  itemGroup: z.string().default('Polymer Resins'),
  itemFamily: z.string().optional(),
  uom: z.string().default('PCS'),
  unitWeight: z.number().positive().default(0.45), // kg
  volume: z.number().positive().optional(),
  shelfLifeDays: z.number().int().optional(),
  isHazardous: z.boolean().default(false),
  isSerialized: z.boolean().default(false),
  isLotTracked: z.boolean().default(true),
  abcClassification: z.enum(['A', 'B', 'C']).default('A'),
  xyzClassification: z.enum(['X', 'Y', 'Z']).default('X'),
  standardCost: z.number().nonnegative().default(120),
  lastPurchasePrice: z.number().nonnegative().optional(),
  lastSalePrice: z.number().nonnegative().optional(),
  minStock: z.number().nonnegative().default(100),
  maxStock: z.number().nonnegative().default(5000),
  reorderPoint: z.number().nonnegative().default(500),
  reorderQty: z.number().positive().default(1000),
  leadTimeDays: z.number().int().positive().default(7),
  supplierId: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'INACTIVE', 'OBSOLETE', 'REJECTED']).default('DRAFT'),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateItemDto = z.input<typeof CreateItemDtoSchema>;
export const UpdateItemDtoSchema = CreateItemDtoSchema.partial();
export type UpdateItemDto = z.input<typeof UpdateItemDtoSchema>;

// Screen 2 & 3: BOM List & Multi-Level BOM Builder
export const BomLineDtoSchema = z.object({
  id: z.string().optional(),
  lineNo: z.number().int().default(1),
  componentItemId: z.string().min(1, 'Component Item ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  uom: z.string().default('PCS'),
  scrapPct: z.number().min(0).max(100).default(0),
  yieldPct: z.number().min(0).max(100).default(100),
  isPhantom: z.boolean().default(false),
  isOptional: z.boolean().default(false),
  isCritical: z.boolean().default(false),
  referenceDesignator: z.string().optional(),
  position: z.string().optional(),
  sequence: z.number().int().default(10),
  notes: z.string().optional(),
});
export type BomLineDto = z.input<typeof BomLineDtoSchema>;

export const CreateBomDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  bomCode: z.string().min(2, 'BOM Code is required'),
  bomName: z.string().min(2, 'BOM Name is required'),
  parentItemId: z.string().min(1, 'Parent Item ID is required'),
  bomType: z.enum(['MANUFACTURING', 'ENGINEERING', 'COSTING', 'PLANNING', 'SALES', 'CONFIGURABLE']).default('MANUFACTURING'),
  version: z.string().default('v1.0'),
  revision: z.string().default('A'),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'OBSOLETE', 'REJECTED']).default('DRAFT'),
  quantity: z.number().positive().default(1),
  uom: z.string().default('PCS'),
  yieldPct: z.number().min(0).max(100).default(100),
  scrapPct: z.number().min(0).max(100).default(0),
  cycleTimeSec: z.number().positive().default(15.2),
  setupTimeMin: z.number().nonnegative().default(45),
  totalCost: z.number().nonnegative().default(0),
  isDefault: z.boolean().default(true),
  lines: z.array(BomLineDtoSchema).min(1, 'At least 1 BOM line is required'),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateBomDto = z.input<typeof CreateBomDtoSchema>;
export const UpdateBomDtoSchema = CreateBomDtoSchema.partial();
export type UpdateBomDto = z.input<typeof UpdateBomDtoSchema>;

// Screen 4: BOM Versions & Diff
export const CreateBomVersionDtoSchema = z.object({
  changeReason: z.string().min(3, 'Change reason is required'),
});
export type CreateBomVersionDto = z.input<typeof CreateBomVersionDtoSchema>;

// Screen 5: Engineering Change Orders (ECO/ECR)
export const CreateEcrDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  ecrNumber: z.string().optional(),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  requestType: z.enum(['NEW', 'MODIFY', 'OBSOLETE', 'SUBSTITUTE', 'CORRECTIVE', 'IMPROVEMENT']).default('MODIFY'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).default('MEDIUM'),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'CLOSED']).default('DRAFT'),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
  justification: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateEcrDto = z.input<typeof CreateEcrDtoSchema>;

export const CreateEcoDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  ecoNumber: z.string().optional(),
  ecrId: z.string().optional(),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_IMPLEMENTATION', 'IMPLEMENTED', 'CLOSED']).default('DRAFT'),
  effectiveDate: z.string().default(new Date().toISOString()),
  implementationDate: z.string().optional(),
  items: z.array(z.object({
    bomId: z.string().optional(),
    itemId: z.string().optional(),
    changeType: z.enum(['BOM_CHANGE', 'ITEM_CHANGE', 'ROUTING_CHANGE']).default('BOM_CHANGE'),
    oldVersion: z.string().optional(),
    newVersion: z.string().optional(),
    changeDetails: z.record(z.string(), z.any()).default({}),
  })).default([]),
});
export type CreateEcoDto = z.input<typeof CreateEcoDtoSchema>;

// Screen 6: Process Routing Operations
export const RoutingOperationDtoSchema = z.object({
  id: z.string().optional(),
  operationNo: z.number().int().default(10),
  operationCode: z.string().min(2),
  operationName: z.string().min(2),
  workCenterId: z.string().optional(),
  machineId: z.string().optional(),
  setupTimeMin: z.number().nonnegative().default(30),
  runTimePerUnit: z.number().positive().default(0.25), // minutes per unit
  teardownTimeMin: z.number().nonnegative().default(15),
  queueTimeMin: z.number().nonnegative().default(0),
  moveTimeMin: z.number().nonnegative().default(5),
  laborRate: z.number().nonnegative().default(180), // per hr
  machineRate: z.number().nonnegative().default(450), // per hr
  overheadRate: z.number().nonnegative().default(85), // per hr
  crewSize: z.number().int().default(1),
  isCritical: z.boolean().default(false),
  isInspection: z.boolean().default(false),
  notes: z.string().optional(),
});
export type RoutingOperationDto = z.input<typeof RoutingOperationDtoSchema>;

export const CreateRoutingDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  routingCode: z.string().min(2, 'Routing Code is required'),
  routingName: z.string().min(2, 'Routing Name is required'),
  itemId: z.string().min(1, 'Item ID is required'),
  bomId: z.string().optional(),
  version: z.string().default('v1.0'),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'OBSOLETE']).default('DRAFT'),
  isDefault: z.boolean().default(true),
  operations: z.array(RoutingOperationDtoSchema).min(1, 'At least 1 operation required'),
});
export type CreateRoutingDto = z.input<typeof CreateRoutingDtoSchema>;
export const UpdateRoutingDtoSchema = CreateRoutingDtoSchema.partial();
export type UpdateRoutingDto = z.input<typeof UpdateRoutingDtoSchema>;

// Screen 7: Standard Cost Rollup
export const CreateCostDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  itemId: z.string().min(1),
  bomId: z.string().optional(),
  routingId: z.string().optional(),
  costType: z.enum(['STANDARD', 'ACTUAL', 'ESTIMATED', 'PLANNED', 'HISTORICAL']).default('STANDARD'),
  costVersion: z.string().default('v1.0'),
  materialCost: z.number().nonnegative().default(0),
  laborCost: z.number().nonnegative().default(0),
  machineCost: z.number().nonnegative().default(0),
  overheadCost: z.number().nonnegative().default(0),
  subcontractCost: z.number().nonnegative().default(0),
  currency: z.string().default('INR'),
  effectiveFrom: z.string().default(new Date().toISOString()),
});
export type CreateCostDto = z.input<typeof CreateCostDtoSchema>;

// ============================================================================
// MRP DTOs (Screens 8 – 9)
// ============================================================================

// Screen 8: MRP Run
export const RunMrpDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  runType: z.enum(['REGENERATIVE', 'NET_CHANGE', 'PLANNED_ORDER']).default('NET_CHANGE'),
  runMode: z.enum(['PLANT_WISE', 'CONSOLIDATED', 'ITEM_WISE']).default('PLANT_WISE'),
  plantId: z.string().optional().default('PLANT-01'),
  planningHorizonDays: z.number().int().positive().default(90),
  frozenZoneDays: z.number().int().nonnegative().default(7),
  includeSafetyStock: z.boolean().default(true),
  includeForecast: z.boolean().default(true),
  itemIds: z.array(z.string()).optional(),
});
export type RunMrpDto = z.input<typeof RunMrpDtoSchema>;

// ============================================================================
// DEMAND PLANNING DTOs (Screens 10 – 13)
// ============================================================================

// Screen 10 & 11: Demand Plan & S&OP
export const CreateDemandPlanDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  planNumber: z.string().optional(),
  planType: z.enum(['SALES_FORECAST', 'DEMAND_PLAN', 'S_AND_OP', 'CONSENSUS', 'STATISTICAL', 'MANUAL', 'COMBINED']).default('CONSENSUS'),
  period: z.string().default('2026-10'),
  periodType: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  year: z.number().int().default(2026),
  month: z.number().int().default(10),
  itemId: z.string().optional(),
  plantId: z.string().optional(),
  statisticalForecast: z.number().nonnegative().default(0),
  salesForecast: z.number().nonnegative().default(0),
  marketingForecast: z.number().nonnegative().default(0),
  consensusForecast: z.number().positive('Consensus quantity must be positive'),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'LOCKED', 'FINALIZED', 'ARCHIVED']).default('DRAFT'),
});
export type CreateDemandPlanDto = z.input<typeof CreateDemandPlanDtoSchema>;

export const CreateSopPlanDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  period: z.string().default('2026-Q4'),
  consensusRevenue: z.number().positive(),
  productionCapacityUnits: z.number().positive(),
  inventoryBufferUnits: z.number().nonnegative(),
  bottleneckSummary: z.string().optional(),
});
export type CreateSopPlanDto = z.input<typeof CreateSopPlanDtoSchema>;

// Screen 12: 12-Month Sales Forecast
export const GenerateForecastDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  itemId: z.string().optional(),
  periodType: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  horizonMonths: z.number().int().default(12),
  smoothingFactor: z.number().min(0).max(1).default(0.2), // Alpha
  trendFactor: z.number().min(0).max(1).default(0.1), // Beta
});
export type GenerateForecastDto = z.input<typeof GenerateForecastDtoSchema>;

// Screen 13: Master Production Schedule (MPS)
export const CreateMpsDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  mpsNumber: z.string().optional(),
  itemId: z.string().min(1, 'Item ID is required'),
  plantId: z.string().default('PLANT-01'),
  period: z.string().default('2026-W40'),
  periodType: z.enum(['WEEKLY', 'MONTHLY']).default('WEEKLY'),
  year: z.number().int().default(2026),
  week: z.number().int().default(40),
  forecastQty: z.number().nonnegative().default(5000),
  customerOrders: z.number().nonnegative().default(4200),
  mpsQty: z.number().positive().default(5500),
  availableToPromise: z.number().nonnegative().default(1300),
  projectedStock: z.number().nonnegative().default(2400),
  status: z.enum(['DRAFT', 'PROPOSED', 'APPROVED', 'FIRMED', 'RELEASED', 'COMPLETED', 'CANCELLED']).default('PROPOSED'),
});
export type CreateMpsDto = z.input<typeof CreateMpsDtoSchema>;

// ============================================================================
// CAPACITY & ADVANCED PLANNING DTOs (Screens 14 – 19)
// ============================================================================

// Screen 14: Capacity Requirements Planning (CRP)
export const CalculateCrpDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  period: z.string().default('2026-W40'),
  workCenterId: z.string().optional(),
});
export type CalculateCrpDto = z.input<typeof CalculateCrpDtoSchema>;

// Screen 15: Rough-Cut Capacity Planning (RCCP)
export const CalculateRccpDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  period: z.string().default('2026-Q4'),
});
export type CalculateRccpDto = z.input<typeof CalculateRccpDtoSchema>;

// Screen 16: Finite Production Scheduling
export const CreateScheduleDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  scheduleNumber: z.string().optional(),
  workOrderId: z.string().optional(),
  machineId: z.string().min(1, 'Machine ID is required'),
  startTime: z.string().default(new Date().toISOString()),
  endTime: z.string().default(new Date(Date.now() + 8 * 3600000).toISOString()),
  setupTimeMin: z.number().nonnegative().default(30),
  runTimeMin: z.number().nonnegative().default(450),
  sequence: z.number().int().default(1),
  status: z.enum(['PROPOSED', 'FIRMED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED']).default('PROPOSED'),
  isFirmed: z.boolean().default(false),
});
export type CreateScheduleDto = z.input<typeof CreateScheduleDtoSchema>;

// Screen 18: Supplier Capacity Planning
export const UpdateSupplierCapacityDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  supplierId: z.string().min(1),
  supplierName: z.string().min(2),
  itemId: z.string().optional(),
  period: z.string().default('2026-Q4'),
  committedCapacity: z.number().positive(),
  availableCapacity: z.number().nonnegative(),
  allocatedQty: z.number().nonnegative().default(0),
  leadTimeDays: z.number().int().default(14),
  moq: z.number().nonnegative().default(500),
  status: z.enum(['ACTIVE', 'CONSTRAINED', 'OVERLOADED', 'INACTIVE']).default('ACTIVE'),
});
export type UpdateSupplierCapacityDto = z.input<typeof UpdateSupplierCapacityDtoSchema>;
