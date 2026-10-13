export interface BomCreatedEvent {
  bomId: string;
  code: string;
  itemCode: string;
  version: string;
  tenantId: string;
  occurredAt: string;
}

export interface BomVersionApprovedEvent {
  bomId: string;
  code: string;
  itemCode: string;
  version: string;
  approvedBy: string;
  tenantId: string;
  occurredAt: string;
}

export interface EcoCompletedEvent {
  ecoId: string;
  ecoNumber: string;
  bomId: string;
  tenantId: string;
  occurredAt: string;
}
