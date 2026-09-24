import { z } from 'zod';

export const PurchaseOrderItemSchema = z.object({
  itemCode: z.string().min(1, 'Item code is required'),
  itemName: z.string().min(1, 'Item name is required'),
  category: z.string().default('Raw Polymer Resin'),
  uom: z.string().default('KG'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().positive('Unit price must be positive'),
  taxRatePct: z.number().default(18), // Standard 18% GST
  hsnCode: z.string().default('39021000'),
});
export type PurchaseOrderItem = z.infer<typeof PurchaseOrderItemSchema>;

export const CreatePurchaseRequisitionDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  requisitionNumber: z.string().optional(),
  department: z.string().default('Supply Chain & Materials'),
  initiatorUserId: z.string().min(1, 'Initiator ID is required'),
  initiatorName: z.string().default('SCM Buyer'),
  requiredDate: z.string().min(1, 'Required delivery date is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  items: z.array(PurchaseOrderItemSchema).min(1, 'At least one item required'),
  justification: z.string().min(5, 'Justification required'),
});
export type CreatePurchaseRequisitionDto = z.infer<typeof CreatePurchaseRequisitionDtoSchema>;

export const CreatePurchaseOrderDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  poNumber: z.string().optional(),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  vendorName: z.string().min(1, 'Vendor Name is required'),
  vendorGstin: z.string().optional().default('33AAACR2938K1ZN'),
  currency: z.string().default('INR'),
  prReference: z.string().optional(),
  paymentTerms: z.string().default('Net 30 Days'),
  shippingAddress: z.string().default('Plant 01 - Main Polymer Silos, Hosur'),
  items: z.array(PurchaseOrderItemSchema).min(1, 'At least one line item required'),
  initiatorUserId: z.string().min(1, 'Buyer ID is required'),
});
export type CreatePurchaseOrderDto = z.infer<typeof CreatePurchaseOrderDtoSchema>;

export const CreateGoodsReceiptNoteDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  grnNumber: z.string().optional(),
  poNumber: z.string().min(1, 'PO number is required'),
  vendorInvoiceNumber: z.string().min(1, 'Vendor Invoice Number is required'),
  vehicleNumber: z.string().optional().default('TN-70-AJ-4921'),
  receivedDate: z.string().default(new Date().toISOString().split('T')[0]),
  receivedByUserId: z.string().min(1, 'Receiver User ID is required'),
  destinationWarehouse: z.string().default('RAW-POLYMER-SILO-01'),
  items: z.array(
    z.object({
      itemCode: z.string(),
      orderedQty: z.number(),
      deliveredQty: z.number(),
      acceptedQty: z.number(),
      rejectedQty: z.number().default(0),
      batchLotNumber: z.string().min(1, 'Batch/Lot number is required'),
      mfiActual: z.number().optional(),
      moisturePct: z.number().optional(),
      quarantineBin: z.string().default('HOLD-BIN-01'),
      rejectionReason: z.string().optional(),
    })
  ).min(1, 'At least one receipt line item is required'),
});
export type CreateGoodsReceiptNoteDto = z.infer<typeof CreateGoodsReceiptNoteDtoSchema>;

export const ThreeWayMatchEvaluationDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  poNumber: z.string().min(1),
  grnNumber: z.string().min(1),
  vendorInvoiceNumber: z.string().min(1),
  billedTotalAmount: z.number(),
  priceTolerancePct: z.number().default(0.5), // 0.5% tolerance
  qtyTolerancePct: z.number().default(0.2),
});
export type ThreeWayMatchEvaluationDto = z.infer<typeof ThreeWayMatchEvaluationDtoSchema>;

export const InventoryStockMovementDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  sku: z.string().min(1, 'SKU is required'),
  sourceWarehouse: z.string().min(1),
  sourceBin: z.string().min(1),
  targetWarehouse: z.string().min(1),
  targetBin: z.string().min(1),
  batchLotNumber: z.string().min(1),
  quantity: z.number().positive('Quantity must be positive'),
  uom: z.string().default('KG'),
  movementType: z.enum(['PURCHASE_RECEIPT', 'TRANSFER', 'SHOPFLOOR_ISSUE', 'SCRAP', 'ADJUSTMENT']),
  referenceDoc: z.string().default('MANUAL'),
  userId: z.string().min(1),
});
export type InventoryStockMovementDto = z.infer<typeof InventoryStockMovementDtoSchema>;

export const AtomicStockReservationDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  sku: z.string().min(1),
  requiredQuantity: z.number().positive(),
  workOrderRef: z.string().min(1),
  warehouse: z.string().default('RAW-POLYMER-SILO-01'),
});
export type AtomicStockReservationDto = z.infer<typeof AtomicStockReservationDtoSchema>;
