import React, { useState } from 'react';
import {
  X,
  Check,
  FileCheck,
  History,
  Lock,
  Calendar,
  User,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import {
  customerMasterService,
  EnrichedCustomerRecord,
  CustomerPoVersion,
} from '../../services/customerMasterService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: EnrichedCustomerRecord;
  onPoUpdated: (updatedCustomer: EnrichedCustomerRecord) => void;
  showToast: (msg: string) => void;
}

export const CustomerPoAmendmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customer,
  onPoUpdated,
  showToast,
}) => {
  const [poNumber, setPoNumber] = useState(
    customer.poNumber || `PO-${customer.code}-2026-01`
  );
  const [poDate, setPoDate] = useState(
    customer.poDate || new Date().toISOString().slice(0, 10)
  );
  const [version, setVersion] = useState(
    `Rev 0${(customer.poVersions?.length || 0) + 1} (${new Date().toLocaleString('default', { month: 'short' })} Release)`
  );
  const [changeReason, setChangeReason] = useState('Monthly Schedule Release & Volume Extension');
  const [changedBy, setChangedBy] = useState('Commercial Operations Lead');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber.trim()) {
      setErrorMsg('Customer PO Number is mandatory.');
      return;
    }
    if (!poDate.trim()) {
      setErrorMsg('PO Date is mandatory.');
      return;
    }
    if (!changeReason.trim()) {
      setErrorMsg('Reason for PO Amendment / Revision is required for audit traceability.');
      return;
    }

    const updated = customerMasterService.addPoAmendment(customer.code, {
      poNumber: poNumber.trim().toUpperCase(),
      poDate,
      version: version.trim(),
      changeReason: changeReason.trim(),
      changedBy: changedBy.trim(),
      notes: notes.trim(),
    });

    if (updated) {
      onPoUpdated(updated);
      showToast(`✓ PO Version ${version} saved successfully for ${customer.name}`);
      onClose();
    }
  };

  const history: CustomerPoVersion[] = customer.poVersions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0F8B8D]/10 rounded-lg text-[#0F8B8D]">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                Customer PO Amendment &amp; LIFO Version Audit
              </h3>
              <p className="text-[11px] text-slate-500">
                Customer: <strong>{customer.name}</strong> ({customer.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                New / Amended PO Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PO-TM-2026-9022"
                value={poNumber}
                onChange={(e) => {
                  setPoNumber(e.target.value.toUpperCase());
                  setErrorMsg(null);
                }}
                className="w-full p-2.5 border rounded-lg font-mono font-bold uppercase text-slate-900 focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                PO Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full p-2.5 border rounded-lg font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Revision Tag / Version <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rev 03 / Q4-2026 Release"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full p-2.5 border rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Reason for Amendment <span className="text-red-500">*</span>
              </label>
              <select
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-white font-medium"
              >
                <option value="Monthly Schedule Release & Volume Extension">
                  Monthly Schedule Release &amp; Volume Extension
                </option>
                <option value="Quarterly Rate / Price Amendment">Quarterly Rate / Price Amendment</option>
                <option value="Annual Rate Contract Renewal">Annual Rate Contract Renewal</option>
                <option value="Part Code / Specification Revision">
                  Part Code / Specification Revision
                </option>
                <option value="Billing Entity / GSTIN Update">Billing Entity / GSTIN Update</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Author / Changed By</label>
              <input
                type="text"
                value={changedBy}
                onChange={(e) => setChangedBy(e.target.value)}
                className="w-full p-2.5 border rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Audit Notes / Context</label>
              <input
                type="text"
                placeholder="e.g. Approved via OEM email dated 30-Sep"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 border rounded-lg"
              />
            </div>
          </div>

          {/* LIFO Version History Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#0F8B8D]" /> PO Version Traceability History ({history.length} Revisions)
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                LIFO Sorted
              </span>
            </div>

            {history.length === 0 ? (
              <div className="p-3 text-center text-slate-400">No previous PO revisions recorded.</div>
            ) : (
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                {history.map((h, i) => (
                  <div key={i} className="p-2.5 hover:bg-slate-50 flex items-start justify-between gap-2 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="font-mono text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 font-bold">
                          {h.version}
                        </span>
                        <span className="font-mono font-bold">{h.poNumber}</span>
                        <span className="text-[11px] text-slate-500 font-normal">({h.poDate})</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        <strong>Reason:</strong> {h.changeReason}
                        {h.notes && <span className="text-slate-400"> — {h.notes}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 text-[10px] text-slate-400">
                      <div>{h.changedBy}</div>
                      <div className="font-mono">{h.changedAt}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save &amp; Apply PO Amendment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
