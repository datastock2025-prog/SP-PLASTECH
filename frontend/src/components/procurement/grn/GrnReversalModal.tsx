import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Layers,
  FileText,
  Lock,
} from 'lucide-react';
import { GoodsReceiptNoteExt } from '../../../types/grnTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grn: GoodsReceiptNoteExt | null;
  onConfirmReversal: (grnId: string, reason: string, supervisorPin: string) => void;
  showToast: (msg: string) => void;
}

export const GrnReversalModal: React.FC<Props> = ({
  isOpen,
  onClose,
  grn,
  onConfirmReversal,
  showToast,
}) => {
  if (!isOpen || !grn) return null;

  const [reason, setReason] = useState('Wrong quantity entered at dock');
  const [supervisorPin, setSupervisorPin] = useState('9921');
  const [notes, setNotes] = useState('');

  const handleReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorPin) {
      showToast('Supervisor PIN is mandatory to authorize GRN reversal.');
      return;
    }
    onConfirmReversal(grn.id, `${reason} - ${notes}`, supervisorPin);
    showToast(`GRN ${grn.grnNumber} has been reversed and stock cancelled.`);
    onClose();
  };

  const totalReceived = grn.lines.reduce((s, l) => s + l.currentReceivedQty, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-rose-300">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-['Space_Grotesk']">
                Reverse Goods Receipt Note
              </h3>
              <p className="text-xs text-rose-200 font-mono">{grn.grnNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReversal} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-900">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Critical Reversal Impact Warning
            </div>
            <p className="text-[11px] leading-relaxed text-rose-800">
              Reversing this GRN will deduct <strong>{totalReceived.toLocaleString()} KG</strong> from warehouse storage bin <strong>{grn.lines[0]?.bin}</strong>, reopen PO #{grn.poNumber} remaining balance, and void the accrued AP liability.
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Reason for Reversal *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="Wrong quantity entered at dock">Wrong quantity entered at dock</option>
              <option value="Wrong lot/batch number captured">Wrong lot / batch number captured</option>
              <option value="Wrong purchase order referenced">Wrong purchase order referenced</option>
              <option value="Duplicate GRN created in error">Duplicate GRN created in error</option>
              <option value="Severe in-transit damage discovered after unloading">Severe in-transit damage discovered</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Supervisor Authorization PIN *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={supervisorPin}
                onChange={(e) => setSupervisorPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Audit Explanatory Note</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Corrected weighbridge net slip from 24,000 to 22,000 KG"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold text-xs shadow-sm transition"
            >
              Authorize & Reverse GRN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
