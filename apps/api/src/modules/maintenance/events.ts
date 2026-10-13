export interface MachineMaintenanceScheduledEvent {
  workOrderId: string;
  equipmentId: string;
  maintenanceType: string;
  scheduledDate: string;
  tenantId: string;
  occurredAt: string;
}

export interface BreakdownResolvedEvent {
  workOrderId: string;
  equipmentId: string;
  resolvedAt: string;
  downtimeHours: number;
  tenantId: string;
  occurredAt: string;
}

export interface MachineDowntimeLoggedEvent {
  equipmentId: string;
  downtimeReason: string;
  reportedBy: string;
  tenantId: string;
  occurredAt: string;
}
