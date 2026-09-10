import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Building,
  Package,
} from 'lucide-react';
import { GoodsReceiptNote, ExtendedPurchaseOrder } from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  grns: GoodsReceiptNote[];
  pos: ExtendedPurchaseOrder[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateGRN: (grn: GoodsReceiptNote) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const GoodsReceiptNoteView: React.FC<Props> = ({
  grns,
  pos,
  onNavigate,
  onUpdateGRN,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredGrns = grns.filter((g) => {
    const matchSearch =
      g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.lines.some((l) => l.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || l.lotBatchNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = selectedStatus === 'All' || g.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredGrns.length / pageSize) || 1;
  const paginatedGrns = filteredGrns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenCreateDrawer = () => {
    let formNumber = `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    let formPoNumber = pos[0]?.poNumber || 'PO-2026-3390';
    let formChallan = 'DC-9921';
    let formVehicle = 'GJ-15-XY-9081';
    let formCarrier = 'Vapi Express Logistics';
    let formBatch = `BATCH-PP-${Math.floor(1000 + Math.random() * 9000)}`;
    let formQty = 10000;

    const handleCreate = () => {
      const po = pos.find((p) => p.poNumber === formPoNumber) || pos[0];
      const newGrn: GoodsReceiptNote = {
        id: formNumber,
        grnNumber: formNumber,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        receiptDate: new Date().toISOString().slice(0, 10),
        warehouse: 'RM-WH-01',
        receivingDock: 'Dock 2',
        deliveryChallanNo: formChallan,
        vehicleNumber: formVehicle,
        transporterName: formCarrier,
        packingSlipRef: 'PS-9921',
        status: 'accepted',
        inspectionStatus: 'Approved',
        receivedBy: 'Ramesh Patel (Warehouse Supervisor)',
        notes: 'Goods received and inspected in good condition.',
        lines: [
          {
            lineNo: 1,
            poLineNo: 1,
            itemCode: po.lines[0]?.itemCode || 'RM-PP-NAT-001',
            itemName: po.lines[0]?.itemName || 'PP Natural Granules H110MA',
            orderedQty: formQty,
            receivedQty: formQty,
            acceptedQty: formQty,
            rejectedQty: 0,
            uom: 'KG',
            lotBatchNumber: formBatch,
            mfgDate: '2026-08-20',
            expiryDate: '2027-08-19',
            coaReference: 'COA-VERIFIED',
            binLocation: 'RM-WH-01-A1',
            quarantineBin: 'RM-WH-01-QZ',
            inspectionRequired: true,
            inspectionStatus: 'Passed QC',
          }
        ],
      };

      onUpdateGRN(newGrn);
      closeDrawer();
      showToast(`Logged Goods Receipt ${newGrn.grnNumber} for ${newGrn.supplierName}`);
    };

    openDrawer(
      'Log Inward Goods Receipt (GRN)',
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[#14213D] text-white rounded-xl">
          <div className="text-[10px] text-[#0F8B8D] font-bold uppercase">Dock Gate Entry</div>
          <div className="font-bold text-sm">Record Raw Material Physical Consignment</div>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Target Purchase Order</label>
          <select
            defaultValue={formPoNumber}
            onChange={(e) => (formPoNumber = e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
          >
            {pos.map((p) => (
              <option key={p.id} value={p.poNumber}>{p.poNumber} — {p.supplierName} ({p.lines[0]?.itemName})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">GRN Number</label>
            <input
              type="text"
              defaultValue={formNumber}
              onChange={(e) => (formNumber = e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Delivery Challan #</label>
            <input
              type="text"
              defaultValue={formChallan}
              onChange={(e) => (formChallan = e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Truck / Vehicle No.</label>
            <input
              type="text"
              defaultValue={formVehicle}
              onChange={(e) => (formVehicle = e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white font-mono text-xs uppercase"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Carrier Name</label>
            <input
              type="text"
              defaultValue={formCarrier}
              onChange={(e) => (formCarrier = e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
          <div className="font-semibold text-slate-700">Consignment Batch & Weighment</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-500 text-[10px]">Supplier Lot / Batch #</label>
              <input
                type="text"
                defaultValue={formBatch}
                onChange={(e) => (formBatch = e.target.value)}
                className="w-full px-2 py-1 border rounded bg-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-slate-500 text-[10px]">Received Quantity (KG)</label>
              <input
                type="number"
                defaultValue={formQty}
                onChange={(e) => (formQty = Number(e.target.value))}
                className="w-full px-2 py-1 border rounded bg-white text-xs font-bold text-[#14213D]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 text-slate-600">
            <input type="checkbox" defaultChecked className="rounded text-[#0F8B8D]" />
            <span>COA (Certificate of Analysis) inspected and attached</span>
          </div>
        </div>
      </div>,
      <div className="flex justify-end gap-2">
        <button
          onClick={closeDrawer}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm"
        >
          Generate GRN & Clear Gate
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Goods Receipt Notes (GRN)
          </h1>
          <p className="text-xs text-slate-500">
            Inward material gate entries, physical receipt verification, batch tracking, and QC release
          </p>
        </div>

        <button
          onClick={handleOpenCreateDrawer}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Log Gate Entry (GRN)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by GRN #, PO #, batch lot, or truck vehicle..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
        >
          <option value="All">All Statuses</option>
          <option value="approved">Approved & Passed QC</option>
          <option value="draft">Quarantine Inspection</option>
          <option value="rejected">Rejected at Dock</option>
        </select>
      </div>

      {/* GRN Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-semibold">GRN Number</th>
                <th className="py-3 px-3 font-semibold">PO Reference</th>
                <th className="py-3 px-3 font-semibold">Supplier Name</th>
                <th className="py-3 px-3 font-semibold">Vehicle & Carrier</th>
                <th className="py-3 px-3 font-semibold">Batch / Lot #</th>
                <th className="py-3 px-3 font-semibold text-right">Received Qty</th>
                <th className="py-3 px-3 font-semibold text-center">QC Status</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedGrns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No goods receipts recorded.
                  </td>
                </tr>
              ) : (
                paginatedGrns.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[#14213D]">{grn.grnNumber}</div>
                      <div className="text-[10px] text-slate-500">{grn.receiptDate}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-[#0F8B8D]">{grn.poNumber}</div>
                      <div className="text-[10px] text-slate-500">Challan: {grn.deliveryChallanNo}</div>
                    </td>

                    <td className="py-3 px-3 font-medium text-[#14213D]">{grn.supplierName}</td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[#14213D]">{grn.vehicleNumber}</div>
                      <div className="text-[10px] text-slate-500">{grn.transporterName}</div>
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      {grn.lines[0]?.lotBatchNumber}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-[#14213D]">
                      {(grn.lines[0]?.receivedQty ?? 0).toLocaleString()} {grn.lines[0]?.uom || 'KG'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> QC Passed
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <ProcurementStatusBadge status={grn.status} size="xs" />
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
