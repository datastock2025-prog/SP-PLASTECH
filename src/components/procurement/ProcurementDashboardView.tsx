import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  FileText,
  Truck,
  ShieldAlert,
  Layers,
  ArrowRight,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Award,
  Sparkles,
  BarChart3,
  Scale,
  Calendar,
} from 'lucide-react';
import {
  SupplierMaster,
  PurchaseRequisition,
  RequestForQuotation,
  ExtendedPurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoiceRecord,
  MrpPurchaseSuggestion,
  SupplierRiskItem,
} from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import {
  PROCUREMENT_SPEND_BY_CATEGORY,
  PROCUREMENT_MONTHLY_SPEND_TREND,
} from '../../data/procurementData';

interface Props {
  suppliers?: SupplierMaster[];
  prs?: PurchaseRequisition[];
  rfqs?: RequestForQuotation[];
  pos?: ExtendedPurchaseOrder[];
  grns?: GoodsReceiptNote[];
  invoices?: SupplierInvoiceRecord[];
  mrpSuggestions?: MrpPurchaseSuggestion[];
  risks?: SupplierRiskItem[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
  showToast: (msg: string) => void;
}

export const ProcurementDashboardView: React.FC<Props> = ({
  suppliers = [],
  prs = [],
  rfqs = [],
  pos = [],
  grns = [],
  invoices = [],
  mrpSuggestions = [],
  risks = [],
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [selectedPlant, setSelectedPlant] = useState<string>('All Plants');
  const [timeRange, setTimeRange] = useState<string>('August 2026');

  // KPI Calculations with strict defensive checks
  const safePrs = prs || [];
  const safeRfqs = rfqs || [];
  const safePos = pos || [];
  const safeInvoices = invoices || [];
  const safeMrp = mrpSuggestions || [];
  const safeRisks = risks || [];
  const safeSuppliers = suppliers || [];

  const openPrsCount = safePrs.filter((p) => ['pending_approval', 'approved', 'draft'].includes(p.status)).length;
  const openRfqsCount = safeRfqs.filter((r) => ['sent', 'response_received', 'supplier_reviewing'].includes(r.status)).length;
  const activePosCount = safePos.filter((p) => ['approved', 'sent_to_supplier', 'partially_received'].includes(p.status)).length;
  const pendingApprovalsCount = safePrs.filter((p) => p.status === 'pending_approval').length + safePos.filter((p) => p.approvalStatus === 'pending').length;
  const overduePosCount = safePos.filter((p) => p.status === 'sent_to_supplier' && p.expectedDeliveryDate && new Date(p.expectedDeliveryDate) < new Date()).length;
  const pendingInvoicesCount = safeInvoices.filter((i) => i.matchStatus !== 'matched').length;
  const criticalShortagesCount = safeMrp.filter((m) => (m.priority || '').includes('Critical') || (m.priority || '').includes('High')).length;

  const totalPoValue = safePos.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Command Header */}
      <div className="bg-[#14213D] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0F8B8D]/30 text-[#0F8B8D] border border-[#0F8B8D]/40 uppercase tracking-wider">
              Procurement & Vendor Portal
            </span>
            <span className="text-xs text-slate-300">Live Supply Chain Sync</span>
          </div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] tracking-tight">
            Procurement Command Center
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Polymer resin supply management, raw material price indexing (Platts), RFQ quotation matrix, supplier compliance, and 3-way invoice matching.
          </p>
        </div>

        {/* Global Filters & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white/10 rounded-lg p-1 text-xs border border-white/10">
            <button
              onClick={() => setSelectedPlant('All Plants')}
              className={`px-3 py-1 rounded font-medium transition ${
                selectedPlant === 'All Plants' ? 'bg-white text-[#14213D] shadow' : 'text-slate-200 hover:text-white'
              }`}
            >
              All Plants
            </button>
            <button
              onClick={() => setSelectedPlant('Plant 1 (Vapi)')}
              className={`px-3 py-1 rounded font-medium transition ${
                selectedPlant === 'Plant 1 (Vapi)' ? 'bg-white text-[#14213D] shadow' : 'text-slate-200 hover:text-white'
              }`}
            >
              Plant 1 (Vapi)
            </button>
          </div>

          <button
            onClick={() => onNavigate('mrpSuggestions')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            MRP Suggestions ({mrpSuggestions.length})
          </button>

          <button
            onClick={() => onNavigate('prCreate')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New PR
          </button>
        </div>
      </div>

      {/* 15 Primary KPI Cards in Responsive Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {/* Card 1: Open PRs */}
        <div
          onClick={() => onNavigate('prList')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#0F8B8D] hover:shadow transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Open Requisitions</span>
            <FileText className="w-4 h-4 text-[#0F8B8D]" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">{openPrsCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 2 Approved for PO
          </div>
        </div>

        {/* Card 2: Open RFQs */}
        <div
          onClick={() => onNavigate('rfqList')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#0F8B8D] hover:shadow transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Active RFQs</span>
            <Layers className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">{openRfqsCount}</div>
          <div className="text-[11px] text-sky-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 2 Quotes Ready to Compare
          </div>
        </div>

        {/* Card 3: Open POs */}
        <div
          onClick={() => onNavigate('poList')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#0F8B8D] hover:shadow transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Active POs</span>
            <Package className="w-4 h-4 text-[#E8622C]" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">{activePosCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">₹{(totalPoValue / 100000).toFixed(1)}L Total Order Val</div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div
          onClick={() => onNavigate('procApprovalQueue')}
          className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm hover:border-amber-400 hover:shadow transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-amber-900">{pendingApprovalsCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">PR-081 & PO-3391 in Queue</div>
        </div>

        {/* Card 5: MTD Spend */}
        <div
          onClick={() => onNavigate('procReports')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#0F8B8D] hover:shadow transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>MTD Purchase Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">₹44.2 L</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Within ₹55L Budget</div>
        </div>

        {/* Card 6: YTD Spend */}
        <div
          onClick={() => onNavigate('procReports')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#0F8B8D] hover:shadow transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>YTD Material Spend</span>
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">₹2.84 Cr</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">64.2% Virgin Resin</div>
        </div>

        {/* Card 7: Overdue Deliveries */}
        <div
          onClick={() => onNavigate('poList')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-red-400 hover:shadow transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Delayed POs</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-red-600">{overduePosCount}</div>
          <div className="text-[11px] text-red-500 font-medium mt-1">SABIC India Lexan PO</div>
        </div>

        {/* Card 8: Partially Received */}
        <div
          onClick={() => onNavigate('poList')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Partial Receipts</span>
            <Truck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">1</div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">PO-3392 (180/400 KG)</div>
        </div>

        {/* Card 9: Goods Receipt (GRN) */}
        <div
          onClick={() => onNavigate('grnList')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Pending QC GRNs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">0</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">All 2 GRNs Released</div>
        </div>

        {/* Card 10: Invoices 3-Way Match */}
        <div
          onClick={() => onNavigate('supplierInvoiceList')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Pending Invoices</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">{pendingInvoicesCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">1 Price Variance (₹2.5k)</div>
        </div>

        {/* Card 11: Supplier OTD % */}
        <div
          onClick={() => onNavigate('supplierScorecard')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>On-Time Delivery</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">96.5%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">+1.8% vs Last Month</div>
        </div>

        {/* Card 12: Quality Acceptance */}
        <div
          onClick={() => onNavigate('supplierScorecard')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>QC Acceptance Rate</span>
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">98.8%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">1 Lot Blocked (EcoPolymer)</div>
        </div>

        {/* Card 13: Avg Lead Time */}
        <div
          onClick={() => onNavigate('supplierList')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Avg Lead Time</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">7.8 Days</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Virgin Resin: 7 Days</div>
        </div>

        {/* Card 14: PPV Variance */}
        <div
          onClick={() => onNavigate('procReports')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Price Variance (PPV)</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">-0.9%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">₹42.5k Cost Savings</div>
        </div>

        {/* Card 15: Critical Alerts */}
        <div
          onClick={() => onNavigate('procRiskCompliance')}
          className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm hover:border-red-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-red-800 mb-1">
            <span>Supplier Risk Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-red-700">{safeRisks.length}</div>
          <div className="text-[11px] text-red-600 font-medium mt-1">1 Critical Vendor Block</div>
        </div>
      </div>

      {/* Main Split View: Spend Analytics & Critical Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Category Spend & Monthly Trends */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spend By Polymer & Consumables Category */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#14213D]">
                  YTD Spend Breakdown by Raw Material Category
                </h2>
                <p className="text-xs text-slate-500">Distribution across virgin polymers, color concentrates, and plant tooling</p>
              </div>
              <button
                onClick={() => onNavigate('procReports')}
                className="text-xs text-[#0F8B8D] font-semibold hover:underline flex items-center gap-1"
              >
                View Detailed Report <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Horizontal Stacked Bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex mb-4 bg-slate-100">
              {PROCUREMENT_SPEND_BY_CATEGORY.map((cat, idx) => (
                <div
                  key={idx}
                  style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                  title={`${cat.category}: ${cat.pct}% (₹${(cat.spend / 100000).toFixed(1)}L)`}
                />
              ))}
            </div>

            {/* Category Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold text-right">YTD Spend</th>
                    <th className="py-2.5 px-3 font-semibold text-right">% of Total</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Price Index Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PROCUREMENT_SPEND_BY_CATEGORY.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cat.color }}></span>
                        <span className="font-medium text-[#14213D]">{cat.category}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#14213D]">
                        ₹{(cat.spend / 100000).toFixed(2)} Lakhs
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{cat.pct}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <TrendingDown className="w-3 h-3" /> Platts Stable
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical MRP Shortage Alerts */}
          <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14213D]">Critical MRP Raw Material Shortages</h3>
                  <p className="text-xs text-slate-500">Immediate purchase orders required to avert production machine stops</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('mrpSuggestions')}
                className="px-3 py-1.5 bg-[#E8622C] hover:bg-[#d45320] text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Launch MRP Consolidation
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {safeMrp.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-red-100 bg-red-50/40 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#14213D]">{item.itemName}</span>
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded font-medium border border-red-200">
                        Shortage: {item.shortageQty} {item.uom}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">[{item.itemCode}]</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Target Work Order: <span className="font-semibold text-[#14213D]">{item.linkedWorkOrderId || 'WO-1190'}</span> • Lead Time: {item.leadTimeDays} Days from <span className="font-semibold">{item.preferredSupplierName}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => {
                        showToast(`Converted ${item.itemCode} into Draft Purchase Order for ${item.preferredSupplierName}`);
                        onNavigate('poList');
                      }}
                      className="px-3 py-1.5 bg-[#0F8B8D] text-white text-xs font-semibold rounded-lg hover:bg-[#0d797b] transition"
                    >
                      1-Click PO ({item.suggestedOrderQty} {item.uom})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Operational Feeds & Fast Launchpad */}
        <div className="space-y-6">
          {/* Quick Action Navigation Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Procurement Quick Launchpad
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('supplierList')}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 text-left transition flex flex-col justify-between"
              >
                <Truck className="w-4 h-4 text-[#0F8B8D] mb-1" />
                <span className="text-xs font-semibold text-[#14213D]">Supplier Master</span>
                <span className="text-[10px] text-slate-500">{safeSuppliers.length} Vendors Registered</span>
              </button>

              <button
                onClick={() => onNavigate('rfqCompare', { rfqNumber: 'RFQ-2026-018' })}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 text-left transition flex flex-col justify-between"
              >
                <Scale className="w-4 h-4 text-sky-600 mb-1" />
                <span className="text-xs font-semibold text-[#14213D]">Quote Comparison</span>
                <span className="text-[10px] text-slate-500">Side-by-side Matrix</span>
              </button>

              <button
                onClick={() => onNavigate('supplierInvoiceMatch')}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 text-left transition flex flex-col justify-between"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-600 mb-1" />
                <span className="text-xs font-semibold text-[#14213D]">3-Way Match</span>
                <span className="text-[10px] text-slate-500">PO vs GRN vs Bill</span>
              </button>

              <button
                onClick={() => onNavigate('supplierScorecard')}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 text-left transition flex flex-col justify-between"
              >
                <Award className="w-4 h-4 text-amber-600 mb-1" />
                <span className="text-xs font-semibold text-[#14213D]">Vendor Scorecard</span>
                <span className="text-[10px] text-slate-500">OTD & Quality Radar</span>
              </button>

              <button
                onClick={() => onNavigate('procContractList')}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 text-left transition flex flex-col justify-between"
              >
                <FileText className="w-4 h-4 text-teal-600 mb-1" />
                <span className="text-xs font-semibold text-[#14213D]">Supply Contracts</span>
                <span className="text-[10px] text-slate-500">Volume Agreements</span>
              </button>

              <button
                onClick={() => onNavigate('procPriceList')}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 text-left transition flex flex-col justify-between"
              >
                <BarChart3 className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-xs font-semibold text-[#14213D]">Indexed Pricing</span>
                <span className="text-[10px] text-slate-500">Platts Polymer Formula</span>
              </button>
            </div>
          </div>

          {/* Pending Approval Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Approvals ({pendingApprovalsCount})
              </h3>
              <button
                onClick={() => onNavigate('procApprovalQueue')}
                className="text-[11px] text-[#0F8B8D] font-semibold hover:underline"
              >
                Open Hub
              </button>
            </div>

            <div className="space-y-2">
              {safePrs.filter((p) => p.status === 'pending_approval').map((pr) => (
                <div
                  key={pr.id}
                  onClick={() => onNavigate('prDetail', { id: pr.id })}
                  className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40 hover:bg-amber-50 cursor-pointer transition flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-[#14213D]">{pr.prNumber}</div>
                    <div className="text-[11px] text-slate-600 truncate max-w-[170px]">
                      {pr.lines[0]?.itemName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-[#14213D]">₹{((pr.estimatedTotal || 0) / 100000).toFixed(2)}L</div>
                    <span className="text-[10px] text-amber-700 font-medium">VP Approval Req</span>
                  </div>
                </div>
              ))}

              {safePos.filter((p) => p.approvalStatus === 'pending').map((po) => (
                <div
                  key={po.id}
                  onClick={() => onNavigate('poDetail', { id: po.id })}
                  className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-[#14213D]">{po.poNumber}</div>
                    <div className="text-[11px] text-slate-600 truncate max-w-[170px]">{po.supplierName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-[#14213D]">₹{((po.totalAmount || 0) / 100000).toFixed(2)}L</div>
                    <ProcurementStatusBadge status="pending_approval" size="xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Risk & Compliance Watchlist */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Supplier Risk Watchlist
              </h3>
              <button
                onClick={() => onNavigate('procRiskCompliance')}
                className="text-[11px] text-[#0F8B8D] font-semibold hover:underline"
              >
                All Risks
              </button>
            </div>

            <div className="space-y-2">
              {safeRisks.map((risk) => (
                <div key={risk.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-start gap-2">
                  <span
                    className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                      risk.riskLevel === 'Critical'
                        ? 'bg-red-500'
                        : risk.riskLevel === 'High'
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#14213D]">{risk.supplierName}</div>
                    <div className="text-[11px] text-slate-600">{risk.issueDescription}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Owner: {risk.owner}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
