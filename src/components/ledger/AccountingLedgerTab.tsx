// ============================================================================
// TAB 8: ACCOUNTING LEDGER & GENERAL LEDGER WORKSPACE
// Step-12 Specification: Journal Entries, Account Ledgers, Trial Balance, Sub-ledger Sync
// ============================================================================

import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  Layers,
  FileCheck2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Download,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { JournalEntryItem, DocumentAccountingImpact } from '../../types/unifiedLedgerTypes';
import { mockJournalEntries } from '../../data/unifiedLedgerData';

interface Props {
  onOpenAccountingImpact: (impact: DocumentAccountingImpact) => void;
  onOpenDocPreview: (docType: string, docNumber: string, data: any) => void;
  onTraceDoc: (docNumber: string) => void;
}

export const AccountingLedgerTab: React.FC<Props> = ({
  onOpenAccountingImpact,
  onOpenDocPreview,
  onTraceDoc,
}) => {
  const [subView, setSubView] = useState<'journals' | 'subLedgerRecon' | 'trialBalance'>('journals');
  const [selectedJe, setSelectedJe] = useState<JournalEntryItem>(mockJournalEntries[0]);

  // Sub-ledger to GL reconciliation stats
  const subLedgerMetrics = [
    {
      title: 'Physical Stock Ledger ⟷ GL Inventory (1310-00)',
      subLedgerVal: '₹3,42,80,000',
      glVal: '₹3,42,80,000',
      variance: '₹0.00',
      status: 'Perfect Match',
    },
    {
      title: 'GRNI Clearing (2120-00) Aging Balance',
      subLedgerVal: '₹1,90,000',
      glVal: '₹1,90,000',
      variance: '₹0.00',
      status: 'Unvouchered Inward',
    },
    {
      title: 'AP Subledger (Vendors) ⟷ GL AP (2110-00)',
      subLedgerVal: '₹54,30,000',
      glVal: '₹54,30,000',
      variance: '₹0.00',
      status: 'Perfect Match',
    },
    {
      title: 'AR Subledger (Customers) ⟷ GL AR (1210-00)',
      subLedgerVal: '₹92,40,000',
      glVal: '₹92,40,000',
      variance: '₹0.00',
      status: 'Perfect Match',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Journal Postings</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {mockJournalEntries.length} Posted Vouchers
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">Continuous Auto-Posting</span>
        </div>
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 block mb-1">Sub-ledger Reconciliation</span>
          <span className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300">
            100% Synced
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">Zero Out-of-Balance JEs</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Debits / Credits Verified</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            ₹59,65,200
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Dr = Cr Balanced</span>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 shadow-xs">
          <span className="text-xs text-purple-700 dark:text-purple-400 block mb-1">Period Closing Health</span>
          <span className="text-xl font-bold font-mono text-purple-800 dark:text-purple-300">
            Audit Ready
          </span>
          <span className="text-[11px] text-purple-600 block mt-0.5">All Cost Centers Tagged</span>
        </div>
      </div>

      {/* Sub-view switcher */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setSubView('journals')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              subView === 'journals'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Journal Voucher Register ({mockJournalEntries.length})
          </button>
          <button
            onClick={() => setSubView('subLedgerRecon')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              subView === 'subLedgerRecon'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sub-Ledger vs General Ledger Ties
          </button>
        </div>

        <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition">
          <Download className="w-3.5 h-3.5" /> Export GL Audit File
        </button>
      </div>

      {subView === 'journals' && (
        <>
          {/* Journal Entries Master Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Automated Double-Entry Journal Voucher Register
                </h3>
                <p className="text-[11px] text-slate-500">
                  Every entry is cryptographically anchored to its operational source document
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">{mockJournalEntries.length} Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">JE Number & Date</th>
                    <th className="py-2.5 px-3">Source Module</th>
                    <th className="py-2.5 px-3">Source Doc #</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Approved By</th>
                    <th className="py-2.5 px-3 text-center">Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mockJournalEntries.map((je) => {
                    const isSelected = selectedJe.id === je.id;
                    return (
                      <tr
                        key={je.id}
                        onClick={() => setSelectedJe(je)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-l-4 border-l-[#E8622C]'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-[#E8622C]">{je.jeNumber}</div>
                          <div className="text-[11px] text-slate-400">{je.postingDate}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                            {je.sourceModule}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-blue-600">
                          {je.sourceDocNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {je.description}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          ₹{je.totalDebit.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          ₹{je.totalCredit.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
                            {je.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500">{je.approvedBy}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTraceDoc(je.jeNumber);
                            }}
                            className="p-1 text-purple-600 hover:bg-purple-100 rounded transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected JE Line Items Detail (Step-12 Mandate) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {selectedJe.jeNumber} Line Breakdown ({selectedJe.lines.length} Accounting Entries)
                </h4>
                <p className="text-xs text-slate-500">
                  Document Date: {selectedJe.documentDate} • Cost Center: {selectedJe.lines[0]?.costCenter} • Plant: {selectedJe.lines[0]?.plant}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Balance Check:</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  ✓ Dr ₹{selectedJe.totalDebit.toLocaleString('en-IN')} = Cr ₹{selectedJe.totalCredit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Account Code & Name</th>
                    <th className="py-2 px-3">Account Type</th>
                    <th className="py-2 px-3 text-right">Debit (Dr)</th>
                    <th className="py-2 px-3 text-right">Credit (Cr)</th>
                    <th className="py-2 px-3">Cost Center</th>
                    <th className="py-2 px-3">Item / Batch / Ref</th>
                    <th className="py-2 px-3">Line Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedJe.lines.map((l) => (
                    <tr key={l.lineNo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono text-slate-400">{l.lineNo}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{l.accountName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{l.accountCode}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]">
                          {l.accountType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {l.debit > 0 ? `₹${l.debit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {l.credit > 0 ? `₹${l.credit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{l.costCenter}</td>
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                        {l.batchLot || l.itemCode || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{l.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {subView === 'subLedgerRecon' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Sub-Ledger to General Ledger Real-Time Reconciliation Matrix
            </h4>
            <div className="space-y-3">
              {subLedgerMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{metric.title}</span>
                    <span className="text-slate-500 text-[11px]">Continuously verified by automated balance daemon</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sub-ledger:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{metric.subLedgerVal}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">GL Account:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{metric.glVal}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Variance:</span>
                      <span className="font-mono font-bold text-emerald-600">{metric.variance}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px]">
                      {metric.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
