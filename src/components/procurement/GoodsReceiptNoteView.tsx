import React, { useState, useEffect } from 'react';
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
import { postPutawayTasksToWarehouse } from '../../utils/warehouseSync';

import { ItemMaster } from '../../types';

interface Props {
  grns: GoodsReceiptNote[];
  pos: ExtendedPurchaseOrder[];
  items?: ItemMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateGRN: (grn: GoodsReceiptNote) => void;
  onUpdatePO?: (po: ExtendedPurchaseOrder) => void;
  onUpdateItem?: (item: ItemMaster) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const GoodsReceiptNoteView: React.FC<Props> = ({
  grns: propGrns,
  pos,
  items = [],
  onNavigate,
  onUpdateGRN,
  onUpdatePO,
  onUpdateItem,
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

  // Synchronize PO Queue from POs state dynamically
  useEffect(() => {
    pos.forEach((po) => {
      if (po.status === 'sent_to_supplier' || po.status === 'approved' || po.status === 'partially_received') {
        po.lines.forEach((l, idx) => {
          const remaining = (l.orderedQty || 0) - (l.receivedQty || 0);
          if (remaining > 0) {
            setPoQueue((prev) => {
              const exists = prev.some((q) => q.poNumber === po.poNumber && q.poLineNo === (l.lineNo || idx + 1));
              if (exists) return prev;
              const newQueueItem: ConfirmedPoQueueItem = {
                id: `PO-QUEUE-${po.poNumber}-${idx + 1}`,
                poNumber: po.poNumber,
                poLineNo: l.lineNo || idx + 1,
                poDate: po.poDate,
                supplierId: po.supplierId,
                supplierCode: po.supplierCode || po.supplierId,
                supplierName: po.supplierName,
                supplierGstin: '24AAACG1234F1Z8',
                expectedDate: po.expectedDeliveryDate,
                arrivalDateTime: `${po.expectedDeliveryDate} 08:45 AM`,
                plant: 'Plant 1 (Vapi Polymer Works)',
                warehouse: l.warehouse || po.plantWarehouse || 'RM-WH-01',
                receivingDock: 'Dock 2 (Heavy Resin Ramp)',
                itemCode: l.itemCode,
                itemName: l.itemName,
                itemCategory: l.description || 'Raw Material Resin',
                materialType: 'RM',
                uom: l.uom,
                orderedQty: l.orderedQty,
                previouslyReceivedQty: l.receivedQty || 0,
                openPoQty: remaining,
                unitPrice: l.unitPrice,
                poStatus: po.status === 'partially_received' ? 'Partially Received' : 'Confirmed',
                qualityRequired: true,
                asnReceived: true,
                vehicleArrived: true,
                transporterName: (po as any).deliveryTracking?.transporterName || 'Vapi Express Highway Logistics',
                vehicleNumber: 'GJ-15-XY-9081',
                driverName: 'Suresh Parmar',
                deliveryChallanNo: `DC-${po.poNumber}-01`,
                toleranceOverPct: 5.0,
                toleranceUnderPct: 10.0,
                qcMode: 'QC_BEFORE_GRN',
                inspectionPlan: 'Standard Polyolefin Injection & Blow QC Assay',
              };
              return [newQueueItem, ...prev];
            });
          }
        });
      }
    });
  }, [pos]);

  // Modals
  const [isLiveCreateOpen, setIsLiveCreateOpen] = useState(false);
  const [selectedPoItemForCreate, setSelectedPoItemForCreate] = useState<ConfirmedPoQueueItem | undefined>(undefined);

  const [selectedGrnForDetail, setSelectedGrnForDetail] = useState<GoodsReceiptNoteExt | null>(null);
  const [selectedGrnForPrint, setSelectedGrnForPrint] = useState<GoodsReceiptNoteExt | null>(null);
  const [selectedGrnForReturn, setSelectedGrnForReturn] = useState<GoodsReceiptNoteExt | null>(null);
  const [selectedGrnForReversal, setSelectedGrnForReversal] = useState<GoodsReceiptNoteExt | null>(null);

  const [isMobileScanOpen, setIsMobileScanOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Helper to post received/accepted lots to inventory items
  const postLotsToInventory = (grn: GoodsReceiptNoteExt) => {
    if (!onUpdateItem || items.length === 0) return;

    grn.lines.forEach((line) => {
      const targetItem = items.find((i) => i.code === line.itemCode);
      if (!targetItem) return;

      const acceptedVolume = line.acceptedQty > 0 ? line.acceptedQty : line.currentReceivedQty;
      if (acceptedVolume <= 0) return;

      const newLotsToPost: any[] = [];

      if (line.lots && line.lots.length > 0) {
        // Multi-Lot Allocation Posting
        line.lots.forEach((lot) => {
          newLotsToPost.push({
            lotId: lot.lotBatchNumber,
            qty: lot.quantity,
            uom: lot.uom || line.uom,
            mfgDate: lot.mfgDate || line.mfgDate,
            expiryDate: lot.expiryDate || line.expiryDate,
            status: 'available',
            bin: lot.bin || line.bin,
            supplierRef: grn.poNumber,
            qcRequired: false,
          });
        });
      } else {
        // Single Lot Posting
        newLotsToPost.push({
          lotId: line.lotBatchNumber,
          qty: acceptedVolume,
          uom: line.uom,
          mfgDate: line.mfgDate,
          expiryDate: line.expiryDate,
          status: 'available',
          bin: line.bin,
          supplierRef: grn.poNumber,
          qcRequired: false,
        });
      }

      const existingLots = targetItem.lots || [];
      const updatedLots = [...newLotsToPost, ...existingLots];
      
      const parseNumeric = (val?: string | number) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
      };

      const curStockNum = parseNumeric(targetItem.stock || (targetItem as any).currentStock);
      const curAvailNum = parseNumeric(targetItem.avail || (targetItem as any).availableStock);
      const newStockNum = curStockNum + acceptedVolume;
      const newAvailNum = curAvailNum + acceptedVolume;

      const updatedItem: ItemMaster = {
        ...targetItem,
        stock: `${newStockNum.toLocaleString()} ${line.uom || 'KG'}`,
        avail: `${newAvailNum.toLocaleString()} ${line.uom || 'KG'}`,
        lots: updatedLots,
      };

      onUpdateItem(updatedItem);
      showToast(`✓ Posted ${newLotsToPost.length} lot(s) (${acceptedVolume} ${line.uom}) to Inventory for ${targetItem.name}`);
    });
  };

  // Save new GRN
  const handleSaveGrn = (newGrn: GoodsReceiptNoteExt, isDraft: boolean) => {
    setExtendedGrns((prev) => [newGrn, ...prev]);

    // Update PO Received Quantities and Status
    const targetPo = pos.find((p) => p.poNumber === newGrn.poNumber || p.id === newGrn.poNumber);
    if (targetPo && onUpdatePO) {
      let totalReceivedNow = targetPo.receivedAmount || 0;
      const updatedPoLines = targetPo.lines.map((pLine) => {
        const matchingGrnLine = newGrn.lines.find(
          (gl) => gl.poLineNo === pLine.lineNo || gl.itemCode === pLine.itemCode
        );
        if (matchingGrnLine) {
          const newRcvd = (pLine.receivedQty || 0) + matchingGrnLine.currentReceivedQty;
          const newRem = Math.max(0, pLine.orderedQty - newRcvd);
          totalReceivedNow += matchingGrnLine.currentReceivedQty * pLine.unitPrice;
          return {
            ...pLine,
            receivedQty: newRcvd,
            remainingQty: newRem,
            status: (newRem === 0 ? 'received' : 'partially_received') as any,
          };
        }
        return pLine;
      });

      const allPoReceived = updatedPoLines.every((l) => l.remainingQty === 0);
      const updatedPo: ExtendedPurchaseOrder = {
        ...targetPo,
        lines: updatedPoLines,
        receivedAmount: totalReceivedNow,
        status: allPoReceived ? 'received' : 'partially_received',
        grnList: [...(targetPo.grnList || []), newGrn.grnNumber],
        activityHistory: [
          ...(targetPo.activityHistory || []),
          {
            date: newGrn.receiptDate,
            event: `Inward GRN ${newGrn.grnNumber} recorded (${newGrn.lines.reduce((s, l) => s + l.currentReceivedQty, 0)} KG)`,
            by: newGrn.receivedBy,
          },
        ],
      };

      onUpdatePO(updatedPo);
    }

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
              poStatus: (newOpen === 0 ? 'Confirmed' : 'Partially Received') as 'Approved' | 'Confirmed' | 'Partially Received' | 'On Hold',
            };
          }
          return p;
        })
        .filter((p) => p.openPoQty > 0)
    );

    // If NO_QC or Approved immediately, post to inventory
    if (!isDraft && (newGrn.inspectionMode === 'NO_QC' || newGrn.inspectionStatus === 'Approved')) {
      postLotsToInventory(newGrn);
    }

    // If not draft and QC not required or after GRN, generate putaway task
    if (!isDraft) {
      const firstLine = newGrn.lines[0];
      if (firstLine) {
        const newTask: GrnPutawayTask = {
          id: `PTW-${Math.floor(1000 + Math.random() * 9000)}`,
          grnNumber: newGrn.grnNumber,
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

  // Update existing GRN and trigger inventory posting if QC passed
  const handleUpdateGrn = (updated: GoodsReceiptNoteExt) => {
    setExtendedGrns((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    if (selectedGrnForDetail?.id === updated.id) {
      setSelectedGrnForDetail(updated);
    }

    if (
      updated.inspectionStatus === 'Approved' ||
      updated.status === 'accepted' ||
      updated.inventoryPostingStatus === 'Posted to Available Stock'
    ) {
      postLotsToInventory(updated);
    }
  };

  // Complete Putaway Task & Post to Warehouse Stock & Lot Ledger
  const handleCompletePutaway = (taskId: string, actualLocation: string, binCode: string) => {
    const targetTask = putawayTasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const completedTask: GrnPutawayTask = {
      ...targetTask,
      putawayStatus: 'Completed',
      actualLocation,
      binCode,
      putawayBy: 'Dharmesh Solanki (Forklift Bay #2)',
      completedAt: new Date().toISOString(),
    };

    setPutawayTasks((prev) =>
      prev.map((t) => (t.id === taskId ? completedTask : t))
    );

    // Synchronize into Warehouse Stock Overview & Lot Ledger
    postPutawayTasksToWarehouse([completedTask], { [taskId]: actualLocation });
  };

  // Bulk Complete Putaway Tasks & Post to Warehouse Stock & Lot Ledger
  const handleBulkSendToWarehouse = (selectedTasks: GrnPutawayTask[], customBins?: Record<string, string>) => {
    const updatedTaskMap = new Map<string, GrnPutawayTask>();
    const nowIsoStr = new Date().toISOString();

    selectedTasks.forEach((t) => {
      const targetBin = customBins?.[t.id] || t.recommendedLocation;
      updatedTaskMap.set(t.id, {
        ...t,
        putawayStatus: 'Completed',
        actualLocation: targetBin,
        binCode: targetBin.split('-').pop() || 'BIN-01',
        putawayBy: 'Dharmesh Solanki (Forklift Bay #2)',
        completedAt: nowIsoStr,
      });
    });

    setPutawayTasks((prev) =>
      prev.map((t) => (updatedTaskMap.has(t.id) ? updatedTaskMap.get(t.id)! : t))
    );

    // Synchronize all selected tasks into Warehouse Stock Overview & Lot Ledger
    const completedTasksList = Array.from(updatedTaskMap.values());
    postPutawayTasksToWarehouse(completedTasksList, customBins);
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
          grnNumber: target.grnNumber,
          poLineNo: 1,
          itemCode: updatedLines[0]?.itemCode || '',
          itemName: updatedLines[0]?.itemName || '',
          lotBatchNumber: updatedLines[0]?.lotBatchNumber || '',
          exceptionType: 'Damaged Material',
          quantityAffected: qty,
          uom: uom,
          reason,
          supplierNotificationRequired: true,
          returnRequired: true,
          ncrRequired: true,
          debitNoteRequired: true,
          disposition: 'Return to supplier',
          status: 'Open',
          createdAt: new Date().toISOString(),
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
      status: 'reversed',
      inventoryPostingStatus: 'Not Posted',
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
            onNavigate('poDetail', { id: poNum, poNumber: poNum });
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
          onBulkSendToWarehouse={handleBulkSendToWarehouse}
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
