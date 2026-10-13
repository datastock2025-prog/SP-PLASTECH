import type { PoolClient } from 'pg';

export interface FinanceModulePorts {
  // Consumes events from procurement, sales, warehouse, manufacturing
  onGrnPostedHandler?(event: any): Promise<void>;
  onInvoiceIssuedHandler?(event: any): Promise<void>;
  onDispatchPostedHandler?(event: any): Promise<void>;
  onProductionCompletedHandler?(event: any): Promise<void>;
}

export interface FinanceApi {
  getAccountById(tx: PoolClient, id: string): Promise<any>;
  getJournalEntryById(tx: PoolClient, id: string): Promise<any>;
}
