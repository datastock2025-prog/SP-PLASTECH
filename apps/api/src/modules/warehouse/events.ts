export interface StockTransferredEvent {
  transferId: string;
  itemCode: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  tenantId: string;
  occurredAt: string;
}

export interface LotHeldEvent {
  lotId: string;
  lotNumber: string;
  reason: string;
  tenantId: string;
  occurredAt: string;
}

export interface LotReleasedEvent {
  lotId: string;
  lotNumber: string;
  releasedBy: string;
  tenantId: string;
  occurredAt: string;
}

export interface StockShortageDetectedEvent {
  itemCode: string;
  requiredQty: number;
  availableQty: number;
  tenantId: string;
  occurredAt: string;
}
