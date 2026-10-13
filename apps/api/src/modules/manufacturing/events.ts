export interface ProductionCompletedEvent {
  workOrderId: string;
  itemCode: string;
  goodQty: number;
  scrapQty: number;
  machineId: string;
  tenantId: string;
  occurredAt: string;
}

export interface ScrapReportedEvent {
  workOrderId: string;
  itemCode: string;
  scrapQty: number;
  reasonCode?: string;
  tenantId: string;
  occurredAt: string;
}

export interface MachineDowntimeLoggedEvent {
  machineId: string;
  downtimeMinutes: number;
  reason: string;
  category: string;
  tenantId: string;
  occurredAt: string;
}
