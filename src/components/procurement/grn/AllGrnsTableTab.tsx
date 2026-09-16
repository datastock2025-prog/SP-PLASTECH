import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Truck,
  Download,
  QrCode,
  Layers,
} from 'lucide-react';
import { GoodsReceiptNoteExt } from '../../../types/grnTypes';
import { PaginationBar } from '../../common/PaginationBar';

interface Props {
  grns: GoodsReceiptNoteExt[];
  onSelectGrn: (grn: GoodsReceiptNoteExt) => void;
  onOpenCreateModal: () => void;
  onPrintGrn: (grn: GoodsReceiptNoteExt) => void;
  onOpenReturnModal: (grn: GoodsReceiptNoteExt) => void;
  showToast: (msg: string) => void;
}

export const AllGrnsTableTab: React.FC<Props> = ({
  grns,
  onSelectGrn,
  onOpenCreateModal,
  onPrintGrn,
  onOpenReturnModal,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [inspectionFilter, setInspectionFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const warehouses = Array.from(new Set(grns.map((g) => g.warehouse)));

  const filteredGrns = grns.filter((g) => {
    const matchSearch =
      g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.lines.some(
        (l) =>
          l.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.lotBatchNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchStatus = statusFilter === 'All' || g.status === statusFilter;
    const matchInspection = inspectionFilter === 'All' || g.inspectionStatus === inspectionFilter;
    const matchWarehouse = warehouseFilter === 'All' || g.warehouse === warehouseFilter;

    return matchSearch && matchStatus && matchInspection && matchWarehouse;
  });

  const totalPages = Math.ceil(filteredGrns.length / pageSize) || 1;
  const paginatedGrns = filteredGrns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D]">
            Goods Receipt Notes (GRN) Master Registry
          </h2>
          <p className="text-xs text-slate-500">
            Official ledger of inward gate receipts, accepted polymer stock, lot batches, and warehouse putaways
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Live Inward GRN Entry
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search GRN #, PO #, supplier, lot batch, truck #..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="All">All GRN Statuses</option>
            <option value="posted">Posted to Stock</option>
            <option value="pending_qc">Pending QC Clearance</option>
            <option value="putaway_pending">Putaway Pending</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={inspectionFilter}
            onChange={(e) => {
              setInspectionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="All">All QC Results</option>
            <option value="Approved">Passed QC</option>
            <option value="Pending">Pending Lab Test</option>
            <option value="Quarantined">Quarantined</option>
            <option value="Rejected">Failed QC</option>
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="All">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main GRN Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-semibold">GRN # & Date</th>
                <th className="py-3 px-3 font-semibold">PO Reference</th>
                <th className="py-3 px-3 font-semibold">Supplier</th>
                <th className="py-3 px-3 font-semibold">Vehicle & Gate Pass</th>
                <th className="py-3 px-3 font-semibold">Lot / Batch #</th>
                <th className="py-3 px-3 font-semibold text-right">Received Qty</th>
                <th className="py-3 px-3 font-semibold text-right">Accepted Qty</th>
                <th className="py-3 px-3 font-semibold text-center">QC Status</th>
                <th className="py-3 px-3 font-semibold text-center">Posting Status</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedGrns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="font-semibold text-slate-600">No goods receipts match current criteria.</p>
                  </td>
                </tr>
              ) : (
                paginatedGrns.map((grn) => {
                  const line = grn.lines[0];
                  const totalRecv = grn.lines.reduce((s, l) => s + l.currentReceivedQty, 0);
                  const totalAcc = grn.lines.reduce((s, l) => s + l.acceptedQty, 0);

                  return (
                    <tr key={grn.id} className="hover:bg-slate-50/80 transition">
                      {/* GRN # & Date */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectGrn(grn)}
                          className="font-mono font-bold text-[#14213D] hover:underline hover:text-[#0F8B8D] flex items-center gap-1"
                        >
                          {grn.grnNumber}
                          <Eye className="w-3 h-3 text-slate-400" />
                        </button>
                        <div className="text-[10px] text-slate-400">{grn.receiptDate} ({grn.arrivalTime})</div>
                      </td>

                      {/* PO Ref */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-blue-700">{grn.poNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[110px]" title={grn.deliveryChallanNo}>
                          DC: {grn.deliveryChallanNo}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-3 max-w-[160px]">
                        <div className="font-semibold text-slate-800 truncate" title={grn.supplierName}>
                          {grn.supplierName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">Inv: {grn.supplierInvoiceNo}</div>
                      </td>

                      {/* Vehicle & Gate */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">{grn.vehicleNumber}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]" title={grn.transporterName}>
                          {grn.gateEntryNumber}
                        </div>
                      </td>

                      {/* Lot / Batch */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-purple-700">{line?.lotBatchNumber}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[110px]">
                          Bin: {line?.bin}
                        </div>
                      </td>

                      {/* Received Qty */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {totalRecv.toLocaleString()} {line?.uom}
                      </td>

                      {/* Accepted Qty */}
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        {totalAcc.toLocaleString()} {line?.uom}
                      </td>

                      {/* QC Status */}
                      <td className="py-3 px-3 text-center">
                        {grn.inspectionStatus === 'Approved' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed
                          </span>
                        ) : grn.inspectionStatus === 'Rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending QC
                          </span>
                        )}
                      </td>

                      {/* Posting Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          grn.inventoryPostingStatus.includes('Available')
                            ? 'bg-emerald-100 text-emerald-800'
                            : grn.inventoryPostingStatus.includes('Quarantine')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {grn.inventoryPostingStatus}
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectGrn(grn)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition"
                            title="Drilldown 10-Tab GRN Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#0F8B8D]" />
                          </button>
                          <button
                            onClick={() => onPrintGrn(grn)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition"
                            title="Print GRN Voucher or Label"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredGrns.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemName="goods receipts"
        />
      </div>
    </div>
  );
};
