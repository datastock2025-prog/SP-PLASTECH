import type { PoolClient } from 'pg';

export interface IdentityModulePorts {
  // Ports required by identity from other domains (if any)
}

export interface IdentityApi {
  getUser(tx: PoolClient, id: string): Promise<any>;
  assertPlantAccess(tx: PoolClient, userId: string, plantId: string): Promise<boolean>;
}
