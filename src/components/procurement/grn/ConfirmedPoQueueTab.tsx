import React, { useState } from 'react';
import {
  Search,
  Filter,
  Truck,
  Plus,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Eye,
  Building,
  Calendar,
  Layers,
  ChevronDown,
  Download,
} from 'lucide-react';
import { ConfirmedPoQueueItem, MaterialType } from '../../../types/grnTypes';
import { PaginationBar } from '../../common/PaginationBar';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [vehicleArrivedOnly, setVehicleArrivedOnly] = useState(false);
  const [qualityOnly, setQualityOnly] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract unique filter dropdown values
  const suppliers = Array.from(new Set(poQueue.map((p) => p.supplierName)));
  const warehouses = Array.from(new Set(poQueue.map((p) => p.warehouse)));

  const filteredQueue = poQueue.filter((item) => {
    const matchSearch =
      item.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSupplier = supplierFilter === 'All' || item.supplierName === supplierFilter;
    const matchMaterial = materialTypeFilter === 'All' || item.materialType === materialTypeFilter;
    const matchStatus = statusFilter === 'All' || item.poStatus === statusFilter;
    const matchWarehouse = warehouseFilter === 'All' || item.warehouse === warehouseFilter;
    const matchVehicle = !vehicleArrivedOnly || item.vehicleArrived;
    const matchQuality = !qualityOnly || item.qualityRequired;

    return (
      matchSearch &&
      matchSupplier &&
      matchMaterial &&
      matchStatus &&
      matchWarehouse &&
      matchVehicle &&
      matchQuality
    );
  });

  const totalPages = Math.ceil(filteredQueue.length / pageSize) || 1;
  const paginatedQueue = filteredQueue.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePrintChecklist = (item: ConfirmedPoQueueItem) => {
    showToast(`Generating Inward Receiving Checklist & Tare Slip for ${item.poNumber}`);
  };

  return (
    <div className="space-y-4">
      {/* Header Description & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D]">
            Confirmed PO Inward Receiving Queue
          </h2>
          <p className="text-xs text-slate-500">
            Approved purchase orders synced and awaiting physical dock gate entry, weighbridge tally, and live unloading
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                ['PO,Date,Supplier,Item,Qty,UOM,Dock,Status'].join(',') +
                '\n' +
                poQueue
                  .map(
                    (p) =>
                      `${p.poNumber},${p.poDate},"${p.supplierName}","${p.itemName}",${p.openPoQty},${p.uom},${p.receivingDock},${p.poStatus}`
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `PO_Inward_Queue_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              showToast('Exported Confirmed PO Queue to CSV');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" /> Export Queue
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PO #, supplier, material name, item code, truck..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="All">All Suppliers</option>
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
        </div>

        {/* Filter Toggle Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 border-t border-slate-100">
          <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={vehicleArrivedOnly}
              onChange={(e) => setVehicleArrivedOnly(e.target.checked)}
              className="rounded text-[#0F8B8D] focus:ring-0"
            />
            <span>Vehicle Arrived at Gate ({poQueue.filter((p) => p.vehicleArrived).length})</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={qualityOnly}
              onChange={(e) => setQualityOnly(e.target.checked)}
              className="rounded text-[#0F8B8D] focus:ring-0"
            />
            <span>Mandatory QC Required</span>
          </label>

          <span className="text-slate-400">|</span>
          <span className="text-[11px] text-slate-500">
            Showing <strong>{filteredQueue.length}</strong> receivable line items
          </span>
        </div>
      </div>

      {/* Confirmed PO Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-semibold">PO Number & Date</th>
                <th className="py-3 px-3 font-semibold">Supplier</th>
                <th className="py-3 px-3 font-semibold">Material / Item</th>
                <th className="py-3 px-3 font-semibold text-center">Type</th>
                <th className="py-3 px-3 font-semibold text-right">Ordered</th>
                <th className="py-3 px-3 font-semibold text-right">Previously Recv</th>
                <th className="py-3 px-3 font-semibold text-right">Open Qty</th>
                <th className="py-3 px-3 font-semibold">Receiving Dock & WH</th>
                <th className="py-3 px-3 font-semibold text-center">Gate Arrival</th>
                <th className="py-3 px-3 font-semibold text-center">QC Routing</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedQueue.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="space-y-1">
                      <Truck className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">No confirmed purchase orders available for receiving.</p>
                      <p className="text-[11px] text-slate-400">Check filters or verify that POs have been approved.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    {/* PO Number */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onViewPoDetails(item.poNumber)}
                        className="font-mono font-bold text-blue-700 hover:underline flex items-center gap-1"
                      >
                        {item.poNumber} <Eye className="w-3 h-3 text-blue-400" />
                      </button>
                      <div className="text-[10px] text-slate-400">Date: {item.poDate}</div>
                      <div className="text-[10px] font-semibold text-slate-500">Line #{item.poLineNo}</div>
                    </td>

                    {/* Supplier */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#14213D]">{item.supplierName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">GSTIN: {item.supplierGstin}</div>
                    </td>

                    {/* Material */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-800 truncate" title={item.itemName}>
                        {item.itemName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{item.itemCode}</div>
                    </td>

                    {/* Material Type */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.materialType === 'RM'
                          ? 'bg-blue-100 text-blue-800'
                          : item.materialType === 'CON'
                          ? 'bg-purple-100 text-purple-800'
                          : item.materialType === 'PCK'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.materialType}
                      </span>
                    </td>

                    {/* Ordered Qty */}
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {item.orderedQty.toLocaleString()} {item.uom}
                    </td>

                    {/* Previously Received Qty */}
                    <td className="py-3 px-3 text-right text-slate-500">
                      {item.previouslyReceivedQty.toLocaleString()} {item.uom}
                    </td>

                    {/* Open Qty */}
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {item.openPoQty.toLocaleString()} {item.uom}
                    </td>

                    {/* Dock & WH */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-700">{item.receivingDock}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.warehouse}</div>
                    </td>

                    {/* Gate Arrival */}
                    <td className="py-3 px-3 text-center">
                      {item.vehicleArrived ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Arrived
                          </span>
                          <div className="text-[10px] font-mono text-slate-600 truncate max-w-[110px]" title={item.vehicleNumber}>
                            {item.vehicleNumber}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                            <Clock className="w-3 h-3 text-slate-400" /> In Transit
                          </span>
                          <div className="text-[10px] text-slate-400">Exp: {item.expectedDate}</div>
                        </div>
                      )}
                    </td>

                    {/* QC Routing Mode */}
                    <td className="py-3 px-3 text-center">
                      {item.qcMode === 'QC_BEFORE_GRN' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200" title="Sample tested before inventory post">
                          QC Before GRN
                        </span>
                      ) : item.qcMode === 'QC_AFTER_GRN' ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200" title="Posted to quarantine pending test">
                          QC After GRN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          Direct Receipt
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenCreateModal(item)}
                          className="px-2.5 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1"
                          title="Create Goods Receipt Note against this line"
                        >
                          <Plus className="w-3 h-3" /> Create GRN
                        </button>
                        <button
                          onClick={() => handlePrintChecklist(item)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                          title="Print Inward Receiving Checklist"
                        >
                          <Printer className="w-3.5 h-3.5" />
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
          totalItems={filteredQueue.length}
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
