import React, { useState } from 'react';
import {
  Undo2,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Package,
  Wrench,
  DollarSign,
} from 'lucide-react';
import { SalesRma } from '../../types';
import { SalesStatusBadge } from './SalesStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  returns: SalesRma[];
  onCreateRMA: (rma: SalesRma) => void;
  onUpdateRMA: (rma: SalesRma) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const CustomerReturnsRMAView: React.FC<Props> = ({
  returns,
  onCreateRMA,
  onUpdateRMA,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const filtered = returns.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q) ||
      r.item.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedReturns = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateRMADrawer = () => {
    let customer = 'Bharat AgroTech Ltd';
    let item = 'FG-PET-030';
    let qty = 200;
    let reason = 'Color mismatch in masterbatch dispersion';
    let disposition = 'Credit';

    openDrawer(
      'Create Customer Return Authorization (RMA)',
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 font-medium">
          Quality NCR &amp; Return Authorization &middot; QA Quarantine Gate
        </div>

        <div className="field">
          <label className="font-bold text-[#14213D]">Customer / Account</label>
          <input
            type="text"
            defaultValue={customer}
            onChange={(e) => (customer = e.target.value)}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label className="font-bold text-[#14213D]">Returned Product Part #</label>
            <input
              type="text"
              defaultValue={item}
              onChange={(e) => (item = e.target.value)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
          <div className="field">
            <label className="font-bold text-[#14213D]">Return Quantity (PCS)</label>
            <input
              type="number"
              defaultValue={qty}
              onChange={(e) => (qty = parseInt(e.target.value) || 100)}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-mono"
            />
          </div>
        </div>

        <div className="field">
          <label className="font-bold text-[#14213D]">Defect / Reason for Return</label>
          <textarea
            defaultValue={reason}
            onChange={(e) => (reason = e.target.value)}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white h-20"
          />
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button className="btn btn-sm btn-ghost" onClick={closeDrawer}>
          Cancel
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            const newRMA: SalesRma = {
              id: `RMA-70${returns.length + 1}`,
              soId: 'SO-5001',
              invoiceId: 'INV-2026-09',
              customer,
              uom: 'PCS',
              date: new Date().toISOString().slice(0, 10),
              item,
              qty,
              reason,
              returnType: 'Quality complaint',
              status: 'pending',
              disposition,
              creditAmount: qty * 15.6,
              batch: 'LOT-2026-QC',
              history: [{ event: 'RMA created', time: 'Today' }],
            };
            onCreateRMA(newRMA);
            closeDrawer();
            showToast(`RMA ${newRMA.id} generated`);
          }}
        >
          Authorize RMA
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-rose-600">
            <span>Post-Sales &middot; RMA &amp; Quality Resolution</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">
            Customer Returns &amp; RMA Management
          </h1>
          <p className="text-xs text-[#6B7280]">
            Return authorizations, polymer quality defect analysis, QA quarantine inspection, and credit memos.
          </p>
        </div>

        <button
          onClick={handleCreateRMADrawer}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#E8622C] hover:bg-[#d45320] text-white text-xs font-semibold shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> + New Return (RMA)
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                <th className="p-3">RMA #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Product Item</th>
                <th className="p-3 text-right">Return Qty</th>
                <th className="p-3">Defect Reason</th>
                <th className="p-3">QA Disposition</th>
                <th className="p-3 text-right">Credit Value (₹)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {pagedReturns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-[#0F8B8D]">{r.id}</td>
                  <td className="p-3 font-bold text-[#14213D]">{r.customer}</td>
                  <td className="p-3 font-mono text-[#14213D]">{r.item}</td>
                  <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                    {r.qty.toLocaleString()} {r.uom}
                  </td>
                  <td className="p-3 text-[#6B7280]">{r.reason}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-mono">
                      {r.disposition.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-rose-600">
                    ₹{(r.creditAmount || 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <SalesStatusBadge status={r.status} size="xs" />
                  </td>
                  <td className="p-3 text-right">
                    {r.status === 'pending' ? (
                      <button
                        onClick={() => {
                          onUpdateRMA({ ...r, status: 'approved', disposition: 'Credit Memo' });
                          showToast(`Approved RMA ${r.id} and issued credit memo`);
                        }}
                        className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200"
                      >
                        Approve &amp; Credit
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#6B7280]">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="returns"
        />
      </div>
    </div>
  );
};
