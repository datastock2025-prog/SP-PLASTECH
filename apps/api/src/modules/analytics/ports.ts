import type { PoolClient } from 'pg';

export interface AnalyticsModulePorts {
  // Consumes no external events directly
}

export interface AnalyticsApi {
  getExecutiveKpis(tx: PoolClient, plantId?: string): Promise<any[]>;
  getOeeMetrics(tx: PoolClient, machineId?: string): Promise<any[]>;
}
