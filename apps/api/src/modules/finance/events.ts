export interface JournalEntryPostedEvent {
  entryId: string;
  entryNumber: string;
  totalDebit: number;
  totalCredit: number;
  tenantId: string;
  occurredAt: string;
}

export interface PeriodClosedEvent {
  period: string;
  fiscalYear: string;
  closedBy: string;
  tenantId: string;
  occurredAt: string;
}
