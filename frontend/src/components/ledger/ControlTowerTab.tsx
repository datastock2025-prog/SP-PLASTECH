// ============================================================================
// TAB 1: UNIFIED OPERATIONS & LEDGER CONTROL TOWER
// Step-4 Specification: 14 KPI Cards, Operational Queues, Exception Panel & Drilldowns
// ============================================================================

import React from 'react';
import {
  Boxes,
  ShoppingCart,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Truck,
  FileWarning,
  FileCheck2,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  Scale,
  Calculator,
  ArrowUpRight,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { LedgerWorkspaceTab, ExceptionItem } from '../../types/unifiedLedgerTypes';

interface Props {
  onNavigateTab: (tab: LedgerWorkspaceTab, filterParam?: string) => void;
  exceptions: ExceptionItem[];
  onOpenExceptionModal: (exc: ExceptionItem) => void;
  onOpenAccountingImpact: (docType: string, docNum: string) => void;
}

export const ControlTowerTab: React.FC<Props> = ({
  onNavigateTab,
  exceptions,
  onOpenExceptionModal,
  onOpenAccountingImpact,
}) => {
  const kpiData = [
    {
      id: 'kpi-stock-val',
      label: 'Stock Valuation',
      value: '₹3,42,80,000',
      subtext: '42,950 units in 3 plants',
      icon: Boxes,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
      tab: 'stock' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-open-po',
      label: 'Open PO Commitments',
      value: '₹48,60,000',
      subtext: '8 active POs awaiting inward',
      icon: ShoppingCart,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      tab: 'purchaseOrder' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-pending-grn',
      label: 'Pending Inward GRNs',
      value: '3 Shipments',
      subtext: 'Dock gate-in cleared',
      icon: Receipt,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      tab: 'grn' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-pending-qc',
      label: 'Pending QC Inspection',
      value: '2 Batches',
      subtext: '₹1.90L held in quarantine',
      icon: ShieldCheck,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
      tab: 'qc' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-qc-reject',
      label: 'QC Rejected / On Hold',
      value: '₹1,90,000',
      subtext: 'LOT-MB-RED-09 held',
      icon: ShieldAlert,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
      tab: 'qc' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-pending-dispatch',
      label: 'Pending Dispatch Queue',
      value: '4 Orders',
      subtext: '₹28.4L finished goods ready',
      icon: Truck,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900',
      tab: 'dispatch' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-dispatched-notinvoiced',
      label: 'Dispatched Not Invoiced',
      value: '₹4,20,000',
      subtext: 'Challan RDC-109 pending billing',
      icon: FileWarning,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900',
      tab: 'exceptions' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-invoiced-notpaid',
      label: 'Invoiced Not Paid (AR)',
      value: '₹68,20,000',
      subtext: 'Within standard 30-day credit',
      icon: FileCheck2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900',
      tab: 'invoiceLedger' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-ap-bal',
      label: 'Accounts Payable (AP)',
      value: '₹54,30,000',
      subtext: 'Vendor ledger balance',
      icon: TrendingDown,
      color: 'text-rose-700 dark:text-rose-300',
      bg: 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
      tab: 'invoiceLedger' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-ar-bal',
      label: 'Accounts Receivable (AR)',
      value: '₹92,40,000',
      subtext: 'Customer total exposure',
      icon: TrendingUp,
      color: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
      tab: 'invoiceLedger' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-unposted',
      label: 'Unposted Operations',
      value: '3 Transactions',
      subtext: 'Awaiting Nightly Batch GL Post',
      icon: Clock,
      color: 'text-slate-700 dark:text-slate-300',
      bg: 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700',
      tab: 'accountingLedger' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-exceptions',
      label: 'Active Ledger Exceptions',
      value: `${exceptions.length} Open Alerts`,
      subtext: 'Requires operational reconciliation',
      icon: AlertOctagon,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
      tab: 'exceptions' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-unmatched-grn',
      label: 'Unmatched GRN / Invoice',
      value: '₹1,90,000',
      subtext: 'GRN-2026-0419 unvouchered GRNI',
      icon: Scale,
      color: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
      tab: 'reconciliation' as LedgerWorkspaceTab,
    },
    {
      id: 'kpi-tax-summary',
      label: 'GST Net Liability',
      value: '₹18,45,000',
      subtext: 'Output GST ₹24.2L - ITC ₹5.75L',
      icon: Calculator,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900',
      tab: 'accountingLedger' as LedgerWorkspaceTab,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E8622C] text-white font-bold tracking-wide uppercase">
              Operations Control Tower
            </span>
            <span className="text-xs text-slate-400">Continuous Accounting Sync: Active</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Unified Operations-to-Ledger Ecosystem
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Every physical material movement, quality disposition, delivery note, and billing invoice is cryptographically
            mapped to general ledger accounts with zero dead-end balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('traceability')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Trace Transaction Lineage
          </button>
          <button
            onClick={() => onNavigateTab('reconciliation')}
            className="px-3.5 py-2 rounded-xl bg-[#E8622C] hover:bg-[#d55320] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Scale className="w-4 h-4" /> Run 3-Way Auto-Match
          </button>
        </div>
      </div>

      {/* 14 KPI Cards Grid (Step-4 Prompt Requirement) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Operational & Financial Vital Signs (Click card to drill-down)
          </h3>
          <span className="text-xs text-slate-400">14 Core Dimensions</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {kpiData.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <button
                key={kpi.id}
                onClick={() => onNavigateTab(kpi.tab)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between hover:shadow-md transition cursor-pointer ${kpi.bg} group`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 line-clamp-1">
                    {kpi.label}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-100 transition" />
                </div>
                <div>
                  <div className={`text-base font-bold tracking-tight ${kpi.color}`}>
                    {kpi.value}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {kpi.subtext}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Operational Queues & Exception Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Operational Work Queues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Pipeline Queues */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Operations Pipeline Queues & Ledger Impact
                </h3>
                <p className="text-xs text-slate-500">Live operational documents awaiting next workflow stage</p>
              </div>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded font-semibold">
                P2P & O2C Real-time
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              {/* PO awaiting GRN */}
              <div
                onClick={() => onNavigateTab('purchaseOrder')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer transition flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-500" /> PO Awaiting GRN Inward
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">PO-2026-0855: 500 KG Clariant Red MB</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 dark:text-slate-100">₹2.00L Open</div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">View POs →</span>
                </div>
              </div>

              {/* GRN awaiting QC */}
              <div
                onClick={() => onNavigateTab('qc')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer transition flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> GRN Awaiting QC Clearance
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">GRN-2026-0419: Dock Bin Quarantined</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-purple-600 dark:text-purple-400">1 Pending</div>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">QC Queue →</span>
                </div>
              </div>

              {/* Stock received but not invoiced */}
              <div
                onClick={() => onNavigateTab('reconciliation')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-700 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer transition flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-500" /> Stock Inward (Uninvoiced GRNI)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Accrued in GL Account 2120-00</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400">₹1.90L GRNI</div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Reconcile →</span>
                </div>
              </div>

              {/* Dispatched but not invoiced */}
              <div
                onClick={() => onNavigateTab('dispatch')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-700 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer transition flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-500" /> Dispatched Awaiting Invoice
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">DSP-2026-0511 delivered to Bajaj Auto</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-cyan-600 dark:text-cyan-400">₹4.20L COGS</div>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">Create Bill →</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Trace Search Highlight */}
          <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 border border-purple-200 dark:border-purple-800/50 rounded-xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  Ready to audit the latest Procure-to-Pay or Order-to-Cash loop?
                </div>
                <div className="text-slate-500">
                  Lineage traces PO-2026-0842 → GRN-2026-0412 → QC-2026-0189 → INV-SUP-7721 → JE-2026-0920 → PMT
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('traceability')}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shrink-0 transition"
            >
              Open Interactive Lineage Graph →
            </button>
          </div>
        </div>

        {/* Right Col: Step-4 Exception Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Exception Panel (Action Required)
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded font-semibold">
                {exceptions.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Exception-First Architecture: Resolve mismatches before period close.
            </p>

            {/* List of Exceptions */}
            <div className="space-y-2.5">
              {exceptions.map((exc) => (
                <div
                  key={exc.id}
                  onClick={() => onOpenExceptionModal(exc)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/20 dark:hover:bg-rose-950/20 cursor-pointer transition text-xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        exc.severity === 'Critical'
                          ? 'bg-red-500 text-white'
                          : exc.severity === 'High'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {exc.severity}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{exc.category}</span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                    {exc.documentNumber}: {exc.entity}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {exc.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Impact: ₹{(exc.financialImpact || 0).toLocaleString('en-IN')}</span>
                    <span className="text-rose-600 font-semibold group-hover:underline flex items-center gap-0.5">
                      Resolve <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('exceptions')}
            className="w-full mt-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-center transition"
          >
            Open Comprehensive Exception Register ({exceptions.length})
          </button>
        </div>
      </div>
    </div>
  );
};
