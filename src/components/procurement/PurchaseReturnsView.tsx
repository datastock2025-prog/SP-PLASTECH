import React, { useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  FileText,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { SupplierReturnRecord } from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { INITIAL_PROCUREMENT_RETURNS } from '../../data/procurementData';

interface Props {
  returns?: SupplierReturnRecord[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const PurchaseReturnsView: React.FC<Props> = ({
  returns = INITIAL_PROCUREMENT_RETURNS,
  onNavigate,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = returns.filter((r) =>
    r.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Purchase Returns & Debit Notes
          </h1>
          <p className="text-xs text-slate-500">
            Off-spec polymer rejection handling, dock turnarounds, Non-Conformance Reports (NCR), and vendor debit memos
          </p>
        </div>

        <button
          onClick={() => showToast('Purchase return logging wizard initiated')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Log Material Return
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {filtered.map((ret) => (
          <div
            key={ret.id}
            className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#14213D]">{ret.returnNumber}</span>
                <ProcurementStatusBadge status={ret.status} size="xs" />
                <span className="text-slate-500">Supplier: <strong>{ret.supplierName}</strong></span>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Debit Note Value</div>
                <div className="text-lg font-bold font-['Space_Grotesk'] text-red-600">
                  ₹{ret.creditAmount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase">Rejected Material & Batch</div>
                <div className="font-bold text-[#14213D]">{ret.itemName}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Batch: {ret.lotBatchNumber} • {ret.returnQty.toLocaleString()} {ret.uom}
                </div>
              </div>

              <div className="p-3 bg-red-50 rounded-xl border border-red-100 space-y-1">
                <div className="text-red-700 text-[10px] uppercase font-bold">Defect Cause & Reason</div>
                <div className="font-bold text-red-900">{ret.reason}</div>
                <div className="text-red-700 text-[11px] font-mono">Linked NCR: {ret.linkedNcrId || 'N/A'} • Disp: {ret.dispositionRequested}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase">Debit Note & Tracking</div>
                <div className="font-bold text-[#14213D]">{ret.debitNoteNumber || 'Pending DN'}</div>
                <div className="text-emerald-700 font-semibold text-[11px]">Tracking: {ret.trackingNumber || 'Local Outward Challan'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
