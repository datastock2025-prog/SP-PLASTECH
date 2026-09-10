import React, { useState } from 'react';
import {
  WorkOrder,
  ItemMaster,
  MachineMaster,
  BomMaster,
  StockTransaction,
} from '../types';
import { INITIAL_MOLDS } from '../data/manufacturingData';

// Sub-components
import { MfgCommandCenter } from './manufacturing/MfgCommandCenter';
import { MfgPlanningBoard } from './manufacturing/MfgPlanningBoard';
import { WorkOrderManager } from './manufacturing/WorkOrderManager';
import { WorkOrderDetailTraveler } from './manufacturing/WorkOrderDetailTraveler';
import { DailyProductionGrid } from './manufacturing/DailyProductionGrid';
import { MaterialIssuingWorkbench } from './manufacturing/MaterialIssuingWorkbench';
import { ShopFloorKiosk } from './manufacturing/ShopFloorKiosk';
import { MachineMonitoringTelemetry } from './manufacturing/MachineMonitoringTelemetry';
import { ScrapWasteDashboard } from './manufacturing/ScrapWasteDashboard';
import { DowntimeTrackingView } from './manufacturing/DowntimeTrackingView';
import { ElectronicBatchRecordView } from './manufacturing/ElectronicBatchRecordView';
import { BatchGenealogyGraph } from './manufacturing/BatchGenealogyGraph';
import { MoldToolingManager } from './manufacturing/MoldToolingManager';
import { ChangeoverSMEDView } from './manufacturing/ChangeoverSMEDView';
import { OeeAnalyticsDashboard } from './manufacturing/OeeAnalyticsDashboard';
import { QualityGateInspectionView } from './manufacturing/QualityGateInspectionView';
import { ProductionReportsHub } from './manufacturing/ProductionReportsHub';
import { ProductionSettingsConfig } from './manufacturing/ProductionSettingsConfig';
import { OperatorHistoryView } from './manufacturing/OperatorHistoryView';
import { BulkWizardModal } from './manufacturing/BulkWizardModal';
import { ExcelImportModal } from './manufacturing/ExcelImportModal';

interface ManufacturingProps {
  view: string;
  workOrders: WorkOrder[];
  items: ItemMaster[];
  machines: MachineMaster[];
  boms: BomMaster[];
  stockTxns: StockTransaction[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  onUpdateWO: (wo: WorkOrder) => void;
  onCreateWO: (wo: WorkOrder) => void;
  onDeleteWO: (id: string) => void;
  onIssueMaterial: (woId: string, itemCode: string, qty: number) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

export const ManufacturingViews: React.FC<ManufacturingProps> = ({
  view,
  workOrders,
  items,
  machines,
  boms,
  stockTxns,
  selectedId,
  onNavigate,
  onUpdateWO,
  onCreateWO,
  onDeleteWO,
  onIssueMaterial,
  openDrawer,
  closeDrawer,
  openConfirm,
  showToast,
}) => {
  const [isBulkWizardOpen, setIsBulkWizardOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

  // Helper for batch creating orders from Bulk Wizard or Excel Import
  const handleBulkCreate = (newOrders: WorkOrder[]) => {
    newOrders.forEach((wo) => onCreateWO(wo));
    showToast(`Created and scheduled ${newOrders.length} work orders.`);
  };

  // Helper for Excel Import commit
  const handleExcelImportCommit = (importedOrders: WorkOrder[]) => {
    importedOrders.forEach((wo) => onCreateWO(wo));
    showToast(`Imported ${importedOrders.length} work orders from Excel schedule.`);
  };

  return (
    <div className="w-full">
      {/* 1. Command Center Dashboard */}
      {view === 'mfgDash' && (
        <MfgCommandCenter
          workOrders={workOrders}
          machines={machines}
          items={items}
          molds={INITIAL_MOLDS}
          onNavigate={onNavigate}
          onUpdateWO={onUpdateWO}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      )}

      {/* 2. Planning Board / Scheduler Gantt */}
      {(view === 'machineSchedule' || view === 'planningBoard') && (
        <MfgPlanningBoard
          workOrders={workOrders}
          machines={machines}
          items={items}
          molds={INITIAL_MOLDS}
          onNavigate={onNavigate}
          onUpdateWO={onUpdateWO}
          onCreateWO={onCreateWO}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      )}

      {/* 3. Work Order Manager List */}
      {(view === 'woList' || view === 'workOrders') && (
        <WorkOrderManager
          workOrders={workOrders}
          machines={machines}
          items={items}
          boms={boms}
          onNavigate={onNavigate}
          onUpdateWO={onUpdateWO}
          onCreateWO={onCreateWO}
          onDeleteWO={onDeleteWO}
          onOpenBulkWizard={() => setIsBulkWizardOpen(true)}
          onOpenExcelImport={() => setIsExcelImportOpen(true)}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          openConfirm={openConfirm}
          showToast={showToast}
        />
      )}

      {/* 4. Digital Job Traveler / Detailed WO view */}
      {view === 'woDetail' && (
        <WorkOrderDetailTraveler
          workOrder={workOrders.find((w) => w.id === (selectedId || workOrders[0]?.id)) || workOrders[0]}
          machines={machines}
          items={items}
          boms={boms}
          molds={INITIAL_MOLDS}
          onNavigate={onNavigate}
          onUpdateWO={onUpdateWO}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      )}

      {/* 5. Production Entry Grid (Inline Spreadsheet Grid) */}
      {(view === 'prodEntryGrid' || view === 'dailyGrid') && (
        <DailyProductionGrid
          workOrders={workOrders}
          machines={machines}
          items={items}
          molds={INITIAL_MOLDS}
          onNavigate={onNavigate}
          onUpdateWO={onUpdateWO}
          onCreateWO={onCreateWO}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      )}

      {/* 6. Material Issuing Workbench */}
      {view === 'materialIssuing' && (
        <MaterialIssuingWorkbench
          workOrders={workOrders}
          items={items}
          stockTxns={stockTxns}
          selectedWoId={selectedId}
          onNavigate={onNavigate}
          onIssueMaterial={onIssueMaterial}
          showToast={showToast}
        />
      )}

      {/* 7. Shop Floor Kiosk Console */}
      {(view === 'shopFloor' || view === 'kiosk') && (
        <ShopFloorKiosk
          workOrders={workOrders}
          machines={machines}
          items={items}
          selectedWoId={selectedId}
          onNavigate={onNavigate}
          onUpdateWO={onUpdateWO}
          showToast={showToast}
        />
      )}

      {/* 8. Machine Telemetry & IoT */}
      {(view === 'telemetry' || view === 'machineTelemetry') && (
        <MachineMonitoringTelemetry
          machines={machines}
          workOrders={workOrders}
          items={items}
          molds={INITIAL_MOLDS}
          selectedMachineId={selectedId}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 9. Scrap & Downtime Tracking */}
      {(view === 'scrapDowntime' || view === 'scrapWaste') && (
        <ScrapWasteDashboard
          workOrders={workOrders}
          items={items}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 10. Downtime Tracking */}
      {view === 'downtime' && (
        <DowntimeTrackingView
          workOrders={workOrders}
          machines={machines}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 11. Electronic Batch Record (eBR Hub) */}
      {(view === 'ebrRecord' || view === 'ebr') && (
        <ElectronicBatchRecordView
          workOrders={workOrders}
          items={items}
          selectedWoId={selectedId}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 12. Batch Genealogy & Traceability */}
      {view === 'genealogy' && (
        <BatchGenealogyGraph
          workOrders={workOrders}
          items={items}
          selectedWoId={selectedId}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 13. Mold & Tooling Management */}
      {view === 'moldTooling' && (
        <MoldToolingManager
          molds={INITIAL_MOLDS}
          machines={machines}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 14. Changeover & SMED */}
      {view === 'changeover' && (
        <ChangeoverSMEDView
          machines={machines}
          workOrders={workOrders}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 15. OEE Analytics */}
      {view === 'oeeDash' && (
        <OeeAnalyticsDashboard
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 16. Quality Gate Inspection & SPC */}
      {(view === 'qualityGate' || view === 'spc') && (
        <QualityGateInspectionView
          workOrders={workOrders}
          items={items}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 17. Production Reports Hub */}
      {view === 'reportsHub' && (
        <ProductionReportsHub
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 18. Production Settings */}
      {view === 'mfgSettings' && (
        <ProductionSettingsConfig
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 19. Operator History */}
      {view === 'operatorHistory' && (
        <OperatorHistoryView
          workOrders={workOrders}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* Modals */}
      {isBulkWizardOpen && (
        <BulkWizardModal
          machines={machines}
          items={items}
          boms={boms}
          onBulkCreate={handleBulkCreate}
          onClose={() => setIsBulkWizardOpen(false)}
          showToast={showToast}
        />
      )}

      {isExcelImportOpen && (
        <ExcelImportModal
          machines={machines}
          items={items}
          onImportSuccess={handleExcelImportCommit}
          onClose={() => setIsExcelImportOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
