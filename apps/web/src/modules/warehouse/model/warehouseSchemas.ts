import { z } from 'zod';
import { StockTransaction } from '@/src/types';

export {
  StockTransferSchema,
  CreateStockTransferInputSchema,
  UpdateStockTransferInputSchema,
  WarehouseLocationSchema,
  InventoryStockItemSchema,
} from '@/packages/contracts/warehouse';

export type {
  StockTransferContract,
  CreateStockTransferContract,
  UpdateStockTransferContract,
  WarehouseLocationContract,
  InventoryStockItemContract,
} from '@/packages/contracts/warehouse';

export const stockTransferSchema = z.object({
  itemCode: z.string().min(1, 'Item selection is required'),
  fromLocation: z.string().min(1, 'Source location/bin is required'),
  toLocation: z.string().min(1, 'Destination location/bin is required'),
  quantity: z.number().positive('Transfer quantity must be greater than zero'),
  reference: z.string().optional(),
  batchNumber: z.string().optional(),
});

export type StockTransferFormValues = z.infer<typeof stockTransferSchema>;
export type { StockTransaction };
