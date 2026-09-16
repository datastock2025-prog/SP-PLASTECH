// ============================================================================
// SHARED ACCOUNTING IMPACT & AUDIT DRAWER
// Reusable across all 11 tabs in the Unified Operations-to-Ledger Workspace
// ============================================================================

import React from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  Printer,
  Download,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { DocumentAccountingImpact } from '../../types/unifiedLedgerTypes';

interface Props {
  impact: DocumentAccountingImpact | null;
  onClose: () => void;
  onNavigateToJe?: (jeNumber: string) => void;
}

export const AccountingImpactDrawer: React.FC<Props> = ({ impact, onClose, onNavigateToJe }) => {
  if (!impact) return null;

  const isBalanced = Math.abs(impact.totalDebit - impact.totalCredit) < 0.01;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E8622C]/10 dark:bg-[#E8622C]/20 text-[#E8622C] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                  Accounting Impact & Journal Breakdown
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    impact.status === 'Posted'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : impact.status === 'Simulated'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {impact.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Linked Document: <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{impact.documentType} {impact.documentNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Card */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Posting Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {impact.postingDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Cost Center</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> {impact.costCenter}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Journal Voucher #</span>
              {impact.journalEntryNumber ? (
                <button
                  onClick={() => onNavigateToJe?.(impact.journalEntryNumber!)}
                  className="font-mono font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {impact.journalEntryNumber} <ExternalLink className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-slate-400 italic">Auto-generated upon posting</span>
              )}
            </div>
          </div>

          {/* Balance Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
              isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>
                {isBalanced
                  ? 'Double-Entry Balanced: Total Debits exactly match Total Credits'
                  : 'Out of Balance Warning: Debits do not equal Credits!'}
              </span>
            </div>
            <span className="font-mono font-bold">
              ₹{(impact.totalDebit || 0).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Ledger Impact Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Financial Ledger Debits & Credits
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {(impact.lines || []).length} Line Items
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">GL Account Code & Title</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(impact.lines || []).map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">{line.lineNo}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{line.accountName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{line.accountCode}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {line.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {(line.debit || 0) > 0 ? `₹${(line.debit || 0).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {(line.credit || 0) > 0 ? `₹${(line.credit || 0).toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-semibold border-t border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                    Total Accounting Valuation:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{(impact.totalDebit || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{(impact.totalCredit || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Audit Verification Stamp */}
          <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Automated Operations-to-Ledger Synchronization
            </div>
            <p className="text-blue-700 dark:text-blue-400/90 leading-relaxed">
              This entry is governed by the ERP Continuous Accounting Engine. Any change in operational quantities,
              rejections, or purchase orders automatically re-calculates GRNI clearing, standard cost variances, and GST
              liability across the general ledger without manual journal entry intervention.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 flex items-center gap-1.5 transition">
              <Printer className="w-3.5 h-3.5" /> Print Voucher
            </button>
            <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 flex items-center gap-1.5 transition">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:opacity-90 transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
