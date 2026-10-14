import React, { useState, useMemo } from 'react';
import {
  Search,
  Truck,
  Plus,
  Printer,
  Eye,
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { ConfirmedPoQueueItem } from '../../../types/grnTypes';
import { PaginationBar } from '../../common/PaginationBar';
import { useEnterpriseDataGrid, TimeHorizonScope } from '../../../hooks/useEnterpriseDataGrid';

interface Props {
  poQueue: ConfirmedPoQueueItem[];
  onOpenCreateModal: (item: ConfirmedPoQueueItem) => void;
  onViewPoDetails: (poNumber: string) => void;
  showToast: (msg: string) => void;
}

export const ConfirmedPoQueueTab: React.FC<Props> = ({
  poQueue,
  onOpenCreateModal,
  onViewPoDetails,
  showToast,
}) => {
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [vehicleArrivedOnly, setVehicleArrivedOnly] = useState(false);
  const [qualityOnly, setQualityOnly] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState('All');

  // Extract unique filter dropdown values
  const suppliers = useMemo(() => Array.from(new Set(poQueue.map((p) => p.supplierName))), [poQueue]);
  const warehouses = useMemo(() => Array.from(new Set(poQueue.map((p) => p.warehouse))), [poQueue]);

  // Pre-filter with specialized dropdowns before passing to high-speed Enterprise Grid engine
  const filteredQueueData = useMemo(() => {
    return poQueue.filter((item) => {
      if (supplierFilter !== 'All' && item.supplierName !== supplierFilter) return false;
      if (materialTypeFilter !== 'All' && item.materialType !== materialTypeFilter) return false;
      if (statusFilter !== 'All' && item.poStatus !== statusFilter) return false;
      if (warehouseFilter !== 'All' && item.warehouse !== warehouseFilter) return false;
      if (vehicleArrivedOnly && !item.vehicleArrived) return false;
      if (qualityOnly && !item.qualityRequired) return false;
      return true;
    });
  }, [poQueue, supplierFilter, materialTypeFilter, statusFilter, warehouseFilter, vehicleArrivedOnly, qualityOnly]);

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
    paginatedData: paginatedQueue,
    timeHorizon,
    setTimeHorizon,
    exportChunkedCSV,
    resetFilters,
  } = useEnterpriseDataGrid<ConfirmedPoQueueItem>({
    data: filteredQueueData,
    dateField: (item) => item.poDate || item.expectedDate,
    searchFields: [
      (item) => item.poNumber,
      (item) => item.supplierName,
      (item) => item.itemName,
      (item) => item.itemCode,
      (item) => item.vehicleNumber,
      (item) => item.warehouse,
      (item) => item.receivingDock,
    ],
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250, 500, 1000],
    defaultTimeHorizon: 'all',
  });

  const handleExport = () => {
    exportChunkedCSV(
      'Confirmed_PO_Inward_Queue',
      () => [
        'PO Number',
        'PO Date',
        'Supplier',
        'Item Code',
        'Item Name',
        'Material Type',
        'Ordered Qty',
        'Prev Recv',
        'Open Qty',
        'UOM',
        'Dock',
        'Warehouse',
        'Status',
        'Vehicle No',
      ],
      (p) => [
        p.poNumber,
        p.poDate,
        p.supplierName,
        p.itemCode,
        p.itemName,
        p.materialType,
        p.orderedQty,
        p.previouslyReceivedQty,
        p.openPoQty,
        p.uom,
        p.receivingDock,
        p.warehouse,
        p.poStatus,
        p.vehicleNumber || '',
      ]
    );
    showToast(`Exported ${totalItems.toLocaleString()} PO queue records to CSV`);
  };

  const handlePrintChecklist = (item: ConfirmedPoQueueItem) => {
    showToast(`Generating Inward Receiving Checklist & Tare Slip for ${item.poNumber}`);
  };

  const handleResetAll = () => {
    setSupplierFilter('All');
    setMaterialTypeFilter('All');
    setStatusFilter('All');
    setWarehouseFilter('All');
    setVehicleArrivedOnly(false);
    setQualityOnly(false);
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
      {/* Header Description & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D] flex items-center gap-2">
            Confirmed PO Inward Receiving Queue
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
              {totalItems.toLocaleString()} total
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Approved purchase orders synced and awaiting physical dock gate entry, weighbridge tally, and live unloading
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export ({totalItems.toLocaleString()})
          </button>
        </div>
      </div>

      {/* Enterprise Filter & Search Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Row 1: Search & Quick Time Horizons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Instant Search across records (PO #, supplier, material, item code, truck #)..."
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

        {/* Row 2: Categorical Select Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <select
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="All">All Suppliers ({suppliers.length})</option>
            {suppliers.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={materialTypeFilter}
            onChange={(e) => {
              setMaterialTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="All">All Material Types</option>
            <option value="RM">Raw Material (RM)</option>
            <option value="CON">Concentrates & Masterbatch (CON)</option>
            <option value="PCK">Packaging (PCK)</option>
            <option value="BOP">Bought-Out Parts (BOP)</option>
            <option value="Spare parts">Spare Parts</option>
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

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="All">All PO Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Partially Received">Partially Received</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        {/* Row 3: Filter Toggle Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={vehicleArrivedOnly}
                onChange={(e) => {
                  setVehicleArrivedOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded text-[#0F8B8D] focus:ring-0"
              />
              <span>Vehicle Arrived at Gate ({poQueue.filter((p) => p.vehicleArrived).length})</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={qualityOnly}
                onChange={(e) => {
                  setQualityOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded text-[#0F8B8D] focus:ring-0"
              />
              <span>Mandatory QC Required</span>
            </label>
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
              Showing <strong>{paginatedQueue.length}</strong> of <strong>{totalItems.toLocaleString()}</strong> receivable lines
            </span>
          </div>
        </div>
      </div>

      {/* Confirmed PO Table - No slider / fits 100% cleanly */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="w-full">
          <table className="w-full text-xs text-left table-fixed">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
              <col className="w-[5%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-2 font-semibold">PO # & Date</th>
                <th className="py-2.5 px-2 font-semibold">Supplier</th>
                <th className="py-2.5 px-2 font-semibold">Material / Item</th>
                <th className="py-2.5 px-1.5 font-semibold text-center">Type</th>
                <th className="py-2.5 px-2 font-semibold text-right">Ordered</th>
                <th className="py-2.5 px-2 font-semibold text-right">Prev Recv</th>
                <th className="py-2.5 px-2 font-semibold text-right">Open Qty</th>
                <th className="py-2.5 px-2 font-semibold">Dock & WH</th>
                <th className="py-2.5 px-1.5 font-semibold text-center">Gate Arrival</th>
                <th className="py-2.5 px-1.5 font-semibold text-center">QC Routing</th>
                <th className="py-2.5 px-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedQueue.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="space-y-1">
                      <Truck className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">No confirmed purchase orders match criteria.</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your filters or date horizon.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    {/* PO Number */}
                    <td className="py-2.5 px-2 align-top">
                      <button
                        onClick={() => onViewPoDetails(item.poNumber)}
                        className="font-mono font-bold text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer text-xs"
                      >
                        {item.poNumber} <Eye className="w-2.5 h-2.5 text-blue-400" />
                      </button>
                      <div className="text-[10px] text-slate-400">{item.poDate}</div>
                      <div className="text-[10px] font-semibold text-slate-500">Line #{item.poLineNo}</div>
                    </td>

                    {/* Supplier */}
                    <td className="py-2.5 px-2 align-top">
                      <div className="font-semibold text-[#14213D] truncate text-xs" title={item.supplierName}>
                        {item.supplierName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate" title={item.supplierGstin}>
                        GSTIN: {item.supplierGstin}
                      </div>
                    </td>

                    {/* Material */}
                    <td className="py-2.5 px-2 align-top">
                      <div className="font-semibold text-slate-800 truncate text-xs" title={item.itemName}>
                        {item.itemName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate" title={item.itemCode}>
                        {item.itemCode}
                      </div>
                    </td>

                    {/* Material Type */}
                    <td className="py-2.5 px-1.5 text-center align-top">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold inline-block ${
                          item.materialType === 'RM'
                            ? 'bg-blue-100 text-blue-800'
                            : item.materialType === 'CON'
                            ? 'bg-purple-100 text-purple-800'
                            : item.materialType === 'PCK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.materialType}
                      </span>
                    </td>

                    {/* Ordered Qty */}
                    <td className="py-2.5 px-2 text-right font-medium text-slate-700 text-xs align-top whitespace-nowrap">
                      {item.orderedQty.toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-400">{item.uom}</span>
                    </td>

                    {/* Previously Received Qty */}
                    <td className="py-2.5 px-2 text-right text-slate-500 text-xs align-top whitespace-nowrap">
                      {item.previouslyReceivedQty.toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-400">{item.uom}</span>
                    </td>

                    {/* Open Qty */}
                    <td className="py-2.5 px-2 text-right font-bold text-emerald-700 text-xs align-top whitespace-nowrap">
                      {item.openPoQty.toLocaleString()}{' '}
                      <span className="text-[10px] text-emerald-600 font-normal">{item.uom}</span>
                    </td>

                    {/* Dock & WH */}
                    <td className="py-2.5 px-2 align-top">
                      <div className="font-medium text-slate-700 truncate text-xs" title={item.receivingDock}>
                        {item.receivingDock}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate" title={item.warehouse}>
                        {item.warehouse}
                      </div>
                    </td>

                    {/* Gate Arrival */}
                    <td className="py-2.5 px-1.5 text-center align-top">
                      {item.vehicleArrived ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Arrived
                          </span>
                          <div className="text-[10px] font-mono text-slate-600 truncate" title={item.vehicleNumber}>
                            {item.vehicleNumber}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                            <Clock className="w-2.5 h-2.5 text-slate-400" /> In Transit
                          </span>
                          <div className="text-[10px] text-slate-400 truncate">Exp: {item.expectedDate}</div>
                        </div>
                      )}
                    </td>

                    {/* QC Routing Mode */}
                    <td className="py-2.5 px-1.5 text-center align-top">
                      {item.qcMode === 'QC_BEFORE_GRN' ? (
                        <span
                          className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 inline-block whitespace-nowrap"
                          title="Sample tested before inventory post"
                        >
                          QC Before GRN
                        </span>
                      ) : item.qcMode === 'QC_AFTER_GRN' ? (
                        <span
                          className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 inline-block whitespace-nowrap"
                          title="Posted to quarantine pending test"
                        >
                          QC After GRN
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 inline-block whitespace-nowrap">
                          Direct
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenCreateModal(item)}
                          className="px-2 py-1 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded text-[11px] font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="Create Goods Receipt Note against this line"
                        >
                          <Plus className="w-2.5 h-2.5" /> Create GRN
                        </button>
                        <button
                          onClick={() => handlePrintChecklist(item)}
                          className="p-1 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
                          title="Print Inward Receiving Checklist"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
          itemName="receivable PO lines"
        />
      </div>
    </div>
  );
};
