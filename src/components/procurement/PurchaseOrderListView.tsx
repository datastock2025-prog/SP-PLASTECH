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
} from 'lucide-react';
import { ExtendedPurchaseOrder, SupplierMaster } from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  pos: ExtendedPurchaseOrder[];
  suppliers: SupplierMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdatePO: (po: ExtendedPurchaseOrder) => void;
  onCreatePO: (po: ExtendedPurchaseOrder) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const PurchaseOrderListView: React.FC<Props> = ({
  pos,
  suppliers,
  onNavigate,
  onUpdatePO,
  onCreatePO,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredPos = useMemo(() => {
    return pos.filter((po) => {
      const matchSearch =
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.lines.some((l) => l.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || l.itemCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = selectedStatus === 'All' || po.status === selectedStatus;
      const matchSupplier = selectedSupplier === 'All' || po.supplierName === selectedSupplier;

      return matchSearch && matchStatus && matchSupplier;
    });
  }, [pos, searchTerm, selectedStatus, selectedSupplier]);

  const totalPages = Math.ceil(filteredPos.length / pageSize) || 1;
  const paginatedPos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPos.slice(start, start + pageSize);
  }, [filteredPos, currentPage, pageSize]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['PO Number', 'PO Date', 'Supplier', 'Expected Date', 'Status', 'Total (INR)', 'Payment Terms', 'Incoterms'];
    const rows = filteredPos.map((p) => [
      p.poNumber,
      p.poDate,
      `"${p.supplierName}"`,
      p.expectedDeliveryDate,
      p.status,
      p.totalAmount,
      `"${p.paymentTerms}"`,
      p.incoterms,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchase_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredPos.length} purchase orders to CSV`);
  };

  // Open Create PO Drawer
  const handleOpenCreateDrawer = () => {
    let formNumber = `PO-2026-${Math.floor(3400 + Math.random() * 600)}`;
    let formSupplierId = suppliers[0]?.id || 'SUP-001';
    let formExpectedDate = '2026-09-10';
    let formItemName = 'PP Natural Granules H110MA';
    let formItemCode = 'RM-PP-NAT-001';
    let formQty = 10000;
    let formPrice = 78.5;

    const handleCreate = () => {
      const sup = suppliers.find((s) => s.id === formSupplierId) || suppliers[0];
      const newPo: ExtendedPurchaseOrder = {
        id: formNumber,
        poNumber: formNumber,
        poDate: new Date().toISOString().slice(0, 10),
        expectedDeliveryDate: formExpectedDate,
        promisedDeliveryDate: formExpectedDate,
        supplierId: sup.id,
        supplierName: sup.name,
        supplierCode: sup.code,
        buyer: 'Vikram Seth (Senior Polymer Buyer)',
        plantWarehouse: 'RM-WH-01',
        deliveryTerms: sup.deliveryTerms || 'Door Delivery',
        paymentTerms: sup.paymentTerms || 'Net 30 Days',
        currency: 'INR (₹)',
        exchangeRate: 1.0,
        orderType: 'Standard PO',
        status: 'approved',
        approvalStatus: 'approved',
        totalSubtotal: formQty * formPrice,
        totalDiscount: 0,
        totalTax: formQty * formPrice * 0.18,
        freightAmount: 0,
        totalAmount: formQty * formPrice * 1.18,
        receivedAmount: 0,
        invoicedAmount: 0,
        outstandingAmount: formQty * formPrice * 1.18,
        shippingAddress: 'Reboot Plastic Mfg Plant 1, Plot 42, GIDC Industrial Estate, Vapi 396195',
        billingAddress: 'Reboot Polymer Solutions Ltd, Corporate Suite 800, Mumbai 400051',
        notes: 'Standard polymer granules supply order.',
        specialInstructions: 'Provide manufacturer batch test certificate & COA with vehicle delivery.',
        lines: [
          {
            lineNo: 1,
            itemCode: formItemCode,
            itemName: formItemName,
            description: 'Virgin injection & blow molding polymer granules',
            orderedQty: formQty,
            receivedQty: 0,
            invoicedQty: 0,
            remainingQty: formQty,
            uom: 'KG',
            unitPrice: formPrice,
            discountPct: 0,
            taxPct: 18,
            lineTotal: formQty * formPrice * 1.18,
            expectedDate: formExpectedDate,
            warehouse: 'RM-WH-01',
            binLocation: 'RM-WH-01-A1',
            lotRequired: true,
            coaRequired: true,
            msdsRequired: true,
            status: 'open',
          }
        ],
        grnList: [],
        invoiceList: [],
        approvals: [
          { level: 'Level 1: Procurement Officer', approver: 'Vikram Seth', status: 'Approved', date: new Date().toISOString().slice(0, 10) }
        ],
        activityHistory: [
          { date: new Date().toISOString().slice(0, 10), event: 'PO Created and Released', by: 'Vikram Seth' }
        ],
      };

      onCreatePO(newPo);
      closeDrawer();
      showToast(`Purchase Order ${newPo.poNumber} created for ${sup.name}`);
    };

    openDrawer(
      'Issue New Purchase Order (PO)',
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[#14213D] text-white rounded-xl">
          <div className="text-[10px] text-[#0F8B8D] font-bold uppercase">Commercial Commitment</div>
          <div className="font-bold text-sm">Direct Material Purchase Order</div>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">PO Number</label>
          <input
            type="text"
            defaultValue={formNumber}
            onChange={(e) => (formNumber = e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Supplier *</label>
          <select
            defaultValue={formSupplierId}
            onChange={(e) => (formSupplierId = e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Expected Delivery Date</label>
            <input
              type="date"
              defaultValue={formExpectedDate}
              onChange={(e) => (formExpectedDate = e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Receiving Warehouse</label>
            <input
              type="text"
              defaultValue="RM-WH-01 (Main Plant)"
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-xs"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
          <div className="font-semibold text-slate-700">Line Item</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-500 text-[10px]">Item Name</label>
              <input
                type="text"
                defaultValue={formItemName}
                onChange={(e) => (formItemName = e.target.value)}
                className="w-full px-2 py-1 border rounded bg-white text-xs"
              />
            </div>
            <div>
              <label className="text-slate-500 text-[10px]">Item Code</label>
              <input
                type="text"
                defaultValue={formItemCode}
                onChange={(e) => (formItemCode = e.target.value)}
                className="w-full px-2 py-1 border rounded bg-white font-mono text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-500 text-[10px]">Quantity (KG)</label>
              <input
                type="number"
                defaultValue={formQty}
                onChange={(e) => (formQty = Number(e.target.value))}
                className="w-full px-2 py-1 border rounded bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-slate-500 text-[10px]">Unit Price (₹/kg)</label>
              <input
                type="number"
                defaultValue={formPrice}
                onChange={(e) => (formPrice = Number(e.target.value))}
                className="w-full px-2 py-1 border rounded bg-white text-xs font-bold text-emerald-700"
              />
            </div>
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
          Create Purchase Order
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
            Purchase Orders (PO)
          </h1>
          <p className="text-xs text-slate-500">
            Approved purchase commitments, delivery schedules, goods receipts, and 3-way matching status
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-[#14213D] rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> Create PO
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO #, supplier, buyer, material..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2">
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
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-semibold">PO Number</th>
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
                  const totalOrdered = po.lines?.reduce((a, l) => a + (l.orderedQty ?? (l as any).quantityOrdered ?? 0), 0) || 0;
                  const totalRcvd = po.lines?.reduce((a, l) => a + (l.receivedQty ?? (l as any).quantityReceived ?? 0), 0) || 0;
                  const pct = totalOrdered > 0 ? Math.round((totalRcvd / totalOrdered) * 100) : 0;
                  const firstLine = po.lines?.[0];
                  const firstQty = firstLine?.orderedQty ?? (firstLine as any)?.quantityOrdered ?? 0;

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                      onClick={() => onNavigate('poDetail', { id: po.id })}
                    >
                      {/* PO Number */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#14213D] group-hover:text-[#0F8B8D]">
                          {po.poNumber}
                        </div>
                        <div className="text-[10px] text-slate-500">{po.poDate}</div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#14213D]">{po.supplierName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{po.paymentTerms}</div>
                      </td>

                      {/* Expected Date */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#14213D]">{po.expectedDeliveryDate}</div>
                        <div className="text-[10px] text-slate-500">{po.deliveryTerms || (po as any).incoterms || 'DAP'}</div>
                      </td>

                      {/* Material */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#14213D]">{firstLine?.itemName || 'Polymer Material'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {firstQty.toLocaleString()} {firstLine?.uom || 'KG'} @ ₹{firstLine?.unitPrice || 0}/kg
                        </div>
                      </td>

                      {/* Receipt Progress */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-teal-500' : 'bg-slate-300'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-semibold text-slate-600">{pct}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {totalRcvd.toLocaleString()} / {totalOrdered.toLocaleString()} KG
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right font-bold text-[#14213D]">
                        ₹{(po.totalAmount / 100000).toFixed(2)} Lakhs
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <ProcurementStatusBadge status={po.status} size="xs" />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigate('poPrint', { id: po.id })}
                            title="Print PO Document"
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onNavigate('poDetail', { id: po.id })}
                            className="p-1 hover:bg-slate-100 text-slate-500 rounded"
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

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredPos.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemName="purchase orders"
        />
      </div>
    </div>
  );
};
