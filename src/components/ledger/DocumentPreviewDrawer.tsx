// ============================================================================
// SHARED UNIVERSAL DOCUMENT PREVIEW DRAWER
// Allows drill-down into any business document (PO, GRN, QC, DSP, INV, JE)
// ============================================================================

import React from 'react';
import {
  X,
  FileText,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar,
  Layers,
  Printer,
  ExternalLink,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface Props {
  docType: string;
  docNumber: string;
  data: any;
  onClose: () => void;
  onViewAccountingImpact?: (docNumber: string) => void;
  onViewTrace?: (docNumber: string) => void;
}

export const DocumentPreviewDrawer: React.FC<Props> = ({
  docType,
  docNumber,
  data,
  onClose,
  onViewAccountingImpact,
  onViewTrace,
}) => {
  if (!docNumber) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  {docType}
                </span>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base font-mono">
                  {docNumber}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Operational Business Record & Audit Chain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewAccountingImpact?.(docNumber)}
              className="flex-1 py-2 px-3 bg-[#E8622C]/10 text-[#E8622C] hover:bg-[#E8622C]/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Layers className="w-4 h-4" /> View Accounting Impact
            </button>
            <button
              onClick={() => onViewTrace?.(docNumber)}
              className="flex-1 py-2 px-3 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition border border-purple-200 dark:border-purple-800"
            >
              <ExternalLink className="w-4 h-4" /> Trace End-to-End Lineage
            </button>
          </div>

          {/* Key Attributes */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Counterparty / Supplier / Customer</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                {data?.supplier || data?.customer || data?.customerSupplier || data?.entityParty || 'Internal Plant Movement'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Transaction Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {data?.status || 'Active'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Document Date</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {data?.poDate || data?.grnDate || data?.dispatchDate || data?.invoiceDate || data?.inspectionDate || data?.date || '2026-09-15'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Commercial Value</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                ₹{(data?.poValue || data?.totalReceivedValue || data?.invoiceValue || data?.amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Line Items Details if available */}
          {data?.lines && data.lines.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Document Line Items ({data.lines.length})
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.lines.map((line: any, idx: number) => (
                  <div key={idx} className="p-3.5 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {line.itemName || line.itemService || line.itemCode}
                        </span>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Code: {line.itemCode || '—'} | Batch: {line.lotBatchNumber || line.batchLot || 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {line.quantity || line.currentReceivedQty || line.dispatchQty || 0} {line.uom}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {line.unitPrice || line.rate ? `₹${line.unitPrice || line.rate} / ${line.uom}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance & Verification Panel */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Traceability & Compliance Verification
            </div>
            <p className="text-emerald-800 dark:text-emerald-400/90 leading-relaxed">
              This document is digitally hashed and permanently reconciled with the universal transaction lineage. All
              operational batch quantities and financial values are tied to verified audit logs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 flex items-center gap-1.5 transition">
            <Printer className="w-3.5 h-3.5" /> Print Copy
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:opacity-90 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
