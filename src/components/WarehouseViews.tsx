import React, { useState } from 'react';
import {
  ItemMaster,
  PurchaseOrder,
  SubcontractOrder as LegacySubcontractOrder,
  StockTransaction,
} from '../types';
import {
  INITIAL_WAREHOUSE_LOCATIONS,
  INITIAL_INVENTORY_STOCK,
  INITIAL_PUTAWAY_TASKS,
  INITIAL_PICK_PACK_TASKS,
  INITIAL_CYCLE_COUNTS,
  INITIAL_QUARANTINE_LOTS,
  INITIAL_REGRIND_RUNS,
  INITIAL_SUBCONTRACT_ORDERS,
} from '../data/warehouseData';
import {
  WarehouseLocation,
  InventoryStockItem,
  PutawayTask,
  PickPackTask,
  CycleCountSession,
  QuarantineLotRecord,
  RegrindScrapRun,
  SubcontractOrder,
} from '../types/warehouse';

import { InventoryDashboardView } from './warehouse/InventoryDashboardView';
import { StockLedgerListView } from './warehouse/StockLedgerListView';
import { WarehouseBinMapView } from './warehouse/WarehouseBinMapView';
import { PutawayManagementView } from './warehouse/PutawayManagementView';
import { PickPackDispatchView } from './warehouse/PickPackDispatchView';
import { CycleCountAuditView } from './warehouse/CycleCountAuditView';
import { QuarantineHoldView } from './warehouse/QuarantineHoldView';
import { RegrindScrapClosedLoopView } from './warehouse/RegrindScrapClosedLoopView';
import { SubcontractingManagementView } from './warehouse/SubcontractingManagementView';
import { BarcodeScannerSimulatorView } from './warehouse/BarcodeScannerSimulatorView';
import { LabelPrintingGeneratorView } from './warehouse/LabelPrintingGeneratorView';

interface WarehouseProps {
  view: string;
  items: ItemMaster[];
  pos: PurchaseOrder[];
  subcontracts: LegacySubcontractOrder[];
  stockTxns: StockTransaction[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  onUpdateItem: (item: ItemMaster) => void;
  onUpdatePO: (po: PurchaseOrder) => void;
  onCreatePO: (po: PurchaseOrder) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

export const WarehouseViews: React.FC<WarehouseProps> = ({
  view,
  items,
  pos,
  subcontracts,
  stockTxns,
  selectedId,
  onNavigate,
  onUpdateItem,
  onUpdatePO,
  onCreatePO,
  openDrawer,
  closeDrawer,
  openConfirm,
  showToast,
}) => {
  // Warehouse local state managed with initial seed data
  const [locations, setLocations] = useState<WarehouseLocation[]>(INITIAL_WAREHOUSE_LOCATIONS);
  const [stockItems, setStockItems] = useState<InventoryStockItem[]>(INITIAL_INVENTORY_STOCK);
  const [putawayTasks, setPutawayTasks] = useState<PutawayTask[]>(INITIAL_PUTAWAY_TASKS);
  const [pickTasks, setPickTasks] = useState<PickPackTask[]>(INITIAL_PICK_PACK_TASKS);
  const [cycleCounts, setCycleCounts] = useState<CycleCountSession[]>(INITIAL_CYCLE_COUNTS);
  const [quarantineLots, setQuarantineLots] = useState<QuarantineLotRecord[]>(INITIAL_QUARANTINE_LOTS);
  const [regrindRuns, setRegrindRuns] = useState<RegrindScrapRun[]>(INITIAL_REGRIND_RUNS);
  const [subcontractOrders, setSubcontractOrders] = useState<SubcontractOrder[]>(INITIAL_SUBCONTRACT_ORDERS);

  // 1. Inventory Dashboard
  if (view === 'invDash') {
    return (
      <InventoryDashboardView
        stockItems={stockItems}
        locations={locations}
        putawayTasks={putawayTasks}
        pickTasks={pickTasks}
        quarantineLots={quarantineLots}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    );
  }

  // 2. Stock Ledger List
  if (view === 'stockList') {
    return (
      <StockLedgerListView
        stockItems={stockItems}
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
        onUpdateItem={(updated) => {
          setStockItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        }}
      />
    );
  }

  // 3. 2D Warehouse Bin Map
  if (view === 'binMap') {
    return (
      <WarehouseBinMapView
        locations={locations}
        stockItems={stockItems}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    );
  }

  // 4. Putaway Tasks
  if (view === 'putaway') {
    return (
      <PutawayManagementView
        tasks={putawayTasks}
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
        onUpdateTask={(task) => {
          setPutawayTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        }}
      />
    );
  }

  // 5. Picking & Packing Staging
  if (view === 'picking') {
    return (
      <PickPackDispatchView
        tasks={pickTasks}
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
        onUpdateTask={(task) => {
          setPickTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        }}
      />
    );
  }

  // 6. Cycle Count Audits
  if (view === 'cycleCount') {
    return (
      <CycleCountAuditView
        sessions={cycleCounts}
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
        onUpdateSession={(session) => {
          setCycleCounts((prev) => prev.map((s) => (s.id === session.id ? session : s)));
        }}
        onCreateSession={(newSession) => {
          setCycleCounts((prev) => [newSession, ...prev]);
        }}
      />
    );
  }

  // 7. Quarantine Hold & MRB
  if (view === 'quarantine') {
    return (
      <QuarantineHoldView
        lots={quarantineLots}
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
        onUpdateLot={(lot) => {
          setQuarantineLots((prev) => prev.map((l) => (l.id === lot.id ? lot : l)));
        }}
      />
    );
  }

  // 8. Regrind Scrap Closed Loop
  if (view === 'regrindScrap') {
    return (
      <RegrindScrapClosedLoopView
        runs={regrindRuns}
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
        onCreateRun={(newRun) => {
          setRegrindRuns((prev) => [newRun, ...prev]);
        }}
      />
    );
  }

  // 9. Subcontracting Job-Work
  if (view === 'subcontractList' || view === 'subcontractDetail') {
    return (
      <SubcontractingManagementView
        orders={subcontractOrders}
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
        onUpdateOrder={(order) => {
          setSubcontractOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
        }}
        onCreateOrder={(newOrder) => {
          setSubcontractOrders((prev) => [newOrder, ...prev]);
        }}
      />
    );
  }

  // 10. Barcode Scanner Simulator
  if (view === 'scanner') {
    return (
      <BarcodeScannerSimulatorView
        stockItems={stockItems}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    );
  }

  // 11. Label Printing
  if (view === 'labelPrint') {
    return (
      <LabelPrintingGeneratorView
        stockItems={stockItems}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    );
  }

  // Fallback to stock list
  return (
    <StockLedgerListView
      stockItems={stockItems}
      onNavigate={onNavigate}
      openDrawer={openDrawer}
      closeDrawer={closeDrawer}
      showToast={showToast}
    />
  );
};
