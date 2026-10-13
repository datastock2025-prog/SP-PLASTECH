import type { PoolClient } from 'pg';

export interface SalesModulePorts {
  // Ports required from masterdata, warehouse, integrations
  reserveStockPort?(itemCode: string, qty: number): Promise<boolean>;
  generateEInvoicePort?(invoicePayload: any): Promise<any>;
}

export interface SalesApi {
  getSalesOrderById(tx: PoolClient, id: string): Promise<any>;
  getCustomerById(tx: PoolClient, id: string): Promise<any>;
}
