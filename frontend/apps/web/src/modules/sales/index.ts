// ============================================================================
// SALES MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/sales/index.ts
// ============================================================================

export { SalesViews } from './screens/SalesViews';

export {
  useSales,
  useSalesOrders,
  useSaveSalesOrder,
  useQuotations,
  useSaveQuotation,
  useSalesRmas,
  useSaveSalesRma,
} from './api/useSales';

export { salesApi } from './api/salesApi';
export { salesRoutes } from './routes';

export {
  SalesOrderSchema,
  SalesOrderLineSchema,
  CreateSalesOrderInputSchema,
  UpdateSalesOrderInputSchema,
  CustomerSchema,
  SalesQuotationSchema,
  DeliveryChallanSchema,
  createSalesOrderSchema,
} from './model/salesSchemas';

export type {
  SalesOrderContract,
  SalesOrderLineContract,
  CreateSalesOrderContract,
  UpdateSalesOrderContract,
  CustomerContract,
  SalesQuotationContract,
  DeliveryChallanContract,
  CreateSalesOrderFormValues,
  SalesOrder,
  Customer,
  Quotation,
  SalesQuotation,
} from './model/salesSchemas';

// Key sub-components
export { SalesDashboardView } from './components/SalesDashboardView';
export { SalesOrderListView } from './components/SalesOrderListView';
export { SalesOrderDetailView } from './components/SalesOrderDetailView';
export { SalesQuotationListView } from './components/SalesQuotationListView';
export { QuotationDetailView } from './components/QuotationDetailView';
export { CustomerMasterListView } from './components/CustomerMasterListView';
export { CustomerDetailView } from './components/CustomerDetailView';
export { SalesStatusBadge } from './components/SalesStatusBadge';
