import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  QrCode,
  FileText,
  Layers,
  Sparkles,
  Printer,
  Clock,
  Split,
  Camera,
  Scale,
} from 'lucide-react';
import {
  GoodsReceiptNoteExt,
  GrnLineItemExt,
  ConfirmedPoQueueItem,
  GrnInspectionMode,
  GrnToleranceSettings,
} from '../../../types/grnTypes';
import { LotBatchCaptureModal } from './LotBatchCaptureModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedPoItem?: ConfirmedPoQueueItem;
  pos: any[];
  toleranceSettings: GrnToleranceSettings;
  onSaveGrn: (newGrn: GoodsReceiptNoteExt, isDraft: boolean) => void;
  showToast: (msg: string) => void;
}

export const LiveGrnEntryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedPoItem,
  pos,
  toleranceSettings,
  onSaveGrn,
  showToast,
}) => {
  if (!isOpen) return null;

  // Header State
  const [grnNumber, setGrnNumber] = useState(
    `${toleranceSettings.numberingPrefix}-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [grnDate, setGrnDate] = useState(new Date().toISOString().slice(0, 10));
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().slice(0, 10));
  const [arrivalTime, setArrivalTime] = useState('09:15 AM');

  // Selected PO
  const [poNumber, setPoNumber] = useState(selectedPoItem?.poNumber || pos[0]?.poNumber || 'PO-3391');
  const activePo = pos.find((p) => p.poNumber === poNumber) || pos[0];

  const [supplierCode, setSupplierCode] = useState(selectedPoItem?.supplierCode || activePo?.supplierCode || 'SUP-003');
  const [supplierName, setSupplierName] = useState(selectedPoItem?.supplierName || activePo?.supplierName || 'GAIL (India) Limited');
  const [supplierGstin, setSupplierGstin] = useState(selectedPoItem?.supplierGstin || '24AAACG1234F1Z8');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('INV-2026-' + Math.floor(1000 + Math.random() * 9000));
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryChallanNo, setDeliveryChallanNo] = useState(selectedPoItem?.deliveryChallanNo || 'DC-2026-9912');

  const [vehicleNumber, setVehicleNumber] = useState(selectedPoItem?.vehicleNumber || 'GJ-15-XY-9081');
  const [gateEntryNumber, setGateEntryNumber] = useState('GE-2026-' + Math.floor(1000 + Math.random() * 9000));
  const [transporterName, setTransporterName] = useState(selectedPoItem?.transporterName || 'Vapi Express Highway Logistics');
  const [driverName, setDriverName] = useState(selectedPoItem?.driverName || 'Suresh Parmar');

  const [receivingPlant, setReceivingPlant] = useState(selectedPoItem?.plant || 'Plant 1 (Vapi Polymer Works)');
  const [warehouse, setWarehouse] = useState(selectedPoItem?.warehouse || 'RM-WH-01');
  const [receivingDock, setReceivingDock] = useState(selectedPoItem?.receivingDock || 'Dock 2 (Heavy Resin Ramp)');
  const [receivedBy, setReceivedBy] = useState('Ramesh Patel (Store Supervisor)');
  const [inspectionMode, setInspectionMode] = useState<GrnInspectionMode>(
    selectedPoItem?.qcMode || toleranceSettings.defaultQcMode
  );
  const [remarks, setRemarks] = useState('Physical unloaded count and bag tally verified at receiving dock.');

  // Lines State
  const [lines, setLines] = useState<GrnLineItemExt[]>(() => {
    if (selectedPoItem) {
      const openQty = selectedPoItem.openPoQty;
      return [
        {
          lineNo: 1,
          poLineNo: selectedPoItem.poLineNo,
          itemCode: selectedPoItem.itemCode,
          itemName: selectedPoItem.itemName,
          description: selectedPoItem.itemCategory,
          uom: selectedPoItem.uom,
          orderedQty: selectedPoItem.orderedQty,
          previouslyReceivedQty: selectedPoItem.previouslyReceivedQty,
          openPoQty: openQty,
          arrivedQty: openQty,
          countedQty: openQty,
          currentReceivedQty: openQty,
          acceptedQty: inspectionMode === 'QC_BEFORE_GRN' ? 0 : openQty,
          rejectedQty: 0,
          concessionQty: 0,
          remainingPoQty: 0,
          lotBatchNumber: `LOT-${selectedPoItem.itemCode.slice(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`,
          supplierLotNumber: `SUP-LOT-${Math.floor(1000 + Math.random() * 9000)}`,
          mfgDate: new Date().toISOString().slice(0, 10),
          expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
          shelfLifeDays: 365,
          remainingShelfLifeDays: 365,
          locationCode: selectedPoItem.warehouse,
          bin: `${selectedPoItem.warehouse}-BAY-01`,
          quarantineBin: `${selectedPoItem.warehouse}-QUARANTINE-BAY`,
          qualityStatus: selectedPoItem.qualityRequired ? 'Pending Inspection' : 'Passed QC',
          coaStatus: 'Verified',
          coaReference: 'COA-MATCHED-DOCK',
          msdsAvailable: true,
          countryOrigin: 'India',
          packingType: '25KG Bags',
          bagCount: Math.ceil(openQty / 25),
          grossWeightKg: openQty + 15,
          netWeightKg: openQty,
          storageCondition: 'Ambient Dry (<25°C)',
          toleranceWarning: 'ok',
          remarks: 'Received in sound condition.',
          qcParameters: [
            { testName: 'Melt Flow Index (MFI)', standard: 'Standard spec', actual: 'Pending testing', passed: false },
            { testName: 'Moisture Content %', standard: '< 0.05%', actual: 'Pending testing', passed: false },
          ],
        },
      ];
    }

    // Default from active PO
    return (activePo?.lines || []).map((l: any, idx: number) => {
      const openQty = (l.orderedQty || 1000) - (l.receivedQty || 0);
      return {
        lineNo: idx + 1,
        poLineNo: l.lineNo || idx + 1,
        itemCode: l.itemCode || 'RM-PP-NAT-001',
        itemName: l.itemName || 'PP Natural Granules',
        description: l.description || 'Polymer resin',
        uom: l.uom || 'KG',
        orderedQty: l.orderedQty || 1000,
        previouslyReceivedQty: l.receivedQty || 0,
        openPoQty: openQty,
        arrivedQty: openQty,
        countedQty: openQty,
        currentReceivedQty: openQty,
        acceptedQty: inspectionMode === 'QC_BEFORE_GRN' ? 0 : openQty,
        rejectedQty: 0,
        concessionQty: 0,
        remainingPoQty: 0,
        lotBatchNumber: `LOT-PL01-${Math.floor(10000 + Math.random() * 90000)}`,
        supplierLotNumber: `SUP-B-${Math.floor(100 + Math.random() * 900)}`,
        mfgDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        shelfLifeDays: 365,
        remainingShelfLifeDays: 365,
        locationCode: l.warehouse || 'RM-WH-01',
        bin: l.binLocation || 'RM-WH-01-A1',
        quarantineBin: 'RM-WH-01-QUARANTINE-BAY',
        qualityStatus: 'Pending Inspection',
        coaStatus: 'Verified',
        coaReference: 'COA-DOCK-OK',
        msdsAvailable: true,
        countryOrigin: 'India',
        packingType: '25KG Bags',
        bagCount: Math.ceil(openQty / 25),
        grossWeightKg: openQty + 15,
        netWeightKg: openQty,
        storageCondition: 'Ambient Dry (<25°C)',
        toleranceWarning: 'ok',
        remarks: '',
      };
    });
  });

  // Active Line for Lot Capture Modal
  const [activeLotModalLineIndex, setActiveLotModalLineIndex] = useState<number | null>(null);

  // Live calculation of remaining and tolerance check
  const handleCurrentReceivedQtyChange = (idx: number, newQty: number) => {
    setLines((prev) => {
      const next = [...prev];
      const target = { ...next[idx] };
      target.currentReceivedQty = newQty;
      target.remainingPoQty = Math.max(0, target.openPoQty - newQty);

      if (inspectionMode !== 'QC_BEFORE_GRN') {
        target.acceptedQty = Math.max(0, newQty - target.rejectedQty);
      }

      target.netWeightKg = newQty;
      target.bagCount = Math.ceil(newQty / (target.packingType === '25KG Bags' ? 25 : 50));

      // Tolerance logic
      const overPercentage = ((newQty - target.openPoQty) / target.openPoQty) * 100;
      if (newQty <= target.openPoQty) {
        target.toleranceWarning = newQty < target.openPoQty ? 'short_supply' : 'ok';
      } else if (overPercentage <= toleranceSettings.allowedOverReceiptPct) {
        target.toleranceWarning = 'over_tolerance_warning';
      } else {
        target.toleranceWarning = 'over_tolerance_error';
      }

      next[idx] = target;
      return next;
    });
  };

  const handleRejectedQtyChange = (idx: number, rejQty: number) => {
    setLines((prev) => {
      const next = [...prev];
      const target = { ...next[idx] };
      target.rejectedQty = rejQty;
      if (inspectionMode !== 'QC_BEFORE_GRN') {
        target.acceptedQty = Math.max(0, target.currentReceivedQty - rejQty);
      }
      next[idx] = target;
      return next;
    });
  };

  // Add split lot line
  const handleSplitLine = (idx: number) => {
    const parent = lines[idx];
    const splitQty = Math.floor(parent.currentReceivedQty / 2);
    if (splitQty <= 0) {
      showToast('Quantity too small to split.');
      return;
    }

    // Update parent
    const updatedParent: GrnLineItemExt = {
      ...parent,
      currentReceivedQty: parent.currentReceivedQty - splitQty,
      acceptedQty: inspectionMode === 'QC_BEFORE_GRN' ? 0 : parent.currentReceivedQty - splitQty,
      netWeightKg: parent.currentReceivedQty - splitQty,
    };

    // Create child split
    const childSplit: GrnLineItemExt = {
      ...parent,
      lineNo: lines.length + 1,
      currentReceivedQty: splitQty,
      arrivedQty: splitQty,
      countedQty: splitQty,
      acceptedQty: inspectionMode === 'QC_BEFORE_GRN' ? 0 : splitQty,
      rejectedQty: 0,
      netWeightKg: splitQty,
      lotBatchNumber: `${parent.lotBatchNumber}-SPLIT`,
      supplierLotNumber: `${parent.supplierLotNumber}-B2`,
      remarks: 'Split batch line for secondary pallet location',
    };

    const next = [...lines];
    next[idx] = updatedParent;
    next.splice(idx + 1, 0, childSplit);
    setLines(next);
    showToast(`Split Line #${parent.poLineNo} into two lots.`);
  };

  // Running Totals
  const totalOrdered = lines.reduce((s, l) => s + l.orderedQty, 0);
  const totalPrev = lines.reduce((s, l) => s + l.previouslyReceivedQty, 0);
  const totalCurrent = lines.reduce((s, l) => s + l.currentReceivedQty, 0);
  const totalAccepted = lines.reduce((s, l) => s + l.acceptedQty, 0);
  const totalRejected = lines.reduce((s, l) => s + l.rejectedQty, 0);
  const totalRemaining = lines.reduce((s, l) => s + l.remainingPoQty, 0);

  const hasToleranceError = lines.some((l) => l.toleranceWarning === 'over_tolerance_error');
  const hasToleranceWarning = lines.some((l) => l.toleranceWarning === 'over_tolerance_warning');

  // Handle Save
  const handlePerformSave = (isDraft: boolean, andPutaway: boolean = false) => {
    if (hasToleranceError && !isDraft) {
      showToast('Error: Over-receipt exceeds allowed tolerance (+5%). Supervisor approval required before posting.');
      return;
    }

    const postingStatus = isDraft
      ? 'Not Posted'
      : inspectionMode === 'QC_BEFORE_GRN'
      ? 'Posted to Quarantine'
      : 'Posted to Available Stock';

    const status = isDraft
      ? 'draft'
      : inspectionMode === 'QC_BEFORE_GRN'
      ? 'pending_qc'
      : andPutaway
      ? 'putaway_pending'
      : 'posted';

    const newGrn: GoodsReceiptNoteExt = {
      id: grnNumber,
      grnNumber,
      poNumber,
      supplierId: selectedPoItem?.supplierId || activePo?.supplierId || 'SUP-003',
      supplierName,
      supplierGstin,
      supplierInvoiceNo,
      supplierInvoiceDate,
      deliveryChallanNo,
      receiptDate: grnDate,
      arrivalDate,
      arrivalTime,
      gateEntryNumber,
      vehicleNumber,
      transporterName,
      driverName,
      receivingPlant,
      warehouse,
      receivingDock,
      receivedBy,
      packingSlipRef: `PS-${deliveryChallanNo}`,
      status,
      inspectionStatus: inspectionMode === 'NO_QC' ? 'Approved' : 'Pending',
      inspectionMode,
      inventoryPostingStatus: postingStatus,
      notes: remarks,
      lines,
      qrCodePayload: `GRN:${grnNumber}|PO:${poNumber}|SUP:${supplierName}|TOTAL:${totalCurrent}KG`,
      overReceiptApproved: hasToleranceWarning,
      putawayStatus: andPutaway ? 'In Progress' : 'Pending',
      exceptions: [],
      auditTrail: [
        {
          id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
          action: isDraft ? 'Created' : 'Posted',
          user: receivedBy,
          timestamp: `${grnDate} ${arrivalTime}`,
          details: `${isDraft ? 'Draft GRN recorded' : 'GRN posted'} with ${lines.length} lines. Qty: ${totalCurrent.toLocaleString()} KG`,
        },
      ],
    };

    onSaveGrn(newGrn, isDraft);
    showToast(
      isDraft
        ? `Draft GRN ${grnNumber} saved successfully.`
        : `GRN ${grnNumber} posted against ${poNumber}! ${
            inspectionMode === 'QC_BEFORE_GRN' ? 'Sample dispatched to QC Quarantine.' : 'Stock added to inventory.'
          }`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0F8B8D]/30 border border-[#0F8B8D]/50 text-teal-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-['Space_Grotesk'] text-white">
                  Live Goods Receipt Note (GRN) Inward Entry
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-teal-900/80 text-teal-300 border border-teal-700">
                  {grnNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Record physical material arrival, weighbridge count, batch lots, and quality inspection routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-mono">
              <QrCode className="w-3.5 h-3.5 text-teal-300" />
              <span>QR Traceability Active</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs bg-slate-50/50">
          {/* Section 1: GRN Header Fields */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0F8B8D]" /> Dock Gate Entry & Consignment Details
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-500">QC Routing Mode:</span>
                <select
                  value={inspectionMode}
                  onChange={(e) => setInspectionMode(e.target.value as GrnInspectionMode)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold bg-white text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D]"
                >
                  <option value="QC_BEFORE_GRN">QC Before GRN (Sample & Hold)</option>
                  <option value="QC_AFTER_GRN">QC After GRN (Post to Quarantine)</option>
                  <option value="NO_QC">Direct Receipt (Skip QC / Certified)</option>
                </select>
              </div>
            </div>

            {/* Row 1: GRN #, PO #, Supplier Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">GRN Number *</label>
                <input
                  type="text"
                  value={grnNumber}
                  onChange={(e) => setGrnNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Confirmed PO Number *</label>
                <input
                  type="text"
                  value={poNumber}
                  readOnly
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-blue-700 bg-slate-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Supplier Name *</label>
                <input
                  type="text"
                  value={supplierName}
                  readOnly
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-100 cursor-not-allowed font-medium truncate"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Supplier GSTIN / Code</label>
                <input
                  type="text"
                  value={supplierGstin}
                  onChange={(e) => setSupplierGstin(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-700"
                />
              </div>
            </div>

            {/* Row 2: Challan, Invoice, Vehicle, Gate Pass */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Delivery Challan # *</label>
                <input
                  type="text"
                  value={deliveryChallanNo}
                  onChange={(e) => setDeliveryChallanNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Supplier Invoice #</label>
                <input
                  type="text"
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Truck / Vehicle # *</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Gate Entry #</label>
                <input
                  type="text"
                  value={gateEntryNumber}
                  onChange={(e) => setGateEntryNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-700"
                />
              </div>
            </div>

            {/* Row 3: Transporter, Driver, Plant, Dock, Warehouse */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Transporter / Fleet</label>
                <input
                  type="text"
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Driver Name / Phone</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Receiving Warehouse & Dock</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-700"
                  />
                  <input
                    type="text"
                    value={receivingDock}
                    onChange={(e) => setReceivingDock(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 truncate"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Received By</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Section 2: PO Line Receiving Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs">Line Items Receiving Grid</span>
                <span className="text-[11px] text-slate-500">
                  (Tolerance: +{toleranceSettings.allowedOverReceiptPct}% over-receipt allowed)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Editable fields: <strong>Arrived Qty</strong>, <strong>Counted Qty</strong>, <strong>Current Received Qty</strong>, <strong>Rejected Qty</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Line #</th>
                    <th className="py-2.5 px-3 font-semibold">Item Details</th>
                    <th className="py-2.5 px-2 font-semibold text-center">UOM</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Ordered</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Open PO</th>
                    <th className="py-2.5 px-2 font-semibold text-center bg-teal-50/50">Arrived Qty</th>
                    <th className="py-2.5 px-2 font-semibold text-center bg-teal-50/50">Counted Qty</th>
                    <th className="py-2.5 px-2 font-semibold text-center bg-teal-100/50 font-bold text-teal-900">
                      Receiving Qty *
                    </th>
                    <th className="py-2.5 px-2 font-semibold text-right">Rejected</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Remaining PO</th>
                    <th className="py-2.5 px-2 font-semibold text-center">Tolerance</th>
                    <th className="py-2.5 px-3 font-semibold">Lot & Warehouse Bin</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      {/* Line # */}
                      <td className="py-3 px-3 font-mono font-semibold text-slate-500">
                        #{line.poLineNo}
                      </td>

                      {/* Item Details */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-bold text-slate-900 truncate" title={line.itemName}>
                          {line.itemName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">{line.itemCode}</div>
                        <div className="text-[10px] text-slate-400 truncate">{line.description}</div>
                      </td>

                      {/* UOM */}
                      <td className="py-3 px-2 text-center font-bold text-slate-700">{line.uom}</td>

                      {/* Ordered Qty */}
                      <td className="py-3 px-2 text-right text-slate-600">
                        {line.orderedQty.toLocaleString()}
                      </td>

                      {/* Open PO Qty */}
                      <td className="py-3 px-2 text-right font-medium text-blue-700">
                        {line.openPoQty.toLocaleString()}
                      </td>

                      {/* Arrived Qty (editable) */}
                      <td className="py-3 px-2 text-center bg-teal-50/30">
                        <input
                          type="number"
                          value={line.arrivedQty}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLines((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], arrivedQty: val };
                              return next;
                            });
                          }}
                          className="w-20 px-1.5 py-1 border border-slate-300 rounded text-center text-xs font-semibold bg-white"
                        />
                      </td>

                      {/* Counted Qty (editable) */}
                      <td className="py-3 px-2 text-center bg-teal-50/30">
                        <input
                          type="number"
                          value={line.countedQty}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLines((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], countedQty: val };
                              return next;
                            });
                          }}
                          className="w-20 px-1.5 py-1 border border-slate-300 rounded text-center text-xs font-semibold bg-white"
                        />
                      </td>

                      {/* Current Received Qty (main live input) */}
                      <td className="py-3 px-2 text-center bg-teal-100/30">
                        <input
                          type="number"
                          value={line.currentReceivedQty}
                          onChange={(e) => handleCurrentReceivedQtyChange(idx, Number(e.target.value))}
                          className="w-24 px-2 py-1 border border-teal-500 rounded text-center text-xs font-bold text-[#14213D] bg-white shadow-2xs focus:ring-2 focus:ring-[#0F8B8D]"
                        />
                      </td>

                      {/* Rejected Qty (editable) */}
                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          value={line.rejectedQty}
                          onChange={(e) => handleRejectedQtyChange(idx, Number(e.target.value))}
                          className="w-16 px-1.5 py-1 border border-slate-300 rounded text-right text-xs font-semibold text-rose-600 bg-white"
                        />
                      </td>

                      {/* Remaining PO Qty */}
                      <td className="py-3 px-2 text-right font-bold text-slate-700">
                        {line.remainingPoQty.toLocaleString()}
                      </td>

                      {/* Tolerance Indicator */}
                      <td className="py-3 px-2 text-center">
                        {line.toleranceWarning === 'ok' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Exact
                          </span>
                        ) : line.toleranceWarning === 'short_supply' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Partial
                          </span>
                        ) : line.toleranceWarning === 'over_tolerance_warning' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300"
                            title="Over-receipt within allowable 5% tolerance"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> +Over Tol
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-300"
                            title="Exceeds allowable tolerance! Requires approval"
                          >
                            <ShieldAlert className="w-3 h-3 text-rose-600" /> Exceeds
                          </span>
                        )}
                      </td>

                      {/* Lot & Bin Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveLotModalLineIndex(idx)}
                            className="font-mono font-bold text-blue-700 hover:underline flex items-center gap-1"
                          >
                            {line.lotBatchNumber}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Bin: {line.bin}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveLotModalLineIndex(idx)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700 transition"
                            title="Open Lot / Batch Details"
                          >
                            Lot Data
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSplitLine(idx)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition"
                            title="Split line for multiple lots"
                          >
                            <Split className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Running Totals Bar */}
            <div className="bg-slate-100/80 p-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
              <div className="flex items-center gap-4 text-slate-600">
                <span>Total Ordered: <strong className="text-slate-900">{totalOrdered.toLocaleString()}</strong></span>
                <span>•</span>
                <span>Previously Recv: <strong className="text-slate-900">{totalPrev.toLocaleString()}</strong></span>
                <span>•</span>
                <span>Current Receiving: <strong className="text-[#0F8B8D] text-sm">{totalCurrent.toLocaleString()}</strong></span>
                <span>•</span>
                <span>Total Remaining PO: <strong className="text-blue-800">{totalRemaining.toLocaleString()}</strong></span>
              </div>

              {hasToleranceWarning && (
                <div className="text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Over-receipt detected within 5% tolerance. Permitted for posting.
                </div>
              )}

              {hasToleranceError && (
                <div className="text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-[11px] flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Over-receipt exceeds 5% threshold! Save as Draft or obtain supervisor sign-off.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Remarks & Confirmation Notice */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <label className="font-bold text-slate-700 block">General Gate Remarks & Inspection Notes</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Unloaded 480 bags at Dock 2. Pallets undamaged. Weighbridge slip attached."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            {inspectionMode === 'QC_BEFORE_GRN' ? (
              <span className="text-amber-800 font-medium">
                QC Before GRN active: Stock will be placed in Quarantine Staging until QC clears inspection.
              </span>
            ) : inspectionMode === 'QC_AFTER_GRN' ? (
              <span className="text-blue-800 font-medium">
                QC After GRN active: GRN posted immediately to Quarantine; QC inspection task auto-created.
              </span>
            ) : (
              <span className="text-emerald-800 font-medium">
                Direct Receipt active: Stock will be posted directly to active warehouse bin.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handlePerformSave(true)}
              className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 rounded-lg text-slate-700 text-xs font-semibold transition"
            >
              Save Draft
            </button>
            {inspectionMode === 'QC_BEFORE_GRN' ? (
              <button
                onClick={() => handlePerformSave(false)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Send to QC & Quarantine
              </button>
            ) : (
              <button
                onClick={() => handlePerformSave(false, true)}
                className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Post GRN & Create Putaway
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Lot/Batch Capture Modal */}
      {activeLotModalLineIndex !== null && (
        <LotBatchCaptureModal
          isOpen={true}
          onClose={() => setActiveLotModalLineIndex(null)}
          line={lines[activeLotModalLineIndex]}
          onSaveLot={(updated) => {
            setLines((prev) => {
              const next = [...prev];
              next[activeLotModalLineIndex] = updated;
              return next;
            });
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
