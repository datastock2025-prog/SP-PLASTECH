import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCw,
  Trash2,
  FileText,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Building,
  Info,
} from 'lucide-react';
import { QuarantineLotRecord, QuarantineDisposition } from '../../types/warehouse';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';

interface Props {
  lots: QuarantineLotRecord[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  onUpdateLot?: (lot: QuarantineLotRecord) => void;
}

export const QuarantineHoldView: React.FC<Props> = ({
  lots,
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
  onUpdateLot,
}) => {
  const [quarantineList, setQuarantineList] = useState<QuarantineLotRecord[]>(lots);

  const openDispositionDrawer = (lot: QuarantineLotRecord) => {
    let disposition: QuarantineDisposition = 'released_to_production';
    let authNote = 'Material Review Board approved conditional release with 5% virgin ratio adjustment.';
    let authorizedBy = 'VP Technical & Quality';

    openDrawer(
      `MRB Disposition Decision &mdash; ${lot.quarantineNumber}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
          <div className="font-bold text-purple-900 text-sm">{lot.itemName}</div>
          <div className="text-purple-700 font-mono">
            Lot: {lot.lotNumber} &bull; Qty: {lot.quantityKg.toLocaleString()} {lot.uom}
          </div>
          <div className="text-purple-800 font-semibold">Hold Reason: {lot.holdReason}</div>
          <div className="text-purple-600 text-[11px]">Origin: {lot.originSource} &bull; Inspector: {lot.qcInspector}</div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">MRB Disposition Verdict</label>
          <select
            defaultValue={disposition}
            onChange={(e) => (disposition = e.target.value as QuarantineDisposition)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-600 outline-none"
          >
            <option value="released_to_production">Release to Production (Conditional Deviation Waiver)</option>
            <option value="returned_to_vendor">Return to Vendor (RTV Memo + Debit Note)</option>
            <option value="send_to_regrind">Downcycle to Regrind Granulator Silo</option>
            <option value="scrap_destroy">Scrap &amp; Write-Off Destroy</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Technical Justification / Waiver Note</label>
          <textarea
            rows={3}
            defaultValue={authNote}
            onChange={(e) => (authNote = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-600 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Authorized Officer</label>
          <input
            type="text"
            defaultValue={authorizedBy}
            onChange={(e) => (authorizedBy = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-600 outline-none"
          />
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const updated: QuarantineLotRecord = {
              ...lot,
              dispositionStatus: disposition,
              dispositionActionNote: authNote,
              authorizedBy,
              closureDate: new Date().toISOString().slice(0, 10),
            };
            setQuarantineList((prev) => prev.map((l) => (l.id === lot.id ? updated : l)));
            if (onUpdateLot) onUpdateLot(updated);
            closeDrawer();
            showToast(`MRB disposition posted for ${lot.quarantineNumber}: ${disposition.replace(/_/g, ' ')}`);
          }}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold"
        >
          Authorize &amp; Execute Disposition
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-300 uppercase tracking-wider">
              Quality Hold &middot; MRB Governance
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Quarantine &amp; Non-Conforming Stock Hold
          </h1>
          <p className="text-xs text-slate-500">
            Material Review Board (MRB) dispositions, vendor RTV debit notes, and off-spec polymer containment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('stockList')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Stock Overview
          </button>
          <button
            onClick={() => onNavigate('binMap')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Hold Cage Bin Location
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quarantineList.map((lot) => (
          <div
            key={lot.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-purple-300 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-purple-900">{lot.quarantineNumber}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    {lot.currentBin}
                  </span>
                </div>
                <WarehouseStatusBadge status={lot.dispositionStatus} size="xs" />
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#14213D]">{lot.itemName}</h3>
                <div className="text-xs font-mono text-[#0F8B8D] mt-0.5">SKU: {lot.itemSku}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  Lot: <span className="font-bold text-slate-800">{lot.lotNumber}</span> &bull; Held Qty: <span className="font-bold text-purple-700">{lot.quantityKg.toLocaleString()} {lot.uom}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                <div className="text-rose-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Hold Reason: {lot.holdReason}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Origin: {lot.originSource} &bull; Inspector: {lot.qcInspector} &bull; Date: {lot.holdDate}
                </div>
                {lot.dispositionActionNote && (
                  <div className="text-slate-700 text-[11px] pt-1 border-t border-slate-200 mt-1">
                    <span className="font-bold">MRB Note:</span> {lot.dispositionActionNote}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              {lot.dispositionStatus === 'pending_disposition' ? (
                <button
                  onClick={() => openDispositionDrawer(lot)}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5" /> MRB Disposition Action
                </button>
              ) : (
                <div className="w-full text-center py-1.5 text-[11px] font-semibold text-purple-800 bg-purple-50 rounded-xl border border-purple-200">
                  Closed on {lot.closureDate || '2026-08-28'} &bull; Auth: {lot.authorizedBy}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
