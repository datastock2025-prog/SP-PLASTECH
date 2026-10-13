export interface SalesOrderConfirmedEvent {
  orderId: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  tenantId: string;
  occurredAt: string;
}

export interface DispatchPostedEvent {
  challanId: string;
  challanNumber: string;
  orderId: string;
  customerId: string;
  itemCount: number;
  tenantId: string;
  occurredAt: string;
}

export interface InvoiceIssuedEvent {
  invoiceId: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  totalAmount: number;
  tenantId: string;
  occurredAt: string;
}
