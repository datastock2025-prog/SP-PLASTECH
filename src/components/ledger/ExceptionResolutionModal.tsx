// ============================================================================
// EXCEPTION RESOLUTION MODAL
// Step-15: Root Cause Investigation & One-Click Resolution Workflows
// ============================================================================

import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  CheckCircle2,
  FileText,
  DollarSign,
  UserCheck,
  Calendar,
  Layers,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { ExceptionItem } from '../../types/unifiedLedgerTypes';

interface Props {
  exception: ExceptionItem | null;
  onClose: () => void;
  onResolve: (id: string, actionName: string, notes: string) => void;
}

export const ExceptionResolutionModal: React.FC<Props> = ({
  exception,
  onClose,
  onResolve,
}) => {
  if (!exception) return null;

  const [resolutionAction, setResolutionAction] = useState<string>('accept_variance');
  const [justification, setJustification] = useState<string>('');

  const handleConfirm = () => {
    onResolve(exception.id, resolutionAction, justification || 'Standard resolution applied.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center font-bold">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Exception Investigation: {exception.documentNumber}
              </h3>
              <p className="text-xs text-slate-500">
                Category: {exception.category} • Severity: {exception.severity}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Summary Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Involved Entity / Party:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{exception.entity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Financial Exposure / Impact:</span>
              <span className="font-mono font-bold text-rose-600 text-sm">
                ₹{(exception.financialImpact || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Aging in Queue:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{exception.ageDays} Days Active</span>
            </div>
          </div>

          {/* Description & Root Cause */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Discrepancy Detail & Findings
            </label>
            <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed">
              {exception.description}
            </div>
          </div>

          {/* Resolution Options */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
              Select Corrective Action / Settlement Workflow
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="accept_variance"
                  checked={resolutionAction === 'accept_variance'}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="mt-0.5 text-[#E8622C]"
                />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Accept Variance with Technical Concession
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Release batch for lower-grade polymer blending and post adjustment voucher.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="debit_note"
                  checked={resolutionAction === 'debit_note'}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="mt-0.5 text-[#E8622C]"
                />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Issue Vendor Debit Note & Reject Batch
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Deduct ₹{(exception.financialImpact || 0).toLocaleString('en-IN')} from AP ledger and return material to supplier.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="route_approval"
                  checked={resolutionAction === 'route_approval'}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="mt-0.5 text-[#E8622C]"
                />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Escalate to CFO & Plant Head for Joint Sign-off
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Routes notification to executive authority with high-priority audit flag.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Justification Textarea */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Statutory Audit Justification Note
            </label>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Enter technical or commercial justification for auditors..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#E8622C]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-[#E8622C] hover:bg-[#d55320] text-white rounded-xl font-bold text-xs shadow-xs transition"
          >
            Apply Resolution & Post Reversal
          </button>
        </div>
      </div>
    </div>
  );
};
