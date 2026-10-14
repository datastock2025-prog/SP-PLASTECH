import React, { useState } from 'react';
import {
  X,
  Settings,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { GrnToleranceSettings, GrnInspectionMode } from '../../../types/grnTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: GrnToleranceSettings;
  onSaveSettings: (newSettings: GrnToleranceSettings) => void;
  showToast: (msg: string) => void;
}

export const GrnSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  showToast,
}) => {
  if (!isOpen) return null;

  const [overReceiptPct, setOverReceiptPct] = useState(settings.allowedOverReceiptPct);
  const [underReceiptPct, setUnderReceiptPct] = useState(settings.allowedUnderReceiptPct);
  const [requireApproval, setRequireApproval] = useState(settings.requireApprovalForOverReceipt);
  const [defaultQcMode, setDefaultQcMode] = useState<GrnInspectionMode>(settings.defaultQcMode);
  const [quarantineBin, setQuarantineBin] = useState(settings.quarantineWarehouseBin);
  const [numberingPrefix, setNumberingPrefix] = useState(settings.numberingPrefix);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      allowedOverReceiptPct: Number(overReceiptPct),
      allowedUnderReceiptPct: Number(underReceiptPct),
      maxOverReceiptQtyKg: settings.maxOverReceiptQtyKg || 1500,
      roundingToleranceKg: settings.roundingToleranceKg || 10,
      requireApprovalForOverReceipt: requireApproval,
      defaultQcMode,
      quarantineWarehouseBin: quarantineBin,
      autoCreateInspectionTask: settings.autoCreateInspectionTask ?? true,
      mandatoryCoaForRawMaterials: settings.mandatoryCoaForRawMaterials ?? true,
      numberingPrefix,
    });
    showToast('GRN & QC Tolerance configuration updated successfully.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-teal-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Space_Grotesk']">
                GRN Policies, Tolerances & QC Settings
              </h3>
              <p className="text-xs text-slate-300">
                Configure plant-wide receiving tolerances and inspection defaults
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Tolerances */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-[#0F8B8D]" />
              Receiving Quantity Tolerances
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Allowed Over-Receipt %</label>
                <div className="relative">
                  <input
                    type="number"
                    value={overReceiptPct}
                    onChange={(e) => setOverReceiptPct(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Standard: +5% for bulk resin</span>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Allowed Under-Receipt %</label>
                <div className="relative">
                  <input
                    type="number"
                    value={underReceiptPct}
                    onChange={(e) => setUnderReceiptPct(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Allows closing partial POs</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-slate-700">
              <input
                type="checkbox"
                id="reqApproval"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="rounded text-[#0F8B8D]"
              />
              <label htmlFor="reqApproval" className="cursor-pointer font-medium">
                Enforce supervisor approval PIN if over-receipt exceeds threshold
              </label>
            </div>
          </div>

          {/* QC Inspection Defaults */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Quality Inspection Routing Defaults
            </h4>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Default Inspection Mode</label>
              <select
                value={defaultQcMode}
                onChange={(e) => setDefaultQcMode(e.target.value as GrnInspectionMode)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="QC_BEFORE_GRN">QC Before GRN (Sample & Hold at Dock)</option>
                <option value="QC_AFTER_GRN">QC After GRN (Post immediately to Quarantine Bin)</option>
                <option value="NO_QC">Direct Receipt (Skip QC for pre-certified suppliers)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Default Quarantine Bin Location</label>
              <input
                type="text"
                value={quarantineBin}
                onChange={(e) => setQuarantineBin(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
              />
            </div>
          </div>

          {/* GRN Prefix */}
          <div>
            <label className="text-slate-600 font-semibold block mb-1">GRN Numbering Series Prefix</label>
            <input
              type="text"
              value={numberingPrefix}
              onChange={(e) => setNumberingPrefix(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-800"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg font-semibold text-xs shadow-sm transition"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
