import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  FileText,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  ArrowUpDown,
  Building,
  Printer,
  Sparkles,
} from 'lucide-react';
import { ExtendedPurchaseOrder, SupplierMaster, PurchaseRequisition } from '../../types/procurement';
import { ItemMaster } from '../../types';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { PaginationBar } from '../common/PaginationBar';
import { PurchaseOrderCreateModal } from './PurchaseOrderCreateModal';

interface Props {
  pos: ExtendedPurchaseOrder[];
  suppliers: SupplierMaster[];
  items?: ItemMaster[];
  prs?: PurchaseRequisition[];
  activeParam?: any;
  onNavigate: (view: string, param?: any) => void;
  onUpdatePO: (po: ExtendedPurchaseOrder) => void;
  onCreatePO: (po: ExtendedPurchaseOrder) => void;
  onUpdatePR?: (pr: PurchaseRequisition) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const PurchaseOrderListView: React.FC<Props> = ({
  pos,
  suppliers,
  items = [],
  prs = [],
  activeParam,
  onNavigate,
  onUpdatePO,
  onCreatePO,
  onUpdatePR,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
  const [selectedPrFilter, setSelectedPrFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New PO Wizard Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(
    () => Boolean(activeParam?.openCreateModal || activeParam?.sourcePr)
  );
  const [preselectedPr, setPreselectedPr] = useState<PurchaseRequisition | undefined>(() => {
    if (activeParam?.pr) return activeParam.pr;
    if (activeParam?.sourcePr) {
      return prs.find((p) => p.prNumber === activeParam.sourcePr || p.id === activeParam.sourcePr);
    }
    return undefined;
  });

  const filteredPos = useMemo(() => {
    return pos.filter((po) => {
      const matchSearch =
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.buyer || (po as any).buyerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.sourcePrNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.lines.some(
          (l) =>
            l.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchStatus = selectedStatus === 'All' || po.status === selectedStatus;
      const matchSupplier = selectedSupplier === 'All' || po.supplierName === selectedSupplier;
      const matchPr =
        selectedPrFilter === 'All' ||
        (selectedPrFilter === 'WithPR' && Boolean(po.sourcePrNumber)) ||
        (selectedPrFilter === 'Direct' && !po.sourcePrNumber);

      return matchSearch && matchStatus && matchSupplier && matchPr;
    });
  }, [pos, searchTerm, selectedStatus, selectedSupplier, selectedPrFilter]);

  const totalPages = Math.ceil(filteredPos.length / pageSize) || 1;
  const paginatedPos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPos.slice(start, start + pageSize);
  }, [filteredPos, currentPage, pageSize]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'PO Number',
      'PR Number',
      'PO Date',
      'Supplier',
      'Expected Date',
      'Status',
      'Total (INR)',
      'Payment Terms',
      'Delivery Terms',
    ];
    const rows = filteredPos.map((p) => [
      p.poNumber,
      p.sourcePrNumber || 'N/A',
      p.poDate,
      `"${p.supplierName}"`,
      p.expectedDeliveryDate,
      p.status,
      p.totalAmount,
      `"${p.paymentTerms}"`,
      `"${p.deliveryTerms || (p as any).incoterms || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchase_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredPos.length} purchase orders to CSV`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Purchase Orders (PO)
          </h1>
          <p className="text-xs text-slate-500">
            Approved purchase commitments, delivery schedules, goods receipts, and 3-way matching status
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-[#14213D] rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => {
              setPreselectedPr(undefined);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Create PO
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO #, PR #, supplier, buyer, material..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="sent_to_supplier">Sent to Supplier</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Fully Received</option>
            <option value="invoiced">Invoiced / Closed</option>
            <option value="approved">Approved Draft</option>
          </select>

          <select
            value={selectedSupplier}
            onChange={(e) => {
              setSelectedSupplier(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="All">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPrFilter}
            onChange={(e) => {
              setSelectedPrFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-mono"
          >
            <option value="All">All Sources (PR & Direct)</option>
            <option value="WithPR">Linked with PR</option>
            <option value="Direct">Direct Orders (No PR)</option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-semibold">PO Number & PR Ref</th>
                <th className="py-3 px-3 font-semibold">Supplier</th>
                <th className="py-3 px-3 font-semibold">Expected Date</th>
                <th className="py-3 px-3 font-semibold">Ordered Material</th>
                <th className="py-3 px-3 font-semibold">Receipt Progress</th>
                <th className="py-3 px-3 font-semibold text-right">Order Value</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                paginatedPos.map((po) => {
                  const totalOrdered =
                    po.lines?.reduce(
                      (a, l) => a + (l.orderedQty ?? (l as any).quantityOrdered ?? 0),
                      0
                    ) || 0;
                  const totalRcvd =
                    po.lines?.reduce(
                      (a, l) => a + (l.receivedQty ?? (l as any).quantityReceived ?? 0),
                      0
                    ) || 0;
                  const pct = totalOrdered > 0 ? Math.round((totalRcvd / totalOrdered) * 100) : 0;
                  const firstLine = po.lines?.[0];
                  const firstQty =
                    firstLine?.orderedQty ?? (firstLine as any)?.quantityOrdered ?? 0;

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                      onClick={() => onNavigate('poDetail', { id: po.id, poNumber: po.poNumber })}
                    >
                      {/* PO Number & PR Link */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#14213D] group-hover:text-[#0F8B8D]">
                          {po.poNumber}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500">{po.poDate}</span>
                          {po.sourcePrNumber ? (
                            <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              PR: {po.sourcePrNumber}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-medium">Direct</span>
                          )}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#14213D]">{po.supplierName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{po.paymentTerms}</div>
                      </td>

                      {/* Expected Date */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#14213D]">{po.expectedDeliveryDate}</div>
                        <div className="text-[10px] text-slate-500">
                          {po.deliveryTerms || (po as any).incoterms || 'FOR Gate'}
                        </div>
                      </td>

                      {/* Material */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#14213D]">
                          {firstLine?.itemName || 'Polymer Material'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {firstQty.toLocaleString()} {firstLine?.uom || 'KG'} @ ₹
                          {firstLine?.unitPrice || 0}/kg
                          {po.lines.length > 1 && ` (+${po.lines.length - 1} more)`}
                        </div>
                      </td>

                      {/* Receipt Progress */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct === 100
                                  ? 'bg-emerald-500'
                                  : pct > 0
                                  ? 'bg-teal-500'
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-semibold text-slate-600">
                            {pct}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {totalRcvd.toLocaleString()} / {totalOrdered.toLocaleString()} KG
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-[#14213D]">
                          ₹{((po.totalAmount || 0) / 100000).toFixed(2)} Lakhs
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ₹{(po.totalAmount || 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <ProcurementStatusBadge status={po.status} size="xs" />
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              onNavigate('poPrint', { id: po.id, poNumber: po.poNumber })
                            }
                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            title="Print PO"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              onNavigate('poDetail', { id: po.id, poNumber: po.poNumber })
                            }
                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            title="View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
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

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={filteredPos.length}
          />
        </div>
      </div>

      {/* Modern PO Creation Wizard Modal with connected Item Master autocomplete and PR linking */}
      {isCreateModalOpen && (
        <PurchaseOrderCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setPreselectedPr(undefined);
          }}
          suppliers={suppliers}
          items={items}
          prs={prs}
          preselectedPr={preselectedPr}
          onCreatePO={onCreatePO}
          onUpdatePR={onUpdatePR}
          showToast={showToast}
        />
      )}
    </div>
  );
};
