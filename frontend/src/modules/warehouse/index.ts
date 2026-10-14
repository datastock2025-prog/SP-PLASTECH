// ============================================================================
// DOMAIN MODULE: WAREHOUSE & INVENTORY MANAGEMENT
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export {
  WarehouseViews,
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
  warehouseApi,
} from '../../../apps/web/src/modules/warehouse';

export { initialStockTransactions } from '../../data/initialData';
export {
  INITIAL_WAREHOUSE_LOCATIONS,
  INITIAL_INVENTORY_STOCK,
  INITIAL_PUTAWAY_TASKS,
  INITIAL_PICK_PACK_TASKS,
  INITIAL_CYCLE_COUNTS,
  INITIAL_QUARANTINE_LOTS,
  INITIAL_REGRIND_RUNS,
  INITIAL_SUBCONTRACT_ORDERS,
} from '../../data/warehouseData';

export type {
  WarehouseLocation,
  InventoryStockLot,
  InventoryStockItem,
  PutawayTask,
  PickPackLine,
  PickPackTask,
  CycleCountItemAudit,
  CycleCountSession,
  QuarantineLotRecord,
  RegrindScrapRun,
  SubcontractOrder,
} from '../../types/warehouse';
