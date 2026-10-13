export interface OperatorShiftAssignedEvent {
  employeeId: string;
  shiftCode: string;
  date: string;
  plantId: string;
  tenantId: string;
  occurredAt: string;
}

export interface PayrollProcessedEvent {
  payrollRunId: string;
  month: string;
  year: number;
  totalNetPay: number;
  employeeCount: number;
  tenantId: string;
  occurredAt: string;
}
