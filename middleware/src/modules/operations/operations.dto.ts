import { z } from 'zod';

// ============================================================================
// PRODUCTION DTOs (Screens 1 – 16)
// ============================================================================

// Screen 1: JIT Scheduling Board
export const CreateJitScheduleDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  scheduleNumber: z.string().optional(),
  workOrderId: z.string().optional(),
  machineId: z.string().min(1, 'Machine ID is required'),
  scheduledStart: z.string().default(new Date().toISOString()),
  scheduledEnd: z.string().default(new Date(Date.now() + 8 * 3600000).toISOString()),
  priority: z.number().int().default(10),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED']).default('SCHEDULED'),
  isJit: z.boolean().default(true),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateJitScheduleDto = z.input<typeof CreateJitScheduleDtoSchema>;

// Screen 2: Work Orders
export const CreateWorkOrderDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  woNumber: z.string().optional(),
  salesOrderId: z.string().optional(),
  bomId: z.string().min(1, 'BOM ID is required'),
  machineId: z.string().optional(),
  workCenterId: z.string().optional(),
  targetQty: z.number().positive('Target quantity must be positive'),
  uom: z.string().default('PCS'),
  status: z.enum(['CREATED', 'RELEASED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED']).default('CREATED'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).default('MEDIUM'),
  plannedStart: z.string().default(new Date().toISOString()),
  plannedEnd: z.string().default(new Date(Date.now() + 24 * 3600000).toISOString()),
  shiftId: z.string().optional(),
  assignedToId: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateWorkOrderDto = z.input<typeof CreateWorkOrderDtoSchema>;
export const UpdateWorkOrderDtoSchema = CreateWorkOrderDtoSchema.partial();
export type UpdateWorkOrderDto = z.input<typeof UpdateWorkOrderDtoSchema>;

// Screen 3: Daily Production Entry
export const CreateProductionEntryDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  entryNumber: z.string().optional(),
  workOrderId: z.string().min(1, 'Work Order ID is required'),
  machineId: z.string().min(1, 'Machine ID is required'),
  shiftId: z.string().default('SHIFT-A'),
  entryDate: z.string().default(new Date().toISOString().split('T')[0]),
  operatorId: z.string().min(1, 'Operator ID is required'),
  goodQty: z.number().nonnegative().default(0),
  rejectedQty: z.number().nonnegative().default(0),
  scrapQty: z.number().nonnegative().default(0),
  cycleTimeSec: z.number().positive().default(14.8),
  downtimeMinutes: z.number().nonnegative().default(0),
  reasonCodeId: z.string().optional(),
  notes: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).default({}),
});
export type CreateProductionEntryDto = z.input<typeof CreateProductionEntryDtoSchema>;

// Screen 4: WIP Operations & Storage QC Gate
export const CreateWipOperationDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  wipNumber: z.string().optional(),
  workOrderId: z.string().min(1, 'Work Order ID is required'),
  operationType: z.enum(['DEFLASH', 'ASSEMBLY', 'SECONDARY', 'PACKAGING', 'QUALITY_CHECK', 'STORAGE']).default('DEFLASH'),
  quantity: z.number().positive(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'QC_HOLD', 'RELEASED']).default('PENDING'),
  locationId: z.string().optional(),
  qcGatePassed: z.boolean().default(false),
});
export type CreateWipOperationDto = z.input<typeof CreateWipOperationDtoSchema>;

// Screen 6: Machine Monitoring Telemetry (IoT)
export const LogMachineTelemetryDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  machineId: z.string().min(1, 'Machine ID is required'),
  temperature: z.number().optional().default(235.4),
  pressure: z.number().optional().default(148.2),
  cycleCount: z.number().int().nonnegative().default(120),
  energyConsumption: z.number().optional().default(38.5),
  vibration: z.number().optional().default(1.2),
  status: z.enum(['AVAILABLE', 'RUNNING', 'MAINTENANCE', 'BREAKDOWN', 'SETUP', 'IDLE']).default('RUNNING'),
  alarmCode: z.string().optional(),
  rawData: z.record(z.string(), z.any()).default({}),
});
export type LogMachineTelemetryDto = z.input<typeof LogMachineTelemetryDtoSchema>;

// Screen 7: Downtime Record
export const CreateDowntimeRecordDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  recordNumber: z.string().optional(),
  workOrderId: z.string().optional(),
  machineId: z.string().min(1, 'Machine ID is required'),
  downtimeType: z.enum(['PLANNED', 'UNPLANNED', 'BREAKDOWN', 'SETUP', 'MATERIAL_SHORTAGE', 'QUALITY_ISSUE', 'OTHER']).default('UNPLANNED'),
  reasonCodeId: z.string().min(1, 'Reason Code is required'),
  startTime: z.string().default(new Date().toISOString()),
  endTime: z.string().optional(),
  durationMinutes: z.number().nonnegative().default(15),
  impactOnOee: z.boolean().default(true),
  notes: z.string().optional(),
});
export type CreateDowntimeRecordDto = z.input<typeof CreateDowntimeRecordDtoSchema>;

// Screen 8: Batch Records & Genealogy
export const CreateBatchRecordDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  batchNumber: z.string().optional(),
  workOrderId: z.string().min(1, 'Work Order is required'),
  bomId: z.string().min(1, 'BOM ID is required'),
  batchQty: z.number().positive(),
  status: z.enum(['CREATED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CLOSED']).default('IN_PROGRESS'),
  startedAt: z.string().default(new Date().toISOString()),
  parentBatchId: z.string().optional(),
  materials: z.array(z.object({
    itemId: z.string(),
    itemCode: z.string(),
    itemName: z.string(),
    lotNumber: z.string().optional(),
    quantity: z.number().positive(),
    uom: z.string().default('KG'),
  })).default([]),
});
export type CreateBatchRecordDto = z.input<typeof CreateBatchRecordDtoSchema>;

// Screen 9: QR Traceability Scan
export const QrScanDtoSchema = z.object({
  qrCode: z.string().min(1, 'QR Code is required'),
  location: z.string().default('Shopfloor Gate 1'),
  action: z.enum(['SCAN_IN', 'SCAN_OUT', 'VERIFY', 'TRANSFER']).default('VERIFY'),
});
export type QrScanDto = z.input<typeof QrScanDtoSchema>;

// Screen 10: Changeover Matrix (SMED)
export const CreateChangeoverDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  machineId: z.string().min(1, 'Machine ID is required'),
  fromProductCode: z.string().min(1),
  toProductCode: z.string().min(1),
  plannedDuration: z.number().positive().default(45), // minutes
  actualDuration: z.number().nonnegative().default(0),
  internalTime: z.number().nonnegative().default(0),
  externalTime: z.number().nonnegative().default(0),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED']).default('PLANNED'),
});
export type CreateChangeoverDto = z.input<typeof CreateChangeoverDtoSchema>;

// Screen 11: Material Issuing & Return
export const CreateMaterialIssueDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  workOrderId: z.string().min(1, 'Work Order ID is required'),
  issueType: z.enum(['ISSUE', 'RETURN', 'TRANSFER']).default('ISSUE'),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().positive(),
  uom: z.string().default('KG'),
  batchNumber: z.string().optional(),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateMaterialIssueDto = z.input<typeof CreateMaterialIssueDtoSchema>;

// Screen 16: Shift Handover Log
export const CreateShiftHandoverDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  fromShift: z.string().default('SHIFT-A (06:00 - 14:00)'),
  toShift: z.string().default('SHIFT-B (14:00 - 22:00)'),
  handoverDate: z.string().default(new Date().toISOString().split('T')[0]),
  machineStatusSummary: z.string().min(5),
  productionTargetAchieved: z.boolean().default(true),
  openIssues: z.string().optional(),
  safetyNotes: z.string().optional(),
});
export type CreateShiftHandoverDto = z.input<typeof CreateShiftHandoverDtoSchema>;

// ============================================================================
// WAREHOUSE DTOs (Screens 17 – 28)
// ============================================================================

// Screen 17: Inventory Stock
export const UpdateStockDtoSchema = z.object({
  itemId: z.string().min(1),
  warehouseId: z.string().min(1),
  locationId: z.string().optional(),
  quantityChange: z.number(),
  movementType: z.enum(['TRANSFER', 'ADJUSTMENT', 'CONSUMPTION', 'PRODUCTION', 'RECEIPT', 'ISSUE', 'RETURN', 'SCRAPPED']).default('ADJUSTMENT'),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
});
export type UpdateStockDto = z.input<typeof UpdateStockDtoSchema>;

// Screen 18: Goods Receipts (GRN)
export const CreateGrnDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  grnNumber: z.string().optional(),
  poNumber: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  warehouseId: z.string().default('WH-RM-01'),
  status: z.enum(['DRAFT', 'PENDING_INSPECTION', 'INSPECTED', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'PUTAWAY_COMPLETED']).default('PENDING_INSPECTION'),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string(),
    itemCode: z.string(),
    itemName: z.string(),
    orderedQty: z.number().positive(),
    receivedQty: z.number().positive(),
    uom: z.string().default('KG'),
    batchNumber: z.string().optional(),
  })).min(1, 'At least 1 GRN line required'),
});
export type CreateGrnDto = z.input<typeof CreateGrnDtoSchema>;

// Screen 19: Putaway Task
export const CreatePutawayDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  grnId: z.string().optional(),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  quantity: z.number().positive(),
  uom: z.string().default('KG'),
  fromLocation: z.string().default('Receiving Dock A'),
  toLocationId: z.string().min(1, 'Target Location is required'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
});
export type CreatePutawayDto = z.input<typeof CreatePutawayDtoSchema>;

// Screen 20: Picking Task
export const CreatePickingDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  salesOrderId: z.string().optional(),
  deliveryId: z.string().optional(),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  quantity: z.number().positive(),
  uom: z.string().default('PCS'),
  fromLocationId: z.string().min(1),
  toLocation: z.string().default('Staging Area 1'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PICKED', 'STAGED', 'CANCELLED']).default('PENDING'),
});
export type CreatePickingDto = z.input<typeof CreatePickingDtoSchema>;

// Screen 21: Stock Movement / Transfer
export const CreateStockMovementDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  movementType: z.enum(['TRANSFER', 'ADJUSTMENT', 'CONSUMPTION', 'PRODUCTION', 'RECEIPT', 'ISSUE', 'RETURN', 'SCRAPPED']).default('TRANSFER'),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number().positive(),
  uom: z.string().default('PCS'),
  fromWarehouseId: z.string().optional(),
  fromLocationId: z.string().optional(),
  toWarehouseId: z.string().optional(),
  toLocationId: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateStockMovementDto = z.input<typeof CreateStockMovementDtoSchema>;

// Screen 22: Stock Count & Reconciliation
export const CreateStockCountDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  countDate: z.string().default(new Date().toISOString().split('T')[0]),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'ADJUSTED']).default('DRAFT'),
  lines: z.array(z.object({
    itemId: z.string(),
    itemCode: z.string(),
    itemName: z.string(),
    locationId: z.string().optional(),
    systemQty: z.number().nonnegative(),
    countedQty: z.number().nonnegative(),
    uom: z.string().default('PCS'),
  })).default([]),
});
export type CreateStockCountDto = z.input<typeof CreateStockCountDtoSchema>;

// ============================================================================
// QUALITY DTOs (Screens 29 – 33)
// ============================================================================

// Screen 29/30: Inspection Plans & Inspections
export const CreateInspectionDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  inspectionType: z.enum(['INCOMING', 'IN_PROCESS', 'FINAL', 'RANDOM', 'FIRST_ARTICLE']).default('IN_PROCESS'),
  workOrderId: z.string().optional(),
  batchId: z.string().optional(),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  sampleSize: z.number().positive().default(5),
  acceptedQty: z.number().nonnegative().default(5),
  rejectedQty: z.number().nonnegative().default(0),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CONDITIONALLY_ACCEPTED']).default('PASSED'),
  inspectorId: z.string().min(1),
  notes: z.string().optional(),
  parameters: z.array(z.object({
    parameterName: z.string(),
    specification: z.string(),
    lowerLimit: z.number().optional(),
    upperLimit: z.number().optional(),
    actualValue: z.number().optional(),
    result: z.enum(['PASS', 'FAIL', 'N/A']).default('PASS'),
  })).default([]),
});
export type CreateInspectionDto = z.input<typeof CreateInspectionDtoSchema>;

// Screen 31: Non-Conformance Report (NCR)
export const CreateNcrDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  inspectionId: z.string().optional(),
  workOrderId: z.string().optional(),
  itemId: z.string().min(1),
  itemCode: z.string().min(1),
  defectType: z.string().min(2),
  severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).default('MAJOR'),
  quantity: z.number().positive(),
  disposition: z.enum(['PENDING', 'UNDER_REVIEW', 'REWORK', 'SCRAP', 'RETURN_TO_SUPPLIER', 'USE_AS_IS', 'CLOSED']).default('PENDING'),
  rootCause: z.string().optional(),
  correctiveAction: z.string().optional(),
});
export type CreateNcrDto = z.input<typeof CreateNcrDtoSchema>;

// Screen 32: Corrective Actions (CAPA)
export const CreateCapaDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  ncrId: z.string().optional(),
  title: z.string().min(3),
  rootCause: z.string().min(5),
  correctiveAction: z.string().min(5),
  preventiveAction: z.string().min(5),
  targetDate: z.string().default(new Date(Date.now() + 14 * 86400000).toISOString()),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'VERIFIED', 'CLOSED']).default('OPEN'),
});
export type CreateCapaDto = z.input<typeof CreateCapaDtoSchema>;

// ============================================================================
// MAINTENANCE DTOs (Screens 34 – 36)
// ============================================================================

// Screen 34: Maintenance Schedule
export const CreateMaintenanceScheduleDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  machineId: z.string().min(1),
  maintenanceType: z.enum(['PREVENTIVE', 'BREAKDOWN', 'PREDICTIVE', 'CORRECTIVE']).default('PREVENTIVE'),
  title: z.string().min(3),
  frequencyDays: z.number().int().positive().default(30),
  nextDueDate: z.string().default(new Date(Date.now() + 30 * 86400000).toISOString()),
  assignedTechnicianId: z.string().optional(),
  checklist: z.array(z.string()).default(['Check oil level', 'Inspect heater bands', 'Verify clamping force', 'Clean filters']),
});
export type CreateMaintenanceScheduleDto = z.input<typeof CreateMaintenanceScheduleDtoSchema>;

// Screen 35: Maintenance Work Orders
export const CreateMaintenanceWorkOrderDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  machineId: z.string().min(1),
  maintenanceType: z.enum(['PREVENTIVE', 'BREAKDOWN', 'PREDICTIVE', 'CORRECTIVE']).default('BREAKDOWN'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).default('HIGH'),
  status: z.enum(['CREATED', 'RELEASED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED']).default('CREATED'),
  description: z.string().min(5),
  assignedToId: z.string().optional(),
  scheduledDate: z.string().optional(),
});
export type CreateMaintenanceWorkOrderDto = z.input<typeof CreateMaintenanceWorkOrderDtoSchema>;

// Screen 36: Spare Parts Inventory
export const CreateSparePartDtoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  partCode: z.string().min(2),
  partName: z.string().min(2),
  machineModel: z.string().default('Toshiba 250T'),
  category: z.string().default('Heater Band / Hydraulic'),
  quantityOnHand: z.number().nonnegative().default(10),
  reorderPoint: z.number().nonnegative().default(3),
  unitCost: z.number().positive().default(2400),
  uom: z.string().default('NOS'),
});
export type CreateSparePartDto = z.input<typeof CreateSparePartDtoSchema>;
