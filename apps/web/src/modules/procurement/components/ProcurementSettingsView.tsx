import React from 'react';
import {
  Settings,
  Save,
  ShieldCheck,
  FileText,
  Sliders,
  DollarSign,
} from 'lucide-react';

interface Props {
  showToast: (msg: string) => void;
}

export const ProcurementSettingsView: React.FC<Props> = ({ showToast }) => {
  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Procurement System Policies & Governance
          </h1>
          <p className="text-xs text-slate-500">
            Configure approval thresholds, numbering series, automated tolerance bands, and quality inspection triggers
          </p>
        </div>

        <button
          onClick={() => showToast('Procurement policy settings successfully updated!')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" /> Save Policies
        </button>
      </div>

      {/* Numbering Series */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
        <h3 className="font-bold text-sm text-[#14213D] border-b pb-2">Document Auto-Numbering Series</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Purchase Requisition (PR)</label>
            <input type="text" defaultValue="PR-2026-####" className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50" />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Request For Quote (RFQ)</label>
            <input type="text" defaultValue="RFQ-2026-####" className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50" />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Purchase Order (PO)</label>
            <input type="text" defaultValue="PO-2026-####" className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50" />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Goods Receipt Note (GRN)</label>
            <input type="text" defaultValue="GRN-2026-####" className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50" />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Supplier Debit Note (DN)</label>
            <input type="text" defaultValue="DN-2026-####" className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50" />
          </div>
        </div>
      </div>

      {/* Approval Authority Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
        <h3 className="font-bold text-sm text-[#14213D] border-b pb-2">Delegation of Financial Power & Approval Tiers</h3>
        <div className="space-y-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-[#14213D]">Tier 1: Up to ₹50,000</div>
              <div className="text-slate-500 text-[11px]">Consumables & Standard Hardware</div>
            </div>
            <span className="font-semibold text-emerald-700">Auto-approved by Shift Buyer</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-[#14213D]">Tier 2: ₹50,001 - ₹5,00,000</div>
              <div className="text-slate-500 text-[11px]">Monthly Raw Material Replenishment</div>
            </div>
            <span className="font-semibold text-[#0F8B8D]">Requires Procurement Manager Sign-off</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-[#14213D]">Tier 3: Above ₹5,00,000</div>
              <div className="text-slate-500 text-[11px]">Direct Bulk Polymer Railcars & Tooling Contracts</div>
            </div>
            <span className="font-semibold text-purple-700">Requires VP Supply Chain & CFO Dual Approval</span>
          </div>
        </div>
      </div>

      {/* Tolerances & Quality Rules */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
        <h3 className="font-bold text-sm text-[#14213D] border-b pb-2">Receiving Tolerances & Invoice Matching Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-slate-600 font-semibold">Bulk Polymer Over-Receipt Tolerance</label>
            <input type="text" defaultValue="± 5.0 %" className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold" />
            <span className="text-[10px] text-slate-400">Permissible tanker weighbridge variation</span>
          </div>
          <div className="space-y-1">
            <label className="block text-slate-600 font-semibold">Price Variance Auto-Hold Threshold</label>
            <input type="text" defaultValue="> 1.0 %" className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold text-red-600" />
            <span className="text-[10px] text-slate-400">Invoices exceeding contracted rate are flagged for review</span>
          </div>
        </div>
      </div>
    </div>
  );
};
