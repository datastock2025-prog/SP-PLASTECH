// ============================================================================
// UNIFIED OPERATIONS-TO-LEDGER WORKSPACE: HEADER & UNIVERSAL CONTROLS
// Information Architecture Step-3: Global Context Selector, 11 Tabs, Quick Actions
// ============================================================================

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Receipt,
  ShieldCheck,
  Truck,
  FileSpreadsheet,
  BookOpen,
  GitMerge,
  Scale,
  AlertOctagon,
  Search,
  Building2,
  Warehouse,
  Calendar,
  DollarSign,
  UserCheck,
  Bookmark,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Download,
  Share2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  LedgerWorkspaceTab,
  GlobalWorkspaceContext,
  UserWorkspaceRole,
} from '../../types/unifiedLedgerTypes';

interface Props {
  activeTab: LedgerWorkspaceTab;
  onTabChange: (tab: LedgerWorkspaceTab) => void;
  context: GlobalWorkspaceContext;
  onContextChange: (newContext: Partial<GlobalWorkspaceContext>) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onQuickAction: (action: string) => void;
  openExceptionsCount: number;
}

export const UnifiedLedgerHeader: React.FC<Props> = ({
  activeTab,
  onTabChange,
  context,
  onContextChange,
  searchQuery,
  onSearchChange,
  onQuickAction,
  openExceptionsCount,
}) => {
  const [showQuickActionsDropdown, setShowQuickActionsDropdown] = useState(false);

  const tabs: { id: LedgerWorkspaceTab; label: string; icon: any; badge?: number }[] = [
    { id: 'controlTower', label: 'Control Tower', icon: LayoutDashboard },
    { id: 'stock', label: 'Stock Ledger', icon: Boxes },
    { id: 'purchaseOrder', label: 'Purchase Order', icon: ShoppingCart },
    { id: 'grn', label: 'GRN / Inward', icon: Receipt },
    { id: 'qc', label: 'QC Inspection', icon: ShieldCheck },
    { id: 'dispatch', label: 'Dispatch & SO', icon: Truck },
    { id: 'invoiceLedger', label: 'Invoice Register', icon: FileSpreadsheet },
    { id: 'accountingLedger', label: 'Accounting Ledger', icon: BookOpen },
    { id: 'traceability', label: 'End-to-End Trace', icon: GitMerge },
    { id: 'reconciliation', label: 'Reconciliation', icon: Scale },
    { id: 'exceptions', label: 'Exceptions & Audit', icon: AlertOctagon, badge: openExceptionsCount },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      {/* Upper Bar: Title & Global Context Selector */}
      <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8622C] to-amber-600 text-white flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Operations-to-Ledger Workspace
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8622C]/10 text-[#E8622C] border border-[#E8622C]/20">
                Single-Roof Traceability
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stock <span className="text-slate-300 dark:text-slate-600">•</span> PO <span className="text-slate-300 dark:text-slate-600">•</span> GRN <span className="text-slate-300 dark:text-slate-600">•</span> QC <span className="text-slate-300 dark:text-slate-600">•</span> Dispatch <span className="text-slate-300 dark:text-slate-600">•</span> Invoice <span className="text-slate-300 dark:text-slate-600">•</span> GL Lineage
            </p>
          </div>
        </div>

        {/* Global Context Pickers */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Entity Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
            <Building2 className="w-3.5 h-3.5 text-[#E8622C]" />
            <select
              value={context.entity}
              onChange={(e) => onContextChange({ entity: e.target.value })}
              className="bg-transparent border-none outline-none cursor-pointer pr-1 text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="Reboot Polymers Ltd">Reboot Polymers Ltd</option>
              <option value="Reboot AutoComponents Pvt">Reboot AutoComponents Pvt</option>
            </select>
          </div>

          {/* Plant Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
            <Warehouse className="w-3.5 h-3.5 text-blue-500" />
            <select
              value={context.plantId}
              onChange={(e) => onContextChange({ plantId: e.target.value })}
              className="bg-transparent border-none outline-none cursor-pointer pr-1 text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="ALL">All Facilities</option>
              <option value="Plant 01 — Pune Hub">Plant 01 — Pune Hub</option>
              <option value="Plant 02 — Sanand Precision">Plant 02 — Sanand Precision</option>
              <option value="Plant 03 — Chennai Coastal">Plant 03 — Chennai Coastal</option>
            </select>
          </div>

          {/* Fiscal Period */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <select
              value={context.period}
              onChange={(e) => onContextChange({ period: e.target.value })}
              className="bg-transparent border-none outline-none cursor-pointer pr-1 text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="FY 2026-27 / P-06 (Sep 2026)">FY 2026-27 / P-06 (Sep 2026)</option>
              <option value="FY 2026-27 / P-05 (Aug 2026)">FY 2026-27 / P-05 (Aug 2026)</option>
              <option value="FY 2026-27 / Q2">FY 2026-27 / Q2</option>
            </select>
          </div>

          {/* User Role */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-purple-500" />
            <select
              value={context.userRole}
              onChange={(e) => onContextChange({ userRole: e.target.value as UserWorkspaceRole })}
              className="bg-transparent border-none outline-none cursor-pointer pr-1 text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="finance_manager">Finance Manager</option>
              <option value="warehouse_manager">Warehouse Manager</option>
              <option value="purchase_user">Purchase User</option>
              <option value="sales_user">Sales User</option>
              <option value="quality_user">Quality User</option>
              <option value="management">Executive Management</option>
              <option value="admin">System Admin</option>
            </select>
          </div>

          {/* Quick Actions Button */}
          <div className="relative">
            <button
              onClick={() => setShowQuickActionsDropdown(!showQuickActionsDropdown)}
              className="px-3 py-1.5 bg-[#E8622C] hover:bg-[#d55320] text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Quick Action
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showQuickActionsDropdown && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    onQuickAction('create_po');
                    setShowQuickActionsDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <ShoppingCart className="w-4 h-4 text-blue-500" /> + Create Purchase Order
                </button>
                <button
                  onClick={() => {
                    onQuickAction('create_grn');
                    setShowQuickActionsDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Receipt className="w-4 h-4 text-emerald-500" /> + Create Goods Receipt (GRN)
                </button>
                <button
                  onClick={() => {
                    onQuickAction('create_qc');
                    setShowQuickActionsDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-500" /> + Log QC Inspection
                </button>
                <button
                  onClick={() => {
                    onQuickAction('create_dispatch');
                    setShowQuickActionsDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Truck className="w-4 h-4 text-amber-500" /> + Create Dispatch Note
                </button>
                <button
                  onClick={() => {
                    onQuickAction('create_invoice');
                    setShowQuickActionsDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-500" /> + Post Invoice (Tax Bill)
                </button>
                <button
                  onClick={() => {
                    onQuickAction('create_je');
                    setShowQuickActionsDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <BookOpen className="w-4 h-4 text-[#E8622C]" /> + Manual Journal Entry
                </button>
                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <button
                  onClick={() => {
                    onQuickAction('run_recon');
                    setShowQuickActionsDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium"
                >
                  <Scale className="w-4 h-4 text-indigo-500" /> Run Full 3-Way Reconciliation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Bar: Global Search & Quick Links */}
      <div className="px-6 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Universal Search across PO, GRN, Batch #, Item, Delivery Note, Invoice, JE, or Supplier..."
            className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#E8622C] text-slate-900 dark:text-slate-100"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => onTabChange('traceability')}
            className="px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1.5 transition border border-purple-200 dark:border-purple-800"
          >
            <GitMerge className="w-3.5 h-3.5" /> Trace Search
          </button>
          <button
            onClick={() => onTabChange('reconciliation')}
            className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5 transition border border-blue-200 dark:border-blue-800"
          >
            <Scale className="w-3.5 h-3.5" /> Reconcile GRN/Invoice
          </button>
          <button
            onClick={() => onTabChange('exceptions')}
            className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1.5 transition border border-rose-200 dark:border-rose-800"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Exceptions ({openExceptionsCount})
          </button>
        </div>
      </div>

      {/* Lower Bar: 11 Workspace Navigation Tabs */}
      <div className="px-6 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'border-[#E8622C] text-[#E8622C] bg-[#E8622C]/5 dark:bg-[#E8622C]/10'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#E8622C]' : 'text-slate-400'}`} />
              {t.label}
              {typeof t.badge === 'number' && t.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
