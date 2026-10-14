import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Truck,
  FileText,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Download,
  Calendar,
  Layers,
  Plus,
  Send,
  Scale,
  Building2,
  MapPin,
  User,
  Check,
  ChevronRight,
  Sparkles,
  Package,
  Receipt,
  FileSpreadsheet,
  Phone,
  Navigation,
  FileCheck,
  Info,
} from 'lucide-react';
import {
  ExtendedPurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoiceRecord,
} from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';

interface Props {
  poId: string;
  pos: ExtendedPurchaseOrder[];
  grns: GoodsReceiptNote[];
  invoices: SupplierInvoiceRecord[];
  onNavigate: (view: string, param?: any) => void;
  onUpdatePO: (po: ExtendedPurchaseOrder) => void;
  showToast: (msg: string) => void;
}

export const PurchaseOrderDetailView: React.FC<Props> = ({
  poId,
  pos,
  grns,
  invoices,
  onNavigate,
  onUpdatePO,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const po =
    pos.find((p) => p.id === poId || p.poNumber === poId) ||
    pos.find(
      (p) =>
        p.id.toLowerCase() === (poId || '').toLowerCase() ||
        p.poNumber?.toLowerCase() === (poId || '').toLowerCase()
    ) ||
    pos[0];

  if (!po) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-12">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#14213D]">Purchase Order Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          The requested purchase order record could not be loaded or may have been archived.
        </p>
        <button
          onClick={() => onNavigate('poList')}
          className="px-4 py-2 bg-[#14213D] text-white rounded-xl text-xs font-semibold hover:bg-[#1f2f56] transition"
        >
          Return to Purchase Orders
        </button>
      </div>
    );
  }

  const linkedGrns = grns.filter((g) => g.poNumber === po.poNumber);
  const linkedInvoices = invoices.filter((i) => i.poNumber === po.poNumber);

  // Calculations
  const totalOrderedQty = po.lines.reduce(
    (sum, l) => sum + (l.orderedQty ?? (l as any).quantityOrdered ?? 0),
    0
  );
  const totalReceivedQty = po.lines.reduce(
    (sum, l) => sum + (l.receivedQty ?? (l as any).quantityReceived ?? 0),
    0
  );
  const receiptProgressPct =
    totalOrderedQty > 0 ? Math.min(100, Math.round((totalReceivedQty / totalOrderedQty) * 100)) : 0;

  const subtotal = po.totalSubtotal ?? po.lines.reduce((s, l) => s + (l.lineTotal || 0), 0);
  const taxAmount = po.totalTax ?? (po.totalAmount ? po.totalAmount - subtotal - (po.freightAmount || 0) : 0);
  const freight = po.freightAmount ?? 0;
  const grandTotal = po.totalAmount ?? subtotal + taxAmount + freight;

  const tabsConfig = [
    { id: 0, label: 'Overview', icon: FileText, count: null },
    { id: 1, label: 'Line Items & Specs', icon: Layers, count: po.lines.length },
    { id: 2, label: 'Goods Receipts', icon: Truck, count: linkedGrns.length },
    { id: 3, label: 'Invoices & 3-Way Match', icon: DollarSign, count: linkedInvoices.length },
    { id: 4, label: 'PPV & Cost Breakdown', icon: Scale, count: null },
    { id: 5, label: 'Quality & IQC Protocols', icon: ShieldCheck, count: null },
    { id: 6, label: 'Dispatch & Tracking', icon: Send, count: null },
    { id: 7, label: 'Documents & Attachments', icon: Download, count: 2 },
    { id: 8, label: 'Approval Audit Trail', icon: CheckCircle2, count: po.approvals?.length || 2 },
  ];

  return (
    <div className="space-y-5 pb-16 max-w-[1600px] mx-auto animate-fade-in">
      {/* Top Header & Breadcrumb Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('poList')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Back to PO List</span>
          </button>
          <div className="h-4 w-px bg-slate-300 hidden sm:block" />
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Procurement & Sourcing</span>
          <span className="text-xs text-slate-300 hidden sm:inline">/</span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Purchase Orders</span>
          <span className="text-xs text-slate-300 hidden sm:inline">/</span>
          <span className="text-xs font-mono font-bold text-[#14213D]">{po.poNumber}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('poPrint', { id: po.id, poNumber: po.poNumber })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print PO PDF</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              showToast(`PO ${po.poNumber} link copied to clipboard`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Share PO</span>
          </button>

          {(po.status === 'sent_to_supplier' || po.status === 'partially_received' || po.status === 'approved') && (
            <button
              onClick={() => {
                showToast(`Opening Inward Goods Receipt creator for ${po.poNumber}`);
                onNavigate('grnList');
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Record Inward (GRN)</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Header Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: PO Identity & Metadata */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-2xl font-extrabold text-[#14213D] tracking-tight">
                  {po.poNumber}
                </span>
                <ProcurementStatusBadge status={po.status} size="sm" pulse={po.status === 'sent_to_supplier'} />
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {po.orderType || 'Standard Commercial PO'}
                </span>
              </div>

              {/* Source Requisition / RFQ Reference Chips */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                {po.sourcePrNumber && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/60 font-semibold">
                    <FileText className="w-3 h-3 text-amber-600" />
                    PR: {po.sourcePrNumber}
                  </span>
                )}
                {(po.sourceRfqNumber || (po as any).rfqReference) && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200/60 font-semibold">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    RFQ: {po.sourceRfqNumber || (po as any).rfqReference}
                  </span>
                )}
                {po.contractRef && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200/60 font-semibold">
                    Contract: {po.contractRef}
                  </span>
                )}
              </div>

              {/* Meta Timestamps */}
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>PO Date: <strong className="text-slate-700">{po.poDate}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Promised: <strong className="text-slate-700">{po.expectedDeliveryDate}</strong></span>
                </div>
              </div>
            </div>

            {/* Middle 4 Cols: Supplier & Destination Entity Card */}
            <div className="lg:col-span-4 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#14213D] text-white flex items-center justify-center font-bold text-xs">
                    {po.supplierName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#14213D] leading-tight flex items-center gap-1">
                      {po.supplierName}
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ID: {po.supplierCode || po.supplierId}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  Approved Vendor
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 text-[10px] block">Receiving Plant / WH</span>
                  <span className="font-semibold text-slate-700 truncate block">
                    {po.plantWarehouse || (po as any).plantCode || 'Plant 1 (Vapi)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Assigned Buyer</span>
                  <span className="font-semibold text-slate-700 truncate block">
                    {po.buyer || (po as any).buyerName || 'Vikram Seth'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 3 Cols: Financial Grand Total & Receipt Gauge */}
            <div className="lg:col-span-3 bg-linear-to-br from-[#14213D] to-[#1E293B] text-white rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                    Total PO Value
                  </div>
                  <div className="text-2xl font-black font-['Space_Grotesk'] tracking-tight text-white mt-0.5">
                    ₹{((grandTotal || 0) / 100000).toFixed(2)} Lakhs
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                    ₹{(grandTotal || 0).toLocaleString()} (incl. GST)
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>

              {/* Fulfilment Progress */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Receipt Progress</span>
                  <span className="font-bold text-[#0F8B8D]">{receiptProgressPct}%</span>
                </div>
                <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0F8B8D] h-full rounded-full transition-all duration-500"
                    style={{ width: `${receiptProgressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{totalReceivedQty.toLocaleString()} KG Received</span>
                  <span>{totalOrderedQty.toLocaleString()} KG Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Navigation Tab Bar */}
        <div className="bg-slate-50/90 border-t border-slate-200/80 px-4 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-[#14213D] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Panels Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        {/* TAB 0: OVERVIEW */}
        {activeTab === 0 && (
          <div className="space-y-6">
            {/* 4 Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Order Date */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Order & Release</span>
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-base font-bold text-[#14213D]">{po.poDate}</div>
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Authorized & Released
                </div>
              </div>

              {/* Promised Delivery */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Promised Delivery</span>
                  <Clock className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-base font-bold text-[#14213D]">{po.expectedDeliveryDate}</div>
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> On Target Schedule
                </div>
              </div>

              {/* Commercial Terms */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Payment & Incoterms</span>
                  <DollarSign className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-base font-bold text-[#14213D] truncate">{po.paymentTerms || 'Net 30 Days'}</div>
                <div className="text-[11px] text-slate-500 font-medium truncate mt-1">
                  Terms: {po.deliveryTerms || (po as any).incoterms || 'FOR Destination Gate'}
                </div>
              </div>

              {/* Receiving Destination */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Inward Dock & WH</span>
                  <Building2 className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-base font-bold text-[#14213D] truncate">
                  {po.plantWarehouse || (po as any).receivingWarehouse || 'RM-WH-01'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  Dock #2 (Heavy Resin Ramp)
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#14213D]">Purchased Materials & Line Items</h3>
                  <p className="text-xs text-slate-500">
                    Line item specifications, quantity received vs ordered, unit price, and total values.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {po.lines.length} {po.lines.length === 1 ? 'Line Item' : 'Line Items'}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5 text-center w-10">#</th>
                      <th className="py-3 px-3.5">Material / Item</th>
                      <th className="py-3 px-3.5">Polymer Grade / Spec</th>
                      <th className="py-3 px-3.5 text-right">Ordered Qty</th>
                      <th className="py-3 px-3.5 text-right">Received Qty</th>
                      <th className="py-3 px-3.5 text-right">Unit Price</th>
                      <th className="py-3 px-3.5 text-right">GST %</th>
                      <th className="py-3 px-3.5 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {po.lines.map((line, idx) => {
                      const ordQty = line.orderedQty ?? (line as any).quantityOrdered ?? 0;
                      const rcvQty = line.receivedQty ?? (line as any).quantityReceived ?? 0;
                      const lineTot = line.lineTotal ?? (line as any).lineTotalAmount ?? 0;
                      const linePct = ordQty > 0 ? Math.min(100, Math.round((rcvQty / ordQty) * 100)) : 0;
                      const taxPct = line.taxPct ?? (line as any).taxRatePct ?? 18;

                      return (
                        <tr key={line.itemCode || idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-3.5 text-center font-semibold text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-3.5">
                            <div className="font-mono font-bold text-[#14213D]">{line.itemCode}</div>
                            <div className="text-[11px] text-slate-600 font-medium">{line.itemName}</div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                              {(line as any).mfiSpec || line.description || 'Standard Grade'}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              WH: {line.warehouse || po.plantWarehouse || 'RM-WH-01'}
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-bold text-[#14213D]">
                            {ordQty.toLocaleString()} {line.uom}
                          </td>
                          <td className="py-3.5 px-3.5 text-right">
                            <div className="font-bold text-emerald-700">
                              {rcvQty.toLocaleString()} {line.uom}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">{linePct}% Delivered</div>
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-mono font-semibold text-slate-700">
                            ₹{line.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-mono text-slate-600">
                            {taxPct}%
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-mono font-bold text-[#14213D]">
                            ₹{lineTot.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Financial Totals & Terms Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                {/* Notes & Special Instructions */}
                <div className="md:col-span-7 bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#14213D]">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Special Dispatch & Quality Directives</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {po.specialInstructions ||
                      po.notes ||
                      'Standard 25 KG moisture-barrier palletized packaging. Manufacturer Certificate of Analysis (MFI, Density) and MSDS are mandatory at gate receipt.'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Weighbridge Slip Required
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
                      ✓ COA Attached with Challan
                    </span>
                  </div>
                </div>

                {/* Calculation Summary Table */}
                <div className="md:col-span-5 bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Line Subtotal (Excl. Tax):</span>
                    <span className="font-mono font-semibold text-[#14213D]">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {freight > 0 && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Freight & Transit Insurance:</span>
                      <span className="font-mono font-semibold text-[#14213D]">₹{freight.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>GST / Taxes (18% IGST):</span>
                    <span className="font-mono font-semibold text-[#14213D]">₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-[#14213D]">
                    <span>Grand Landed Total:</span>
                    <span className="font-mono text-base text-[#14213D]">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: LINE ITEMS & CHEMICAL/POLYMER SPECS */}
        {activeTab === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#14213D]">Polymer Engineering & Chemical Specifications</h3>
                <p className="text-xs text-slate-500">
                  Target physical properties, density, moisture limits, and quality verification standards.
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {po.lines.map((line, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#14213D] text-white flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-[#14213D]">{line.itemName}</span>
                      <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 font-bold">
                        {line.itemCode}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold bg-white text-slate-600 px-2.5 py-0.5 rounded border border-slate-200">
                      Category: {(line as any).category || 'Raw Material Resin'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Melt Flow Index (MFI)</span>
                      <div className="font-bold text-xs text-[#14213D] mt-0.5">
                        {(line as any).mfiSpec || '11.5 - 12.5 g/10min (230°C/2.16kg)'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Density / Specific Gravity</span>
                      <div className="font-bold text-xs text-[#14213D] mt-0.5">0.905 - 0.952 g/cm³</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Moisture Tolerance Limit</span>
                      <div className="font-bold text-xs text-emerald-700 mt-0.5">&lt; 0.05% Max wt.</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">GST / HSN Classification</span>
                      <div className="font-bold text-xs text-[#14213D] mt-0.5">
                        HSN 3901 ({line.taxPct ?? 18}% IGST)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                    <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200/60">
                      ✓ FDA 21 CFR 177.1520 Food Contact Compliant
                    </span>
                    <span className="bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded border border-blue-200/60">
                      ✓ RoHS 3 / REACH SVHC Free
                    </span>
                    <span className="bg-purple-50 text-purple-800 font-semibold px-2 py-0.5 rounded border border-purple-200/60">
                      ✓ Quarantine IQC Protocol Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GOODS RECEIPTS (GRN) */}
        {activeTab === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#14213D]">Linked Goods Receipt Notes (GRN)</h3>
                <p className="text-xs text-slate-500">
                  Track warehouse gate arrivals, weighbridge inspection, and QC acceptance records for this order.
                </p>
              </div>
              <button
                onClick={() => onNavigate('grnList')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-xl text-xs font-semibold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Inward GRN</span>
              </button>
            </div>

            {linkedGrns.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                <Truck className="w-8 h-8 mx-auto text-slate-300" />
                <div className="font-bold text-xs text-slate-600">No Goods Receipt Notes recorded yet</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When physical delivery arrives at Plant 1 Gate, register the delivery challan to initiate IQC inspection.
                </p>
                <button
                  onClick={() => onNavigate('grnList')}
                  className="px-3.5 py-1.5 bg-[#14213D] text-white rounded-xl text-xs font-semibold hover:bg-[#1f2f56] transition"
                >
                  Create First GRN Entry
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedGrns.map((grn) => (
                  <div key={grn.id} className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {grn.grnNumber}
                        </span>
                        <span className="text-xs text-slate-500">Date: <strong className="text-slate-700">{grn.receiptDate}</strong></span>
                      </div>
                      <ProcurementStatusBadge status={grn.status} size="sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/70">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Vehicle / Transporter</span>
                        <strong className="text-slate-800">{grn.vehicleNumber || 'GJ-15-XY-9081'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Delivery Challan No.</span>
                        <strong className="text-slate-800">{grn.deliveryChallanNo || (grn as any).deliveryChallanNumber || 'DC-GAIL-2026-8812'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">QC Accepted Volume</span>
                        <strong className="text-emerald-700">
                          {(grn.lines[0]?.acceptedQty ?? (grn.lines[0] as any)?.quantityAccepted ?? 0).toLocaleString()} {grn.lines[0]?.uom || 'KG'}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INVOICES & 3-WAY MATCH */}
        {activeTab === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#14213D]">Supplier Invoices & 3-Way Match Verification</h3>
                <p className="text-xs text-slate-500">
                  Audit comparison between PO contract price, warehouse GRN receipts, and supplier GST e-Invoices.
                </p>
              </div>
            </div>

            {/* 3-Way Match Visual Summary */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                <div className="text-[10px] uppercase font-semibold text-slate-400">1. PO Authorized Value</div>
                <div className="text-base font-bold font-['Space_Grotesk'] text-[#14213D] mt-0.5">
                  ₹{(grandTotal || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">✓ Approved & Committed</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                <div className="text-[10px] uppercase font-semibold text-slate-400">2. GRN Received Value</div>
                <div className="text-base font-bold font-['Space_Grotesk'] text-[#14213D] mt-0.5">
                  ₹{((totalReceivedQty * (po.lines[0]?.unitPrice || 84)) * 1.18).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{totalReceivedQty.toLocaleString()} KG Received</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                <div className="text-[10px] uppercase font-semibold text-slate-400">3. Invoiced Billed Value</div>
                <div className="text-base font-bold font-['Space_Grotesk'] text-[#14213D] mt-0.5">
                  ₹{(po.invoicedAmount || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">✓ 0 Price Variance</div>
              </div>
            </div>

            {linkedInvoices.length === 0 ? (
              <div className="p-8 text-center border border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs">
                No invoices submitted yet by supplier for this order.
              </div>
            ) : (
              linkedInvoices.map((inv) => (
                <div key={inv.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-[#14213D]">
                        {(inv as any).supplierInvoiceNumber || inv.invoiceNumber}
                      </span>
                      <span className="text-slate-500 text-xs ml-2">Internal: {inv.invoiceNumber}</span>
                    </div>
                    <ProcurementStatusBadge status={inv.matchStatus} size="sm" />
                  </div>
                  <div className="text-xs text-slate-600">
                    Invoice Amount: <strong className="text-[#14213D]">₹{(inv.totalInvoiceAmount ?? (inv as any).totalAmount ?? 0).toLocaleString()}</strong> • GST: ₹{(inv.taxAmount ?? 0).toLocaleString()} • Status: <span className="font-semibold text-emerald-700">{inv.matchStatus}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: PPV & PRICING BREAKDOWN */}
        {activeTab === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Purchase Price Variance (PPV) & Cost Breakdown</h3>
              <p className="text-xs text-slate-500">
                Contract rate benchmarked against standard procurement costing model.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-400 text-xs font-medium">Standard Baseline Budget</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">₹86.00 / KG</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Budgeted Standard Cost</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-400 text-xs font-medium">PO Contract Unit Rate</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">₹84.00 / KG</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Favorable Negotiated Rate</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-400 text-xs font-medium">Net PPV Savings Value</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">-2.32% (₹10,600)</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Direct Material Savings</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: QUALITY & IQC */}
        {activeTab === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Incoming Quality Control (IQC) Protocols</h3>
              <p className="text-xs text-slate-500">
                Mandatory test parameters, testing methodology, and lot release standards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Batch COA Verification</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Mandatory MFI & Density certificate from GAIL testing lab.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ASTM D1238 Melt Assay</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  In-house melt flow rate test at 230°C before warehouse putaway.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>AQL 0.65 Level II Sampling</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Representative 5-point bag sample test per 10 MT dispatch lot.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DISPATCH & TRACKING */}
        {activeTab === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Carrier Logistics & Inbound Dispatch Tracking</h3>
              <p className="text-xs text-slate-500">
                Live consignment location, driver details, and gate clearance ETA.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Transporter:</span>
                    <strong className="text-[#14213D]">
                      {(po as any).deliveryTracking?.transporterName || 'Vapi Express Highway Logistics'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Registration:</span>
                    <strong className="font-mono text-[#14213D]">GJ-15-XY-9081</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver Contact:</span>
                    <strong className="text-[#14213D]">Suresh Parmar (+91 98251 09214)</strong>
                  </div>
                </div>

                <div className="space-y-2 sm:border-l sm:border-slate-200 sm:pl-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tracking Status:</span>
                    <span className="font-bold text-emerald-700">En Route to Vapi Plant #1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Gate Arrival:</span>
                    <strong className="text-[#14213D]">{po.expectedDeliveryDate} 08:30 AM</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">E-Way Bill Status:</span>
                    <span className="text-emerald-700 font-semibold">Active & Validated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DOCUMENTS */}
        {activeTab === 7 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Purchase Order Documents & Signed Attachments</h3>
              <p className="text-xs text-slate-500">
                Official digitally signed PO documents and supplier contract agreements.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200/60 font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#14213D]">{po.poNumber}_Authorized_PO.pdf</div>
                    <div className="text-slate-400 text-[11px]">Digitally signed commercial purchase order (245 KB)</div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('poPrint', { id: po.id, poNumber: po.poNumber })}
                  className="px-3 py-1.5 bg-[#14213D] text-white rounded-xl text-xs font-semibold hover:bg-[#1f2f56] transition"
                >
                  View PDF
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 font-bold text-xs">
                    DOC
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#14213D]">Polymer_Technical_Spec_Sheet_HDPE_B56003.pdf</div>
                    <div className="text-slate-400 text-[11px]">GAIL official technical polymer datasheet (1.2 MB)</div>
                  </div>
                </div>
                <button
                  onClick={() => showToast('Downloading Technical Data Sheet...')}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: APPROVAL AUDIT */}
        {activeTab === 8 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Order Authorization & Release Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Multi-level approval log with digital signatures and authorization stamps.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#14213D]">Level 1: Buyer Requisition Validation</div>
                    <div className="text-[11px] text-slate-500">Vikram Seth (Procurement Officer) • {po.poDate} 10:30 AM</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Approved
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#14213D]">Level 2: Procurement Head Authorization</div>
                    <div className="text-[11px] text-slate-500">K. Ramanathan (Procurement Head) • {po.poDate} 02:00 PM</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Released
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
