// ============================================================================
// WAREHOUSE MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/warehouse/index.ts
// ============================================================================

export { WarehouseViews } from './screens/WarehouseViews';

export {
  useWarehouseStock,
  useWarehouseMovementLedger,
  useSaveWarehouseStock,
  useStockLedger,
  useWarehouseBins,
  useStockTransfers,
  useSaveStockTransfer,
  useQuarantineLots,
  getWarehouseStock,
  getStockMovementLedger,
  getWarehouseStockItem,
  getItemStockData,
  syncItemsWithWarehouseStock,
  postPutawayTasksToWarehouse,
  recordOutwardDispatchInventoryMovement,
  recordProductionShiftInventoryMovement,
  isUserAdmin,
  isStoreInUse,
} from './api/useWarehouse';

export type { StockItem, StockTransfer } from './api/useWarehouse';
export { warehouseApi } from './api/warehouseApi';
export { warehouseRoutes } from './routes';

export {
  StockTransferSchema,
  CreateStockTransferInputSchema,
  UpdateStockTransferInputSchema,
  WarehouseLocationSchema,
  InventoryStockItemSchema,
  stockTransferSchema,
} from './model/warehouseSchemas';

export type {
  StockTransferContract,
  CreateStockTransferContract,
  UpdateStockTransferContract,
  WarehouseLocationContract,
  InventoryStockItemContract,
  StockTransferFormValues,
  StockTransaction,
} from './model/warehouseSchemas';

// Component exports
export { StockTransferManager } from './components/stockTransfer/StockTransferManager';
export { InventoryDashboardView } from './components/InventoryDashboardView';
export { StockLedgerListView } from './components/StockLedgerListView';
export { WarehouseBinMapView } from './components/WarehouseBinMapView';
export { PutawayManagementView } from './components/PutawayManagementView';
export { PickPackDispatchView } from './components/PickPackDispatchView';
export { CycleCountAuditView } from './components/CycleCountAuditView';
export { QuarantineHoldView } from './components/QuarantineHoldView';
export { RegrindScrapClosedLoopView } from './components/RegrindScrapClosedLoopView';
export { SubcontractingManagementView } from './components/SubcontractingManagementView';
export { BarcodeScannerSimulatorView } from './components/BarcodeScannerSimulatorView';
export { LabelPrintingGeneratorView } from './components/LabelPrintingGeneratorView';
export { WarehouseStatusBadge } from './components/WarehouseStatusBadge';
