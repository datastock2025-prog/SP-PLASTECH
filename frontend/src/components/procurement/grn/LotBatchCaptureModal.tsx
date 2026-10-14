import React, { useState, useMemo } from 'react';
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
  Plus,
  Trash2,
  Copy,
  Split,
  Building,
  Check,
} from 'lucide-react';
import { GrnLineItemExt, GrnLineLotAllocation } from '../../../types/grnTypes';

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
  // Initialize multiple lots from line.lots or single fallback lot
  const [lots, setLots] = useState<GrnLineLotAllocation[]>(() => {
    if (line.lots && line.lots.length > 0) {
      return line.lots;
    }

    const defaultQty = line.currentReceivedQty || 1000;
    const itemPrefix = line.itemCode.slice(0, 6).replace(/[^a-zA-Z0-9]/g, '');
    const currentYear = new Date().getFullYear().toString().slice(2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    return [
      {
        id: `lot-${Date.now()}-1`,
        lotBatchNumber:
          line.lotBatchNumber ||
          `LOT-${itemPrefix}-${currentYear}${month}-${Math.floor(100 + Math.random() * 900)}A`,
        supplierLotNumber: line.supplierLotNumber || `SUP-BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        quantity: defaultQty,
        uom: line.uom || 'KG',
        mfgDate: line.mfgDate || new Date().toISOString().slice(0, 10),
        expiryDate:
          line.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        bagCount: line.bagCount || Math.ceil(defaultQty / 25),
        bin: line.bin || `${line.locationCode || 'RM-WH-01'}-A1`,
        palletId: `PLT-${Math.floor(100 + Math.random() * 900)}`,
        coaStatus: line.coaStatus || 'Verified',
        coaReference: line.coaReference || 'COA-MATCHED-DOCK',
        qualityStatus: line.qualityStatus || 'Pending Inspection',
      },
    ];
  });

  const [commonPackingType, setCommonPackingType] = useState<GrnLineItemExt['packingType']>(
    line.packingType || '25KG Bags'
  );
  const [commonStorageCondition, setCommonStorageCondition] = useState<
    GrnLineItemExt['storageCondition']
  >(line.storageCondition || 'Ambient Dry (<25°C)');
  const [countryOrigin, setCountryOrigin] = useState(line.countryOrigin || 'India (Hazira Plant)');

  // Sum of lot quantities
  const totalAllocatedQty = useMemo(
    () => lots.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0),
    [lots]
  );
  const targetQty = line.currentReceivedQty || 0;
  const isBalanceMatched = Math.abs(totalAllocatedQty - targetQty) < 0.001;
  const qtyDiff = targetQty - totalAllocatedQty;

  const handleGenerateLotId = (index: number) => {
    const itemPrefix = line.itemCode.slice(0, 6).replace(/[^a-zA-Z0-9]/g, '');
    const yearMonth = `${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const suffix = String.fromCharCode(65 + (index % 26));
    const random = Math.floor(100 + Math.random() * 900);
    const newLot = `LOT-${itemPrefix}-${yearMonth}-${random}${suffix}`;

    setLots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], lotBatchNumber: newLot };
      return next;
    });
    showToast(`Generated lot serial: ${newLot}`);
  };

  const handleAddLot = () => {
    const remainingToAllocate = Math.max(0, qtyDiff);
    const itemPrefix = line.itemCode.slice(0, 6).replace(/[^a-zA-Z0-9]/g, '');
    const yearMonth = `${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const suffix = String.fromCharCode(65 + (lots.length % 26));

    const newLot: GrnLineLotAllocation = {
      id: `lot-${Date.now()}-${lots.length + 1}`,
      lotBatchNumber: `LOT-${itemPrefix}-${yearMonth}-${Math.floor(100 + Math.random() * 900)}${suffix}`,
      supplierLotNumber: `SUP-BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
      quantity: remainingToAllocate > 0 ? remainingToAllocate : 1000,
      uom: line.uom || 'KG',
      mfgDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      bagCount: Math.ceil((remainingToAllocate > 0 ? remainingToAllocate : 1000) / 25),
      bin: `${line.locationCode || 'RM-WH-01'}-A${lots.length + 1}`,
      palletId: `PLT-${Math.floor(100 + Math.random() * 900)}`,
      coaStatus: 'Verified',
      coaReference: 'COA-MATCHED-DOCK',
      qualityStatus: 'Pending Inspection',
    };

    setLots((prev) => [...prev, newLot]);
    showToast(`Added Lot #${lots.length + 1} for ${line.itemCode}`);
  };

  const handleSplitEvenly = () => {
    if (lots.length <= 1) {
      // Split into 2 lots
      const half = Math.floor(targetQty / 2);
      const remainder = targetQty - half;
      const itemPrefix = line.itemCode.slice(0, 6).replace(/[^a-zA-Z0-9]/g, '');
      const yearMonth = `${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      setLots([
        {
          ...lots[0],
          quantity: half,
          bagCount: Math.ceil(half / 25),
          lotBatchNumber: `LOT-${itemPrefix}-${yearMonth}-${Math.floor(100 + Math.random() * 900)}A`,
        },
        {
          id: `lot-${Date.now()}-2`,
          lotBatchNumber: `LOT-${itemPrefix}-${yearMonth}-${Math.floor(100 + Math.random() * 900)}B`,
          supplierLotNumber: `SUP-BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
          quantity: remainder,
          uom: line.uom || 'KG',
          mfgDate: new Date().toISOString().slice(0, 10),
          expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
          bagCount: Math.ceil(remainder / 25),
          bin: `${line.locationCode || 'RM-WH-01'}-A2`,
          palletId: `PLT-${Math.floor(100 + Math.random() * 900)}`,
          coaStatus: 'Verified',
          coaReference: 'COA-MATCHED-DOCK',
          qualityStatus: 'Pending Inspection',
        },
      ]);
    } else {
      // Distribute evenly among current lots
      const splitAmount = Math.floor(targetQty / lots.length);
      const remainder = targetQty - splitAmount * (lots.length - 1);
      setLots((prev) =>
        prev.map((l, idx) => ({
          ...l,
          quantity: idx === prev.length - 1 ? remainder : splitAmount,
          bagCount: Math.ceil((idx === prev.length - 1 ? remainder : splitAmount) / 25),
        }))
      );
    }
    showToast(`Evenly split ${targetQty} ${line.uom} across ${lots.length > 1 ? lots.length : 2} lots`);
  };

  const handleRemoveLot = (index: number) => {
    if (lots.length === 1) {
      showToast('Line item must have at least 1 lot entry.');
      return;
    }
    setLots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLotFieldChange = (index: number, field: keyof GrnLineLotAllocation, value: any) => {
    setLots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'quantity') {
        const qtyNum = Number(value) || 0;
        next[index].bagCount = Math.ceil(qtyNum / 25);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (lots.length === 0) {
      showToast('Error: Please configure at least 1 lot.');
      return;
    }

    if (!isBalanceMatched) {
      showToast(
        `Balance Warning: Sum of lots (${totalAllocatedQty} KG) does not match total received quantity (${targetQty} KG). Please balance quantities.`
      );
      return;
    }

    // Validate dates
    for (const lot of lots) {
      if (new Date(lot.mfgDate) > new Date()) {
        showToast(`Validation Error in Lot ${lot.lotBatchNumber}: Manufacturing date cannot be in the future.`);
        return;
      }
      if (new Date(lot.expiryDate) <= new Date(lot.mfgDate)) {
        showToast(`Validation Error in Lot ${lot.lotBatchNumber}: Expiry date must be after manufacturing date.`);
        return;
      }
    }

    const firstLot = lots[0];
    const totalBags = lots.reduce((sum, l) => sum + (Number(l.bagCount) || 0), 0);

    const updated: GrnLineItemExt = {
      ...line,
      lots: lots,
      lotBatchNumber: lots.length > 1 ? `${firstLot.lotBatchNumber} (+${lots.length - 1} lots)` : firstLot.lotBatchNumber,
      supplierLotNumber: lots.length > 1 ? `${firstLot.supplierLotNumber || 'SUP'} (+${lots.length - 1})` : (firstLot.supplierLotNumber || ''),
      mfgDate: firstLot.mfgDate,
      expiryDate: firstLot.expiryDate,
      packingType: commonPackingType,
      bagCount: totalBags,
      grossWeightKg: targetQty + 15,
      netWeightKg: targetQty,
      storageCondition: commonStorageCondition,
      countryOrigin: countryOrigin,
    };

    onSaveLot(updated);
    showToast(`Saved ${lots.length} lot allocation(s) for ${line.itemCode}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-[#14213D] to-[#1E293B] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0F8B8D] text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">
                  Multi-Lot & Batch Breakdown Allocation
                </h3>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                  {lots.length} {lots.length === 1 ? 'Lot' : 'Lots'} Configured
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Line #{line.poLineNo}: <strong className="text-white">{line.itemName}</strong> ({line.itemCode}) • Target Volume: <strong className="text-[#0F8B8D]">{targetQty.toLocaleString()} {line.uom}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Status Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 font-medium">Target Received Qty:</span>
              <strong className="text-[#14213D] ml-1.5 font-mono text-sm">{targetQty.toLocaleString()} {line.uom}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Total Allocated:</span>
              <strong
                className={`ml-1.5 font-mono text-sm ${
                  isBalanceMatched ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {totalAllocatedQty.toLocaleString()} {line.uom}
              </strong>
            </div>
            {isBalanceMatched ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Exact 100% Match
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {qtyDiff > 0 ? `${qtyDiff.toLocaleString()} ${line.uom} Remaining` : `${Math.abs(qtyDiff).toLocaleString()} ${line.uom} Excess`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSplitEvenly}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Split className="w-3.5 h-3.5 text-slate-500" />
              <span>Split Evenly</span>
            </button>
            <button
              type="button"
              onClick={handleAddLot}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Lot / Batch</span>
            </button>
          </div>
        </div>

        {/* Lots List Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {lots.map((lot, idx) => {
            const mfg = new Date(lot.mfgDate);
            const exp = new Date(lot.expiryDate);
            const shelfLife = Math.max(0, Math.round((exp.getTime() - mfg.getTime()) / (1000 * 3600 * 24)));

            return (
              <div
                key={lot.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
              >
                {/* Lot Header Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#14213D] text-white flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-xs text-[#14213D]">
                      Lot Batch Serial #{idx + 1}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {lot.lotBatchNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleGenerateLotId(idx)}
                      className="text-[11px] text-[#0F8B8D] font-semibold hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Re-Generate ID
                    </button>
                    {lots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLot(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Remove Lot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lot Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  {/* Internal Lot ID */}
                  <div className="lg:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">Internal Lot / Batch No *</label>
                    <input
                      type="text"
                      value={lot.lotBatchNumber}
                      onChange={(e) => handleLotFieldChange(idx, 'lotBatchNumber', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs font-bold text-[#14213D] bg-white focus:ring-2 focus:ring-[#0F8B8D] outline-hidden"
                      required
                    />
                  </div>

                  {/* Supplier Lot / Heat Number */}
                  <div className="lg:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">Supplier Batch / Heat Ref *</label>
                    <input
                      type="text"
                      value={lot.supplierLotNumber || ''}
                      onChange={(e) => handleLotFieldChange(idx, 'supplierLotNumber', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs text-slate-700 bg-white"
                      placeholder="e.g. GAIL-LOT-8812"
                    />
                  </div>

                  {/* Lot Allocated Qty */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Lot Qty ({line.uom}) *</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={lot.quantity}
                      onChange={(e) => handleLotFieldChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-right font-bold text-xs text-[#14213D] bg-white focus:ring-2 focus:ring-[#0F8B8D] outline-hidden"
                      required
                    />
                  </div>

                  {/* Bag Count */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Bags (25kg)</label>
                    <input
                      type="number"
                      value={lot.bagCount || Math.ceil(lot.quantity / 25)}
                      onChange={(e) => handleLotFieldChange(idx, 'bagCount', parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-right text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Dates & Bins Sub-Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  {/* Mfg Date */}
                  <div>
                    <label className="text-slate-500 text-[10px] uppercase font-semibold block">Mfg Date</label>
                    <input
                      type="date"
                      value={lot.mfgDate}
                      onChange={(e) => handleLotFieldChange(idx, 'mfgDate', e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 border border-slate-200 rounded text-xs"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="text-slate-500 text-[10px] uppercase font-semibold block">Expiry Date</label>
                    <input
                      type="date"
                      value={lot.expiryDate}
                      onChange={(e) => handleLotFieldChange(idx, 'expiryDate', e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 border border-slate-200 rounded text-xs"
                    />
                  </div>

                  {/* Putaway Storage Bin */}
                  <div>
                    <label className="text-slate-500 text-[10px] uppercase font-semibold block">Target Storage Bin</label>
                    <input
                      type="text"
                      value={lot.bin || `${line.locationCode}-A1`}
                      onChange={(e) => handleLotFieldChange(idx, 'bin', e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 border border-slate-200 rounded font-mono text-xs bg-slate-50"
                    />
                  </div>

                  {/* Shelf Life & COA Badge */}
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Lifespan: <strong className="text-slate-800">{shelfLife}d</strong>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ COA Attached
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Common Material Storage & Origin Settings */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Packaging Classification</label>
              <select
                value={commonPackingType}
                onChange={(e) => setCommonPackingType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="25KG Bags">25KG Heat-Sealed Bags</option>
                <option value="Octabin">Octabin Bulk Container (1000 KG)</option>
                <option value="Pallets">Palletized & Shrink-Wrapped</option>
                <option value="Gaylord/Boxes">Gaylord Corrugated Boxes</option>
                <option value="Bulk Silo Truck">Bulk Silo Tanker Truck</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Storage Condition</label>
              <select
                value={commonStorageCondition}
                onChange={(e) => setCommonStorageCondition(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="Ambient Dry (<25°C)">Ambient Dry (&lt;25°C)</option>
                <option value="Controlled Humidity">Controlled Low Humidity</option>
                <option value="Silo Bulk">Silo Bulk Storage</option>
                <option value="Hazardous / Flame-Proof">Hazardous / Flame-Proof Bay</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Country / Plant Origin</label>
              <input
                type="text"
                value={countryOrigin}
                onChange={(e) => setCountryOrigin(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isBalanceMatched}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 ${
              isBalanceMatched
                ? 'bg-[#0F8B8D] hover:bg-[#0d797b] active:scale-[0.98] text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Apply {lots.length} Lot Allocation(s)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
