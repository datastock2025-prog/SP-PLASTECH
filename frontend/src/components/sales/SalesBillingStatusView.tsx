import React, { useState } from 'react';
import {
  DollarSign,
  Search,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { SALES_BILLING_RECORDS, BillingRecord } from '../../data/salesData';
import { SalesStatusBadge } from './SalesStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  showToast: (msg: string) => void;
}

export const SalesBillingStatusView: React.FC<Props> = ({ showToast }) => {
  const [records, setRecords] = useState<BillingRecord[]>(SALES_BILLING_RECORDS);
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.soId.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q) ||
      r.deliveryNote.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedRecords = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleGenerateInvoice = (rec: BillingRecord) => {
    setRecords((prev) =>
      prev.map((b) =>
        b.deliveryNote === rec.deliveryNote
          ? {
              ...b,
              invoiceStatus: 'invoiced',
              invoiceId: `INV-2026-${Math.floor(200 + Math.random() * 800)}`,
            }
          : b
      )
    );
    showToast(`Tax invoice generated for ${rec.deliveryNote}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-[#0F8B8D]">
            <span>Financial Flow &middot; Invoicing &amp; Billing Runs</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">
            Sales Billing &amp; Invoicing Status
          </h1>
          <p className="text-xs text-[#6B7280]">
            Delivered-not-invoiced dispatches, partial billing reconciliation, GST invoices, and payment tracking.
          </p>
        </div>

        <button
          onClick={() => {
            setRecords((prev) =>
              prev.map((b) => ({
                ...b,
                invoiceStatus: 'invoiced',
                invoiceId: b.invoiceId || `INV-2026-${Math.floor(200 + Math.random() * 800)}`,
              }))
            );
            showToast('All ready dispatches invoiced successfully');
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white text-xs font-semibold shadow-xs"
        >
          <DollarSign className="w-3.5 h-3.5" /> Run Automated Billing Batch
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                <th className="p-3">Delivery Challan #</th>
                <th className="p-3">SO &amp; Customer</th>
                <th className="p-3">Dispatch Date</th>
                <th className="p-3 text-right">Delivered Value (₹)</th>
                <th className="p-3 text-right">Delivered Qty</th>
                <th className="p-3">Invoice Ref #</th>
                <th className="p-3 text-center">Billing Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {pagedRecords.map((r) => (
                <tr key={r.deliveryNote} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-[#0F8B8D]">{r.deliveryNote}</td>
                  <td className="p-3">
                    <div className="font-bold text-[#14213D]">{r.customer}</div>
                    <div className="text-[10px] font-mono text-[#6B7280]">SO: {r.soId}</div>
                  </td>
                  <td className="p-3 font-mono text-[#6B7280]">{r.deliveryDate}</td>
                  <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                    ₹{r.deliveredValue.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                    {r.deliveredQty.toLocaleString()} PCS
                  </td>
                  <td className="p-3 font-mono text-[#14213D]">
                    {r.invoiceId || <span className="text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="p-3 text-center">
                    <SalesStatusBadge status={r.invoiceStatus} size="xs" />
                  </td>
                  <td className="p-3 text-right">
                    {r.invoiceStatus !== 'invoiced' ? (
                      <button
                        onClick={() => handleGenerateInvoice(r)}
                        className="px-2.5 py-1 rounded bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white font-semibold text-[11px] shadow-xs"
                      >
                        Generate Invoice
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#6B7280] font-medium">Billed</span>
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
          itemName="billing records"
        />
      </div>
    </div>
  );
};
