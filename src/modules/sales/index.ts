// ============================================================================
// DOMAIN MODULE: SALES & ORDER MANAGEMENT
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export { SalesViews } from '../../components/SalesViews';
export {
  initialSalesOrders,
  initialCustomers,
  initialQuotations,
  INITIAL_RMAS,
} from '../../data/initialData';
export {
  SALES_CUSTOMERS,
  SALES_CONTRACTS_SEED,
  SALES_QUOTATIONS,
  SALES_ORDERS_SEED,
  SALES_PRICE_LISTS,
  SALES_REBATES,
  CUSTOMER_CREDIT_EXPOSURES,
  SALES_BILLING_RECORDS,
  SALES_BACKORDERS,
  SALES_FORECAST_DATA,
  CUSTOMER_COMPLAINTS,
} from '../../data/salesData';

export type {
  SalesOrder,
  Customer,
  Quotation,
  ReturnMerchandise,
} from '../../types';
