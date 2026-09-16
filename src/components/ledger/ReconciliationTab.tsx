// ============================================================================
// TAB 10: RECONCILIATION & MATCHING ENGINE
// Step-14 Specification: 3-Way, 2-Way, GRNI Aging, Stock-to-GL & Matching Workspace
// ============================================================================

import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Receipt,
  FileSpreadsheet,
  SlidersHorizontal,
} from 'lucide-react';
import { ReconciliationRuleItem } from '../../types/unifiedLedgerTypes';
import { mockReconciliationRules } from '../../data/unifiedLedgerData';

interface Props {
  onShowToast: (msg: string) => void;
  onOpenDocPreview: (docType: string, docNumber: string, data: any) => void;
}

export const ReconciliationTab: React.FC<Props> = ({
  onShowToast,
  onOpenDocPreview,
}) => {
  const [activeReconType, setActiveReconType] = useState<string>('3-Way Match');
  const [priceTolerance, setPriceTolerance] = useState<number>(0.5);
  const [qtyTolerance, setQtyTolerance] = useState<number>(1.0);
  const [matchingStatus, setMatchingStatus] = useState<string>('Idle');

  const handleRunAutoMatch = () => {
    setMatchingStatus('Running');
    setTimeout(() => {
      setMatchingStatus('Completed');
      onShowToast('3-Way Auto-Match completed: 18 line items verified. 0 variances outside tolerances.');
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                Step-14 Matching & Reconciliation Engine
              </span>
              <span className="text-xs text-slate-400">Automated Financial Integrity Checks</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Three-Way & Sub-Ledger Matching Workbench
            </h2>
            <p className="text-xs text-slate-500">
              Reconcile operational receiving documents with commercial vendor bills, warehouse inventories, and GL accounts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAutoMatch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Run AI 3-Way Auto-Match
            </button>
          </div>
        </div>

        {/* Tolerance Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              Tolerance Thresholds:
            </span>
            <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              Price Tolerance:
              <input
                type="number"
                step="0.1"
                value={priceTolerance}
                onChange={(e) => setPriceTolerance(parseFloat(e.target.value))}
                className="w-16 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-center font-mono font-bold"
              />
              %
            </label>
            <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              Qty Tolerance:
              <input
                type="number"
                step="0.1"
                value={qtyTolerance}
                onChange={(e) => setQtyTolerance(parseFloat(e.target.value))}
                className="w-16 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-center font-mono font-bold"
              />
              %
            </label>
          </div>

          <div className="text-xs text-slate-400">
            Current Status:{' '}
            <span className="font-semibold text-emerald-600">
              {matchingStatus === 'Running' ? 'Analyzing...' : 'All Lines Within Configured Tolerances'}
            </span>
          </div>
        </div>
      </div>

      {/* 6 Core Reconciliation Dimensions Grid (Step-14 Specification) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockReconciliationRules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{rule.reconType}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  rule.status === 'Reconciled'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {rule.status}
              </span>
            </div>

            <p className="text-slate-500 text-[11px] leading-relaxed">{rule.description}</p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tolerance Setting:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{rule.tolerance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Variance:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  ₹{rule.varianceAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Verified:</span>
                <span className="text-slate-500 text-[11px]">{rule.lastRunTime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive 3-Way Match Reconciliation Workbench */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Interactive 3-Way Reconciliation Stage (Split Workbench)
            </h3>
            <p className="text-xs text-slate-500">
              Match unvouchered dock goods receipts on the left against incoming vendor tax invoices on the right
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded">
            Auto-Link Algorithm: Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Unmatched / Active GRN Receipts */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" /> Physical Dock Inward Receipts (GRN)
              </span>
              <span className="text-[11px] text-slate-400">Accrued in GL 2120-00</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs shadow-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-emerald-600">GRN-2026-0412</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  100% Passed QC
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Item: Polypropylene Homopolymer (10,000 KG @ ₹125/KG)
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-400">Supplier: Reliance Industries</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹12,50,000</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Incoming Vendor Tax Invoices */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" /> Vendor Tax Invoices (AP Register)
              </span>
              <span className="text-[11px] text-slate-400">GSTR-2B Verified</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs shadow-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-purple-600">INV-SUP-7721</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                  Matched 1:1
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                Taxable: ₹12,50,000 + GST 18% (₹2,25,000) = ₹14,75,000
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-400">IRN: Verified on NIC</span>
                <span className="font-mono font-bold text-purple-600">Zero Deviation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Reconciliation Action Confirmation */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-emerald-900 dark:text-emerald-200">
                Perfect Match: GRN-2026-0412 ⟷ INV-SUP-7721 ⟷ PO-2026-0842
              </div>
              <div className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px]">
                Quantities, base unit prices, GST rates, and payment terms are 100% congruent. Voucher JE-2026-0920 posted.
              </div>
            </div>
          </div>
          <button
            onClick={() => onShowToast('Reconciliation seal re-affirmed. Audit log timestamped.')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition shrink-0"
          >
            Affirm Audit Seal
          </button>
        </div>
      </div>
    </div>
  );
};
