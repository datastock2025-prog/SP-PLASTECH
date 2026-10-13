export interface MrpPlannedOrdersGeneratedEvent {
  mrpRunId: string;
  orderCount: number;
  horizonDays: number;
  tenantId: string;
  occurredAt: string;
}

export interface JitSchedulePublishedEvent {
  scheduleId: string;
  machineId: string;
  planDate: string;
  shift: string;
  tenantId: string;
  occurredAt: string;
}
