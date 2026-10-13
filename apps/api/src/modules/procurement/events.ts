export interface GrnPostedEvent {
  grnId: string;
  grnNumber: string;
  poNumber: string;
  supplierCode: string;
  tenantId: string;
  occurredAt: string;
}

export interface PoApprovedEvent {
  poId: string;
  supplierId: string;
  approvedBy: string;
  totalAmount: number;
  tenantId: string;
  occurredAt: string;
}

export interface PoClosedEvent {
  poId: string;
  tenantId: string;
  occurredAt: string;
}
