// ============================================================================
// TAB 5: QUALITY CONTROL (QC) INSPECTION & LEDGER IMPACT
// Step-8 Specification: QC Queue, Detail Fields, Stock Status Before/After & Actions
// ============================================================================

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Receipt,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Calendar,
  Layers,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { QcInspectionRecord } from '../../types/unifiedLedgerTypes';
import { mockQcInspections } from '../../data/unifiedLedgerData';

interface Props {
  onOpenDocPreview: (docType: string, docNumber: string, data: any) => void;
  onTraceDoc: (docNumber: string) => void;
  onShowToast: (msg: string) => void;
}

export const QcLedgerTab: React.FC<Props> = ({
  onOpenDocPreview,
  onTraceDoc,
  onShowToast,
}) => {
  const [selectedQc, setSelectedQc] = useState<QcInspectionRecord>(mockQcInspections[0]);

  const handleQcAction = (actionName: string) => {
    onShowToast(`QC Action [${actionName}] applied to ${selectedQc.inspectionId}. Stock status updated.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Inspected Batches</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {mockQcInspections.length} Inspections
          </span>
          <span className="text-[11px] text-blue-600 block mt-0.5">IATF 16949 / ASTM D1238</span>
        </div>
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 block mb-1">Released to Production</span>
          <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            10,000 KG
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">100% Parameter Pass Rate</span>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-xs">
          <span className="text-xs text-amber-700 dark:text-amber-400 block mb-1">On Hold in Quarantine</span>
          <span className="text-xl font-bold font-mono text-amber-800 dark:text-amber-300">
            500 KG (₹1.90L)
          </span>
          <span className="text-[11px] text-amber-600 block mt-0.5">Delta-E Spectro Variance</span>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 shadow-xs">
          <span className="text-xs text-purple-700 dark:text-purple-400 block mb-1">COA & MSDS Status</span>
          <span className="text-xl font-bold font-mono text-purple-800 dark:text-purple-300">
            Verified
          </span>
          <span className="text-[11px] text-purple-600 block mt-0.5">Digital Supplier Certificate</span>
        </div>
      </div>

      {/* QC Queue Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Quality Inspection Queue & Disposition Console
            </h3>
            <p className="text-[11px] text-slate-500">
              Incoming raw materials, in-process MES parts, and outgoing dispatch inspection gates
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{mockQcInspections.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Inspection ID & Date</th>
                <th className="py-2.5 px-3">Source Doc</th>
                <th className="py-2.5 px-3">Item Name & Code</th>
                <th className="py-2.5 px-3">Batch / Lot</th>
                <th className="py-2.5 px-3">Supplier / Customer</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Inspector</th>
                <th className="py-2.5 px-3 text-center">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mockQcInspections.map((qc) => {
                const isSelected = selectedQc.id === qc.id;
                return (
                  <tr
                    key={qc.id}
                    onClick={() => setSelectedQc(qc)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-purple-50/70 dark:bg-purple-950/40 border-l-4 border-l-purple-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {qc.inspectionId}
                      </div>
                      <div className="text-[11px] text-slate-400">{qc.inspectionDate}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-blue-600 font-semibold">
                      {qc.sourceDocument}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{qc.itemName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{qc.itemCode}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {qc.batchLot}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {qc.entityParty}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {qc.quantity.toLocaleString()} KG
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          qc.priority === 'High'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {qc.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          qc.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {qc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400">
                      {qc.inspector}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTraceDoc(qc.inspectionId);
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

      {/* Selected QC Detail & Stock/Ledger Impact Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {selectedQc.inspectionId} — {selectedQc.itemName}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                  {selectedQc.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Source Document: {selectedQc.sourceDocument} • Batch: {selectedQc.batchLot} • Inspector: {selectedQc.inspector}
              </p>
            </div>
          </div>

          {/* QC Result Actions (Step-8 specification) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleQcAction('Accept & Release')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition"
            >
              ✓ Accept & Release to Stock
            </button>
            <button
              onClick={() => handleQcAction('Put on Hold')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-xs transition"
            >
              ⚠ Hold / Re-test
            </button>
            <button
              onClick={() => handleQcAction('Concession Approval')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition"
            >
              Concession Approval
            </button>
            <button
              onClick={() => handleQcAction('Reject & Return to Supplier')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition"
            >
              ✗ Reject & Return (Debit Note)
            </button>
          </div>
        </div>

        {/* Step-8 Stock Impact Before & After Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
              Stock Status Before Inspection
            </span>
            <div className="flex items-center gap-2 font-mono text-amber-700 dark:text-amber-300 font-bold text-sm">
              <Clock className="w-4 h-4" /> {selectedQc.stockStatusBefore}
            </div>
            <p className="text-slate-500 text-[11px]">
              Held in gate inward dock with provisional GRNI accrual. Inventory blocked from production consumption.
            </p>
          </div>

          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-2">
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold block uppercase tracking-wider text-[10px]">
              Stock Status After Inspection
            </span>
            <div className="flex items-center gap-2 font-mono text-emerald-800 dark:text-emerald-200 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {selectedQc.stockStatusAfter}
            </div>
            <p className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px]">
              {selectedQc.ledgerImpactNote}
            </p>
          </div>
        </div>

        {/* Test Parameters & COA Verification Details */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Laboratory Parameters & Digital Certificate Compliance
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400 block text-[11px]">COA Verification</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                ✓ {selectedQc.coaVerification}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">MSDS Verification</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                ✓ {selectedQc.msdsVerification}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">NCR Reference</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {selectedQc.ncrReference || 'None (Pass)'}
              </span>
            </div>
          </div>
          {selectedQc.defectReason && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg text-rose-800 dark:text-rose-200 text-[11px]">
              <span className="font-bold">Defect Note: </span> {selectedQc.defectReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
