import { Decimal } from 'decimal.js';

export class OrderCreatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly customerId: string,
    public readonly totalAmount: Decimal | number,
    public readonly createdById: string,
    public readonly timestamp: string = new Date().toISOString(),
  ) {}
}

export class InventoryUpdatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly itemId: string,
    public readonly itemCode: string,
    public readonly previousStock: Decimal | number,
    public readonly newStock: Decimal | number,
    public readonly minStockLevel: Decimal | number,
    public readonly reason: string,
    public readonly timestamp: string = new Date().toISOString(),
  ) {}
}

export class ApprovalCompletedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly approvalId: string,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
    public readonly approverId: string,
    public readonly comments?: string,
    public readonly timestamp: string = new Date().toISOString(),
  ) {}
}

export class MachineAlertEvent {
  constructor(
    public readonly tenantId: string,
    public readonly machineId: string,
    public readonly machineCode: string,
    public readonly alertType: 'DOWN_TIME' | 'TEMP_EXCEEDED' | 'PRESSURE_DROP' | 'CYCLE_TIME_DEVIATION',
    public readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    public readonly currentOee: number,
    public readonly details: string,
    public readonly timestamp: string = new Date().toISOString(),
  ) {}
}
