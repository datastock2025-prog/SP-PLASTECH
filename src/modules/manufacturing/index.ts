// ============================================================================
// DOMAIN MODULE: MANUFACTURING & SHOP FLOOR EXECUTION
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export { ManufacturingViews } from '../../components/ManufacturingViews';

// Direct Sub-Component Exports
export { MfgCommandCenter } from '../../components/manufacturing/MfgCommandCenter';
export { MfgPlanningBoard } from '../../components/manufacturing/MfgPlanningBoard';
export { WorkOrderManager } from '../../components/manufacturing/WorkOrderManager';
export { WorkOrderDetailTraveler } from '../../components/manufacturing/WorkOrderDetailTraveler';
export { DailyProductionGrid } from '../../components/manufacturing/DailyProductionGrid';
export { MaterialIssuingWorkbench } from '../../components/manufacturing/MaterialIssuingWorkbench';
export { ShopFloorKiosk } from '../../components/manufacturing/ShopFloorKiosk';
export { MachineMonitoringTelemetry } from '../../components/manufacturing/MachineMonitoringTelemetry';
export { ScrapWasteDashboard } from '../../components/manufacturing/ScrapWasteDashboard';
export { DowntimeTrackingView } from '../../components/manufacturing/DowntimeTrackingView';
export { ElectronicBatchRecordView } from '../../components/manufacturing/ElectronicBatchRecordView';
export { BatchGenealogyGraph } from '../../components/manufacturing/BatchGenealogyGraph';
export { MoldToolingManager } from '../../components/manufacturing/MoldToolingManager';
export { ChangeoverSMEDView } from '../../components/manufacturing/ChangeoverSMEDView';
export { OeeAnalyticsDashboard } from '../../components/manufacturing/OeeAnalyticsDashboard';
export { QualityGateInspectionView } from '../../components/manufacturing/QualityGateInspectionView';
export { ProductionReportsHub } from '../../components/manufacturing/ProductionReportsHub';
export { ProductionSettingsConfig } from '../../components/manufacturing/ProductionSettingsConfig';
export { OperatorHistoryView } from '../../components/manufacturing/OperatorHistoryView';
export { BulkWizardModal } from '../../components/manufacturing/BulkWizardModal';
export { ExcelImportModal } from '../../components/manufacturing/ExcelImportModal';
export { DailyProductionExcelModal } from '../../components/manufacturing/DailyProductionExcelModal';
export { JitSchedulingPlanner } from '../../components/manufacturing/JitSchedulingPlanner';

// Domain Data & Types
export { INITIAL_MOLDS } from '../../data/manufacturingData';
export type { MoldMaster } from '../../data/manufacturingData';
export { initialWorkOrders, initialMachines } from '../../data/initialData';
export type {
  WorkOrder,
  MachineMaster,
  StockTransaction,
  RejectionBreakdownItem,
  DowntimeIntervalItem,
} from '../../types';
