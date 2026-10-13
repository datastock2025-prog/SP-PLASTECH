export { createSalesRouter } from './router.js';
export { SalesService, salesService } from './service.js';
export type { SalesApi, SalesModulePorts } from './ports.js';
export type {
  SalesOrderConfirmedEvent,
  DispatchPostedEvent,
  InvoiceIssuedEvent,
} from './events.js';
