import React, { useState } from 'react';
import {
  Truck,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Building,
  Package,
  Plus,
} from 'lucide-react';
import { SalesOrder } from '../../types';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  sos: SalesOrder[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const SalesDeliveryScheduleView: React.FC<Props> = ({ sos, onNavigate, showToast }) => {
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Flatten all dispatch logs from all SOs
  const allDispatches = sos.flatMap((so) =>
    (so.dispatchLogs || []).map((log) => ({
      ...log,
      soId: so.id,
      customer: so.customer,
      customerPO: so.customerPO,
    }))
  );

  const filteredDispatches = allDispatches.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.dc.toLowerCase().includes(q) ||
      d.soId.toLowerCase().includes(q) ||
      d.customer.toLowerCase().includes(q) ||
      d.transporter.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredDispatches.length / pageSize) || 1;
  const pagedDispatches = filteredDispatches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-[#0F8B8D]">
            <span>Logistics &middot; Outward Shipping Schedule</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">
            Delivery Schedule &amp; Outward Shipments
          </h1>
          <p className="text-xs text-[#6B7280]">
            Delivery challans, e-Way bills, transporter allocations, vehicle tracking, and customer receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Dispatch calendar refreshed')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-[#F6F4EF] hover:bg-[#E4E0D6] text-xs font-semibold text-[#14213D]"
          >
            <Calendar className="w-3.5 h-3.5 text-[#0F8B8D]" /> Schedule View
          </button>
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
            placeholder="Search delivery challan (DC), SO #, customer or transporter..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs bg-[#F6F4EF]"
          />
        </div>
        <div className="text-xs font-mono text-[#6B7280]">
          Total Dispatches: <b>{filteredDispatches.length}</b>
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
                <th className="p-3">Delivery Challan #</th>
                <th className="p-3">SO &amp; Customer</th>
                <th className="p-3">Dispatch Date</th>
                <th className="p-3 text-right">Dispatched Qty</th>
                <th className="p-3">Transporter &amp; Vehicle</th>
                <th className="p-3">e-Way Bill Ref</th>
                <th className="p-3">COA Status</th>
                <th className="p-3 text-center">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {pagedDispatches.length > 0 ? (
                pagedDispatches.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#0F8B8D]">{d.dc}</td>
                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{d.customer}</div>
                      <div className="text-[10px] font-mono text-[#6B7280]">
                        SO: {d.soId} &middot; PO: {d.customerPO || '—'}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[#6B7280]">{d.date}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                      {d.qty.toLocaleString()} PCS
                    </td>
                    <td className="p-3 text-[#14213D]">{d.transporter}</td>
                    <td className="p-3 font-mono text-[#6B7280]">{d.eWay || 'EWAY-88401'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-mono">
                        COA Attached
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="badge green">{d.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#9CA3AF]">
                    No delivery records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          totalItems={filteredDispatches.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="shipments"
        />
      </div>
    </div>
  );
};
