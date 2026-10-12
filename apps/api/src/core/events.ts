// ============================================================================
// CORE EVENT BUS & OUTBOX DOMAIN TYPES
// In-process typed event bus with transactional outbox support
// ============================================================================

export type DomainEventName =
  | 'GrnPosted'
  | 'InvoiceIssued'
  | 'DispatchPosted'
  | 'ProductionCompleted'
  | 'LotReleased'
  | 'LotRejected'
  | 'ApprovalDecided'
  | 'ComplaintRaised';

export interface DomainEventPayloads {
  GrnPosted: {
    grnId: string;
    grnNumber: string;
    supplierId: string;
    items: Array<{ itemId: string; qtyReceived: string | number; lotNumber?: string }>;
    occurredAt: string;
    performedBy: string;
  };
  InvoiceIssued: {
    invoiceId: string;
    invoiceNumber: string;
    salesOrderId: string;
    customerId: string;
    totalAmount: string | number;
    taxAmount: string | number;
    occurredAt: string;
  };
  DispatchPosted: {
    dispatchId: string;
    deliveryChallanNumber: string;
    salesOrderId: string;
    carrier?: string;
    trackingNumber?: string;
    occurredAt: string;
  };
  ProductionCompleted: {
    workOrderId: string;
    machineId: string;
    itemId: string;
    goodQty: number;
    scrapQty: number;
    regrindUsedKg: number;
    completedAt: string;
  };
  LotReleased: {
    lotId: string;
    inspectionLotId: string;
    itemId: string;
    approvedQty: number;
    inspectedBy: string;
    releasedAt: string;
  };
  LotRejected: {
    lotId: string;
    inspectionLotId: string;
    itemId: string;
    rejectedQty: number;
    reason: string;
    rejectedAt: string;
  };
  ApprovalDecided: {
    workflowId: string;
    entityType: string;
    entityId: string;
    decision: 'APPROVED' | 'REJECTED';
    decidedBy: string;
    comments?: string;
    decidedAt: string;
  };
  ComplaintRaised: {
    complaintId: string;
    customerId: string;
    issueSummary: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    raisedAt: string;
  };
}

export interface DomainEvent<E extends DomainEventName = DomainEventName> {
  id: string;
  name: E;
  tenantId: string;
  payload: DomainEventPayloads[E];
  occurredAt: string;
}

export interface OutboxRecord {
  id: string;
  tenantId: string;
  eventName: DomainEventName;
  payload: unknown;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  createdAt: string;
  publishedAt?: string;
}

export type EventHandler<E extends DomainEventName> = (event: DomainEvent<E>) => Promise<void> | void;

export class DomainEventBus {
  private handlers = new Map<DomainEventName, Set<EventHandler<any>>>();

  public subscribe<E extends DomainEventName>(eventName: E, handler: EventHandler<E>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    const handlersSet = this.handlers.get(eventName)!;
    handlersSet.add(handler);
    return () => {
      handlersSet.delete(handler);
    };
  }

  public async publish<E extends DomainEventName>(event: DomainEvent<E>): Promise<void> {
    const handlersSet = this.handlers.get(event.name);
    if (!handlersSet || handlersSet.size === 0) return;
    const promises: Promise<void>[] = [];
    for (const handler of handlersSet) {
      try {
        const res = handler(event);
        if (res instanceof Promise) {
          promises.push(res);
        }
      } catch (err) {
        console.error(`[DomainEventBus] Handler error on ${event.name}:`, err);
      }
    }
    await Promise.allSettled(promises);
  }
}

export const eventBus = new DomainEventBus();
