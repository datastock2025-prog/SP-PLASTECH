import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findStockTransferById,
  listStockTransfers,
  findWarehouseLocationByCode,
  listWarehouseLocations,
} from './repo.js';

export class WarehouseService {
  public async getStockTransfer(c: PoolClient, id: string) {
    const transfer = await findStockTransferById(c, id);
    if (!transfer) throw new AppError(404, 'NOT_FOUND', `Stock transfer ${id} not found`);
    return transfer;
  }

  public async getStockTransfers(c: PoolClient, limit = 50, offset = 0) {
    return await listStockTransfers(c, limit, offset);
  }

  public async getWarehouseLocation(c: PoolClient, code: string) {
    const loc = await findWarehouseLocationByCode(c, code);
    if (!loc) throw new AppError(404, 'NOT_FOUND', `Warehouse location ${code} not found`);
    return loc;
  }

  public async getWarehouseLocations(c: PoolClient, limit = 50, offset = 0) {
    return await listWarehouseLocations(c, limit, offset);
  }
}

export const warehouseService = new WarehouseService();
