// ============================================================================
// MANUFACTURING MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/manufacturing/index.ts
// ============================================================================

export { ManufacturingViews, manufacturingRoutes } from './routes';

export {
  useManufacturing,
  useWorkOrders,
  useSaveWorkOrder,
  useLogProductionEntry,
} from './api/useManufacturing';

export type {
  ProductionEntryPayload,
  ProductionEntryResult,
} from './api/useManufacturing';

export { manufacturingApi } from './api/manufacturingApi';

export {
  WorkOrderSchema,
  CreateWorkOrderInputSchema,
  UpdateWorkOrderInputSchema,
  WorkOrderLogSchema,
  MachineMasterSchema,
  DailyProductionEntrySchema,
  RegrindEntrySchema,
  workOrderLogSchema,
  createWorkOrderSchema,
} from './model/manufacturingSchemas';

export type {
  WorkOrderContract,
  CreateWorkOrderContract,
  UpdateWorkOrderContract,
  WorkOrderLogContract,
  MachineMasterContract,
  DailyProductionEntryContract,
  RegrindEntryContract,
  WorkOrderLogFormValues,
  CreateWorkOrderFormValues,
  OutputLog,
  WorkOrder,
  MachineMaster,
} from './model/manufacturingSchemas';

// Core sub-components
export { MfgCommandCenter } from './components/MfgCommandCenter';
export { MfgPlanningBoard } from './components/MfgPlanningBoard';
export { WorkOrderManager } from './components/WorkOrderManager';
export { WorkOrderDetailTraveler } from './components/WorkOrderDetailTraveler';
export { DailyProductionGrid } from './components/DailyProductionGrid';
export { MaterialIssuingWorkbench } from './components/MaterialIssuingWorkbench';
export { ShopFloorKiosk } from './components/ShopFloorKiosk';
export { MachineMonitoringTelemetry } from './components/MachineMonitoringTelemetry';
export { ScrapWasteDashboard } from './components/ScrapWasteDashboard';
export { DowntimeTrackingView } from './components/DowntimeTrackingView';
export { ElectronicBatchRecordView } from './components/ElectronicBatchRecordView';
export { BatchGenealogyGraph } from './components/BatchGenealogyGraph';
export { MoldToolingManager } from './components/MoldToolingManager';
export { ChangeoverSMEDView } from './components/ChangeoverSMEDView';
export { OeeAnalyticsDashboard } from './components/OeeAnalyticsDashboard';
export { QualityGateInspectionView } from './components/QualityGateInspectionView';
export { ProductionReportsHub } from './components/ProductionReportsHub';
export { ProductionSettingsConfig } from './components/ProductionSettingsConfig';
export { OperatorHistoryView } from './components/OperatorHistoryView';
export { BulkWizardModal } from './components/BulkWizardModal';
export { ExcelImportModal } from './components/ExcelImportModal';
export { DailyProductionExcelModal } from './components/DailyProductionExcelModal';
export { JitSchedulingPlanner } from './components/JitSchedulingPlanner';
export { ShopFloorProductionEntry } from './components/shop-floor/ShopFloorProductionEntry';
