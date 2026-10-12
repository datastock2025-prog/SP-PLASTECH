export interface UserCreatedEvent {
  userId: string;
  username: string;
  email: string;
  roleId: string;
  tenantId: string;
  occurredAt: string;
}

export interface UserRoleChangedEvent {
  userId: string;
  oldRoleId: string;
  newRoleId: string;
  tenantId: string;
  occurredAt: string;
}

export interface SessionTerminatedEvent {
  sessionId: string;
  userId: string;
  tenantId: string;
  occurredAt: string;
}
