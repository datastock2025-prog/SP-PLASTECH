// ============================================================================
// TAB 3: PURCHASE ORDER MANAGEMENT & TRACEABILITY
// Step-6 Specification: PO List, 9 Detail Tabs, Line Items, Commitment & Trace Panel
// ============================================================================

import React, { useState } from 'react';
import {
  ShoppingCart,
  Receipt,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ExternalLink,
  ChevronRight,
  Download,
  Filter,
  Search,
  Building,
  Calendar,
  FileText,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { PurchaseOrderRecord, DocumentAccountingImpact } from '../../types/unifiedLedgerTypes';
import { mockPurchaseOrders } from '../../data/unifiedLedgerData';

interface Props {
  onOpenAccountingImpact: (impact: DocumentAccountingImpact) => void;
  onOpenDocPreview: (docType: string, docNumber: string, data: any) => void;
  onTraceDoc: (docNumber: string) => void;
}

export const PurchaseOrderTab: React.FC<Props> = ({
  onOpenAccountingImpact,
  onOpenDocPreview,
  onTraceDoc,
}) => {
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderRecord>(mockPurchaseOrders[0]);
  const [detailTab, setDetailTab] = useState<
    'overview' | 'items' | 'approvals' | 'grnHistory' | 'qcImpact' | 'invoiceMatch' | 'ledgerImpact'
  >('items');

  return (
    <div className="space-y-6">
      {/* Top PO Master Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Procurement Commitments</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            ₹17,00,000
          </span>
          <span className="text-[11px] text-blue-600 block mt-0.5">2 Orders in Scope</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Received at Docks (GRN)</span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ₹15,00,000
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">88.2% Inward Completed</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Invoiced by Suppliers</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            ₹12,50,000
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Matched with GRN-0412</span>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-xs">
          <span className="text-xs text-amber-700 dark:text-amber-400 block mb-1">Pending Invoice Accrual (GRNI)</span>
          <span className="text-xl font-bold font-mono text-amber-800 dark:text-amber-300">
            ₹2,50,000
          </span>
          <span className="text-[11px] text-amber-600 block mt-0.5">Unbilled Delivery Received</span>
        </div>
      </div>

      {/* PO Master Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Purchase Order Register with Upstream & Downstream Statuses
            </h3>
            <p className="text-[11px] text-slate-500">Select any PO to drill down into line items and 3-way matching</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{mockPurchaseOrders.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">PO Number & Date</th>
                <th className="py-2.5 px-3">Supplier & GSTIN</th>
                <th className="py-2.5 px-3 text-right">PO Value</th>
                <th className="py-2.5 px-3 text-right">Received Val</th>
                <th className="py-2.5 px-3 text-right">Invoiced Val</th>
                <th className="py-2.5 px-3">GRN Status</th>
                <th className="py-2.5 px-3">QC Status</th>
                <th className="py-2.5 px-3">Invoice Status</th>
                <th className="py-2.5 px-3">Budget</th>
                <th className="py-2.5 px-3 text-center">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mockPurchaseOrders.map((po) => {
                const isSelected = selectedPo.id === po.id;
                return (
                  <tr
                    key={po.id}
                    onClick={() => setSelectedPo(po)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{po.poNumber}</div>
                      <div className="text-[11px] text-slate-400">{po.poDate}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{po.supplier}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{po.supplierGstin}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₹{po.poValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      ₹{po.receivedValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      ₹{po.invoicedValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          po.grnStatus === 'Fully Received'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {po.grnStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          po.qcStatus === 'QC Passed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {po.qcStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          po.invoiceStatus === 'Fully Invoiced'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {po.invoiceStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200 dark:border-emerald-800">
                        {po.budgetStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTraceDoc(po.poNumber);
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

      {/* Selected PO Detail Panel (Step-6: 9 Detail Tabs) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {selectedPo.poNumber} — {selectedPo.supplier}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  {selectedPo.approvalStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Commitment Value: ₹{selectedPo.commitmentValue.toLocaleString('en-IN')} | Date: {selectedPo.poDate}
              </p>
            </div>
          </div>

          {/* 9 Detail Sub-Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            {[
              { id: 'items', label: 'Items Grid' },
              { id: 'overview', label: 'Overview' },
              { id: 'grnHistory', label: `GRN Receipts (${selectedPo.linkedGrns.length})` },
              { id: 'invoiceMatch', label: `Invoices (${selectedPo.linkedInvoices.length})` },
              { id: 'ledgerImpact', label: 'Commitment & GL' },
              { id: 'approvals', label: 'Approval Audit' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition ${
                  detailTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Line Items Table */}
        {detailTab === 'items' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Code & Name</th>
                  <th className="py-2.5 px-3">HSN Code</th>
                  <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">GST %</th>
                  <th className="py-2.5 px-3 text-right">Line Value</th>
                  <th className="py-2.5 px-3 text-right">Received Qty</th>
                  <th className="py-2.5 px-3 text-right">Remaining</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedPo.lines.map((l) => (
                  <tr key={l.lineNo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-mono text-slate-400">{l.lineNo}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{l.itemName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{l.itemCode}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{l.hsnCode}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {l.quantity.toLocaleString()} {l.uom}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      ₹{l.unitPrice}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {l.taxPct}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₹{l.lineValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                      {l.receivedQty.toLocaleString()} {l.uom}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {l.remainingQty.toLocaleString()} {l.uom}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Linked GRN Receipts */}
        {detailTab === 'grnHistory' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Linked Inward Goods Receipt Notes</span>
              <span className="text-slate-400 font-normal">Step-7 Procure-to-Pay Tie</span>
            </div>
            {selectedPo.linkedGrns.map((grnNo) => (
              <div
                key={grnNo}
                className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{grnNo}</span>
                  <div className="text-[11px] text-slate-500">Gate Entry Verified • Dock Putaway Completed</div>
                </div>
                <button
                  onClick={() => onOpenDocPreview('GRN', grnNo, {})}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded font-semibold text-xs hover:underline flex items-center gap-1"
                >
                  View GRN Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Commitment & GL */}
        {detailTab === 'ledgerImpact' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Commitment Accounting & Linked Accruals
            </div>
            <p className="text-slate-500 text-[11px]">
              Upon Purchase Order approval, budget commitment of ₹{selectedPo.commitmentValue.toLocaleString('en-IN')} was
              reserved under cost center CC-RAW-POLYMER. Actual general ledger posting occurred upon GRN arrival into
              Inventory Account 1310-01 and GRNI Clearing 2120-00.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  onOpenAccountingImpact({
                    documentType: 'PO',
                    documentNumber: selectedPo.poNumber,
                    postingDate: selectedPo.poDate,
                    status: 'Simulated',
                    costCenter: 'CC-RAW-POLYMER',
                    taxImpact: 225000,
                    totalDebit: selectedPo.poValue,
                    totalCredit: selectedPo.poValue,
                    lines: [
                      {
                        id: 'po-comm-1',
                        lineNo: 1,
                        accountCode: '9100-00',
                        accountName: 'Encumbered Budget Commitment',
                        accountType: 'Expense',
                        debit: selectedPo.poValue,
                        credit: 0,
                      },
                      {
                        id: 'po-comm-2',
                        lineNo: 2,
                        accountCode: '9200-00',
                        accountName: 'Budget Reserve Offset',
                        accountType: 'Liability',
                        debit: 0,
                        credit: selectedPo.poValue,
                      },
                    ],
                  })
                }
                className="px-3 py-1.5 bg-[#E8622C] text-white rounded-lg font-semibold text-xs hover:bg-[#d55320] flex items-center gap-1.5 transition"
              >
                <Layers className="w-3.5 h-3.5" /> View Detailed Accounting Mapping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
