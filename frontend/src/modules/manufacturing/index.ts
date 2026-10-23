// ============================================================================
// DOMAIN MODULE: MANUFACTURING & SHOP FLOOR EXECUTION
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export {
  ManufacturingViews,
  MfgCommandCenter,
  MfgPlanningBoard,
  WorkOrderManager,
  WorkOrderDetailTraveler,
  DailyProductionGrid,
  MaterialIssuingWorkbench,
  ShopFloorKiosk,
  MachineMonitoringTelemetry,
  ScrapWasteDashboard,
  DowntimeTrackingView,
  ElectronicBatchRecordView,
  BatchGenealogyGraph,
  MoldToolingManager,
  ChangeoverSMEDView,
  OeeAnalyticsDashboard,
  QualityGateInspectionView,
  ProductionReportsHub,
  ProductionSettingsConfig,
  OperatorHistoryView,
  BulkWizardModal,
  ExcelImportModal,
  DailyProductionExcelModal,
  JitSchedulingPlanner,
  ShopFloorProductionEntry,
  useManufacturing,
  useWorkOrders,
  useSaveWorkOrder,
  useLogProductionEntry,
  manufacturingApi,
  manufacturingRoutes,
} from '../../../apps/web/src/modules/manufacturing';

// Domain Data & Types
export { INITIAL_MOLDS } from '../../data/manufacturingData';
export type { MoldMaster } from '../../data/manufacturingData';
export type {
  WorkOrder,
  MachineMaster,
  StockTransaction,
  RejectionBreakdownItem,
  DowntimeIntervalItem,
} from '../../types';
