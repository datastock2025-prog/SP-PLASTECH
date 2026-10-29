import React, { useState } from 'react';
import {
  WorkOrder,
  ItemMaster,
  MachineMaster,
  BomMaster,
  StockTransaction,
  AuthUser,
} from '@/src/types';
import { INITIAL_MOLDS } from '@/src/data/manufacturingData';
import { useWorkOrders } from '@/src/hooks/useManufacturing';
import { useMachines, usePaginatedItems } from '@/src/hooks/useMasterData';
import { useBoms } from '@/apps/web/src/modules/engineering/api/useEngineering';

// Sub-components
import { MfgCommandCenter } from '../components/MfgCommandCenter';
import { MfgPlanningBoard } from '../components/MfgPlanningBoard';
import { WorkOrderManager } from '../components/WorkOrderManager';
import { WorkOrderDetailTraveler } from '../components/WorkOrderDetailTraveler';
import { DailyProductionGrid } from '../components/DailyProductionGrid';
import { MaterialIssuingWorkbench } from '../components/MaterialIssuingWorkbench';
import { ShopFloorKiosk } from '../components/ShopFloorKiosk';
import { MachineMonitoringTelemetry } from '../components/MachineMonitoringTelemetry';
import { ScrapWasteDashboard } from '../components/ScrapWasteDashboard';
import { DowntimeTrackingView } from '../components/DowntimeTrackingView';
import { ElectronicBatchRecordView } from '../components/ElectronicBatchRecordView';
import { BatchGenealogyGraph } from '../components/BatchGenealogyGraph';
import { MoldToolingManager } from '../components/MoldToolingManager';
import { ChangeoverSMEDView } from '../components/ChangeoverSMEDView';
import { OeeAnalyticsDashboard } from '../components/OeeAnalyticsDashboard';
import { QualityGateInspectionView } from '../components/QualityGateInspectionView';
import { ProductionReportsHub } from '../components/ProductionReportsHub';
import { ProductionSettingsConfig } from '../components/ProductionSettingsConfig';
import { OperatorHistoryView } from '../components/OperatorHistoryView';
import { BulkWizardModal } from '../components/BulkWizardModal';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { JitSchedulingPlanner } from '../components/JitSchedulingPlanner';
import { WipOperationsManager } from '../components/WipOperationsManager';
import { WipStoreQcInspectionView } from '@/src/components/quality/WipStoreQcInspectionView';
import { RegrindMaterialEntryView } from '../components/RegrindMaterialEntryView';
import {
  INITIAL_WIP_RECORDS,
  INITIAL_PLANT_STORE_ITEMS,
  INITIAL_MATERIAL_TRANSFERS,
} from '@/src/data/operationsWipData';
import {
  WipInventoryRecord,
  PlantStoreInventoryItem,
  MaterialTransferRecord,
  OperationalStoreType,
  WipQcStatus,
} from '@/src/types/operationsWipTypes';

interface ManufacturingProps {
  view: string;
  viewParams?: any;
  workOrders: WorkOrder[];
  items: ItemMaster[];
  machines: MachineMaster[];
  boms: BomMaster[];
  stockTxns: StockTransaction[];
  currentUser?: AuthUser | null;
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
  viewParams,
  workOrders,
  items,
  machines,
  boms,
  stockTxns,
  currentUser,
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
  // TanStack Query SSOT (Rule 1 & Rule 3)
  const { data: queryWorkOrders } = useWorkOrders();
  const { data: queryMachines } = useMachines();
  const effectiveWorkOrders = (workOrders && workOrders.length > 0 ? workOrders : queryWorkOrders) || [];
  const effectiveMachines = (machines && machines.length > 0 ? machines : queryMachines) || [];
  const { data: queryBoms } = useBoms();
  const effectiveBoms = (queryBoms && queryBoms.length > 0 ? queryBoms : boms) || [];
  const { data: queryItemsData } = usePaginatedItems({ page: 1, limit: 100 });
  const effectiveItems = (items && items.length > 0 ? items : queryItemsData?.items) || [];

  const [isBulkWizardOpen, setIsBulkWizardOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

  // WIP, Deflash & Assembly Stores state
  const [wipRecords, setWipRecords] = useState<WipInventoryRecord[]>(INITIAL_WIP_RECORDS);
  const [plantStoreItems, setPlantStoreItems] = useState<PlantStoreInventoryItem[]>(INITIAL_PLANT_STORE_ITEMS);
  const [materialTransfers, setMaterialTransfers] = useState<MaterialTransferRecord[]>(INITIAL_MATERIAL_TRANSFERS);

  const handleUpdateWipRecord = (record: WipInventoryRecord) => {
    setWipRecords((prev) => prev.map((r) => (r.id === record.id ? record : r)));
  };

  const handleAddWipRecord = (record: WipInventoryRecord) => {
    setWipRecords((prev) => [record, ...prev]);
  };

  const handleUpdatePlantStoreItems = (newItems: PlantStoreInventoryItem[]) => {
    setPlantStoreItems(newItems);
  };

  const handleAddMaterialTransfer = (transfer: MaterialTransferRecord) => {
    setMaterialTransfers((prev) => [transfer, ...prev]);
  };

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

  // Synchronization handler when Daily Production Entry is logged
  // Logic:
  // - If item has WIP checked (or isWip / routingDestination === 'WIP'): routes to 'PRD-STORE' intermediate WIP floor
  // - If item has DOL checked (or isDol / routingDestination === 'DOL'): routes directly to 'FG-STORE'
  // - If item has ASSEMPLY checked (or isAssembly / routingDestination === 'ASSEMBLY'): routes to 'ASSEMBLY-STORE'
  // - If item has DEFLASH checked (or isDeflash / routingDestination === 'DEFLASH'): routes to 'DEFLASH-STORE'
  const handleSyncWipLot = (wo: WorkOrder, source: 'grid_entry' | 'excel_csv_upload', notes?: string) => {
    const targetItem = items.find((i) => i.code === wo.item);

    let targetStore: OperationalStoreType = 'PRD-STORE';
    let targetStage: 'Molding WIP' | 'FG Inventory' | 'Assembly' | 'Deflashing' = 'Molding WIP';
    let qcStatus: WipQcStatus = 'pending_qc';
    let requiresDeflash = false;
    let requiresAssembly = false;

    if (targetItem?.isDeflash || targetItem?.routingDestination === 'DEFLASH' || targetItem?.defaultLocation === 'DEFLASH-STORE') {
      targetStore = 'DEFLASH-STORE';
      targetStage = 'Deflashing';
      qcStatus = 'transferred_deflash';
      requiresDeflash = true;
    } else if (targetItem?.isAssembly || targetItem?.routingDestination === 'ASSEMBLY' || targetItem?.defaultLocation === 'ASSEMBLY-STORE') {
      targetStore = 'ASSEMBLY-STORE';
      targetStage = 'Assembly';
      qcStatus = 'transferred_assembly';
      requiresAssembly = true;
    } else if (targetItem?.isDol || targetItem?.routingDestination === 'DOL' || targetItem?.defaultLocation === 'FG-STORE') {
      // DOL (Direct On Line) -> directly to FG-STORE
      targetStore = 'FG-STORE';
      targetStage = 'FG Inventory';
      qcStatus = 'moved_to_fg';
    } else {
      // Default: WIP -> PRD-STORE intermediate WIP floor
      targetStore = 'PRD-STORE';
      targetStage = 'Molding WIP';
      qcStatus = 'pending_qc';
    }

    const goodQty = wo.completed ?? wo.qty ?? 1000;
    const scrapQty = wo.scrap ?? 0;
    const runnerKg = wo.runnerQty ?? 0;
    const lumpsKg = wo.lumbesQty ?? 0;
    const dedupKey = `${wo.id}_${wo.shift || 'Shift A'}_${wo.planDate || wo.dueDate || '2026-08-21'}`;

    setWipRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.deduplicationKey === dedupKey || r.workOrderId === wo.id);
      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        const updated: WipInventoryRecord = {
          ...existing,
          producedQty: goodQty + scrapQty,
          goodQty,
          scrapQty,
          runnerKg,
          lumpsKg,
          operator: wo.operator || existing.operator,
          currentStore: targetStore,
          currentStage: targetStage,
          qcStatus: existing.qcStatus === 'pending_qc' ? qcStatus : existing.qcStatus,
          requiresDeflash,
          requiresAssembly,
          lastUpdated: new Date().toISOString(),
          history: [
            {
              event: `Daily production entry updated [${source === 'excel_csv_upload' ? 'Excel Import' : 'Grid Entry'}]`,
              time: 'Just now',
              by: wo.operator || 'Operator',
              store: targetStore,
              details: `Output routed to ${targetStore} (${targetItem?.routingDestination || (requiresDeflash ? 'DEFLASH' : requiresAssembly ? 'ASSEMPLY' : 'DOL')}). Good Qty: ${goodQty} PCS, Scrap: ${scrapQty} PCS.`,
            },
            ...existing.history,
          ],
        };
        const nextList = [...prev];
        nextList[existingIdx] = updated;
        return nextList;
      } else {
        const newRecord: WipInventoryRecord = {
          id: `WIP-LOT-${wo.id}-${Date.now().toString().slice(-4)}`,
          workOrderId: wo.id,
          batchLotNo: `LOT-${wo.item}-${(wo.planDate || '20260821').replace(/-/g, '')}-${(wo.shift || 'A').slice(0, 1)}`,
          itemCode: wo.item,
          itemName: targetItem?.name || wo.item,
          bomId: wo.bomId || `BOM-${wo.item}`,
          plantId: 'PLANT-01',
          plantName: 'Plant 01 - Pune (Injection Molding Unit)',
          machineId: wo.machine || 'IMM-250T-03',
          shift: wo.shift || 'Shift A (06:00 - 14:00)',
          productionDate: wo.planDate || wo.dueDate || '2026-08-21',
          operator: wo.operator || 'Floor Operator',
          source,
          deduplicationKey: dedupKey,
          producedQty: goodQty + scrapQty,
          goodQty,
          scrapQty,
          runnerKg,
          lumpsKg,
          currentStore: targetStore,
          currentStage: targetStage,
          qcStatus,
          requiresDeflash,
          requiresAssembly,
          deflashStatus: requiresDeflash ? 'pending' : undefined,
          assemblyStatus: requiresAssembly ? 'pending' : undefined,
          lastUpdated: new Date().toISOString(),
          history: [
            {
              event: `Daily production entry logged [${source === 'excel_csv_upload' ? 'Excel Import' : 'Grid Entry'}]`,
              time: 'Just now',
              by: wo.operator || 'Operator',
              store: targetStore,
              details: `Auto-routed to ${targetStore} based on Item Master (${targetItem?.routingDestination || (requiresDeflash ? 'DEFLASH' : requiresAssembly ? 'ASSEMPLY' : 'DOL')}). Good Qty: ${goodQty} PCS.`,
            },
          ],
        };
        return [newRecord, ...prev];
      }
    });

    // Also update plant store inventory balances so the store reflects the stock
    setPlantStoreItems((prev) => {
      const idx = prev.findIndex((p) => p.itemCode === wo.item && p.storeCode === targetStore);
      if (idx !== -1) {
        const existing = prev[idx];
        const next = [...prev];
        next[idx] = {
          ...existing,
          currentBalance: (existing.currentBalance ?? existing.stockQty ?? 0) + goodQty,
          availableBalance: (existing.availableBalance ?? existing.stockQty ?? 0) + goodQty,
          stockQty: (existing.stockQty ?? 0) + goodQty,
          lastMovementDate: 'Today',
        };
        return next;
      } else {
        const newStoreItem: PlantStoreInventoryItem = {
          id: `PSI-${Date.now()}-${targetStore}`,
          plantId: 'PLANT-01',
          storeCode: targetStore,
          storeName: targetStore === 'FG-STORE' ? 'Finished Goods Handover Store' :
                     targetStore === 'ASSEMBLY-STORE' ? 'Assembly Floor Store' :
                     'Deflash Floor Store',
          itemCode: wo.item,
          itemName: targetItem?.name || wo.item,
          category: targetItem?.cat || 'Finished Goods',
          currentBalance: goodQty,
          availableBalance: goodQty,
          holdBalance: 0,
          uom: 'PCS',
          minLevel: 1000,
          maxLevel: 50000,
          lastMovementDate: 'Today',
        };
        return [newStoreItem, ...prev];
      }
    });

    // Update WorkOrder locOutput so traveler shows the routed store
    onUpdateWO({
      ...wo,
      locOutput: targetStore,
    });
  };

  return (
    <div className="w-full">
      {/* 1. Command Center Dashboard */}
      {view === 'mfgDash' && (
        <MfgCommandCenter
          workOrders={effectiveWorkOrders}
          machines={effectiveMachines}
          items={effectiveItems}
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
          workOrders={effectiveWorkOrders}
          machines={effectiveMachines}
          items={effectiveItems}
          boms={effectiveBoms}
          molds={INITIAL_MOLDS}
          onNavigate={onNavigate}
          onUpdateWO={onUpdateWO}
          onCreateWO={onCreateWO}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      )}

      {/* 2b. JIT Scheduling & Daily Production Planning Cockpit */}
      {view === 'jitBoard' && (
        <JitSchedulingPlanner
          workOrders={effectiveWorkOrders}
          machines={effectiveMachines}
          items={effectiveItems}
          boms={effectiveBoms}
          molds={INITIAL_MOLDS}
          currentUser={currentUser}
          onNavigate={onNavigate}
          onUpdateWO={onUpdateWO}
          onCreateWO={onCreateWO}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          openConfirm={openConfirm}
          showToast={showToast}
        />
      )}

      {/* 3. Work Order Manager List */}
      {(view === 'woList' || view === 'workOrders' || view === 'createWoGrid') && (
        <WorkOrderManager
          workOrders={effectiveWorkOrders}
          machines={effectiveMachines}
          items={effectiveItems}
          boms={effectiveBoms}
          molds={INITIAL_MOLDS}
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
          workOrder={effectiveWorkOrders.find((w) => w.id === (selectedId || effectiveWorkOrders[0]?.id)) || effectiveWorkOrders[0]}
          machines={effectiveMachines}
          items={effectiveItems}
          boms={effectiveBoms}
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
          workOrders={effectiveWorkOrders}
          machines={effectiveMachines}
          items={effectiveItems}
          molds={INITIAL_MOLDS}
          boms={effectiveBoms}
          initialDate={viewParams?.date}
          onNavigate={onNavigate}
          onUpdateWO={onUpdateWO}
          onCreateWO={onCreateWO}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
          onSyncWipLot={handleSyncWipLot}
        />
      )}

      {/* 6. Material Issuing Workbench */}
      {view === 'materialIssuing' && (
        <MaterialIssuingWorkbench
          workOrders={effectiveWorkOrders}
          items={effectiveItems}
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
          workOrders={effectiveWorkOrders}
          machines={effectiveMachines}
          items={effectiveItems}
          selectedWoId={selectedId}
          onNavigate={onNavigate}
          onUpdateWO={onUpdateWO}
          showToast={showToast}
        />
      )}

      {/* 8. Machine Telemetry & IoT */}
      {(view === 'telemetry' || view === 'machineTelemetry') && (
        <MachineMonitoringTelemetry
          machines={effectiveMachines}
          workOrders={effectiveWorkOrders}
          items={effectiveItems}
          molds={INITIAL_MOLDS}
          selectedMachineId={selectedId}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 9. Scrap & Downtime Tracking */}
      {(view === 'scrapDowntime' || view === 'scrapWaste') && (
        <ScrapWasteDashboard
          workOrders={effectiveWorkOrders}
          items={effectiveItems}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 10. Downtime Tracking */}
      {view === 'downtime' && (
        <DowntimeTrackingView
          workOrders={effectiveWorkOrders}
          machines={effectiveMachines}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 11. Electronic Batch Record (eBR Hub) */}
      {(view === 'ebrRecord' || view === 'ebr') && (
        <ElectronicBatchRecordView
          workOrders={effectiveWorkOrders}
          items={effectiveItems}
          selectedWoId={selectedId}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 12. Batch Genealogy & Traceability */}
      {view === 'genealogy' && (
        <BatchGenealogyGraph
          workOrders={effectiveWorkOrders}
          items={effectiveItems}
          selectedWoId={selectedId}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 13. Mold & Tooling Management */}
      {view === 'moldTooling' && (
        <MoldToolingManager
          molds={INITIAL_MOLDS}
          machines={effectiveMachines}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 14. Changeover & SMED */}
      {view === 'changeover' && (
        <ChangeoverSMEDView
          machines={effectiveMachines}
          workOrders={effectiveWorkOrders}
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
          workOrders={effectiveWorkOrders}
          items={effectiveItems}
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
          workOrders={effectiveWorkOrders}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 20. WIP, Deflash & Assembly Stores (QC Gate) */}
      {(view === 'wipOperations' || view === 'wip') && (
        <WipOperationsManager
          wipRecords={wipRecords}
          plantStoreItems={plantStoreItems}
          materialTransfers={materialTransfers}
          workOrders={effectiveWorkOrders}
          items={effectiveItems}
          machines={effectiveMachines}
          onUpdateWipRecord={handleUpdateWipRecord}
          onAddWipRecord={handleAddWipRecord}
          onUpdatePlantStoreItems={handleUpdatePlantStoreItems}
          onAddMaterialTransfer={handleAddMaterialTransfer}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 21. Consolidated Store QC Check Screen */}
      {(view === 'wipStoreQc' || view === 'storeQcCheck' || view === 'wipQcInspection') && (
        <WipStoreQcInspectionView
          wipRecords={wipRecords}
          items={effectiveItems}
          workOrders={effectiveWorkOrders}
          onUpdateWipRecord={handleUpdateWipRecord}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* 22. Transitional Regrind (RG) Material Entry & Mixing Hub */}
      {(view === 'rgMaterialEntry' ||
        view === 'regrindMaterialEntry' ||
        view === 'regrindEntry' ||
        view === 'regrindMixingHub') && (
        <RegrindMaterialEntryView
          workOrders={effectiveWorkOrders}
          items={effectiveItems}
          machines={effectiveMachines}
          boms={effectiveBoms}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}

      {/* Modals */}
      {(isBulkWizardOpen || view === 'createWoGrid') && (
        <BulkWizardModal
          machines={effectiveMachines}
          items={effectiveItems}
          boms={effectiveBoms}
          molds={INITIAL_MOLDS}
          onBulkCreate={handleBulkCreate}
          onClose={() => {
            setIsBulkWizardOpen(false);
            if (view === 'createWoGrid') {
              onNavigate('woList');
            }
          }}
          showToast={showToast}
        />
      )}

      {isExcelImportOpen && (
        <ExcelImportModal
          machines={effectiveMachines}
          items={effectiveItems}
          onImportSuccess={handleExcelImportCommit}
          onClose={() => setIsExcelImportOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
