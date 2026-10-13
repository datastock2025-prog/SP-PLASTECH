export interface LotReleasedEvent {
  lotId: string;
  lotNumber: string;
  releasedBy: string;
  tenantId: string;
  occurredAt: string;
}

export interface LotRejectedEvent {
  lotId: string;
  lotNumber: string;
  reason: string;
  rejectedBy: string;
  tenantId: string;
  occurredAt: string;
}

export interface NcrRaisedEvent {
  ncrId: string;
  itemCode: string;
  severity: string;
  quantityAffected: number;
  tenantId: string;
  occurredAt: string;
}

export interface CapaClosedEvent {
  capaId: string;
  ncrId?: string;
  verifiedBy: string;
  tenantId: string;
  occurredAt: string;
}
