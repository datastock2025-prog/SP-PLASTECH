import { describe, it, expect } from 'vitest';
import {
  StockTransferSchema,
  CreateStockTransferInputSchema,
  UpdateStockTransferInputSchema,
  WarehouseLocationSchema,
  InventoryStockItemSchema,
  stockTransferSchema,
} from '@/packages/contracts/warehouse';

describe('Warehouse Module Contracts & Validation', () => {
  it('validates a valid StockTransferSchema payload', () => {
    const rawTransfer = {
      id: 'tx-2026-001',
      itemCode: 'RM-PP-001',
      fromLocation: 'BIN-RM-A01',
      toLocation: 'BIN-WIP-B02',
      quantity: 250,
      reference: 'Transfer to Production Line 1',
      batchNumber: 'LOT-2026-004',
      status: 'COMPLETED' as const,
      version: 1,
    };

    const parsed = StockTransferSchema.safeParse(rawTransfer);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.itemCode).toBe('RM-PP-001');
      expect(parsed.data.quantity).toBe(250);
      expect(parsed.data.status).toBe('COMPLETED');
    }
  });

  it('rejects a stock transfer with non-positive quantity', () => {
    const invalid = {
      itemCode: 'RM-PP-001',
      fromLocation: 'BIN-RM-A01',
      toLocation: 'BIN-WIP-B02',
      quantity: -50,
    };

    const parsed = StockTransferSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateStockTransferInputSchema with version check', () => {
    const update = {
      status: 'COMPLETED' as const,
      version: 2,
    };

    const parsed = UpdateStockTransferInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(2);
    }
  });

  it('validates a WarehouseLocationSchema payload', () => {
    const rawLoc = {
      id: 'loc-uuid-001',
      code: 'BIN-RM-01',
      name: 'Raw Material Rack 1 Bin 1',
      type: 'bin' as const,
      zone: 'Zone A',
      warehouseCode: 'WH-MAIN',
      active: true,
    };

    const parsed = WarehouseLocationSchema.safeParse(rawLoc);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe('BIN-RM-01');
      expect(parsed.data.type).toBe('bin');
    }
  });

  it('validates an InventoryStockItemSchema payload', () => {
    const rawStock = {
      id: 'stk-uuid-001',
      itemCode: 'RM-HDPE-001',
      itemName: 'High Density Polyethylene Natural',
      primaryWarehouse: 'WH-MAIN',
      currentStock: 1500,
      allocatedStock: 200,
      availableStock: 1300,
      uom: 'KG',
      status: 'IN_STOCK' as const,
    };

    const parsed = InventoryStockItemSchema.safeParse(rawStock);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.itemCode).toBe('RM-HDPE-001');
      expect(parsed.data.availableStock).toBe(1300);
    }
  });
});
