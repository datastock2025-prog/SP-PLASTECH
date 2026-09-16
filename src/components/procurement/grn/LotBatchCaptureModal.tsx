import React, { useState } from 'react';
import {
  X,
  QrCode,
  Calendar,
  Layers,
  Scale,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { GrnLineItemExt } from '../../../types/grnTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  line: GrnLineItemExt;
  onSaveLot: (updatedLine: GrnLineItemExt) => void;
  showToast: (msg: string) => void;
}

export const LotBatchCaptureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  line,
  onSaveLot,
  showToast,
}) => {
  const [internalLot, setInternalLot] = useState(
    line.lotBatchNumber || `LOT-PL01-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [supplierLot, setSupplierLot] = useState(line.supplierLotNumber || 'SUP-LOT-2026-01');
  const [mfgDate, setMfgDate] = useState(line.mfgDate || new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(
    line.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
  );
  const [packingType, setPackingType] = useState<GrnLineItemExt['packingType']>(line.packingType || '25KG Bags');
  const [bagCount, setBagCount] = useState<number>(line.bagCount || Math.ceil((line.currentReceivedQty || 1000) / 25));
  const [grossWeight, setGrossWeight] = useState<number>(line.grossWeightKg || (line.currentReceivedQty || 1000) + 15);
  const [netWeight, setNetWeight] = useState<number>(line.netWeightKg || line.currentReceivedQty || 1000);
  const [storageCondition, setStorageCondition] = useState<GrnLineItemExt['storageCondition']>(
    line.storageCondition || 'Ambient Dry (<25°C)'
  );
  const [coaStatus, setCoaStatus] = useState<GrnLineItemExt['coaStatus']>(line.coaStatus || 'Verified');
  const [coaReference, setCoaReference] = useState(line.coaReference || 'COA-CERT-MATCHED');
  const [msdsAvailable, setMsdsAvailable] = useState(line.msdsAvailable ?? true);
  const [countryOrigin, setCountryOrigin] = useState(line.countryOrigin || 'India (Hazira Plant)');

  if (!isOpen) return null;

  // Calculate shelf life days
  const mfg = new Date(mfgDate);
  const exp = new Date(expiryDate);
  const shelfLifeDays = Math.max(0, Math.round((exp.getTime() - mfg.getTime()) / (1000 * 3600 * 24)));
  const remainingDays = Math.max(0, Math.round((exp.getTime() - Date.now()) / (1000 * 3600 * 24)));

  const handleGenerateNewLot = () => {
    const itemPrefix = line.itemCode.slice(0, 6).replace(/[^a-zA-Z0-9]/g, '');
    const newLot = `LOT-${itemPrefix}-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    setInternalLot(newLot);
    showToast(`Generated internal lot format: ${newLot}`);
  };

  const handleSave = () => {
    // Basic validation
    if (new Date(mfgDate) > new Date()) {
      showToast('Validation Error: Manufacturing date cannot be in the future.');
      return;
    }
    if (new Date(expiryDate) <= new Date(mfgDate)) {
      showToast('Validation Error: Expiry date must be after manufacturing date.');
      return;
    }

    const updated: GrnLineItemExt = {
      ...line,
      lotBatchNumber: internalLot,
      supplierLotNumber: supplierLot,
      mfgDate,
      expiryDate,
      shelfLifeDays,
      remainingShelfLifeDays: remainingDays,
      packingType,
      bagCount,
      grossWeightKg: grossWeight,
      netWeightKg: netWeight,
      storageCondition,
      coaStatus,
      coaReference,
      msdsAvailable,
      countryOrigin,
    };

    onSaveLot(updated);
    showToast(`Saved lot details for ${line.itemCode} (${internalLot})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-teal-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Space_Grotesk']">
                Capture Lot & Batch Number Details
              </h3>
              <p className="text-xs text-slate-300">
                Line #{line.poLineNo}: {line.itemName} ({line.itemCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Internal Lot & Supplier Lot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Internal Lot / Batch Number *</label>
                <button
                  type="button"
                  onClick={handleGenerateNewLot}
                  className="text-[11px] text-[#0F8B8D] font-semibold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-Generate
                </button>
              </div>
              <input
                type="text"
                value={internalLot}
                onChange={(e) => setInternalLot(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-[#14213D] bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
              <span className="text-[10px] text-slate-500">
                Rule: Unique batch serial tracked across molding production and inventory.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Supplier Lot / Heat Number *</label>
              <input
                type="text"
                value={supplierLot}
                onChange={(e) => setSupplierLot(e.target.value)}
                placeholder="e.g. REPOL-H110-B892"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
              <span className="text-[10px] text-slate-500">
                From supplier COA or bag label for supplier traceability.
              </span>
            </div>
          </div>

          {/* Dates & Shelf Life */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#0F8B8D]" />
              Manufacturing & Expiry Lifespan
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 font-medium">Manufacturing Date</label>
                <input
                  type="date"
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-[11px] flex items-center justify-between">
                  <span>Shelf Life:</span>
                  <span className="font-bold">{shelfLifeDays} days ({remainingDays} remaining)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Packaging, Bags & Weighbridge Tally */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-purple-600" />
              Packaging & Physical Weighbridge Tally
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-600 font-medium">Packing Type</label>
                <select
                  value={packingType}
                  onChange={(e) => setPackingType(e.target.value as any)}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="25KG Bags">25KG Bags</option>
                  <option value="Drums">Drums / Barrels</option>
                  <option value="Gaylord/Boxes">Gaylord / Boxes</option>
                  <option value="Pallets">Pallets (Shrink-wrapped)</option>
                  <option value="Octabin">Octabin Container</option>
                  <option value="Bulk Silo Truck">Bulk Silo Truck</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-medium">Bag / Container Count</label>
                <input
                  type="number"
                  value={bagCount}
                  onChange={(e) => setBagCount(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Gross Weight (KG)</label>
                <input
                  type="number"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Net Weight (KG)</label>
                <input
                  type="number"
                  value={netWeight}
                  onChange={(e) => setNetWeight(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-[#14213D]"
                />
              </div>
            </div>
          </div>

          {/* Quality & Storage Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Storage Environmental Condition</label>
              <select
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Ambient Dry (<25°C)">Ambient Dry (&lt;25°C) - Standard Polymer</option>
                <option value="Controlled Humidity">Controlled Humidity - Masterbatch / Additives</option>
                <option value="Silo Bulk">Silo Bulk Storage</option>
                <option value="Hazardous / Flame-Proof">Hazardous / Flame-Proof Zone</option>
                <option value="Cleanroom Staging">Cleanroom Medical Staging</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Country / Plant of Origin</label>
              <input
                type="text"
                value={countryOrigin}
                onChange={(e) => setCountryOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* COA & MSDS Status */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-700" />
                Certificate of Analysis (COA) & MSDS Verification
              </div>
              <span className="text-[11px] font-semibold text-blue-700">Mandatory for QC Release</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-600 font-medium">COA Verification Status</label>
                <select
                  value={coaStatus}
                  onChange={(e) => setCoaStatus(e.target.value as any)}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="Verified">Verified & Parameters Matched</option>
                  <option value="Pending">Pending Lab Verification</option>
                  <option value="Missing">Missing COA (Hold Shipment)</option>
                  <option value="Failed">Failed Specification Limits</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-medium">COA Reference # / File Code</label>
                <input
                  type="text"
                  value={coaReference}
                  onChange={(e) => setCoaReference(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-slate-700">
              <input
                type="checkbox"
                id="msdsCheck"
                checked={msdsAvailable}
                onChange={(e) => setMsdsAvailable(e.target.checked)}
                className="rounded text-[#0F8B8D]"
              />
              <label htmlFor="msdsCheck" className="cursor-pointer">
                Material Safety Data Sheet (MSDS) verified and attached for regulatory compliance
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Barcode/QR label will be automatically updated with this batch serial.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              Apply Lot / Batch Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
