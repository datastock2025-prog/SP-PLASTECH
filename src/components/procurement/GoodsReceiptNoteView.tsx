import React, { useState } from 'react';
import {
  Truck,
  Layers,
  ShieldCheck,
  RotateCcw,
  Settings,
  Smartphone,
  Printer,
  Plus,
  FileText,
  FileCheck,
  AlertTriangle,
  QrCode,
  FlaskConical,
} from 'lucide-react';
import { GoodsReceiptNote, ExtendedPurchaseOrder } from '../../types/procurement';
import {
  GoodsReceiptNoteExt,
  ConfirmedPoQueueItem,
  GrnPutawayTask,
  GrnToleranceSettings,
} from '../../types/grnTypes';
import {
  INITIAL_EXTENDED_GRNS,
  INITIAL_CONFIRMED_PO_QUEUE,
  INITIAL_PUTAWAY_TASKS,
  DEFAULT_GRN_SETTINGS,
} from '../../data/grnData';

// Subcomponents
import { GrnDashboardTab } from './grn/GrnDashboardTab';
import { ConfirmedPoQueueTab } from './grn/ConfirmedPoQueueTab';
import { AllGrnsTableTab } from './grn/AllGrnsTableTab';
import { QualityInspectionConsole } from './grn/QualityInspectionConsole';
import { PutawayInventoryPostingTab } from './grn/PutawayInventoryPostingTab';
import { LiveGrnEntryModal } from './grn/LiveGrnEntryModal';
import { GrnDetailModal } from './grn/GrnDetailModal';
import { ExceptionsAndReturnsModal } from './grn/ExceptionsAndReturnsModal';
import { GrnReversalModal } from './grn/GrnReversalModal';
import { MobileBarcodeReceivingModal } from './grn/MobileBarcodeReceivingModal';
import { GrnPrintViewModal } from './grn/GrnPrintViewModal';
import { GrnSettingsModal } from './grn/GrnSettingsModal';

interface Props {
  grns: GoodsReceiptNote[];
  pos: ExtendedPurchaseOrder[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateGRN: (grn: GoodsReceiptNote) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const GoodsReceiptNoteView: React.FC<Props> = ({
  grns: propGrns,
  pos,
  onNavigate,
  onUpdateGRN,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'allGrns' | 'qc' | 'putaway' | 'exceptions'>('dashboard');

  // Enterprise GRN State
  const [extendedGrns, setExtendedGrns] = useState<GoodsReceiptNoteExt[]>(INITIAL_EXTENDED_GRNS);
  const [poQueue, setPoQueue] = useState<ConfirmedPoQueueItem[]>(INITIAL_CONFIRMED_PO_QUEUE);
  const [putawayTasks, setPutawayTasks] = useState<GrnPutawayTask[]>(INITIAL_PUTAWAY_TASKS);
  const [toleranceSettings, setToleranceSettings] = useState<GrnToleranceSettings>(DEFAULT_GRN_SETTINGS);

  // Modals
  const [isLiveCreateOpen, setIsLiveCreateOpen] = useState(false);
  const [selectedPoItemForCreate, setSelectedPoItemForCreate] = useState<ConfirmedPoQueueItem | undefined>(undefined);

  const [selectedGrnForDetail, setSelectedGrnForDetail] = useState<GoodsReceiptNoteExt | null>(null);
  const [selectedGrnForPrint, setSelectedGrnForPrint] = useState<GoodsReceiptNoteExt | null>(null);
  const [selectedGrnForReturn, setSelectedGrnForReturn] = useState<GoodsReceiptNoteExt | null>(null);
  const [selectedGrnForReversal, setSelectedGrnForReversal] = useState<GoodsReceiptNoteExt | null>(null);

  const [isMobileScanOpen, setIsMobileScanOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Save new GRN
  const handleSaveGrn = (newGrn: GoodsReceiptNoteExt, isDraft: boolean) => {
    setExtendedGrns((prev) => [newGrn, ...prev]);

    // If created from PO queue, update or remove queue item
    setPoQueue((prev) =>
      prev
        .map((p) => {
          if (p.poNumber === newGrn.poNumber) {
            const receivedInThisGrn = newGrn.lines.reduce((s, l) => s + l.currentReceivedQty, 0);
            const newOpen = Math.max(0, p.openPoQty - receivedInThisGrn);
            return {
              ...p,
              previouslyReceivedQty: p.previouslyReceivedQty + receivedInThisGrn,
              openPoQty: newOpen,
              poStatus: newOpen === 0 ? 'Closed' : 'Partially Received',
            };
          }
          return p;
        })
        .filter((p) => p.openPoQty > 0)
    );

    // If not draft and QC not required or after GRN, generate putaway task
    if (!isDraft) {
      const firstLine = newGrn.lines[0];
      if (firstLine) {
        const newTask: GrnPutawayTask = {
          id: `PTW-${Math.floor(1000 + Math.random() * 9000)}`,
          grnNumber: newGrn.grnNumber,
          poNumber: newGrn.poNumber,
          itemCode: firstLine.itemCode,
          itemName: firstLine.itemName,
          lotNumber: firstLine.lotBatchNumber,
          quantity: firstLine.currentReceivedQty,
          uom: firstLine.uom,
          currentLocation: newGrn.receivingDock,
          recommendedLocation: firstLine.bin,
          recommendedZone: 'Standard Resin Bay',
          actualLocation: firstLine.bin,
          binCode: firstLine.bin,
          palletContainerId: `PLT-${Math.floor(100 + Math.random() * 900)}`,
          fefoPriority: 'Standard',
          putawayStatus: 'Pending',
        };
        setPutawayTasks((prev) => [newTask, ...prev]);
      }
    }

    // Sync legacy parent adapter
    try {
      const legacyGrn: GoodsReceiptNote = {
        id: newGrn.id,
        grnNumber: newGrn.grnNumber,
        poNumber: newGrn.poNumber,
        supplierId: newGrn.supplierId,
        supplierName: newGrn.supplierName,
        receiptDate: newGrn.receiptDate,
        warehouse: newGrn.warehouse,
        receivingDock: newGrn.receivingDock,
        deliveryChallanNo: newGrn.deliveryChallanNo,
        vehicleNumber: newGrn.vehicleNumber,
        transporterName: newGrn.transporterName,
        packingSlipRef: newGrn.packingSlipRef,
        status: newGrn.status as any,
        inspectionStatus: newGrn.inspectionStatus,
        receivedBy: newGrn.receivedBy,
        notes: newGrn.notes,
        lines: newGrn.lines.map((l) => ({
          lineNo: l.lineNo,
          poLineNo: l.poLineNo,
          itemCode: l.itemCode,
          itemName: l.itemName,
          orderedQty: l.orderedQty,
          receivedQty: l.currentReceivedQty,
          acceptedQty: l.acceptedQty,
          rejectedQty: l.rejectedQty,
          uom: l.uom,
          lotBatchNumber: l.lotBatchNumber,
          mfgDate: l.mfgDate,
          expiryDate: l.expiryDate,
          coaReference: l.coaReference,
          binLocation: l.bin,
          quarantineBin: l.quarantineBin,
          inspectionRequired: true,
          inspectionStatus: l.qualityStatus as any,
        })),
      };
      onUpdateGRN(legacyGrn);
    } catch (e) {
      console.warn('Parent legacy sync optional', e);
    }
  };

  // Update existing GRN
  const handleUpdateGrn = (updated: GoodsReceiptNoteExt) => {
    setExtendedGrns((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    if (selectedGrnForDetail?.id === updated.id) {
      setSelectedGrnForDetail(updated);
    }
  };

  // Complete Putaway Task
  const handleCompletePutaway = (taskId: string, actualLocation: string, binCode: string) => {
    setPutawayTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            putawayStatus: 'Completed',
            actualLocation,
            binCode,
            putawayBy: 'Dharmesh Solanki (Forklift Bay #2)',
            putawayDate: new Date().toISOString().slice(0, 10),
            putawayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return t;
      })
    );
  };

  // Submit Supplier Return / Debit Note
  const handleSubmitReturn = (
    grnId: string,
    exceptionType: string,
    qty: number,
    uom: string,
    reason: string,
    debitNoteAmount: number
  ) => {
    const target = extendedGrns.find((g) => g.id === grnId);
    if (!target) return;

    const updatedLines = [...target.lines];
    if (updatedLines[0]) {
      updatedLines[0] = {
        ...updatedLines[0],
        rejectedQty: updatedLines[0].rejectedQty + qty,
        acceptedQty: Math.max(0, updatedLines[0].acceptedQty - qty),
      };
    }

    const updated: GoodsReceiptNoteExt = {
      ...target,
      lines: updatedLines,
      status: 'partially_accepted',
      inspectionStatus: 'Quarantined',
      exceptions: [
        ...target.exceptions,
        {
          id: 'EXC-' + Math.floor(1000 + Math.random() * 9000),
          grnLineNo: 1,
          type: 'Damaged',
          quantity: qty,
          reason,
          debitNoteGenerated: true,
          debitNoteNumber: `DN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        },
      ],
      auditTrail: [
        ...target.auditTrail,
        {
          id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
          action: 'Returned',
          user: 'Store Supervisor',
          timestamp: new Date().toLocaleString(),
          details: `Logged Return: ${qty} ${uom} rejected. Debit Note generated: ₹${debitNoteAmount.toLocaleString()}. Reason: ${reason}`,
        },
      ],
    };

    handleUpdateGrn(updated);
  };

  // Confirm Reversal
  const handleConfirmReversal = (grnId: string, reason: string, supervisorPin: string) => {
    const target = extendedGrns.find((g) => g.id === grnId);
    if (!target) return;

    const reversed: GoodsReceiptNoteExt = {
      ...target,
      status: 'rejected',
      inventoryPostingStatus: 'Reversed / Cancelled',
      auditTrail: [
        ...target.auditTrail,
        {
          id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
          action: 'Reversed',
          user: `Supervisor Authorized (PIN ${supervisorPin})`,
          timestamp: new Date().toLocaleString(),
          details: `GRN cancelled and reversed. Reason: ${reason}`,
        },
      ],
    };

    handleUpdateGrn(reversed);
  };

  // Complete Mobile Scan
  const handleCompleteMobileScan = (poNumber: string, scannedQty: number, lotNumber: string) => {
    const poItem = poQueue.find((p) => p.poNumber === poNumber);
    if (!poItem) return;

    const newGrnNumber = `${toleranceSettings.numberingPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newGrn: GoodsReceiptNoteExt = {
      id: newGrnNumber,
      grnNumber: newGrnNumber,
      poNumber: poItem.poNumber,
      supplierId: poItem.supplierId,
      supplierName: poItem.supplierName,
      supplierGstin: poItem.supplierGstin,
      supplierInvoiceNo: `INV-MOB-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierInvoiceDate: new Date().toISOString().slice(0, 10),
      deliveryChallanNo: poItem.deliveryChallanNo || 'DC-MOB-01',
      receiptDate: new Date().toISOString().slice(0, 10),
      arrivalDate: new Date().toISOString().slice(0, 10),
      arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      gateEntryNumber: `GE-MOB-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleNumber: poItem.vehicleNumber || 'GJ-15-MOB-01',
      transporterName: poItem.transporterName || 'Express Logistics',
      driverName: poItem.driverName || 'Truck Driver',
      receivingPlant: poItem.plant,
      warehouse: poItem.warehouse,
      receivingDock: poItem.receivingDock,
      receivedBy: 'Handheld Terminal Operator #04',
      packingSlipRef: 'PS-MOB',
      status: 'posted',
      inspectionStatus: 'Pending',
      inspectionMode: toleranceSettings.defaultQcMode,
      inventoryPostingStatus: 'Posted to Available Stock',
      notes: 'Logged via Zebra handheld mobile scanner at receiving ramp.',
      qrCodePayload: `GRN:${newGrnNumber}|PO:${poItem.poNumber}|LOT:${lotNumber}`,
      overReceiptApproved: false,
      putawayStatus: 'In Progress',
      exceptions: [],
      lines: [
        {
          lineNo: 1,
          poLineNo: poItem.poLineNo,
          itemCode: poItem.itemCode,
          itemName: poItem.itemName,
          description: poItem.itemCategory,
          uom: poItem.uom,
          orderedQty: poItem.orderedQty,
          previouslyReceivedQty: poItem.previouslyReceivedQty,
          openPoQty: poItem.openPoQty,
          arrivedQty: scannedQty,
          countedQty: scannedQty,
          currentReceivedQty: scannedQty,
          acceptedQty: scannedQty,
          rejectedQty: 0,
          concessionQty: 0,
          remainingPoQty: Math.max(0, poItem.openPoQty - scannedQty),
          lotBatchNumber: lotNumber,
          supplierLotNumber: `SUP-${lotNumber}`,
          mfgDate: new Date().toISOString().slice(0, 10),
          expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
          shelfLifeDays: 365,
          remainingShelfLifeDays: 365,
          locationCode: poItem.warehouse,
          bin: `${poItem.warehouse}-BAY-01`,
          quarantineBin: `${poItem.warehouse}-QUARANTINE-BAY`,
          qualityStatus: 'Pending Inspection',
          coaStatus: 'Verified',
          coaReference: 'COA-MOBILE-MATCH',
          msdsAvailable: true,
          countryOrigin: 'India',
          packingType: '25KG Bags',
          bagCount: Math.ceil(scannedQty / 25),
          grossWeightKg: scannedQty + 12,
          netWeightKg: scannedQty,
          storageCondition: 'Ambient Dry (<25°C)',
          toleranceWarning: 'ok',
          remarks: 'Scanned at dock',
        },
      ],
      auditTrail: [
        {
          id: 'AUD-MOB-1',
          action: 'Created',
          user: 'Mobile Barcode Terminal #04',
          timestamp: new Date().toLocaleString(),
          details: `Direct dock scan receipt logged: ${scannedQty} ${poItem.uom}`,
        },
      ],
    };

    handleSaveGrn(newGrn, false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Ribbon Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              Goods Receipt Note (GRN) Management
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#0F8B8D]/15 text-[#0F8B8D]">
              Inward Gate & Dock Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gate entry logging, PO receiving queue, weighbridge tally, batch lot capture, QC inspection routing, and FEFO putaway
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedPoItemForCreate(undefined);
              setIsLiveCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-xl text-xs font-bold shadow-2xs transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Live Inward GRN Entry
          </button>
          <button
            onClick={() => setIsMobileScanOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-600" />
            Dock Scanner
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs shadow-2xs transition"
            title="GRN Tolerances & QC Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modern High-Contrast Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 overflow-x-auto scrollbar-none text-xs">
        {[
          { id: 'dashboard', label: 'Overview & Dock Metrics', icon: Layers, badge: null },
          { id: 'queue', label: 'Confirmed PO Receiving Queue', icon: Truck, badge: poQueue.length },
          { id: 'allGrns', label: 'GRN Master Registry', icon: FileCheck, badge: extendedGrns.length },
          {
            id: 'qc',
            label: 'Quality Inspection Console',
            icon: FlaskConical,
            badge: extendedGrns.filter((g) => g.status === 'pending_qc').length,
          },
          {
            id: 'putaway',
            label: 'Putaway & Warehouse Bins',
            icon: Layers,
            badge: putawayTasks.filter((t) => t.putawayStatus !== 'Completed').length,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-[#14213D] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/20 text-teal-200' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      {activeTab === 'dashboard' && (
        <GrnDashboardTab
          grns={extendedGrns}
          poQueue={poQueue}
          putawayTasks={putawayTasks}
          onTabChange={(tab: any) => setActiveTab(tab)}
          onOpenCreateModal={(po) => {
            setSelectedPoItemForCreate(po);
            setIsLiveCreateOpen(true);
          }}
          onOpenMobileScan={() => setIsMobileScanOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSelectGrn={(grn) => setSelectedGrnForDetail(grn)}
        />
      )}

      {activeTab === 'queue' && (
        <ConfirmedPoQueueTab
          poQueue={poQueue}
          onOpenCreateModal={(item) => {
            setSelectedPoItemForCreate(item);
            setIsLiveCreateOpen(true);
          }}
          onViewPoDetails={(poNum) => {
            onNavigate('orders', { poNumber: poNum });
          }}
          showToast={showToast}
        />
      )}

      {activeTab === 'allGrns' && (
        <AllGrnsTableTab
          grns={extendedGrns}
          onSelectGrn={(grn) => setSelectedGrnForDetail(grn)}
          onOpenCreateModal={() => {
            setSelectedPoItemForCreate(undefined);
            setIsLiveCreateOpen(true);
          }}
          onPrintGrn={(grn) => setSelectedGrnForPrint(grn)}
          onOpenReturnModal={(grn) => setSelectedGrnForReturn(grn)}
          showToast={showToast}
        />
      )}

      {activeTab === 'qc' && (
        <QualityInspectionConsole
          grns={extendedGrns}
          onUpdateGrn={handleUpdateGrn}
          showToast={showToast}
        />
      )}

      {activeTab === 'putaway' && (
        <PutawayInventoryPostingTab
          tasks={putawayTasks}
          onCompleteTask={handleCompletePutaway}
          showToast={showToast}
        />
      )}

      {/* MODAL 1: Live GRN Entry Modal */}
      {isLiveCreateOpen && (
        <LiveGrnEntryModal
          isOpen={isLiveCreateOpen}
          onClose={() => setIsLiveCreateOpen(false)}
          selectedPoItem={selectedPoItemForCreate}
          pos={pos}
          toleranceSettings={toleranceSettings}
          onSaveGrn={handleSaveGrn}
          showToast={showToast}
        />
      )}

      {/* MODAL 2: 10-Tab GRN Drilldown Detail Modal */}
      {selectedGrnForDetail && (
        <GrnDetailModal
          isOpen={!!selectedGrnForDetail}
          onClose={() => setSelectedGrnForDetail(null)}
          grn={selectedGrnForDetail}
          onPrint={(grn) => setSelectedGrnForPrint(grn)}
          onOpenReturnModal={(grn) => setSelectedGrnForReturn(grn)}
          onOpenReversalModal={(grn) => setSelectedGrnForReversal(grn)}
          showToast={showToast}
        />
      )}

      {/* MODAL 3: Print View Modal */}
      {selectedGrnForPrint && (
        <GrnPrintViewModal
          isOpen={!!selectedGrnForPrint}
          onClose={() => setSelectedGrnForPrint(null)}
          grn={selectedGrnForPrint}
          showToast={showToast}
        />
      )}

      {/* MODAL 4: Exceptions & Supplier Returns Modal */}
      {selectedGrnForReturn && (
        <ExceptionsAndReturnsModal
          isOpen={!!selectedGrnForReturn}
          onClose={() => setSelectedGrnForReturn(null)}
          grn={selectedGrnForReturn}
          onSubmitReturn={handleSubmitReturn}
          showToast={showToast}
        />
      )}

      {/* MODAL 5: GRN Reversal Modal */}
      {selectedGrnForReversal && (
        <GrnReversalModal
          isOpen={!!selectedGrnForReversal}
          onClose={() => setSelectedGrnForReversal(null)}
          grn={selectedGrnForReversal}
          onConfirmReversal={handleConfirmReversal}
          showToast={showToast}
        />
      )}

      {/* MODAL 6: Mobile Barcode Receiving Scanner */}
      {isMobileScanOpen && (
        <MobileBarcodeReceivingModal
          isOpen={isMobileScanOpen}
          onClose={() => setIsMobileScanOpen(false)}
          poQueue={poQueue}
          onCompleteScan={handleCompleteMobileScan}
          showToast={showToast}
        />
      )}

      {/* MODAL 7: GRN Policies & Settings */}
      {isSettingsOpen && (
        <GrnSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={toleranceSettings}
          onSaveSettings={(newSet) => setToleranceSettings(newSet)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
