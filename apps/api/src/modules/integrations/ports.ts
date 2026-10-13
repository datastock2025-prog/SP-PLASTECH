import type { PoolClient } from 'pg';

export interface IntegrationsModulePorts {
  // Consumes events from sales, warehouse
  onInvoiceIssuedHandler?(event: any): Promise<void>;
  onDispatchPostedHandler?(event: any): Promise<void>;
}

export interface IntegrationsApi {
  getWebhookById(tx: PoolClient, id: string): Promise<any>;
  listWebhooks(tx: PoolClient): Promise<any[]>;
  dispatchWebhook(event: string, payload: any): Promise<void>;
}
