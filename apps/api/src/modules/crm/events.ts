export interface InquiryCostedEvent {
  inquiryId: string;
  inquiryNumber: string;
  customerId: string;
  quotedPrice: number;
  tenantId: string;
  occurredAt: string;
}

export interface OpportunityWonEvent {
  opportunityId: string;
  accountId: string;
  expectedRevenue: number;
  tenantId: string;
  occurredAt: string;
}
