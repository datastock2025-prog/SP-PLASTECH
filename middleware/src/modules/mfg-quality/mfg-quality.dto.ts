import { z } from 'zod';

export const BomItemSchema = z.object({
  partId: z.string().min(1, 'Part ID is required'),
  partName: z.string().min(1, 'Part Name is required'),
  itemType: z.enum(['RAW_MATERIAL', 'SUB_ASSEMBLY', 'MASTERBATCH', 'PACKAGING', 'INSERT']),
  quantityPerUnit: z.number().positive('Quantity per unit must be positive'),
  uom: z.string().default('KG'),
  scrapAllowancePct: z.number().default(2.5), // Standard 2.5% scrap allowance
  childItems: z.array(z.any()).optional().default([]),
});
export type BomItem = z.infer<typeof BomItemSchema>;

export const CreateBomRevisionDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  bomCode: z.string().min(1, 'BOM Code is required'),
  productCode: z.string().min(1, 'Product Code is required'),
  productName: z.string().min(1, 'Product Name is required'),
  revision: z.string().default('Rev-A'),
  moldCode: z.string().default('M-004-BUMPER'),
  cavityCount: z.number().int().positive().default(2),
  targetCycleTimeSec: z.number().positive().default(42.5),
  items: z.array(BomItemSchema).min(1, 'At least one BOM line item is required'),
  ecoReference: z.string().optional(),
  authorUserId: z.string().min(1, 'Author ID is required'),
});
export type CreateBomRevisionDto = z.infer<typeof CreateBomRevisionDtoSchema>;

export const CreateWorkOrderDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  workOrderNumber: z.string().optional(),
  productCode: z.string().min(1, 'Product Code is required'),
  productName: z.string().min(1, 'Product Name is required'),
  bomRevision: z.string().default('Rev-A'),
  targetQuantity: z.number().int().positive('Target quantity must be positive'),
  assignedMachineId: z.string().default('IMM-BAY-04'),
  assignedMoldId: z.string().default('MOLD-2026-004'),
  plannedStartDate: z.string().default(new Date().toISOString()),
  shift: z.enum(['Shift-A', 'Shift-B', 'Shift-C']).default('Shift-A'),
  priority: z.enum(['NORMAL', 'HIGH', 'EXPEDITE']).default('NORMAL'),
  operatorUserId: z.string().default('USR-OP-01'),
});
export type CreateWorkOrderDto = z.infer<typeof CreateWorkOrderDtoSchema>;

export const MachineTelemetryDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  machineId: z.string().min(1, 'Machine ID is required'),
  operatingMinutes: z.number().default(480), // 8 hr shift = 480 min
  plannedDowntimeMinutes: z.number().default(30),
  unplannedDowntimeMinutes: z.number().default(15),
  idealCycleTimeSec: z.number().default(42.0),
  actualCycleTimeSec: z.number().default(43.5),
  totalShotsProduced: z.number().int().positive(),
  goodPartsCount: z.number().int().nonnegative(),
  defectPartsCount: z.number().int().nonnegative(),
});
export type MachineTelemetryDto = z.infer<typeof MachineTelemetryDtoSchema>;

export const SpcDataEntryDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  characteristicName: z.string().min(1, 'Characteristic Name is required'), // e.g. 'Part Thickness (mm)'
  nominalValue: z.number().default(3.20),
  usl: z.number().default(3.35), // Upper Spec Limit
  lsl: z.number().default(3.05), // Lower Spec Limit
  subgroupSamples: z.array(z.number()).min(5, 'At least 5 sample measurements required per subgroup'),
  sampleBatchRef: z.string().default('LOT-2026-009'),
  inspectedByUserId: z.string().min(1),
});
export type SpcDataEntryDto = z.infer<typeof SpcDataEntryDtoSchema>;

export const CreateMrbDispositionDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  ncrNumber: z.string().optional(),
  lotNumber: z.string().min(1, 'Lot Number is required'),
  productCode: z.string().min(1),
  defectDescription: z.string().min(5),
  defectCategory: z.enum(['SINK_MARK', 'FLASH', 'WARPAGE', 'BLACK_SPECK', 'COLOR_VARIANCE', 'SHORT_SHOT']),
  quarantinedQuantityKg: z.number().positive(),
  proposedDisposition: z.enum(['REWORK', 'REGRIND_BLEND', 'SCRAP_WRITE_OFF', 'RETURN_TO_SUPPLIER', 'USE_AS_IS']),
  regrindBlendRatioPct: z.number().optional().default(15),
  initiatedByUserId: z.string().min(1),
});
export type CreateMrbDispositionDto = z.infer<typeof CreateMrbDispositionDtoSchema>;
