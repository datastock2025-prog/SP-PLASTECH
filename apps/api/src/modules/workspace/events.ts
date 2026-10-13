export interface ApprovalDecidedEvent {
  approvalId: string;
  documentType: string;
  documentNumber: string;
  decision: 'APPROVED' | 'REJECTED';
  decidedBy: string;
  tenantId: string;
  occurredAt: string;
}

export interface TaskCompletedEvent {
  taskId: string;
  taskTitle: string;
  module: string;
  completedBy: string;
  tenantId: string;
  occurredAt: string;
}

export interface PoApprovedConsumer {
  poNumber: string;
  supplierId: string;
  totalAmount: number;
  approvedBy: string;
}

export interface BomVersionApprovedConsumer {
  bomId: string;
  itemCode: string;
  version: string;
  approvedBy: string;
}

export interface NcrRaisedConsumer {
  ncrNumber: string;
  itemCode: string;
  severity: string;
  raisedBy: string;
}
