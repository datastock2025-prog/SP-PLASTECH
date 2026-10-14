import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  RotateCcw,
  FileText,
  Camera,
  CheckCircle2,
  DollarSign,
  Truck,
} from 'lucide-react';
import { GoodsReceiptNoteExt } from '../../../types/grnTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grn: GoodsReceiptNoteExt | null;
  onSubmitReturn: (
    grnId: string,
    exceptionType: string,
    qty: number,
    uom: string,
    reason: string,
    debitNoteAmount: number
  ) => void;
  showToast: (msg: string) => void;
}

export const ExceptionsAndReturnsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  grn,
  onSubmitReturn,
  showToast,
}) => {
  if (!isOpen || !grn) return null;

  const [exceptionType, setExceptionType] = useState<string>('Damaged Packaging (Wet/Torn Bags)');
  const [returnQty, setReturnQty] = useState<number>(100);
  const [reason, setReason] = useState('Bags torn during transit resulting in dust & moisture contamination.');
  const [estimatedUnitRate, setEstimatedUnitRate] = useState<number>(128); // INR/KG

  const debitNoteTotal = returnQty * estimatedUnitRate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (returnQty <= 0) {
      showToast('Please enter a valid rejection quantity.');
      return;
    }
    onSubmitReturn(grn.id, exceptionType, returnQty, grn.lines[0]?.uom || 'KG', reason, debitNoteTotal);
    showToast(`Debit Note request generated for ${returnQty} KG (₹${debitNoteTotal.toLocaleString()})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-[#14213D] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-['Space_Grotesk']">
                Log Material Exception & Supplier Debit Note
              </h3>
              <p className="text-xs text-slate-300">
                {grn.grnNumber} • {grn.supplierName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Discrepancy / Exception Category *</label>
            <select
              value={exceptionType}
              onChange={(e) => setExceptionType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
            >
              <option value="Damaged Packaging (Wet/Torn Bags)">Damaged Packaging (Wet / Torn Bags)</option>
              <option value="Contaminated Resin / Foreign Particles">Contaminated Resin / Foreign Particles</option>
              <option value="Off-Spec MFI / Lab Rheology Failure">Off-Spec MFI / Lab Rheology Failure</option>
              <option value="Physical Weighbridge Shortage">Physical Weighbridge Shortage</option>
              <option value="Wrong Grade / Mismatched Polymer">Wrong Grade / Mismatched Polymer</option>
              <option value="Missing or Invalid COA Certificate">Missing or Invalid COA Certificate</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Discrepancy / Return Qty (KG) *</label>
              <input
                type="number"
                value={returnQty}
                onChange={(e) => setReturnQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-rose-700"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Unit Price (₹/KG)</label>
              <input
                type="number"
                value={estimatedUnitRate}
                onChange={(e) => setEstimatedUnitRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
            <div className="text-[11px] text-rose-800 font-semibold flex justify-between">
              <span>Debit Note Amount to Deduct:</span>
              <strong className="text-rose-900 text-sm">₹{debitNoteTotal.toLocaleString()}</strong>
            </div>
            <span className="text-[10px] text-rose-700 block">
              Auto-generates Debit Note draft to offset against Supplier Invoice #{grn.supplierInvoiceNo}.
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Detailed Findings & Root Cause</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Describe damaged condition, pallet markings, or test variance..."
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">Attached Dock Photo: <strong>pallet_damage_dock2.jpg</strong></span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              Attached
            </span>
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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Generate Debit Note & Return Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
