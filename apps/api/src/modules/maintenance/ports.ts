import type { PoolClient } from 'pg';

export interface MaintenanceModulePorts {
  // Consumes events from manufacturing
  onMachineDowntimeLoggedHandler?(event: any): Promise<void>;
}

export interface MaintenanceApi {
  getWorkOrderById(tx: PoolClient, id: string): Promise<any>;
  getEquipmentById(tx: PoolClient, id: string): Promise<any>;
}
