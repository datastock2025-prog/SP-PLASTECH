// ============================================================================
// TAB 4: GRN / GOODS RECEIPT SCREEN CONNECTED TO PO, QC, STOCK & LEDGER
// Step-7 Specification: Queue, Header Fields, Line Grid, Quantity Logic, GL Preview
// ============================================================================

import React, { useState } from 'react';
import {
  Receipt,
  ShoppingCart,
  ShieldCheck,
  Boxes,
  Truck,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Eye,
  Download,
  Calendar,
  Building,
  UserCheck,
} from 'lucide-react';
import { GrnRecord, DocumentAccountingImpact } from '../../types/unifiedLedgerTypes';
import { mockGrnRecords } from '../../data/unifiedLedgerData';

interface Props {
  onOpenAccountingImpact: (impact: DocumentAccountingImpact) => void;
  onOpenDocPreview: (docType: string, docNumber: string, data: any) => void;
  onTraceDoc: (docNumber: string) => void;
  onNavigateToQc: (qcId: string) => void;
}

export const GrnLedgerTab: React.FC<Props> = ({
  onOpenAccountingImpact,
  onOpenDocPreview,
  onTraceDoc,
  onNavigateToQc,
}) => {
  const [selectedGrn, setSelectedGrn] = useState<GrnRecord>(mockGrnRecords[0]);

  return (
    <div className="space-y-6">
      {/* KPI & Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Inward GRN Receipts</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            ₹14,40,000
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">2 Inward Consignments</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Posted to Inventory Asset</span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ₹12,50,000
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">GL A/C 1310-01 Updated</span>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-xs">
          <span className="text-xs text-amber-700 dark:text-amber-400 block mb-1">Pending QC Inward Gate</span>
          <span className="text-xl font-bold font-mono text-amber-800 dark:text-amber-300">
            ₹1,90,000
          </span>
          <span className="text-[11px] text-amber-600 block mt-0.5">GRN-2026-0419 Quarantined</span>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/40 shadow-xs">
          <span className="text-xs text-blue-700 dark:text-blue-400 block mb-1">GRNI Clearing Balance</span>
          <span className="text-xl font-bold font-mono text-blue-800 dark:text-blue-300">
            ₹1,90,000
          </span>
          <span className="text-[11px] text-blue-600 block mt-0.5">GL A/C 2120-00 Unvouchered</span>
        </div>
      </div>

      {/* GRN Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Goods Receipt Note (GRN) Operational Ledger
            </h3>
            <p className="text-[11px] text-slate-500">Live dock-inward receipts, QC gate statuses, and accounting journal ties</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{mockGrnRecords.length} GRNs Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">GRN # & Date</th>
                <th className="py-2.5 px-3">PO Reference</th>
                <th className="py-2.5 px-3">Supplier & Invoice/Challan</th>
                <th className="py-2.5 px-3">Vehicle / Gate #</th>
                <th className="py-2.5 px-3">QC Mode</th>
                <th className="py-2.5 px-3 text-right">Received Val</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">GL Impact</th>
                <th className="py-2.5 px-3 text-center">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mockGrnRecords.map((grn) => {
                const isSelected = selectedGrn.id === grn.id;
                return (
                  <tr
                    key={grn.id}
                    onClick={() => setSelectedGrn(grn)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-l-4 border-l-emerald-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {grn.grnNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">{grn.grnDate}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                      {grn.poNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{grn.supplier}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Challan: {grn.supplierInvoiceChallan}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {grn.vehicleNumber} / {grn.gateEntryNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                        {grn.qcMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₹{grn.totalReceivedValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          grn.status === 'Posted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {grn.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAccountingImpact(grn.accountingImpact);
                        }}
                        className="p-1.5 text-[#E8622C] hover:bg-[#E8622C]/10 rounded-lg transition font-semibold"
                        title="View GL Accrual Posting"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTraceDoc(grn.grnNumber);
                        }}
                        className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition"
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

      {/* Selected GRN Inspection & Item Grid (Step-7 Columns) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {selectedGrn.grnNumber} Inward Inspection & Putaway Grid
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {selectedGrn.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gate Entry: {selectedGrn.gateEntryNumber} | Store: {selectedGrn.receivingStore} | Truck: {selectedGrn.vehicleNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedGrn.linkedQcId && (
              <button
                onClick={() => onNavigateToQc(selectedGrn.linkedQcId!)}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-lg font-semibold text-xs border border-purple-200 dark:border-purple-800 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> View QC Report ({selectedGrn.linkedQcId})
              </button>
            )}
            <button
              onClick={() => onOpenAccountingImpact(selectedGrn.accountingImpact)}
              className="px-3 py-1.5 bg-[#E8622C] text-white rounded-lg font-semibold text-xs hover:bg-[#d55320] flex items-center gap-1.5 shadow-xs transition"
            >
              <Layers className="w-3.5 h-3.5" /> View GRN Accounting Impact
            </button>
          </div>
        </div>

        {/* Step-7 Detailed Columns Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Item Code & Name</th>
                  <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                  <th className="py-2.5 px-3 text-right">Received Qty</th>
                  <th className="py-2.5 px-3 text-right">Accepted Qty</th>
                  <th className="py-2.5 px-3 text-right">Rejected</th>
                  <th className="py-2.5 px-3">Batch / Lot #</th>
                  <th className="py-2.5 px-3">Mfg / Expiry</th>
                  <th className="py-2.5 px-3">Putaway Bin</th>
                  <th className="py-2.5 px-3">Quality Status</th>
                  <th className="py-2.5 px-3">COA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedGrn.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{line.itemName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{line.itemCode}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {line.orderedQty.toLocaleString()} {line.uom}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {line.currentReceivedQty.toLocaleString()} {line.uom}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                      {line.acceptedQty.toLocaleString()} {line.uom}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                      {line.rejectedQty.toLocaleString()} {line.uom}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-purple-600 dark:text-purple-400">
                      {line.lotBatchNumber}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500 font-mono">
                      {line.mfgDate} / {line.expiryDate}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {line.locationCode}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          line.qualityStatus === 'Passed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {line.qualityStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-medium">
                        {line.coaStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accounting Impact Preview Box (Step-7 mandate) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>Automatic Double-Entry Journal Voucher Posted for {selectedGrn.grnNumber}</span>
            <span className="font-mono text-slate-400">
              Voucher #{selectedGrn.accountingImpact.journalEntryNumber || 'Pending'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-semibold">
                Debit (Dr) Inventory Asset:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                ₹{selectedGrn.accountingImpact.totalDebit.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500 block">A/C 1310-01 Raw Material Polymer</span>
            </div>
            <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/40">
              <span className="text-[11px] text-blue-700 dark:text-blue-300 block font-semibold">
                Credit (Cr) GRNI Clearing Accrual:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                ₹{selectedGrn.accountingImpact.totalCredit.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500 block">A/C 2120-00 Goods Received Not Invoiced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
