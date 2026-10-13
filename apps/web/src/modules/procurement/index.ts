// ============================================================================
// PROCUREMENT MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/procurement/index.ts
// ============================================================================

export { ProcurementViews } from './screens/ProcurementViews';

export {
  useProcurement,
  usePurchaseOrders,
  useSavePurchaseOrder,
  useSuppliers,
  useSupplierPriceLists,
} from './api/useProcurement';
export { procurementApi } from './api/procurementApi';

export { procurementRoutes } from './routes';

export type {
  PurchaseOrderContract,
  PurchaseOrderLineContract,
  CreatePurchaseOrderContract,
  UpdatePurchaseOrderContract,
  PurchaseRequisitionContract,
  SupplierMasterContract,
  GoodsReceiptNoteContract,
} from '@/packages/contracts/procurement';

export {
  createPurchaseOrderSchema,
} from './model/procurementSchemas';

export type {
  CreatePurchaseOrderFormValues,
} from './model/procurementSchemas';
