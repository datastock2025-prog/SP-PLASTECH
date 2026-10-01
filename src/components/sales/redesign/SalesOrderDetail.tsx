import React, { useState } from 'react';
import {
  ArrowLeft,
  Truck,
  FileCheck,
  FileText,
  ShieldCheck,
  Package,
  Calendar,
  Link as LinkIcon,
  Unlink,
  Printer,
  Download,
  Clock,
  AlertTriangle,
  QrCode,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Eye,
  AlertOctagon,
  Building2,
  XCircle,
} from 'lucide-react';
import {
  PlasticSalesOrder,
  MonthlyPlanOrder,
  DeliveryNoteChallan,
  FgBatchStock,
  EInvoiceRecord,
  EWayBillRecord,
} from '../../../types/salesOrderDeliveryTypes';
import { r2StorageService } from '../../../services/storage/r2StorageService';
import { UploadCloud } from 'lucide-react';

interface SalesOrderDetailProps {
  order: PlasticSalesOrder;
  monthlyPlans: MonthlyPlanOrder[];
  deliveries: DeliveryNoteChallan[];
  batches: FgBatchStock[];
  eInvoices: EInvoiceRecord[];
  eWayBills: EWayBillRecord[];
  onBack: () => void;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const SalesOrderDetail: React.FC<SalesOrderDetailProps> = ({
  order,
  monthlyPlans,
  deliveries,
  batches,
  eInvoices,
  eWayBills,
  onBack,
  onNavigate,
  showToast,
}) => {
  // 10 Functional Tabs
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [customDocs, setCustomDocs] = useState<Array<{ name: string; size: string; date: string; type: string }>>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newDoc = {
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Uploaded Attachment',
    };
    setCustomDocs((prev) => [newDoc, ...prev]);
    showToast(`✓ Uploaded "${file.name}" to Order Documents.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Associated records
  const orderDeliveries = deliveries.filter((d) => d.salesOrderId === order.id);
  const orderInvoices = eInvoices.filter((i) => i.salesOrderNumber === order.id);
  const orderEwbs = eWayBills.filter((e) =>
    orderDeliveries.some((d) => d.id === e.documentNumber || d.invoiceNumber === e.documentNumber)
  );
  const linkedPlan = monthlyPlans.find((p) => p.id === order.monthlyPlanRef);

  // Aggregates
  const totalQty = order.lines.reduce((sum, l) => sum + l.orderedQty, 0);
  const deliveredQty = order.lines.reduce((sum, l) => sum + l.deliveredQty, 0);
  const remainingQty = totalQty - deliveredQty;

  const tabs = [
    'Overview',
    'Items',
    'Monthly Plan Link',
    'Stock & Allocation',
    'Deliveries',
    'Invoices',
    'E-Invoice',
    'E-Way Bill',
    'Documents',
    'Activity & Audit Trail',
  ];

  return (
    <div className="space-y-4">
      {/* Top Back & Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#0F8B8D]">{order.id}</span>
            <span className="text-xs text-gray-400">&bull;</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {order.orderType}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                order.status === 'Ready to Dispatch'
                  ? 'bg-purple-100 text-purple-800'
                  : order.status === 'Credit Hold'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {order.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 font-['Space_Grotesk'] mt-0.5">
            {order.customer}
          </h1>
        </div>
      </div>

      {/* Header Metric Cards (8 Core Values) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
        <div className="p-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">Total Qty</div>
          <div className="text-sm font-bold text-gray-900">{totalQty.toLocaleString()} PCS</div>
        </div>
        <div className="p-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">Delivered</div>
          <div className="text-sm font-bold text-emerald-600">{deliveredQty.toLocaleString()} PCS</div>
        </div>
        <div className="p-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">Remaining</div>
          <div className="text-sm font-bold text-amber-600">{remainingQty.toLocaleString()} PCS</div>
        </div>
        <div className="p-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">Order Value</div>
          <div className="text-sm font-bold text-gray-900">₹{order.totalOrderValue.toLocaleString()}</div>
        </div>
        <div className="p-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">Invoiced</div>
          <div className="text-sm font-bold text-indigo-600">₹{order.invoicedValue.toLocaleString()}</div>
        </div>
        <div className="p-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">Credit Status</div>
          <div className={`text-xs font-bold ${order?.creditStatus === 'Approved' ? 'text-emerald-700' : 'text-red-700'}`}>
            {(order?.creditStatus || 'Approved').toUpperCase()}
          </div>
        </div>
        <div className="p-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">E-Invoice</div>
          <div className="text-xs font-bold text-emerald-700">{order.eInvoiceStatus}</div>
        </div>
        <div className="p-2">
          <div className="text-[10px] uppercase font-bold text-gray-400">E-Way Bill</div>
          <div className="text-xs font-bold text-emerald-700">{order.eWayBillStatus}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('createDelivery', { soId: order.id })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold shadow-2xs"
          >
            <Truck className="w-3.5 h-3.5" /> Create Delivery Note
          </button>
          <button
            onClick={() => {
              showToast(`Checking live credit for ${order.customer}: Available ₹${(order.availableCredit / 100000).toFixed(2)}L`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Check Credit
          </button>
          <button
            onClick={() => onNavigate('eInvoiceMgmt')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
          >
            <FileCheck className="w-3.5 h-3.5 text-indigo-600" /> E-Invoice IRP
          </button>
          <button
            onClick={() => onNavigate('eWayBillMgmt')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
          >
            <FileText className="w-3.5 h-3.5 text-orange-600" /> E-Way Bill Portal
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" /> Print SO
          </button>
          <button
            onClick={() => showToast(`Exported Sales Order ${order.id} PDF with GST Schedule.`)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" /> Export PDF
          </button>
        </div>
      </div>

      {/* 10 Functional Tabs Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#14213D] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer & Facility Details */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-2">
              1. Customer & Facility Profile
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">Customer Name:</span>
                <div className="font-semibold text-gray-900">{order.customer}</div>
              </div>
              <div>
                <span className="text-gray-400">Customer GSTIN:</span>
                <div className="font-mono font-semibold text-gray-900">{order.customerGstin}</div>
              </div>
              <div>
                <span className="text-gray-400">Customer PO Number:</span>
                <div className="font-mono text-gray-900">{order.customerPoNumber || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-400">PO Date / Order Date:</span>
                <div className="text-gray-900">{order.customerPoDate} / {order.orderDate}</div>
              </div>
              <div>
                <span className="text-gray-400">Manufacturing Plant:</span>
                <div className="text-gray-900 font-semibold">{order.plant}</div>
              </div>
              <div>
                <span className="text-gray-400">Finished Goods Store:</span>
                <div className="text-gray-900 font-semibold">{order.fgStore}</div>
              </div>
              <div>
                <span className="text-gray-400">Salesperson:</span>
                <div className="text-gray-900">{order.salesperson}</div>
              </div>
              <div>
                <span className="text-gray-400">Payment Terms:</span>
                <div className="text-gray-900">{order.paymentTerms}</div>
              </div>
            </div>

            <div className="border-t pt-2 space-y-1">
              <span className="text-gray-400">Billing Address & POS:</span>
              <div className="text-gray-800">
                {order.billingAddress.line1}, {order.billingAddress.city}, {order.billingAddress.state} - {order.billingAddress.pincode}
              </div>
              <div className="text-indigo-700 font-semibold">POS: {order.billingAddress.placeOfSupply}</div>
            </div>
          </div>

          {/* Financial Breakdown & Commercials */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-2">
              2. Financial Summary & GST Schedule
            </h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Taxable Goods Amount:</span>
                <span className="font-mono font-semibold text-gray-900">₹{order.taxableAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST Amount (9%):</span>
                <span className="font-mono font-semibold text-gray-900">₹{order.cgstTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST Amount (9%):</span>
                <span className="font-mono font-semibold text-gray-900">₹{order.sgstTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IGST Amount (18%):</span>
                <span className="font-mono font-semibold text-gray-900">₹{order.igstTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Freight & Insurance:</span>
                <span className="font-mono font-semibold text-gray-900">₹{order.freightAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Special Packaging:</span>
                <span className="font-mono font-semibold text-gray-900">₹{order.packingAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-[#14213D]">
                <span>Total Gross Order Value:</span>
                <span className="font-mono">₹{order.totalOrderValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-[11px] text-emerald-800 space-y-0.5">
              <div className="font-bold">Exposure Check:</div>
              <div>Limit: ₹{(order.creditLimit / 100000).toFixed(1)}L | Current Exp: ₹{(order.currentExposure / 100000).toFixed(1)}L</div>
              <div>Available Headroom: ₹{(order.availableCredit / 100000).toFixed(1)}L</div>
            </div>
          </div>

          {/* Transport & Dispatch Details */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-2">
              3. Transport, Vehicle & Delivery SLA
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">Transport Mode:</span>
                <div className="text-gray-900 font-semibold">{order.transportMode}</div>
              </div>
              <div>
                <span className="text-gray-400">Transporter:</span>
                <div className="text-gray-900 font-semibold">{order.transporterName || 'Pending'}</div>
              </div>
              <div>
                <span className="text-gray-400">Vehicle Number:</span>
                <div className="font-mono font-bold text-gray-900">{order.vehicleNumber || 'Unassigned'}</div>
              </div>
              <div>
                <span className="text-gray-400">LR / Docket #:</span>
                <div className="font-mono text-gray-900">{order.lrNumber || 'Awaiting Gate Out'}</div>
              </div>
              <div>
                <span className="text-gray-400">Incoterms:</span>
                <div className="text-gray-900">{order.incoterms}</div>
              </div>
              <div>
                <span className="text-gray-400">Required Date:</span>
                <div className="text-emerald-700 font-bold">{order.requiredDeliveryDate}</div>
              </div>
            </div>
            <div className="border-t pt-2">
              <span className="text-gray-400">Delivery Instructions:</span>
              <div className="text-gray-700 mt-0.5">{order.deliveryTerms}</div>
            </div>
          </div>

          {/* Packaging & Quality Specs */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-2">
              4. Packaging & Quality Certifications
            </h3>
            <div>
              <span className="text-gray-400">Packaging Protocol:</span>
              <div className="text-gray-900 font-medium mt-0.5">{order.packagingInstructions}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t pt-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${order.coaRequired ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                <span className="text-gray-700">COA Certificate Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${order.batchTraceabilityRequired ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                <span className="text-gray-700">FEFO Batch Traceability</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${order.eInvoiceRequired ? 'bg-indigo-500' : 'bg-gray-300'}`}></span>
                <span className="text-gray-700">E-Invoice QR Mandated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${order.eWayBillRequired ? 'bg-amber-500' : 'bg-gray-300'}`}></span>
                <span className="text-gray-700">E-Way Bill Mandatory</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ITEMS */}
      {activeTab === 'Items' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
              Order Line Items & Finished Goods Specifications ({order.lines.length})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Item & Customer Code</th>
                  <th className="p-2.5">Polymer & Mould</th>
                  <th className="p-2.5 text-right">Ordered</th>
                  <th className="p-2.5 text-right">Delivered</th>
                  <th className="p-2.5 text-right">Remaining</th>
                  <th className="p-2.5 text-right">Avail Stock</th>
                  <th className="p-2.5 text-right">Rate</th>
                  <th className="p-2.5 text-right">Taxable</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.lines.map((l) => (
                  <tr key={l.lineNumber} className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-mono font-bold text-gray-700">{l.lineNumber}</td>
                    <td className="p-2.5">
                      <div className="font-semibold text-gray-900">{l.itemName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        Code: {l.itemCode} | Cust: {l.customerItemCode} | HSN: {l.hsn}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <div className="text-gray-800">{l.polymerGrade}</div>
                      <div className="text-[10px] text-gray-400 font-mono">Mould: {l.mouldCode}</div>
                    </td>
                    <td className="p-2.5 text-right font-bold text-gray-900">{l.orderedQty.toLocaleString()} {l.uom}</td>
                    <td className="p-2.5 text-right text-emerald-600 font-semibold">{l.deliveredQty.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-amber-600 font-semibold">{l.remainingQty.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-mono text-gray-700">{l.availableStock.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-mono">₹{l.unitPrice}</td>
                    <td className="p-2.5 text-right font-mono">₹{l.taxableValue.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-gray-900">₹{l.totalValue.toLocaleString()}</td>
                    <td className="p-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.shortageQty > 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {l.shortageQty > 0 ? `Short: ${l.shortageQty}` : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY PLAN LINK */}
      {activeTab === 'Monthly Plan Link' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Monthly Plan Reconciliation Link</h3>
              <p className="text-xs text-gray-500">
                Daily sales orders are independent by default. Linking to a monthly plan is for forecast reconciliation only.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  order.monthlyPlanRef
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {order.monthlyPlanRef ? 'LINKED TO MONTHLY PLAN' : 'INDEPENDENT ORDER (NOT LINKED)'}
              </span>
            </div>
          </div>

          {order.monthlyPlanRef ? (
            <div className="space-y-4">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 text-xs space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-blue-900 font-semibold">Monthly Plan ID:</span>
                    <div className="text-sm font-bold text-blue-900 font-mono mt-0.5">{order.monthlyPlanRef}</div>
                  </div>
                  <div>
                    <span className="text-blue-900 font-semibold">Demand Period:</span>
                    <div className="text-sm font-bold text-gray-900 mt-0.5">{order.monthlyPlanPeriod || 'September 2026'}</div>
                  </div>
                  <div>
                    <span className="text-blue-900 font-semibold">Link Type:</span>
                    <div className="text-sm font-bold text-gray-900 mt-0.5">{order.linkType}</div>
                  </div>
                  <div>
                    <span className="text-blue-900 font-semibold">Customer Plan Scope:</span>
                    <div className="text-sm font-bold text-gray-900 mt-0.5">{order.customer}</div>
                  </div>
                </div>
              </div>

              {linkedPlan && (
                <div className="border border-gray-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                    Plan Progress Breakdown ({linkedPlan.id})
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-2.5 rounded-lg">
                      <div className="text-gray-500">Total Planned Quantity</div>
                      <div className="text-base font-bold text-gray-900">{linkedPlan.totalPlannedQty.toLocaleString()} PCS</div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-800">
                      <div>Supplied against Plan</div>
                      <div className="text-base font-bold">{linkedPlan.totalDailySuppliedQty.toLocaleString()} PCS</div>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-lg text-amber-800">
                      <div>Remaining Balance</div>
                      <div className="text-base font-bold">{linkedPlan.remainingPlanQty.toLocaleString()} PCS</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    showToast(`Unlinked ${order.id} from ${order.monthlyPlanRef}.`);
                  }}
                  className="px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Unlink className="w-3.5 h-3.5" /> Remove Link (Make Independent)
                </button>
                <button
                  onClick={() => onNavigate('reconciliation')}
                  className="px-3 py-1.5 bg-[#14213D] text-white rounded-lg text-xs font-semibold"
                >
                  Open Full Reconciliation Hub
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-700">
                  This sales order is treated as a standalone commercial transaction. If this order fulfills part of a recurring customer monthly commitment, you may manually map it.
                </p>
              </div>
              <button
                onClick={() => onNavigate('reconciliation', { soId: order.id })}
                className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <LinkIcon className="w-3.5 h-3.5" /> Link to an Active Monthly Plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STOCK & ALLOCATION */}
      {activeTab === 'Stock & Allocation' && (() => {
        const orderSkus = (order.lines || []).map((l) => l.itemCode);
        const allocatedBatches = batches.filter((b) => orderSkus.includes(b.itemCode));

        return (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Finished Goods Batches & FEFO Picking Matrix</h3>
                <p className="text-xs text-gray-500">
                  Live batch allocation for order SKUs ({orderSkus.join(', ')}) sorted by First Expiry First Out (FEFO).
                </p>
              </div>
              <button
                onClick={() => showToast('Stock refreshed from plant warehouse MES.')}
                className="flex items-center gap-1 px-2.5 py-1.5 border rounded-lg hover:bg-gray-50 text-gray-700 font-semibold"
              >
                <RefreshCw className="w-3 h-3 text-gray-500" /> Refresh Stock
              </button>
            </div>

            {allocatedBatches.length === 0 ? (
              <div className="p-8 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-200 space-y-2">
                <Package className="w-8 h-8 text-gray-400 mx-auto" />
                <div className="font-bold text-gray-700 text-sm">No Batches Allocated for this Order's SKUs</div>
                <p className="text-gray-400 text-xs max-w-md mx-auto">
                  Finished goods batches will be assigned during Outward Delivery Note generation or dynamically populated upon MES injection molding completion.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-gray-600 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">Batch #</th>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5">Location / Bin</th>
                      <th className="p-2.5 text-right">Available</th>
                      <th className="p-2.5 text-right">Reserved</th>
                      <th className="p-2.5">Mfg / Expiry Date</th>
                      <th className="p-2.5">COA Status</th>
                      <th className="p-2.5">QC Status</th>
                      <th className="p-2.5 text-center">FEFO Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allocatedBatches.map((b) => (
                      <tr key={b.batchNumber} className="hover:bg-gray-50">
                        <td className="p-2.5 font-mono font-bold text-gray-900">{b.batchNumber}</td>
                        <td className="p-2.5 font-semibold text-gray-800">{b.itemName}</td>
                        <td className="p-2.5 font-mono text-gray-600">{b.locationCode} &bull; {b.binCode}</td>
                        <td className="p-2.5 text-right font-bold text-gray-900">{b.availableQty.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-gray-500">{b.reservedQty.toLocaleString()}</td>
                        <td className="p-2.5">
                          <div>{b.mfgDate}</div>
                          <div className="text-[10px] text-gray-400">Exp: {b.expiryDate}</div>
                        </td>
                        <td className="p-2.5 font-semibold text-emerald-700">{b.coaStatus}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {b.qualityStatus}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold font-mono text-[#0F8B8D]">#{b.fefoRank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 5: DELIVERIES */}
      {activeTab === 'Deliveries' && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Delivery Notes & Challans Generated</h3>
              <p className="text-xs text-gray-500">Dispatched or ready deliveries fulfilling this Sales Order.</p>
            </div>
            <button
              onClick={() => onNavigate('createDelivery', { soId: order.id })}
              className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg font-semibold flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" /> Create New Delivery Note
            </button>
          </div>

          {orderDeliveries.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No delivery notes generated yet against this order.</div>
          ) : (
            <div className="space-y-3">
              {orderDeliveries.map((d) => (
                <div key={d.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#0F8B8D]">{d.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-800">
                        {d.type}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        {d.status}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-gray-900">
                      ₹{d.invoiceValue.toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-600">
                    <div>Vehicle: <strong className="text-gray-900 font-mono">{d.vehicleNumber}</strong></div>
                    <div>Transporter: <strong className="text-gray-900">{d.transporterName}</strong></div>
                    <div>LR #: <strong className="text-gray-900 font-mono">{d.lrNumber}</strong></div>
                    <div>Gate Pass: <strong className="text-emerald-700 font-mono">{d.gatePassNumber || 'Pending'}</strong></div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-gray-200 text-[11px]">
                    <span className="text-emerald-700 font-semibold">IRN: {d.irn ? `${d.irn.substring(0, 16)}...` : 'N/A'}</span>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-emerald-700 font-semibold">EWB: {d.ewbNumber || 'Pending'}</span>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-gray-500">Packages: {d.packageCount} ({d.grossWeightKg} Kg)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: INVOICES */}
      {activeTab === 'Invoices' && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Commercial Tax Invoices</h3>
              <p className="text-xs text-gray-500">Official GST invoices booked for this order.</p>
            </div>
          </div>

          {orderInvoices.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No invoices booked yet.</div>
          ) : (
            <div className="space-y-3">
              {orderInvoices.map((inv) => (
                <div key={inv.invoiceNumber} className="p-4 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-sm text-gray-900">{inv.invoiceNumber}</span>
                    <span className="font-mono font-bold text-emerald-700">₹{inv.invoiceValue.toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Taxable: ₹{inv.taxableValue.toLocaleString()} | CGST: ₹{inv.cgst.toLocaleString()} | SGST: ₹{inv.sgst.toLocaleString()} | IGST: ₹{inv.igst.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    IRN: {inv.irn || 'Pending IRP'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: E-INVOICE */}
      {activeTab === 'E-Invoice' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">E-Invoice IRP Synchronization (NIC Portal)</h3>
              <p className="text-xs text-gray-500">B2B e-Invoicing under GST mandate with 64-character IRN generation.</p>
            </div>
            <button
              onClick={() => setShowJsonModal(!showJsonModal)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold"
            >
              {showJsonModal ? 'Hide JSON Viewer' : 'View Signed JSON'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">IRP Generated Credentials</div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="ml-2 font-bold text-emerald-700">{order.eInvoiceStatus}</span>
              </div>
              <div>
                <span className="text-gray-400">IRN:</span>
                <div className="font-mono text-[11px] font-bold text-gray-900 break-all mt-0.5">
                  b78a994c1f9302194857dc820a45719bc40192e472093849102830fca1029148
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-gray-400">Ack Number:</span>
                  <div className="font-mono font-semibold text-gray-900">112026090014521</div>
                </div>
                <div>
                  <span className="text-gray-400">Ack Date:</span>
                  <div className="text-gray-900">2026-09-11 16:45:10</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow-2xs">
                <QrCode className="w-16 h-16 text-gray-800" />
              </div>
              <div className="text-[11px] font-bold text-gray-800 mt-2">NIC Digitally Signed QR Code</div>
              <div className="text-[10px] text-gray-500">Scanable by GST Authority app</div>
            </div>
          </div>

          {showJsonModal && (
            <div className="p-3 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
              {JSON.stringify(
                {
                  Version: '1.1',
                  TranDtls: { TaxSch: 'GST', SupTyp: 'B2B', RegRev: 'N' },
                  DocDtls: { Typ: 'INV', No: 'INV-2026-09-001', Dt: '11/09/2026' },
                  SellerDtls: { Gstin: '27AABCP1122D1Z4', LglNm: 'Apex Polymer Molding Ltd' },
                  BuyerDtls: { Gstin: order.customerGstin, LglNm: order.customer },
                  ValDtls: { AssVal: order.taxableAmount, CgstVal: order.cgstTotal, SgstVal: order.sgstTotal, TotInvVal: order.totalOrderValue },
                },
                null,
                2
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: E-WAY BILL */}
      {activeTab === 'E-Way Bill' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">E-Way Bill Tracking & Vehicle Management</h3>
              <p className="text-xs text-gray-500">Live countdown, vehicle transshipment logs, and extension tools.</p>
            </div>
            <button
              onClick={() => onNavigate('eWayBillMgmt')}
              className="px-3 py-1.5 bg-[#0F8B8D] text-white rounded-lg font-semibold"
            >
              Open EWB Hub
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
              <div className="text-[10px] uppercase font-bold text-emerald-700">EWB Number</div>
              <div className="text-base font-bold font-mono mt-0.5">241088492019</div>
              <div className="text-[10px] text-emerald-700 mt-1">Generated via Invoice INV-2026-09-001</div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-[10px] uppercase font-bold text-gray-500">Validity Remaining</div>
              <div className="text-base font-bold text-emerald-700 mt-0.5">38 Hours</div>
              <div className="text-[10px] text-gray-500 mt-1">Expires: 2026-09-13 23:59:59</div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-[10px] uppercase font-bold text-gray-500">Part A & Part B</div>
              <div className="text-base font-bold text-gray-900 mt-0.5">Complete & Ready</div>
              <div className="text-[10px] text-gray-500 mt-1">Vehicle: MH-14-GH-8821</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: DOCUMENTS */}
      {activeTab === 'Documents' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Associated Commercial & Dispatch Documents</h3>
              <p className="text-xs text-gray-500">Repository of customer PO, tax invoices, EWBs, and gate passes.</p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload Document
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              {
                name: `Customer PO (${order.customerPoNumber || 'PO-2026'})`,
                type: 'Customer PO',
                size: '240 KB',
                onDownload: () => {
                  const poHtml = `<!DOCTYPE html><html><head><title>Customer PO ${order.customerPoNumber}</title><style>body{font-family:Arial;padding:20px;}</style></head><body><h2>CUSTOMER PURCHASE ORDER</h2><p><b>PO Number:</b> ${order.customerPoNumber}</p><p><b>Customer:</b> ${order.customer}</p><p><b>Date:</b> ${order.orderDate}</p><p><b>Total Value:</b> ₹${order.totalOrderValue.toLocaleString()}</p></body></html>`;
                  r2StorageService.downloadLocalPdfBlob(poHtml, `Customer_PO_${order.customerPoNumber || 'PO'}.html`);
                  showToast(`✓ Downloaded Customer PO document.`);
                },
              },
              {
                name: `Sales Order Confirmation (${order.id})`,
                type: 'Internal SO',
                size: '180 KB',
                onDownload: () => {
                  const soHtml = `<!DOCTYPE html><html><head><title>SO Confirmation ${order.id}</title><style>body{font-family:Arial;padding:20px;}</style></head><body><h2>SALES ORDER CONFIRMATION</h2><p><b>Order ID:</b> ${order.id}</p><p><b>Customer:</b> ${order.customer}</p><p><b>Total Ordered:</b> ${totalQty.toLocaleString()} PCS</p><p><b>Total Value:</b> ₹${order.totalOrderValue.toLocaleString()}</p></body></html>`;
                  r2StorageService.downloadLocalPdfBlob(soHtml, `SO_Confirmation_${order.id}.html`);
                  showToast(`✓ Downloaded Sales Order Confirmation document.`);
                },
              },
              ...orderDeliveries.map((d) => ({
                name: `Delivery Note (${d.id})`,
                type: 'Delivery Challan',
                size: '310 KB',
                onDownload: () => {
                  r2StorageService.downloadLocalPdfBlob(`<!DOCTYPE html><html><body><h2>Delivery Challan ${d.id}</h2><p>Vehicle: ${d.vehicleNumber}</p></body></html>`, `Delivery_Challan_${d.id}.html`);
                  showToast(`✓ Downloaded Delivery Note ${d.id}.`);
                },
              })),
              ...customDocs.map((doc) => ({
                name: doc.name,
                type: doc.type,
                size: doc.size,
                onDownload: () => {
                  r2StorageService.downloadLocalPdfBlob(`<!DOCTYPE html><html><body><h3>Uploaded Document: ${doc.name}</h3><p>Date: ${doc.date}</p></body></html>`, doc.name);
                  showToast(`✓ Downloaded ${doc.name}.`);
                },
              })),
            ].map((doc, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 flex items-center justify-between hover:bg-gray-100/70 transition">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate max-w-[180px]" title={doc.name}>{doc.name}</div>
                    <div className="text-[10px] text-gray-400">{doc.type} &bull; {doc.size}</div>
                  </div>
                </div>
                <button
                  onClick={doc.onDownload}
                  className="p-1.5 text-gray-400 hover:text-teal-700 hover:bg-white rounded-lg transition cursor-pointer"
                  title={`Download ${doc.name}`}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: ACTIVITY & AUDIT TRAIL */}
      {activeTab === 'Activity & Audit Trail' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold text-gray-900">Complete Audit Trail & IRP Transaction Logs</h3>
            <p className="text-xs text-gray-500">Immutable chronological history of all updates to this order.</p>
          </div>

          <div className="space-y-3">
            {order.auditTrail.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#0F8B8D] mt-1.5 shrink-0"></div>
                <div>
                  <div className="font-semibold text-gray-900">{log.action}</div>
                  <div className="text-[11px] text-gray-500">
                    By <span className="font-medium text-gray-700">{log.user}</span> on {log.timestamp}
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded mt-1 font-mono">
                      {log.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
