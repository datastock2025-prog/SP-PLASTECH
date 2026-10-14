// ============================================================================
// TAB 11: EXCEPTIONS WORKBENCH & AUDIT TRAIL
// Step-15 Specification: Categorized Exceptions, Root Cause Analysis, Resolution & Audit
// ============================================================================

import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  FileCheck2,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  UserCheck,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ExceptionItem } from '../../types/unifiedLedgerTypes';
import { mockExceptions } from '../../data/unifiedLedgerData';

interface Props {
  exceptions: ExceptionItem[];
  onOpenExceptionModal: (exc: ExceptionItem) => void;
  onTraceDoc: (docNumber: string) => void;
  onShowToast: (msg: string) => void;
}

export const ExceptionsAuditTab: React.FC<Props> = ({
  exceptions,
  onOpenExceptionModal,
  onTraceDoc,
  onShowToast,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredExceptions = exceptions.filter((exc) => {
    const matchCat = filterCategory === 'ALL' || exc.category === filterCategory;
    const matchSev = filterSeverity === 'ALL' || exc.severity === filterSeverity;
    const matchSearch =
      exc.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
      exc.entity.toLowerCase().includes(search.toLowerCase()) ||
      exc.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSev && matchSearch;
  });

  const auditEvents = [
    {
      id: 'aud-1',
      time: '2026-09-15 17:30:11',
      user: 'Anita Desai (Quality Lead)',
      action: 'Placed Batch LOT-MB-RED-09 on QC Hold',
      document: 'QC-2026-0205',
      reason: 'Color spectrum Delta-E tolerance deviation (1.8 > 0.8)',
    },
    {
      id: 'aud-2',
      time: '2026-09-14 14:15:02',
      user: 'Rajesh Sharma (Finance Controller)',
      action: 'Approved 3-Way Match & Released Payment Voucher',
      document: 'INV-SUP-7721',
      reason: 'Congruent with GRN-2026-0412 & PO-2026-0842',
    },
    {
      id: 'aud-3',
      time: '2026-09-12 11:05:44',
      user: 'Suresh Menon (Warehouse Head)',
      action: 'Cleared Gate Inward & Generated Accrual JE',
      document: 'GRN-2026-0412',
      reason: 'Physical weighbridge verified: 10,000 KG net weight',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                Step-15 Exception-First Architecture
              </span>
              <span className="text-xs text-slate-400">Zero-Compromise Financial Integrity</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Operations & Ledger Exception Workbench
            </h2>
            <p className="text-xs text-slate-500">
              Isolate, investigate, and reconcile discrepancies across receipt quantities, quality holds, tax variances, and uninvoiced movements.
            </p>
          </div>

          <button
            onClick={() => onShowToast('Audit report exported: PDF generated with cryptographic verification hashes.')}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" /> Export Statutory Auditor Package
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exceptions..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none w-56"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Categories</option>
            <option value="QC Hold">QC Hold</option>
            <option value="GRN Variance">GRN Variance</option>
            <option value="Invoice Mismatch">Invoice Mismatch</option>
            <option value="Dispatch Delay">Dispatch Delay</option>
            <option value="Period Close">Period Close</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>

          <span className="text-slate-400 ml-auto font-mono text-xs">
            Showing {filteredExceptions.length} of {exceptions.length} Alerts
          </span>
        </div>
      </div>

      {/* Exception Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Severity & Category</th>
                <th className="py-2.5 px-3">Document Reference</th>
                <th className="py-2.5 px-3">Entity / Party</th>
                <th className="py-2.5 px-3">Description & Root Cause</th>
                <th className="py-2.5 px-3 text-right">Financial Exposure</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Age</th>
                <th className="py-2.5 px-3 text-center">Resolve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExceptions.map((exc) => (
                <tr key={exc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          exc.severity === 'Critical'
                            ? 'bg-rose-500 text-white'
                            : exc.severity === 'High'
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {exc.severity}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{exc.category}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    <button onClick={() => onTraceDoc(exc.documentNumber)} className="hover:underline flex items-center gap-1">
                      {exc.documentNumber} <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium">
                    {exc.entity}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-sm">
                    {exc.description}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₹{(exc.financialImpact || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        exc.status === 'Open'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {exc.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{exc.ageDays} Days</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onOpenExceptionModal(exc)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-lg font-semibold text-[11px] transition border border-rose-200 dark:border-rose-800"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Trail Section (Step-15 Specification) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Immutable Operations-to-Ledger Event Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Every manual change, approval, inspection disposition, and ledger adjustment is cryptographically timestamped
            </p>
          </div>
          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded">
            Append-Only Log Active
          </span>
        </div>

        <div className="space-y-3">
          {auditEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{evt.action}</span>
                  <span className="font-mono text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded text-[10px]">
                    {evt.document}
                  </span>
                </div>
                <div className="text-slate-500">{evt.reason}</div>
              </div>

              <div className="text-right">
                <div className="font-medium text-slate-700 dark:text-slate-300">{evt.user}</div>
                <div className="text-[11px] text-slate-400 font-mono">{evt.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
