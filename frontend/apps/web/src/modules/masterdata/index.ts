// ============================================================================
// MASTERDATA MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/masterdata/index.ts
// ============================================================================

export { MasterDataViews } from './screens/MasterDataViews';
export { CreateItemWizardModal } from './components/CreateItemWizardModal';
export { ItemGridImportModal } from './components/ItemGridImportModal';

export {
  useItems,
  useItemCount,
  usePaginatedItems,
  useItemCatalogStats,
  useSaveItem,
  useDeleteItem,
  useApproveItem,
  useRejectItem,
  useBulkImportItems,
  useMoldTools,
  useWarehouses,
  useCreateWarehouse,
  useCreateWarehouseBin,
  useSuppliers,
  useCreateSupplier,
  usePlants,
  useGovernanceAuditHistory,
  useGovernanceChangeRequests,
} from './api/useMasterData';
export { itemService } from './api/itemService';
export { masterDataGovernanceService } from './api/masterDataGovernanceService';

export { masterDataRoutes } from './routes';

export type {
  ItemContract,
  UpdateItemContract,
} from '@/packages/contracts/masterdata';
export type {
  CreateItemFormValues,
  UpdateItemFormValues,
} from './model/masterDataSchemas';
