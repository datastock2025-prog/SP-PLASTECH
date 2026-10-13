import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findSalesOrderById,
  listSalesOrders,
  findCustomerById,
  listCustomers,
} from './repo.js';

export class SalesService {
  public async getSalesOrder(c: PoolClient, id: string) {
    const so = await findSalesOrderById(c, id);
    if (!so) throw new AppError(404, 'NOT_FOUND', `Sales order ${id} not found`);
    return so;
  }

  public async getSalesOrders(c: PoolClient, limit = 50, offset = 0) {
    return await listSalesOrders(c, limit, offset);
  }

  public async getCustomer(c: PoolClient, id: string) {
    const customer = await findCustomerById(c, id);
    if (!customer) throw new AppError(404, 'NOT_FOUND', `Customer ${id} not found`);
    return customer;
  }

  public async getCustomers(c: PoolClient, limit = 50, offset = 0) {
    return await listCustomers(c, limit, offset);
  }
}

export const salesService = new SalesService();
