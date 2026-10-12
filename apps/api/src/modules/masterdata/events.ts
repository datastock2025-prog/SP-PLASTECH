export interface ItemCreatedEvent {
  itemId: string;
  code: string;
  name: string;
  category: string;
  tenantId: string;
  occurredAt: string;
}

export interface ItemUpdatedEvent {
  itemId: string;
  code: string;
  changedFields: string[];
  tenantId: string;
  occurredAt: string;
}

export interface ItemStatusChangedEvent {
  itemId: string;
  code: string;
  oldStatus: string;
  newStatus: string;
  tenantId: string;
  occurredAt: string;
}
