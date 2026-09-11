import React, { useState } from 'react';
import { WorkOrder, RejectionBreakdownItem } from '../../types';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Layers,
  Info,
  Flame,
  Check
} from 'lucide-react';

export interface MultiRejectionModalProps {
  workOrder: WorkOrder;
  isOpen: boolean;
  onClose: () => void;
  onSave: (woId: string, rejectionBreakdown: RejectionBreakdownItem[], totalScrap: number) => void;
  showToast?: (msg: string) => void;
}

// Standard plastics injection & extrusion defect reason catalog
export const STANDARD_REJECTION_REASONS = [
  { reason: 'Short Shot / Incomplete Cavity Filling', category: 'process', severity: 'High', code: 'REJ-01' },
  { reason: 'Part Flash / Parting Line Burrs', category: 'mechanical', severity: 'Medium', code: 'REJ-02' },
  { reason: 'Sink Marks & Thick Section Voids', category: 'process', severity: 'Medium', code: 'REJ-03' },
  { reason: 'Silver Streaks / Moisture Splay', category: 'material', severity: 'Critical', code: 'REJ-04' },
  { reason: 'Dimensional Warpage & Twisting', category: 'process', severity: 'High', code: 'REJ-05' },
  { reason: 'Degraded Polymer & Black Specks', category: 'material', severity: 'Critical', code: 'REJ-06' },
  { reason: 'Start-up Purge & Stabilization Shots', category: 'startup', severity: 'Low', code: 'REJ-07' },
  { reason: 'Color Streak / Masterbatch Inhomogeneity', category: 'material', severity: 'Medium', code: 'REJ-08' },
  { reason: 'Jetting & Gate Blush', category: 'process', severity: 'Medium', code: 'REJ-09' },
  { reason: 'Diesel Effect / Burn Marks (Air Trap)', category: 'process', severity: 'High', code: 'REJ-10' },
  { reason: 'Weld Lines / Cold Slug Inclusion', category: 'process', severity: 'Medium', code: 'REJ-11' },
  { reason: 'Ejector Pin Push Marks / Cracking', category: 'mechanical', severity: 'High', code: 'REJ-12' },
  { reason: 'Surface Scratches & Part Scuffing', category: 'visual', severity: 'Low', code: 'REJ-13' },
  { reason: 'Wall Thickness Out of Tolerance', category: 'dimensional', severity: 'High', code: 'REJ-14' },
];

export const MultiRejectionModal: React.FC<MultiRejectionModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  onSave,
  showToast,
}) => {
  if (!isOpen) return null;

  // Initialize defect entries from workOrder breakdown or fall back to single reason if available
  const [defects, setDefects] = useState<RejectionBreakdownItem[]>(() => {
    if (workOrder.rejectionBreakdown && workOrder.rejectionBreakdown.length > 0) {
      return JSON.parse(JSON.stringify(workOrder.rejectionBreakdown));
    }
    if (workOrder.scrap > 0) {
      return [
        {
          id: `rej-${Date.now()}-1`,
          reason: workOrder.rejectionReason || 'Short Shot / Incomplete Cavity Filling',
          qty: workOrder.scrap,
          category: 'process',
          notes: 'Initial recorded scrap',
        },
      ];
    }
    return [
      {
        id: `rej-${Date.now()}-1`,
        reason: 'Short Shot / Incomplete Cavity Filling',
        qty: 10,
        category: 'process',
        notes: '',
      },
    ];
  });

  const totalDefectQty = defects.reduce((sum, d) => sum + (Number(d.qty) || 0), 0);
  const totalProduced = (workOrder.completed || 0) + totalDefectQty;
  const scrapPercentage = totalProduced > 0 ? ((totalDefectQty / totalProduced) * 100).toFixed(1) : '0.0';

  const handleAddDefect = (presetReason?: string, presetCategory?: string) => {
    const newEntry: RejectionBreakdownItem = {
      id: `rej-${Date.now()}-${defects.length + 1}`,
      reason: presetReason || STANDARD_REJECTION_REASONS[0].reason,
      qty: 5,
      category: (presetCategory as any) || STANDARD_REJECTION_REASONS[0].category,
      notes: '',
    };
    setDefects((prev) => [...prev, newEntry]);
  };

  const handleUpdateDefect = (id: string | undefined, index: number, field: keyof RejectionBreakdownItem, value: any) => {
    setDefects((prev) =>
      prev.map((item, i) => {
        if ((item.id && item.id === id) || (!item.id && i === index)) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleRemoveDefect = (index: number) => {
    setDefects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    onSave(workOrder.id, defects, totalDefectQty);
    if (showToast) {
      showToast(`Updated ${defects.length} rejection reasons for WO #${workOrder.id} (Total Scrap: ${totalDefectQty} pcs)`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FAF9F5] rounded-2xl border border-[#E4E0D6] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E4E0D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-2xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#14213D]">Multi-Defect Rejection Breakdown</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  {workOrder.id}
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Record and categorize multiple rejection reasons for finished good <b className="text-[#14213D]">{workOrder.item}</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#14213D] hover:bg-[#F6F4EF] border border-transparent hover:border-[#E4E0D6] transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Defect Metrics Strip */}
        <div className="p-3 sm:p-4 bg-white border-b border-[#E4E0D6] grid grid-cols-3 gap-3">
          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E0D6]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">Total Scrap Pieces</div>
            <div className="text-lg font-bold font-mono text-rose-700 mt-0.5">
              {totalDefectQty.toLocaleString()} <span className="text-xs text-[#6B7280] font-sans">pcs</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E0D6]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">Defect Types Recorded</div>
            <div className="text-lg font-bold font-mono text-purple-700 mt-0.5">
              {defects.length} <span className="text-xs text-[#6B7280] font-sans">causes</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E0D6]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">Calculated Scrap Rate</div>
            <div className={`text-lg font-bold font-mono mt-0.5 ${Number(scrapPercentage) > 5 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {scrapPercentage}%
            </div>
          </div>
        </div>

        {/* Quick Add Presets Bar */}
        <div className="px-4 py-2.5 bg-[#F6F4EF] border-b border-[#E4E0D6] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-[#6B7280] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Quick Add:
          </span>
          {[
            { name: '+ Short Shot', reason: 'Short Shot / Incomplete Cavity Filling', cat: 'process' },
            { name: '+ Flash / Burrs', reason: 'Part Flash / Parting Line Burrs', cat: 'mechanical' },
            { name: '+ Sink Marks', reason: 'Sink Marks & Thick Section Voids', cat: 'process' },
            { name: '+ Silver Splay', reason: 'Silver Streaks / Moisture Splay', cat: 'material' },
            { name: '+ Black Specks', reason: 'Degraded Polymer & Black Specks', cat: 'material' },
            { name: '+ Startup Shots', reason: 'Start-up Purge & Stabilization Shots', cat: 'startup' },
          ].map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddDefect(pill.reason, pill.cat)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-[#E4E0D6] hover:border-rose-300 text-[#14213D] text-[11px] font-semibold whitespace-nowrap transition-all shadow-2xs"
            >
              {pill.name}
            </button>
          ))}
        </div>

        {/* Defect Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {defects.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#CBD5E1] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-sm font-bold text-[#14213D]">No Rejections Logged</div>
              <p className="text-xs text-[#6B7280]">
                Zero scrap recorded on this work order. Click below to add a defect if needed.
              </p>
              <button
                type="button"
                onClick={() => handleAddDefect()}
                className="mt-2 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Defect
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {defects.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] hover:border-rose-200 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Defect Reason Selector */}
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-0.5">
                        Defect Reason #{idx + 1}
                      </label>
                      <select
                        value={item.reason}
                        onChange={(e) => handleUpdateDefect(item.id, idx, 'reason', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E4E0D6] bg-[#FAF9F5] text-xs font-bold text-[#14213D] focus:ring-1 focus:ring-rose-500 focus:outline-none"
                      >
                        {STANDARD_REJECTION_REASONS.map((r) => (
                          <option key={r.code} value={r.reason}>
                            [{r.code}] {r.reason} ({r.severity})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Defect Quantity */}
                    <div className="w-28 sm:w-28">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-0.5">
                        Scrap Qty (pcs)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.qty}
                        onChange={(e) =>
                          handleUpdateDefect(item.id, idx, 'qty', Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E4E0D6] bg-white text-xs font-mono font-bold text-rose-700 text-right focus:ring-1 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>

                    {/* Category Selector */}
                    <div className="w-28 sm:w-28">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-0.5">
                        Category
                      </label>
                      <select
                        value={item.category || 'process'}
                        onChange={(e) => handleUpdateDefect(item.id, idx, 'category', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-[#E4E0D6] bg-white text-xs font-semibold text-[#14213D] focus:ring-1 focus:ring-rose-500 focus:outline-none"
                      >
                        <option value="process">Process</option>
                        <option value="material">Material</option>
                        <option value="mechanical">Mechanical</option>
                        <option value="dimensional">Dimensional</option>
                        <option value="visual">Visual</option>
                        <option value="startup">Startup</option>
                      </select>
                    </div>

                    {/* Remove Action */}
                    <div className="pt-4 sm:pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveDefect(idx)}
                        className="p-1.5 text-[#9CA3AF] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Defect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes / Action Taken */}
                  <div>
                    <input
                      type="text"
                      placeholder="Root cause / shift technician remarks (e.g. nozzle heater band #2 fluctuated)..."
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateDefect(item.id, idx, 'notes', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#F1EFE9] bg-[#FDFDFD] text-[11px] text-[#4B5563] placeholder:text-[#9CA3AF] focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleAddDefect()}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#E4E0D6] hover:border-rose-300 hover:bg-rose-50/50 text-[#14213D] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-rose-600" />
            Add Another Rejection Reason
          </button>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#E4E0D6] flex items-center justify-between">
          <div className="text-xs text-[#6B7280]">
            Syncs with Work Order Total Scrap: <b className="text-rose-700 font-mono">{totalDefectQty} pcs</b>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-xs font-bold text-[#14213D] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply Rejections ({totalDefectQty} pcs)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
