// ============================================================================
// QUICK ACTION MODAL
// Step-3 Quick Action: Create PO, GRN, QC Inspection, Dispatch, Invoice, JE
// ============================================================================

import React, { useState } from 'react';
import {
  X,
  Plus,
  ShoppingCart,
  Receipt,
  ShieldCheck,
  Truck,
  FileSpreadsheet,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  actionType: string | null;
  onClose: () => void;
  onSubmit: (actionType: string, formData: any) => void;
}

export const QuickActionModal: React.FC<Props> = ({
  actionType,
  onClose,
  onSubmit,
}) => {
  if (!actionType) return null;

  const getTitleAndIcon = () => {
    switch (actionType) {
      case 'create_po':
        return { title: 'Create New Purchase Order (PO)', icon: ShoppingCart, color: 'text-blue-500' };
      case 'create_grn':
        return { title: 'Log Goods Receipt Note (GRN Inward)', icon: Receipt, color: 'text-emerald-500' };
      case 'create_qc':
        return { title: 'Record Laboratory QC Inspection', icon: ShieldCheck, color: 'text-purple-500' };
      case 'create_dispatch':
        return { title: 'Generate Outbound Dispatch Delivery Note', icon: Truck, color: 'text-amber-500' };
      case 'create_invoice':
        return { title: 'Post Tax Invoice (AP/AR)', icon: FileSpreadsheet, color: 'text-teal-500' };
      case 'create_je':
        return { title: 'Post Manual General Ledger Journal Voucher', icon: BookOpen, color: 'text-[#E8622C]' };
      default:
        return { title: 'Perform Operational Action', icon: Plus, color: 'text-slate-700' };
    }
  };

  const { title, icon: Icon, color } = getTitleAndIcon();

  const [entityName, setEntityName] = useState('Reliance Industries Ltd');
  const [docRef, setDocRef] = useState('PO-2026-0899');
  const [amount, setAmount] = useState('250000');
  const [notes, setNotes] = useState('Standard monthly procurement lot.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(actionType, { entityName, docRef, amount: parseFloat(amount), notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{title}</h3>
              <p className="text-xs text-slate-500">Live linkage to Stock, QC, Invoicing, and GL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Supplier / Customer / Entity Party
            </label>
            <input
              type="text"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#E8622C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Reference Document #
              </label>
              <input
                type="text"
                value={docRef}
                onChange={(e) => setDocRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-[#E8622C]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Transaction Value (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-[#E8622C]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Operational & Accounting Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#E8622C]"
            />
          </div>

          {/* Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300">
            ✓ Double-entry accounting impact will be calculated and posted to the General Ledger automatically.
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#E8622C] hover:bg-[#d55320] text-white rounded-xl font-bold text-xs shadow-xs transition"
            >
              Save & Post to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
