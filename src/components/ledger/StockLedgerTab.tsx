// ============================================================================
// TAB 2: STOCK / INVENTORY LEDGER SCREEN
// Step-5 Specification: Stock Overview, Movement Ledger, Accounting Impact Panel
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Layers,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  Calendar,
  Warehouse,
  ChevronRight,
} from 'lucide-react';
import {
  StockOverviewItem,
  StockMovementLedgerItem,
  DocumentAccountingImpact,
} from '../../types/unifiedLedgerTypes';
import { mockStockOverview, mockStockMovements } from '../../data/unifiedLedgerData';

interface Props {
  onOpenAccountingImpact: (impact: DocumentAccountingImpact) => void;
  onOpenDocPreview: (docType: string, docNumber: string, data: any) => void;
  onTraceDoc: (docNumber: string) => void;
}

export const StockLedgerTab: React.FC<Props> = ({
  onOpenAccountingImpact,
  onOpenDocPreview,
  onTraceDoc,
}) => {
  const [subView, setSubView] = useState<'overview' | 'movements'>('overview');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Filtered Stock Overview
  const filteredStock = useMemo(() => {
    return mockStockOverview.filter((item) => {
      const matchCat = filterCategory === 'ALL' || item.category === filterCategory;
      const matchStat = filterStatus === 'ALL' || item.qualityStatus === filterStatus;
      const matchSearch =
        item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.batchLot.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchStat && matchSearch;
    });
  }, [filterCategory, filterStatus, search]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return mockStockMovements.filter((m) => {
      return (
        m.movementId.toLowerCase().includes(search.toLowerCase()) ||
        m.itemCode.toLowerCase().includes(search.toLowerCase()) ||
        m.batchLot.toLowerCase().includes(search.toLowerCase()) ||
        m.sourceDocument.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [search]);

  // Calculate totals
  const totalValuation = useMemo(() => {
    return mockStockOverview.reduce((acc, curr) => acc + curr.stockValue, 0);
  }, []);

  const totalQuarantineVal = useMemo(() => {
    return mockStockOverview
      .filter((i) => i.qualityStatus === 'QC Hold' || i.qualityStatus === 'Quarantine')
      .reduce((acc, curr) => acc + curr.stockValue, 0);
  }, []);

  return (
    <div className="space-y-5">
      {/* Top Banner & Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Inventory Asset Valuation</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            ₹{totalValuation.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
            Perpetual Ledger Reconciled
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Active Batches Tracked</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {mockStockOverview.length} Verified Lots
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">FIFO & W-Avg Valued</span>
        </div>

        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-xs">
          <span className="text-xs text-amber-700 dark:text-amber-400 block mb-1">Quarantined / QC Hold</span>
          <span className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200">
            ₹{totalQuarantineVal.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-amber-600 block mt-0.5">
            LOT-MB-RED-09 Color Deviation
          </span>
        </div>

        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 block mb-1">Stock-to-GL Sync</span>
          <span className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300">
            100% Synced
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">
            Zero Unposted Physical Movements
          </span>
        </div>
      </div>

      {/* Sub-View Switcher & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Toggle between Overview and Movement Ledger */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setSubView('overview')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              subView === 'overview'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Stock Overview ({filteredStock.length})
          </button>
          <button
            onClick={() => setSubView('movements')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              subView === 'movements'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Movement Ledger ({mockStockMovements.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, batch, item..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none w-56"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Categories</option>
            <option value="Raw Material">Raw Material</option>
            <option value="Masterbatch">Masterbatch</option>
            <option value="Finished Goods">Finished Goods</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="Available">Available</option>
            <option value="QC Hold">QC Hold</option>
            <option value="Quarantine">Quarantine</option>
          </select>

          <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition">
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {subView === 'overview' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Item Code & Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Store / Bin</th>
                  <th className="py-3 px-3">Batch / Lot</th>
                  <th className="py-3 px-3 text-right">In Qty</th>
                  <th className="py-3 px-3 text-right">Out Qty</th>
                  <th className="py-3 px-3 text-right">Closing Qty</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Total Value</th>
                  <th className="py-3 px-3">Quality Status</th>
                  <th className="py-3 px-3 text-center">Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStock.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.itemName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{item.itemCode}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {item.store} / {item.location}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {item.batchLot}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      +{item.inQty.toLocaleString()} {item.uom}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      -{item.outQty.toLocaleString()} {item.uom}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {item.closingQty.toLocaleString()} {item.uom}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      ₹{item.unitCost}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{item.stockValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                          item.qualityStatus === 'Available'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {item.qualityStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onTraceDoc(item.batchLot)}
                        title="Trace Batch Lineage"
                        className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Movement Ledger Sub-View */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Movement ID & Time</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Item & Batch</th>
                  <th className="py-3 px-3">Source & Ref Doc</th>
                  <th className="py-3 px-3 text-right">In / Out Qty</th>
                  <th className="py-3 px-3 text-right">Total Value</th>
                  <th className="py-3 px-3">Route (From → To)</th>
                  <th className="py-3 px-3">Accounting Impact</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">{m.movementId}</div>
                      <div className="text-[11px] text-slate-400">{m.dateTime}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold text-[10px]">
                        {m.movementType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{m.itemName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">Lot: {m.batchLot}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <button
                        onClick={() => onOpenDocPreview(m.movementType, m.sourceDocument, {})}
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        {m.sourceDocument} <ExternalLink className="w-3 h-3" />
                      </button>
                      <div className="text-[10px] text-slate-400">{m.referenceDocument}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {m.inQty > 0 ? (
                        <span className="text-emerald-600">+{m.inQty.toLocaleString()}</span>
                      ) : (
                        <span className="text-rose-600">-{m.outQty.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                      ₹{m.totalValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400">
                      {m.fromLocation} → {m.toLocation}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.accountingImpact === 'Posted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {m.accountingImpact}
                      </span>
                      {m.journalEntryNo && (
                        <div className="text-[10px] text-blue-600 font-mono mt-0.5">{m.journalEntryNo}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          onOpenAccountingImpact({
                            documentType: 'Stock',
                            documentNumber: m.movementId,
                            postingDate: m.dateTime.slice(0, 10),
                            status: m.accountingImpact === 'Posted' ? 'Posted' : 'Pending Approval',
                            journalEntryNumber: m.journalEntryNo,
                            costCenter: 'CC-STORE-01',
                            taxImpact: 0,
                            totalDebit: m.totalValue,
                            totalCredit: m.totalValue,
                            lines: [
                              {
                                id: 'act-stk-1',
                                lineNo: 1,
                                accountCode: '1310-00',
                                accountName: 'Physical Stock Inventory Account',
                                accountType: 'Asset',
                                debit: m.inQty > 0 ? m.totalValue : 0,
                                credit: m.outQty > 0 ? m.totalValue : 0,
                              },
                              {
                                id: 'act-stk-2',
                                lineNo: 2,
                                accountCode: '2120-00',
                                accountName: 'GRNI Clearing or Issue Offset',
                                accountType: 'Liability',
                                debit: m.outQty > 0 ? m.totalValue : 0,
                                credit: m.inQty > 0 ? m.totalValue : 0,
                              },
                            ],
                          });
                        }}
                        className="px-2.5 py-1 rounded bg-[#E8622C]/10 text-[#E8622C] hover:bg-[#E8622C]/20 font-semibold text-[11px] transition"
                      >
                        Impact Drawer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
