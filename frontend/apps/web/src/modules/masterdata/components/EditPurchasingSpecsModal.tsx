import React, { useState } from 'react';
import { ItemMaster } from '@/src/types';
import { Factory, X } from 'lucide-react';
import { masterDataGovernanceService } from '../api/masterDataGovernanceService';

export interface EditPurchasingSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemMaster | null;
  onSave: (updated: ItemMaster) => void | Promise<void>;
  showToast: (msg: string) => void;
}

export const EditPurchasingSpecsModal: React.FC<EditPurchasingSpecsModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  showToast,
}) => {
  if (!isOpen || !item) return null;

  const [supplier, setSupplier] = useState(item.supplier || '');
  const [cost, setCost] = useState<number | string>(item.standardCost || item.cost || 0);
  const [leadTime, setLeadTime] = useState(item.leadTime || '');
  const [wh, setWh] = useState(item.wh || '');
  const [reorderLevel, setReorderLevel] = useState(item.reorderLevel || '');
  const [safetyStock, setSafetyStock] = useState(item.safetyStock || '');
  const [hsnCode, setHsnCode] = useState(item.hsnCode || item.hsCode || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updatedItem: ItemMaster = {
        ...item,
        supplier: supplier.trim(),
        cost: Number(cost) || 0,
        standardCost: Number(cost) || 0,
        leadTime: leadTime.trim(),
        wh: wh.trim(),
        reorderLevel: String(reorderLevel || ''),
        safetyStock: String(safetyStock || ''),
        hsnCode: hsnCode.trim(),
        hsCode: hsnCode.trim(),
      };

      await onSave(updatedItem);
      masterDataGovernanceService.recordAudit({
        entityType: 'ITEM_MASTER',
        entityCode: item.code,
        entityName: item.name,
        action: 'UPDATE',
        changedBy: 'Procurement Authority',
        changeSummary: `Updated Purchasing Specs: Supplier (${supplier || '—'}), Rate (₹${cost}), Lead Time (${leadTime || '—'})`,
        diff: {
          supplier: { before: item.supplier, after: supplier },
          cost: { before: item.cost, after: cost },
          leadTime: { before: item.leadTime, after: leadTime },
        },
      });
      showToast(`✓ Purchasing specifications updated for ${item.code}`);
      onClose();
    } catch (err: any) {
      showToast(`⚠️ Failed to update purchasing specs: ${err?.message || 'Error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Factory className="w-4 h-4 text-[#0F8B8D]" /> Edit Purchasing &amp; Supplier Specs
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{item.code} &mdash; {item.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label htmlFor="purchasing-supplier-input" className="block font-semibold text-slate-700">Preferred Supplier / Vendor</label>
            <input
              id="purchasing-supplier-input"
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Supreme Petrochem or Reliance Industries"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="purchasing-cost-input" className="block font-semibold text-slate-700">Standard Purchase Cost (₹)</label>
              <input
                id="purchasing-cost-input"
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="purchasing-leadtime-input" className="block font-semibold text-slate-700">Procurement Lead Time</label>
              <input
                id="purchasing-leadtime-input"
                type="text"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                placeholder="e.g. 7 Days or 2 Weeks"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="purchasing-store-input" className="block font-semibold text-slate-700">Target Store</label>
              <input
                id="purchasing-store-input"
                type="text"
                value={wh}
                onChange={(e) => setWh(e.target.value)}
                placeholder="RM-WH-01"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="purchasing-rop-input" className="block font-semibold text-slate-700">Reorder Level (ROP)</label>
              <input
                id="purchasing-rop-input"
                type="text"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="purchasing-safety-input" className="block font-semibold text-slate-700">Safety Buffer</label>
              <input
                id="purchasing-safety-input"
                type="text"
                value={safetyStock}
                onChange={(e) => setSafetyStock(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="purchasing-hsn-input" className="block font-semibold text-slate-700">HSN / Tariff Code</label>
            <input
              id="purchasing-hsn-input"
              type="text"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              placeholder="e.g. 39021000"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : 'Save Specifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
