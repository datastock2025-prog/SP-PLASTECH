import React, { useState } from 'react';
import {
  TrendingUp,
  FileEdit,
  ShoppingBag,
  Truck,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  Undo2,
  FileSpreadsheet,
  Building,
  Sparkles,
  Search,
  Calendar,
  Filter,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { SalesOrder, SalesQuotation, Customer, ReturnMerchandise } from '../../types';
import { SalesStatusBadge } from './SalesStatusBadge';
import {
  CUSTOMER_CREDIT_EXPOSURES,
  SALES_BACKORDERS,
  SALES_BILLING_RECORDS,
  CUSTOMER_COMPLAINTS,
} from '../../data/salesData';

interface Props {
  sos: SalesOrder[];
  quotes: SalesQuotation[];
  customers: Customer[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const SalesDashboardView: React.FC<Props> = ({
  sos,
  quotes,
  customers,
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [timeRange, setTimeRange] = useState<'MTD' | 'QTD' | 'YTD'>('MTD');

  // Metrics calculation
  const getSOTotal = (s: SalesOrder) => s.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const getQuoteTotal = (q: SalesQuotation) =>
    q.lines.reduce((sum, l) => sum + l.qty * l.price * (1 - (l.discountPct || 0) / 100), 0);

  const totalOpenSOValue = sos
    .filter((s) => s.approval !== 'rejected')
    .reduce((sum, s) => sum + getSOTotal(s), 0);

  const totalQuotesValue = quotes.reduce((sum, q) => sum + getQuoteTotal(q), 0);
  const convertedQuotes = quotes.filter((q) => q.stage === 'converted').length;
  const quoteConversionRate = quotes.length > 0 ? ((convertedQuotes / quotes.length) * 100).toFixed(1) : '68.4';

  const ordersPendingConfirmation = sos.filter((s) => s.approval === 'pending').length;
  const ordersOnCreditHold = CUSTOMER_CREDIT_EXPOSURES.filter(
    (c) => c.creditStatus === 'credit_blocked' || c.creditStatus === 'near_limit'
  ).length;

  const totalBackorderValue = SALES_BACKORDERS.reduce(
    (sum, b) => sum + b.shortageQty * (b.item.startsWith('RM') ? 135 : 9.5),
    0
  );

  const deliveredNotInvoicedCount = SALES_BILLING_RECORDS.filter(
    (b) => b.invoiceStatus === 'ready_to_bill' || b.invoiceStatus === 'not_billed'
  ).length;

  const overdueReceivables = CUSTOMER_CREDIT_EXPOSURES.reduce((sum, c) => sum + c.overdueAmount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action Hub */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#0F8B8D]/10 text-[#0F8B8D] font-mono font-bold text-[10px] uppercase tracking-wider">
              Plastic B2B Sales Ops &middot; Commercial Architecture
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] mt-1 font-['Space_Grotesk']">
            Sales Command Center
          </h1>
          <p className="text-xs text-[#6B7280]">
            Omnichannel quotes, work-order linked confirmations, resin allocation, dispatch schedules, and credit control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-[#E4E0D6] p-0.5 bg-[#F6F4EF] text-xs font-semibold">
            {(['MTD', 'QTD', 'YTD'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md transition-all ${
                  timeRange === r
                    ? 'bg-white text-[#14213D] shadow-xs font-bold'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate('quoteList')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F6F4EF] hover:bg-[#E4E0D6] text-[#14213D] text-xs font-semibold border border-[#E4E0D6] transition-colors"
          >
            <FileEdit className="w-3.5 h-3.5 text-[#0F8B8D]" />
            <span>+ New Quotation</span>
          </button>

          <button
            onClick={() => onNavigate('soList')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E8622C] hover:bg-[#d45320] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>+ Create Sales Order</span>
          </button>
        </div>
      </div>

      {/* TOP KPI ROW: Enterprise Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs hover:border-[#0F8B8D]/40 transition-all">
          <div className="text-[11px] font-medium text-[#6B7280] flex items-center justify-between">
            <span>Sales Revenue {timeRange}</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#0F8B8D]" />
          </div>
          <div className="text-lg font-bold text-[#14213D] mt-1 font-mono">
            ₹{timeRange === 'MTD' ? '38,42,500' : timeRange === 'QTD' ? '1,12,60,000' : '4,85,20,000'}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="w-3 h-3" /> +8.4% vs target
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs hover:border-[#0F8B8D]/40 transition-all">
          <div className="text-[11px] font-medium text-[#6B7280] flex items-center justify-between">
            <span>Open Pipeline</span>
            <FileEdit className="w-3.5 h-3.5 text-[#E8622C]" />
          </div>
          <div className="text-lg font-bold text-[#14213D] mt-1 font-mono">
            ₹{(totalQuotesValue / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-[#6B7280] mt-0.5">
            <b>{quotes.length}</b> active proposals
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs hover:border-[#0F8B8D]/40 transition-all">
          <div className="text-[11px] font-medium text-[#6B7280] flex items-center justify-between">
            <span>Quote Win Rate</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-[#14213D] mt-1 font-mono">
            {quoteConversionRate}%
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="w-3 h-3" /> +3.2% vs Q2
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs hover:border-[#0F8B8D]/40 transition-all">
          <div className="text-[11px] font-medium text-[#6B7280] flex items-center justify-between">
            <span>Open SOs Value</span>
            <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-[#14213D] mt-1 font-mono">
            ₹{(totalOpenSOValue / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-[#0F8B8D] font-semibold mt-0.5">
            {sos.length} Confirmed orders
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs hover:border-rose-400 transition-all">
          <div className="text-[11px] font-medium text-[#6B7280] flex items-center justify-between">
            <span>Credit Holds</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-bold text-rose-600 mt-1 font-mono">
            {ordersOnCreditHold} Accts
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
            Action required
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs hover:border-amber-400 transition-all">
          <div className="text-[11px] font-medium text-[#6B7280] flex items-center justify-between">
            <span>Backorder Shortage</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-amber-700 mt-1 font-mono">
            ₹{(totalBackorderValue / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-[#6B7280] mt-0.5">
            {SALES_BACKORDERS.length} Lines staged
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs hover:border-emerald-400 transition-all">
          <div className="text-[11px] font-medium text-[#6B7280] flex items-center justify-between">
            <span>On-Time Delivery</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 mt-1 font-mono">
            96.4%
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            OTIF Benchmark met
          </div>
        </div>
      </div>

      {/* SECONDARY METRICS STRIP: Financial & Operational Readiness */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gradient-to-r from-[#14213D] to-[#1C2B4D] text-white p-4 rounded-xl shadow-xs">
        <div className="border-r border-white/10 pr-4">
          <div className="text-[10px] uppercase font-mono text-[#9AA5C4]">Delivered Not Invoiced</div>
          <div className="text-base font-bold font-mono mt-0.5 text-[#0F8B8D]">
            {deliveredNotInvoicedCount} Dispatches (₹1,61,000)
          </div>
          <div className="text-[10px] text-[#C7CEE6]">Ready for billing run</div>
        </div>

        <div className="border-r border-white/10 pr-4">
          <div className="text-[10px] uppercase font-mono text-[#9AA5C4]">Overdue Receivables</div>
          <div className="text-base font-bold font-mono mt-0.5 text-rose-300">
            ₹{(overdueReceivables / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-[#C7CEE6]">2 Accounts flagged</div>
        </div>

        <div className="border-r border-white/10 pr-4">
          <div className="text-[10px] uppercase font-mono text-[#9AA5C4]">Active Sales Contracts</div>
          <div className="text-base font-bold font-mono mt-0.5 text-amber-300">
            4 Blanket Agreements
          </div>
          <div className="text-[10px] text-[#C7CEE6]">68% Volume released</div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-mono text-[#9AA5C4]">Customer Returns (RMA)</div>
          <div className="text-base font-bold font-mono mt-0.5 text-cyan-300">
            2 Open (₹5,020)
          </div>
          <div className="text-[10px] text-[#C7CEE6]">1 Under QA inspection</div>
        </div>
      </div>

      {/* MIDDLE CHARTS: Sales Analytics & Plastic Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Revenue Trend vs Target */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0F8B8D]" />
                <span>Monthly Sales Revenue &amp; Target Forecast</span>
              </h2>
              <p className="text-xs text-[#6B7280]">Actual realized vs budget across raw resin &amp; molded goods</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-[#14213D]">
                <span className="w-3 h-3 rounded bg-[#0F8B8D]" /> Actual
              </span>
              <span className="flex items-center gap-1.5 text-[#6B7280]">
                <span className="w-3 h-3 rounded bg-[#E8622C]/40 border border-[#E8622C]" /> Target
              </span>
            </div>
          </div>

          {/* Clean Vector Visualizer */}
          <div className="space-y-3 pt-2">
            {[
              { month: 'Apr 2026', actual: 32.4, target: 30.0, pct: '108%' },
              { month: 'May 2026', actual: 36.1, target: 34.0, pct: '106%' },
              { month: 'Jun 2026', actual: 41.5, target: 38.0, pct: '109%' },
              { month: 'Jul 2026', actual: 39.8, target: 40.0, pct: '99%' },
              { month: 'Aug 2026 (MTD)', actual: 38.4, target: 42.0, pct: '91%' },
            ].map((d) => (
              <div key={d.month} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#14213D]">{d.month}</span>
                  <span className="text-[#6B7280]">
                    <b>₹{d.actual}L</b> / ₹{d.target}L ({d.pct})
                  </span>
                </div>
                <div className="h-4 bg-[#F6F4EF] rounded-full overflow-hidden flex relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#0F8B8D] to-[#25a5a7] rounded-full"
                    style={{ width: `${Math.min(100, (d.actual / 50) * 100)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#E8622C] z-10"
                    style={{ left: `${(d.target / 50) * 100}%` }}
                    title="Target line"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plastic Category Mix */}
        <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#E8622C]" />
              <span>Sales by Product Category</span>
            </h2>
            <p className="text-xs text-[#6B7280]">Plastic manufacturing portfolio split</p>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { cat: 'Raw Resin (PP, HDPE, ABS)', val: '₹18.4L', share: 42, color: 'bg-[#0F8B8D]' },
              { cat: 'Finished Goods (Bottles & Buckets)', val: '₹12.2L', share: 28, color: 'bg-[#E8622C]' },
              { cat: 'Masterbatch & Colorants', val: '₹5.5L', share: 13, color: 'bg-purple-600' },
              { cat: 'Additives & UV Stabilizers', val: '₹3.8L', share: 9, color: 'bg-amber-500' },
              { cat: 'Regrind & Reprocessed', val: '₹2.4L', share: 5, color: 'bg-teal-600' },
              { cat: 'Industrial Packaging', val: '₹1.3L', share: 3, color: 'bg-slate-500' },
            ].map((c) => (
              <div key={c.cat} className="text-xs">
                <div className="flex justify-between font-medium text-[#14213D] mb-1">
                  <span>{c.cat}</span>
                  <span className="font-mono font-bold">{c.val} ({c.share}%)</span>
                </div>
                <div className="w-full h-2 bg-[#F6F4EF] rounded-full overflow-hidden">
                  <div className={`h-full ${c.color}`} style={{ width: `${c.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OPERATIONAL WIDGETS & ALERTS (STEP-2 Mandates) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Expiring Quotations */}
        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase text-[#14213D] tracking-wider">
                Quotations Expiring Soon
              </h2>
            </div>
            <button
              onClick={() => onNavigate('quoteList')}
              className="text-[11px] font-semibold text-[#0F8B8D] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-[#E4E0D6] mt-2">
            {quotes.slice(0, 3).map((q) => (
              <div
                key={q.id}
                onClick={() => onNavigate('quoteDetail', { id: q.id })}
                className="py-2.5 hover:bg-[#F6F4EF] px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#0F8B8D]">{q.id}</span>
                  <SalesStatusBadge status={q.stage} size="xs" />
                </div>
                <div className="text-xs font-medium text-[#14213D] truncate mt-0.5">{q.customer}</div>
                <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-0.5">
                  <span className="font-mono">Expires: {q.validUntil}</span>
                  <span className="font-mono font-bold text-[#14213D]">
                    ₹{getQuoteTotal(q).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Limit Alerts & Approvals */}
        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h2 className="text-xs font-bold uppercase text-[#14213D] tracking-wider">
                Credit Block &amp; Approvals
              </h2>
            </div>
            <button
              onClick={() => onNavigate('creditControl')}
              className="text-[11px] font-semibold text-[#0F8B8D] hover:underline"
            >
              Credit Control
            </button>
          </div>

          <div className="divide-y divide-[#E4E0D6] mt-2">
            {CUSTOMER_CREDIT_EXPOSURES.slice(0, 3).map((c) => (
              <div
                key={c.customerCode}
                onClick={() => onNavigate('creditControl')}
                className="py-2.5 hover:bg-[#F6F4EF] px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#14213D] truncate">{c.customerName}</span>
                  <SalesStatusBadge status={c.creditStatus} size="xs" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-1">
                  <span>Balance: ₹{c.currentBalance.toLocaleString()}</span>
                  <span className="font-mono text-rose-600 font-semibold">
                    {c.overdueAmount > 0 ? `Overdue: ₹${c.overdueAmount.toLocaleString()}` : `Limit: ₹${(c.creditLimit / 100000).toFixed(1)}L`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliveries Scheduled Today & Quality NCRs */}
        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#0F8B8D]" />
              <h2 className="text-xs font-bold uppercase text-[#14213D] tracking-wider">
                Shipping &amp; RMA Alerts
              </h2>
            </div>
            <button
              onClick={() => onNavigate('deliverySchedule')}
              className="text-[11px] font-semibold text-[#0F8B8D] hover:underline"
            >
              Shipping Plan
            </button>
          </div>

          <div className="space-y-2 mt-2">
            <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200 text-xs">
              <div className="flex items-center justify-between font-semibold text-teal-900">
                <span>DN-8803 &middot; Metro Retail</span>
                <span className="font-mono">10,000 PCS</span>
              </div>
              <p className="text-[11px] text-teal-800 mt-0.5">
                500ml HDPE Dispenser Containers &middot; COA Attached &middot; Silo/Truck staging
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 text-xs">
              <div className="flex items-center justify-between font-semibold text-rose-900">
                <span>RMA-701 &middot; Bharat AgroTech</span>
                <span className="font-mono">₹3,120</span>
              </div>
              <p className="text-[11px] text-rose-800 mt-0.5">
                Quality hold on PET Preform LOT-2026-A &middot; QA Inspection in Progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR (STEP-2 & STEP-22) */}
      <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
        <h2 className="text-xs font-bold uppercase text-[#7C88AC] tracking-wider mb-3">
          Quick Sales Navigation &amp; Workflows
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <button
            onClick={() => onNavigate('quoteList')}
            className="p-3 rounded-lg bg-[#F6F4EF] hover:bg-[#E4E0D6] text-left transition-colors flex flex-col justify-between h-20"
          >
            <FileEdit className="w-4 h-4 text-[#0F8B8D]" />
            <div>
              <div className="text-xs font-bold text-[#14213D]">Quotations</div>
              <div className="text-[10px] text-[#6B7280]">Draft proposals</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('soList')}
            className="p-3 rounded-lg bg-[#F6F4EF] hover:bg-[#E4E0D6] text-left transition-colors flex flex-col justify-between h-20"
          >
            <ShoppingBag className="w-4 h-4 text-[#E8622C]" />
            <div>
              <div className="text-xs font-bold text-[#14213D]">Sales Orders</div>
              <div className="text-[10px] text-[#6B7280]">Customer orders</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('deliverySchedule')}
            className="p-3 rounded-lg bg-[#F6F4EF] hover:bg-[#E4E0D6] text-left transition-colors flex flex-col justify-between h-20"
          >
            <Truck className="w-4 h-4 text-teal-600" />
            <div>
              <div className="text-xs font-bold text-[#14213D]">Delivery Plan</div>
              <div className="text-[10px] text-[#6B7280]">Dispatches &amp; COA</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('creditControl')}
            className="p-3 rounded-lg bg-[#F6F4EF] hover:bg-[#E4E0D6] text-left transition-colors flex flex-col justify-between h-20"
          >
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            <div>
              <div className="text-xs font-bold text-[#14213D]">Credit Control</div>
              <div className="text-[10px] text-[#6B7280]">Limits &amp; Releases</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('billingStatus')}
            className="p-3 rounded-lg bg-[#F6F4EF] hover:bg-[#E4E0D6] text-left transition-colors flex flex-col justify-between h-20"
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-xs font-bold text-[#14213D]">Billing Status</div>
              <div className="text-[10px] text-[#6B7280]">Invoice requests</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('orderTracking')}
            className="p-3 rounded-lg bg-[#F6F4EF] hover:bg-[#E4E0D6] text-left transition-colors flex flex-col justify-between h-20"
          >
            <Search className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-xs font-bold text-[#14213D]">Order Tracking</div>
              <div className="text-[10px] text-[#6B7280]">13-Stage Timeline</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('pricingMgmt')}
            className="p-3 rounded-lg bg-[#F6F4EF] hover:bg-[#E4E0D6] text-left transition-colors flex flex-col justify-between h-20"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-xs font-bold text-[#14213D]">Pricing &amp; Rebates</div>
              <div className="text-[10px] text-[#6B7280]">Matrix &amp; Simulator</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
