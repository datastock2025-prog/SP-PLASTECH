import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import { findPurchaseOrderById, listPurchaseOrders, findSupplierById, listSuppliers } from './repo.js';

export class ProcurementService {
  public async getPurchaseOrder(c: PoolClient, id: string) {
    const po = await findPurchaseOrderById(c, id);
    if (!po) throw new AppError(404, 'NOT_FOUND', `Purchase order ${id} not found`);
    return po;
  }

  public async getPurchaseOrders(c: PoolClient, limit = 50, offset = 0) {
    return await listPurchaseOrders(c, limit, offset);
  }

  public async getSupplier(c: PoolClient, id: string) {
    const supplier = await findSupplierById(c, id);
    if (!supplier) throw new AppError(404, 'NOT_FOUND', `Supplier ${id} not found`);
    return supplier;
  }

  public async getSuppliers(c: PoolClient, limit = 50, offset = 0) {
    return await listSuppliers(c, limit, offset);
  }
}

export const procurementService = new ProcurementService();
