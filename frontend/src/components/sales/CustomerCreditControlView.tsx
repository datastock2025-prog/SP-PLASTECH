import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  DollarSign,
  AlertTriangle,
  Lock,
  Unlock,
  Building,
  CheckCircle,
} from 'lucide-react';
import {
  CUSTOMER_CREDIT_EXPOSURES,
  CreditExposure,
} from '../../data/salesData';
import { SalesStatusBadge } from './SalesStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  showToast: (msg: string) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
}

export const CustomerCreditControlView: React.FC<Props> = ({
  showToast,
  openDrawer,
  closeDrawer,
}) => {
  const [exposures, setExposures] = useState<CreditExposure[]>(CUSTOMER_CREDIT_EXPOSURES);
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const filtered = exposures.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.customerCode.toLowerCase().includes(q) ||
      e.customerName.toLowerCase().includes(q) ||
      e.segment.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedExposures = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleReleaseCreditHold = (exp: CreditExposure) => {
    let reason = 'Temporary 14-day credit extension approved by VP Finance';
    let manager = 'Sunil Mehta (VP Finance)';

    openDrawer(
      `Override Credit Block & Release Orders for ${exp.customerName}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
          ⚠️ Financial Risk Governance &middot; Manual Override Required
        </div>

        <div className="space-y-1">
          <label className="font-bold text-[#14213D]">Customer Current Exposure</label>
          <div className="p-3 bg-[#F6F4EF] rounded border border-[#E4E0D6] space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Credit Limit:</span>
              <b>₹{exp.creditLimit.toLocaleString()}</b>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Current Outstanding:</span>
              <b>₹{exp.currentBalance.toLocaleString()}</b>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Overdue (&gt;60 Days):</span>
              <b>₹{exp.overdueAmount.toLocaleString()}</b>
            </div>
          </div>
        </div>

        <div className="field">
          <label className="font-bold text-[#14213D]">Approval Reason / Justification</label>
          <textarea
            defaultValue={reason}
            onChange={(e) => (reason = e.target.value)}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white h-20"
          />
        </div>

        <div className="field">
          <label className="font-bold text-[#14213D]">Authorizing Executive</label>
          <input
            type="text"
            defaultValue={manager}
            onChange={(e) => (manager = e.target.value)}
            className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white font-medium"
          />
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button className="btn btn-sm btn-ghost" onClick={closeDrawer}>
          Cancel
        </button>
        <button
          className="btn btn-sm btn-primary bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            setExposures((prev) =>
              prev.map((c) =>
                c.customerCode === exp.customerCode ? { ...c, creditStatus: 'good_standing' } : c
              )
            );
            closeDrawer();
            showToast(`Credit hold released for ${exp.customerName}`);
          }}
        >
          Authorize Release
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
            <span>Risk Governance &middot; Financial Credit Control</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">
            Customer Credit Limits &amp; Exposure Management
          </h1>
          <p className="text-xs text-[#6B7280]">
            Credit limits, aging receivables buckets, real-time exposure calculations, and credit hold releases.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] flex items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9AA5C4]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by customer code, account name or segment..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs bg-[#F6F4EF]"
          />
        </div>
        <div className="text-xs font-mono text-[#6B7280]">
          Total Accounts: <b>{filtered.length}</b>
        </div>
      </div>

      {/* Credit Exposures Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                <th className="p-3">Customer Code</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3 text-right">Credit Limit (₹)</th>
                <th className="p-3 text-right">Current Balance</th>
                <th className="p-3 text-right">Open Orders Value</th>
                <th className="p-3 text-right">Available Credit</th>
                <th className="p-3 text-right">Overdue (&gt;30d)</th>
                <th className="p-3 text-center">Credit Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {pagedExposures.map((c) => {
                const isBlocked = c.creditStatus === 'credit_blocked';
                return (
                  <tr key={c.customerCode} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#0F8B8D]">{c.customerCode}</td>
                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{c.customerName}</div>
                      <div className="text-[10px] text-[#6B7280]">{c.segment}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                      ₹{c.creditLimit.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-[#14213D]">
                      ₹{c.currentBalance.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-[#6B7280]">
                      ₹{c.openOrdersValue.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ₹{c.availableCredit.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600">
                      {c.overdueAmount > 0 ? `₹${c.overdueAmount.toLocaleString()}` : '₹0'}
                    </td>
                    <td className="p-3 text-center">
                      <SalesStatusBadge status={c.creditStatus} size="xs" />
                    </td>
                    <td className="p-3 text-right">
                      {isBlocked ? (
                        <button
                          onClick={() => handleReleaseCreditHold(c)}
                          className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200 flex items-center gap-1 ml-auto"
                        >
                          <Unlock className="w-3 h-3" /> Release Hold
                        </button>
                      ) : (
                        <button
                          onClick={() => showToast(`Credit statement generated for ${c.customerCode}`)}
                          className="px-2 py-1 rounded bg-[#F6F4EF] hover:bg-[#E4E0D6] text-[#14213D] font-semibold text-[11px] border border-[#E4E0D6]"
                        >
                          Statement
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
          itemName="accounts"
        />
      </div>
    </div>
  );
};
