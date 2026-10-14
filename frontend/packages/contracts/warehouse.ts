import { z } from 'zod';

export const StockTransferSchema = z.object({
  id: z.string().optional(),
  itemCode: z.string().min(1, 'Item selection is required'),
  fromLocation: z.string().min(1, 'Source location/bin is required'),
  toLocation: z.string().min(1, 'Destination location/bin is required'),
  quantity: z.number().positive('Transfer quantity must be greater than zero'),
  reference: z.string().optional().default(''),
  batchNumber: z.string().optional().default(''),
  status: z.enum(['DRAFT', 'PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).default('COMPLETED'),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateStockTransferInputSchema = StockTransferSchema.omit({ id: true });
export const UpdateStockTransferInputSchema = StockTransferSchema.partial().extend({
  version: z.number().int().min(1),
});

export const WarehouseLocationSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Location code is required'),
  name: z.string().min(1, 'Location name is required'),
  type: z.enum(['warehouse', 'zone', 'aisle', 'rack', 'shelf', 'bin']).default('bin'),
  zone: z.string().optional().default('A'),
  warehouseCode: z.string().optional().default('WH-01'),
  active: z.boolean().default(true),
});

export const InventoryStockItemSchema = z.object({
  id: z.string().optional(),
  itemCode: z.string().min(1, 'Item code is required'),
  itemName: z.string().min(1, 'Item name is required'),
  primaryWarehouse: z.string().default('WH-MAIN'),
  currentStock: z.number().min(0).default(0),
  allocatedStock: z.number().min(0).default(0),
  availableStock: z.number().min(0).default(0),
  uom: z.string().default('KG'),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'REORDER']).default('IN_STOCK'),
});

export type StockTransferContract = z.infer<typeof StockTransferSchema>;
export type CreateStockTransferContract = z.infer<typeof CreateStockTransferInputSchema>;
export type UpdateStockTransferContract = z.infer<typeof UpdateStockTransferInputSchema>;
export type WarehouseLocationContract = z.infer<typeof WarehouseLocationSchema>;
export type InventoryStockItemContract = z.infer<typeof InventoryStockItemSchema>;
