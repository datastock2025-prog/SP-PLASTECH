import type { PoolClient } from 'pg';

export interface CrmModulePorts {
  // Consumes no external events
}

export interface CrmApi {
  getLeadById(tx: PoolClient, id: string): Promise<any>;
  getOpportunityById(tx: PoolClient, id: string): Promise<any>;
}
