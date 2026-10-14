import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Printer,
  RotateCcw,
  CheckCircle2,
  Clock,
  Truck,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import { GoodsReceiptNoteExt } from '../../../types/grnTypes';
import { PaginationBar } from '../../common/PaginationBar';
import { useEnterpriseDataGrid, TimeHorizonScope } from '../../../hooks/useEnterpriseDataGrid';

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
  const [statusFilter, setStatusFilter] = useState('All');
  const [inspectionFilter, setInspectionFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');

  const warehouses = useMemo(() => Array.from(new Set(grns.map((g) => g.warehouse))), [grns]);

  // Pre-filter with specialized categorical criteria before fast engine processing
  const filteredGrnData = useMemo(() => {
    return grns.filter((g) => {
      if (statusFilter !== 'All' && g.status !== statusFilter) return false;
      if (inspectionFilter !== 'All' && g.inspectionStatus !== inspectionFilter) return false;
      if (warehouseFilter !== 'All' && g.warehouse !== warehouseFilter) return false;
      return true;
    });
  }, [grns, statusFilter, inspectionFilter, warehouseFilter]);

  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizeOptions,
    totalPages,
    totalItems,
    paginatedData: paginatedGrns,
    timeHorizon,
    setTimeHorizon,
    exportChunkedCSV,
    resetFilters,
  } = useEnterpriseDataGrid<GoodsReceiptNoteExt>({
    data: filteredGrnData,
    dateField: (item) => item.receiptDate,
    searchFields: [
      (item) => item.grnNumber,
      (item) => item.poNumber,
      (item) => item.supplierName,
      (item) => item.deliveryChallanNo,
      (item) => item.supplierInvoiceNo,
      (item) => item.vehicleNumber,
      (item) => item.gateEntryNumber,
      (item) => item.warehouse,
      (item) =>
        item.lines
          .map((l) => `${l.itemName} ${l.itemCode} ${l.lotBatchNumber} ${l.bin || ''}`)
          .join(' '),
    ],
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250, 500, 1000],
    defaultTimeHorizon: 'all',
  });

  const handleExport = () => {
    exportChunkedCSV(
      'GRN_Master_Registry',
      () => [
        'GRN Number',
        'Receipt Date',
        'Arrival Time',
        'PO Number',
        'Supplier Name',
        'DC Number',
        'Invoice Number',
        'Vehicle Number',
        'Gate Entry',
        'Warehouse',
        'Item Code',
        'Item Name',
        'Lot Number',
        'Received Qty',
        'Accepted Qty',
        'Rejected Qty',
        'UOM',
        'QC Status',
        'Posting Status',
      ],
      (g) => {
        const line = g.lines[0];
        return [
          g.grnNumber,
          g.receiptDate,
          g.arrivalTime,
          g.poNumber,
          g.supplierName,
          g.deliveryChallanNo,
          g.supplierInvoiceNo,
          g.vehicleNumber,
          g.gateEntryNumber,
          g.warehouse,
          line?.itemCode || '',
          line?.itemName || '',
          line?.lotBatchNumber || '',
          line?.currentReceivedQty || 0,
          line?.acceptedQty || 0,
          line?.rejectedQty || 0,
          line?.uom || '',
          g.inspectionStatus,
          g.inventoryPostingStatus,
        ];
      }
    );
    showToast(`Exported ${totalItems.toLocaleString()} GRN records to CSV`);
  };

  const handleResetAll = () => {
    setStatusFilter('All');
    setInspectionFilter('All');
    setWarehouseFilter('All');
    resetFilters();
  };

  const timeHorizonOptions: { label: string; value: TimeHorizonScope }[] = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'This Month', value: 'month' },
    { label: 'Last 90 Days', value: '90days' },
    { label: 'Current Year', value: 'year' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D] flex items-center gap-2">
            Goods Receipt Notes (GRN) Master Registry
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
              {totalItems.toLocaleString()} records
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Official ledger of inward gate receipts, accepted polymer stock, lot batches, and warehouse putaways
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export ({totalItems.toLocaleString()})
          </button>
          <button
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Live Inward GRN Entry
          </button>
        </div>
      </div>

      {/* Enterprise Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Row 1: Instant Search & Time Horizon Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search across 300,000+ GRNs (GRN #, PO #, supplier, lot batch, DC, invoice, truck #)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            />
          </div>

          {/* Time Horizon Date Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Horizon:
            </span>
            {timeHorizonOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeHorizon(opt.value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  timeHorizon === opt.value
                    ? 'bg-[#14213D] text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Categorical Dropdowns & Status Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
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
              <option value="All">All Warehouses ({warehouses.length})</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-500">
              Showing <strong>{paginatedGrns.length}</strong> of <strong>{totalItems.toLocaleString()}</strong> goods receipts
            </span>
          </div>
        </div>
      </div>

      {/* Main GRN Master Table - Slider-Free */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="w-full">
          <table className="w-full text-xs text-left table-fixed">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-2 font-semibold">GRN # & Date</th>
                <th className="py-2.5 px-2 font-semibold">PO Reference</th>
                <th className="py-2.5 px-2 font-semibold">Supplier</th>
                <th className="py-2.5 px-2 font-semibold">Vehicle & Pass</th>
                <th className="py-2.5 px-2 font-semibold">Lot / Batch #</th>
                <th className="py-2.5 px-2 font-semibold text-right">Received</th>
                <th className="py-2.5 px-2 font-semibold text-right">Accepted</th>
                <th className="py-2.5 px-1.5 font-semibold text-center">QC Status</th>
                <th className="py-2.5 px-1.5 font-semibold text-center">Posting</th>
                <th className="py-2.5 px-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedGrns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="font-semibold text-slate-600">No goods receipts match current criteria.</p>
                    <p className="text-[11px] text-slate-400">Adjust search queries or expand the date horizon.</p>
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
                      <td className="py-2.5 px-2 align-top">
                        <button
                          onClick={() => onSelectGrn(grn)}
                          className="font-mono font-bold text-[#14213D] hover:underline hover:text-[#0F8B8D] flex items-center gap-1 cursor-pointer text-xs"
                        >
                          {grn.grnNumber}
                          <Eye className="w-2.5 h-2.5 text-slate-400" />
                        </button>
                        <div className="text-[10px] text-slate-400 truncate">{grn.receiptDate} ({grn.arrivalTime})</div>
                      </td>

                      {/* PO Ref */}
                      <td className="py-2.5 px-2 align-top">
                        <div className="font-mono font-bold text-blue-700 text-xs">{grn.poNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate" title={grn.deliveryChallanNo}>
                          DC: {grn.deliveryChallanNo}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-2.5 px-2 align-top">
                        <div className="font-semibold text-slate-800 truncate text-xs" title={grn.supplierName}>
                          {grn.supplierName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">Inv: {grn.supplierInvoiceNo}</div>
                      </td>

                      {/* Vehicle & Gate */}
                      <td className="py-2.5 px-2 align-top">
                        <div className="font-mono font-bold text-slate-900 text-xs">{grn.vehicleNumber}</div>
                        <div className="text-[10px] text-slate-500 truncate" title={grn.transporterName}>
                          {grn.gateEntryNumber}
                        </div>
                      </td>

                      {/* Lot / Batch */}
                      <td className="py-2.5 px-2 align-top">
                        <div className="font-mono font-bold text-purple-700 text-xs truncate">{line?.lotBatchNumber}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          Bin: {line?.bin}
                        </div>
                      </td>

                      {/* Received Qty */}
                      <td className="py-2.5 px-2 text-right font-bold text-slate-900 text-xs align-top whitespace-nowrap">
                        {totalRecv.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{line?.uom}</span>
                      </td>

                      {/* Accepted Qty */}
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-700 text-xs align-top whitespace-nowrap">
                        {totalAcc.toLocaleString()} <span className="text-[10px] text-emerald-600 font-normal">{line?.uom}</span>
                      </td>

                      {/* QC Status */}
                      <td className="py-2.5 px-1.5 text-center align-top">
                        {grn.inspectionStatus === 'Approved' ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold whitespace-nowrap">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Passed
                          </span>
                        ) : grn.inspectionStatus === 'Rejected' ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold whitespace-nowrap">
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold whitespace-nowrap">
                            <Clock className="w-2.5 h-2.5 text-amber-600" /> Pending QC
                          </span>
                        )}
                      </td>

                      {/* Posting Status */}
                      <td className="py-2.5 px-1.5 text-center align-top">
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold inline-block truncate max-w-full ${
                            grn.inventoryPostingStatus.includes('Available')
                              ? 'bg-emerald-100 text-emerald-800'
                              : grn.inventoryPostingStatus.includes('Quarantine')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                          title={grn.inventoryPostingStatus}
                        >
                          {grn.inventoryPostingStatus}
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="py-2.5 px-2 text-right align-top">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectGrn(grn)}
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded transition cursor-pointer"
                            title="Drilldown 10-Tab GRN Details"
                          >
                            <Eye className="w-3 h-3 text-[#0F8B8D]" />
                          </button>
                          <button
                            onClick={() => onPrintGrn(grn)}
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded transition cursor-pointer"
                            title="Print GRN Voucher or Label"
                          >
                            <Printer className="w-3 h-3" />
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
          totalItems={totalItems}
          pageSizeOptions={pageSizeOptions}
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
