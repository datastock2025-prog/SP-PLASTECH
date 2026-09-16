// ============================================================================
// TAB 6: DISPATCH / DELIVERY NOTE SCREEN CONNECTED TO SO, STOCK, QC & LEDGER
// Step-9 Specification: Dispatch List, Workflow, Stock Issue & COGS Accounting Impact
// ============================================================================

import React, { useState } from 'react';
import {
  Truck,
  FileCheck2,
  Boxes,
  ShieldCheck,
  Receipt,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Download,
  Calendar,
  Building,
  UserCheck,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { DispatchRecord, DocumentAccountingImpact } from '../../types/unifiedLedgerTypes';
import { mockDispatches } from '../../data/unifiedLedgerData';

interface Props {
  onOpenAccountingImpact: (impact: DocumentAccountingImpact) => void;
  onOpenDocPreview: (docType: string, docNumber: string, data: any) => void;
  onTraceDoc: (docNumber: string) => void;
}

export const DispatchLedgerTab: React.FC<Props> = ({
  onOpenAccountingImpact,
  onOpenDocPreview,
  onTraceDoc,
}) => {
  const [selectedDsp, setSelectedDsp] = useState<DispatchRecord>(mockDispatches[0]);
  const [activeSubTab, setActiveSubTab] = useState<
    'items' | 'workflow' | 'stockIssue' | 'accounting' | 'trace'
  >('items');

  const workflowSteps = [
    { title: 'Sales Order', status: 'Completed', detail: 'SO-2026-1190' },
    { title: 'Stock Reservation', status: 'Completed', detail: '3,200 PCS Reserved' },
    { title: 'Picking & Packing', status: 'Completed', detail: 'Pallets Sealed' },
    { title: 'Gate Pass & Vehicle', status: 'Completed', detail: 'GP-4410 / MH-12-PQ-8842' },
    { title: 'Dispatched & Delivered', status: 'Completed', detail: 'E-Way Bill 5519281' },
    { title: 'Invoice & AR Ledger', status: 'Completed', detail: 'INV-CUST-8819' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Finished Goods Dispatched</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            ₹13,44,000
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">3,200 Units to Automotive OEM</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Cost of Goods Sold (COGS)</span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ₹13,44,000
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">GL A/C 5110-00 Debited</span>
        </div>
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 block mb-1">E-Way Bill & E-Invoice</span>
          <span className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300">
            Active / Cleared
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">NIC Portal IRN Generated</span>
        </div>
        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/40 shadow-xs">
          <span className="text-xs text-blue-700 dark:text-blue-400 block mb-1">Customer Billed & Reconciled</span>
          <span className="text-xl font-bold font-mono text-blue-800 dark:text-blue-300">
            100%
          </span>
          <span className="text-[11px] text-blue-600 block mt-0.5">Tata AutoComp Systems</span>
        </div>
      </div>

      {/* Dispatch Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Dispatch & Delivery Note Register
            </h3>
            <p className="text-[11px] text-slate-500">
              Customer outbound fulfillment connected to sales orders, warehouse pick lists, and COGS journal posting
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{mockDispatches.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Delivery Note # & Date</th>
                <th className="py-2.5 px-3">Sales Order Ref</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Vehicle & Gate Pass</th>
                <th className="py-2.5 px-3 text-right">Dispatch Qty</th>
                <th className="py-2.5 px-3">Invoice Status</th>
                <th className="py-2.5 px-3">Stock Status</th>
                <th className="py-2.5 px-3">Accounting Status</th>
                <th className="py-2.5 px-3 text-center">GL Impact</th>
                <th className="py-2.5 px-3 text-center">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mockDispatches.map((dsp) => {
                const isSelected = selectedDsp.id === dsp.id;
                return (
                  <tr
                    key={dsp.id}
                    onClick={() => setSelectedDsp(dsp)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-l-4 border-l-cyan-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {dsp.deliveryNoteNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">{dsp.dispatchDate}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                      {dsp.salesOrderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{dsp.customer}</div>
                      <div className="text-[10px] text-slate-400">{dsp.warehouse}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {dsp.vehicleNumber} / {dsp.gatePassNumber}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {dsp.dispatchQty.toLocaleString()} PCS
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
                        {dsp.invoiceStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400">
                      {dsp.stockStatus}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-semibold">
                        {dsp.accountingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAccountingImpact(dsp.accountingImpact);
                        }}
                        className="p-1.5 text-[#E8622C] hover:bg-[#E8622C]/10 rounded-lg transition font-semibold"
                        title="View COGS Accounting Impact"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTraceDoc(dsp.deliveryNoteNumber);
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

      {/* Selected Dispatch Detail Panel (Step-9 Sub-tabs) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {selectedDsp.deliveryNoteNumber} — Outbound Dispatch & Packing Manifest
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold">
                  {selectedDsp.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Customer: {selectedDsp.customer} • SO: {selectedDsp.salesOrderNumber} • Vehicle: {selectedDsp.vehicleNumber}
              </p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            {[
              { id: 'items', label: 'Items & Batches' },
              { id: 'workflow', label: 'Order-to-Cash Workflow' },
              { id: 'accounting', label: 'COGS Journal Impact' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition ${
                  activeSubTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Items & Batches */}
        {activeSubTab === 'items' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">SO Line #</th>
                  <th className="py-2.5 px-3">Item Code & Name</th>
                  <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                  <th className="py-2.5 px-3 text-right">Dispatch Qty</th>
                  <th className="py-2.5 px-3">Batch / Lot #</th>
                  <th className="py-2.5 px-3">Location Bin</th>
                  <th className="py-2.5 px-3 text-right">Unit Value</th>
                  <th className="py-2.5 px-3 text-right">Total Line Value</th>
                  <th className="py-2.5 px-3">Quality Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedDsp.lines.map((l) => (
                  <tr key={l.soLineNo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-mono text-slate-400">{l.soLineNo}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{l.itemName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{l.itemCode}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {l.orderedQty.toLocaleString()} {l.uom}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {l.dispatchQty.toLocaleString()} {l.uom}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-purple-600 dark:text-purple-400">
                      {l.batchLot}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{l.location}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      ₹{l.unitPrice}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{l.totalValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
                        ✓ {l.qualityStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Workflow */}
        {activeSubTab === 'workflow' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Order-to-Cash End-to-End Fulfillment Progression
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {workflowSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mx-auto text-xs font-bold">
                    ✓
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{step.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{step.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Accounting */}
        {activeSubTab === 'accounting' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Automatic COGS Recognition for {selectedDsp.deliveryNoteNumber}</span>
              <span className="font-mono text-purple-600 font-semibold">
                Journal Voucher: {selectedDsp.accountingImpact.journalEntryNumber}
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Upon gate-out dispatch, 3,200 Finished Goods items were deducted from Active Inventory Stock and recognized
              as Cost of Goods Sold (COGS) in the General Ledger.
            </p>
            <button
              onClick={() => onOpenAccountingImpact(selectedDsp.accountingImpact)}
              className="px-3 py-1.5 bg-[#E8622C] text-white rounded-lg font-semibold text-xs hover:bg-[#d55320] flex items-center gap-1.5 transition"
            >
              <Layers className="w-3.5 h-3.5" /> View Full COGS & Inventory Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
