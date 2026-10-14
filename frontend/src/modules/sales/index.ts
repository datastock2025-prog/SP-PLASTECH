// ============================================================================
// DOMAIN MODULE: SALES & ORDER MANAGEMENT
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export {
  SalesViews,
  useSales,
  useSalesOrders,
  useSaveSalesOrder,
  useQuotations,
  useSaveQuotation,
  useSalesRmas,
  useSaveSalesRma,
  salesApi,
  salesRoutes,
} from '../../../apps/web/src/modules/sales';

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

export * from '../../services/nic';
