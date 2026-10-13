export interface EwbDispatchedEvent {
  ewbNumber: string;
  dispatchId: string;
  transporterId?: string;
  validUntil: string;
  tenantId: string;
  occurredAt: string;
}

export interface WebhookDeliveredEvent {
  webhookId: string;
  event: string;
  targetUrl: string;
  responseStatus: number;
  tenantId: string;
  occurredAt: string;
}
