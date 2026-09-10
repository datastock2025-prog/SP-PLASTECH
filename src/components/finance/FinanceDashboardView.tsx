import React from 'react';
import {
  Account,
  JournalEntry,
  CostCenter,
  CustomerInvoice,
  SupplierInvoice,
  FixedAsset,
  Customer,
} from '../../types';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building,
  Receipt,
  BookOpen,
  Plus,
  RefreshCw,
  Landmark,
  Sliders,
  Calendar,
  Layers,
  Percent,
} from 'lucide-react';

interface Props {
  accounts: Account[];
  journalEntries: JournalEntry[];
  costCenters: CostCenter[];
  invoices: CustomerInvoice[];
  supplierInvoices?: SupplierInvoice[];
  customers?: Customer[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const FinanceDashboardView: React.FC<Props> = ({
  accounts,
  journalEntries,
  costCenters,
  invoices,
  onNavigate,
  showToast,
}) => {
  // Financial KPI calculations
  const totalRevenue = accounts
    .filter((a) => a.type === 'Revenue')
    .reduce((sum, a) => sum + (a.balance || 0), 0) || 9840000;

  const totalCOGS = accounts
    .filter((a) => a.type === 'Expense' && a.code.startsWith('5'))
    .reduce((sum, a) => sum + (a.balance || 0), 0) || 7580000;

  const grossProfit = totalRevenue - totalCOGS;
  const grossMarginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '32.4';

  const arBalance = accounts.find((a) => a.code === '1200')?.balance || 8600000;
  const apBalance = accounts.find((a) => a.code === '2100')?.balance || 1840000;
  const cashBalance = (accounts.find((a) => a.code === '1110')?.balance || 6120000) +
    (accounts.find((a) => a.code === '1120')?.balance || 2100000);

  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Finance &middot; General Ledger &amp; Controlling
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Finance Command Center
          </h1>
          <p className="text-xs text-[#6B7280]">
            Consolidated general ledger, working capital liquidity, cost absorption, and real-time P&amp;L performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF] flex items-center gap-1.5 shadow-sm transition-colors"
            onClick={() => onNavigate('coaList')}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0F8B8D]" /> Chart of Accounts
          </button>
          <button
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF] flex items-center gap-1.5 shadow-sm transition-colors"
            onClick={() => onNavigate('periodClose')}
          >
            <Calendar className="w-3.5 h-3.5 text-[#E8622C]" /> Period Close
          </button>
          <button
            className="px-3 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C] flex items-center gap-1.5 shadow-sm transition-colors"
            onClick={() => onNavigate('jeList')}
          >
            <Plus className="w-3.5 h-3.5" /> + New Journal Entry
          </button>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Operating Revenue */}
        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              Operating Revenue (YTD)
            </span>
            <span className="p-1.5 bg-[#DCF0EF] text-[#0F8B8D] rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-2">
            {formatINR(totalRevenue)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#0F8B8D] font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% vs target budget</span>
          </div>
        </div>

        {/* Gross Margin */}
        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              Gross Margin (COGS Ratio)
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-2">
            {grossMarginPct}%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Target: 30.0% &middot; Net ₹{(grossProfit / 100000).toFixed(1)} L</span>
          </div>
        </div>

        {/* Accounts Receivable */}
        <div
          className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onNavigate('arDash')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              Accounts Receivable (AR)
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-2">
            {formatINR(arBalance)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-1">
            <span>DSO: <b>38 Days</b></span>
            <span className="text-emerald-600 font-medium">92% Current</span>
          </div>
        </div>

        {/* Cash & Bank Position */}
        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              Cash &amp; Bank Liquidity
            </span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-2">
            {formatINR(cashBalance)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-1">
            <span>HDFC + ICICI</span>
            <span className="text-blue-600 font-medium">AP Cover: {(cashBalance / apBalance).toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <button
          onClick={() => onNavigate('apDash')}
          className="p-3 bg-white rounded-xl border border-[#E4E0D6] hover:border-[#0F8B8D] hover:bg-[#F6F4EF] text-left transition-all group"
        >
          <div className="p-2 w-fit rounded-lg bg-orange-50 text-[#E8622C] mb-2 group-hover:scale-105 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-[#14213D]">Accounts Payable</div>
          <div className="text-[10px] text-[#6B7280]">3-Way PO Matching</div>
        </button>

        <button
          onClick={() => onNavigate('arDash')}
          className="p-3 bg-white rounded-xl border border-[#E4E0D6] hover:border-[#0F8B8D] hover:bg-[#F6F4EF] text-left transition-all group"
        >
          <div className="p-2 w-fit rounded-lg bg-emerald-50 text-emerald-600 mb-2 group-hover:scale-105 transition-transform">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-[#14213D]">Receivables &amp; AR</div>
          <div className="text-[10px] text-[#6B7280]">Aging &amp; Dunning</div>
        </button>

        <button
          onClick={() => onNavigate('invoiceList')}
          className="p-3 bg-white rounded-xl border border-[#E4E0D6] hover:border-[#0F8B8D] hover:bg-[#F6F4EF] text-left transition-all group"
        >
          <div className="p-2 w-fit rounded-lg bg-blue-50 text-blue-600 mb-2 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-[#14213D]">Customer Invoices</div>
          <div className="text-[10px] text-[#6B7280]">GST Tax Invoicing</div>
        </button>

        <button
          onClick={() => onNavigate('costCenterList')}
          className="p-3 bg-white rounded-xl border border-[#E4E0D6] hover:border-[#0F8B8D] hover:bg-[#F6F4EF] text-left transition-all group"
        >
          <div className="p-2 w-fit rounded-lg bg-purple-50 text-purple-600 mb-2 group-hover:scale-105 transition-transform">
            <Building className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-[#14213D]">Cost Centers</div>
          <div className="text-[10px] text-[#6B7280]">Overhead Absorption</div>
        </button>

        <button
          onClick={() => onNavigate('productCosting')}
          className="p-3 bg-white rounded-xl border border-[#E4E0D6] hover:border-[#0F8B8D] hover:bg-[#F6F4EF] text-left transition-all group"
        >
          <div className="p-2 w-fit rounded-lg bg-teal-50 text-[#0F8B8D] mb-2 group-hover:scale-105 transition-transform">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-[#14213D]">Product Costing</div>
          <div className="text-[10px] text-[#6B7280]">BOM &amp; Machine Rates</div>
        </button>

        <button
          onClick={() => onNavigate('varianceAnalysis')}
          className="p-3 bg-white rounded-xl border border-[#E4E0D6] hover:border-[#0F8B8D] hover:bg-[#F6F4EF] text-left transition-all group"
        >
          <div className="p-2 w-fit rounded-lg bg-amber-50 text-amber-600 mb-2 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-[#14213D]">Variance Analysis</div>
          <div className="text-[10px] text-[#6B7280]">Material, Labor, OH</div>
        </button>
      </div>

      {/* Main Grid: Cost Center Absorption vs Working Capital */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Center Absorption Matrix */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E4E0D6] flex items-center justify-between bg-[#F6F4EF]/50">
            <div>
              <h2 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk']">
                Manufacturing Cost Center Absorption &amp; Utilization
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                Monthly budget allocation vs actual absorbed machine &amp; labor costs.
              </p>
            </div>
            <button
              onClick={() => onNavigate('costCenterList')}
              className="text-xs text-[#0F8B8D] hover:underline font-semibold"
            >
              View All &rarr;
            </button>
          </div>
          <div className="p-4 space-y-4">
            {costCenters.slice(0, 5).map((cc) => {
              const utilPct = Math.min(Math.round((cc.actual / cc.budget) * 100), 100);
              const isOver = cc.actual > cc.budget;
              return (
                <div key={cc.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-[#F6F4EF] px-1.5 py-0.5 rounded text-[#14213D] font-semibold">
                        {cc.code}
                      </span>
                      <span className="font-semibold text-[#14213D]">{cc.name}</span>
                      <span className="text-[10px] text-[#6B7280] font-mono">
                        ({cc.allocBase})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-[#6B7280]">
                        ₹{(cc.actual / 100000).toFixed(2)}L / ₹{(cc.budget / 100000).toFixed(2)}L
                      </span>
                      <span className={`font-bold ${isOver ? 'text-[#E8622C]' : 'text-[#0F8B8D]'}`}>
                        {((cc.actual / cc.budget) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[#E4E0D6] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver ? 'bg-[#E8622C]' : 'bg-[#0F8B8D]'
                      }`}
                      style={{ width: `${utilPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Working Capital & Liquidity Breakdown */}
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-4 space-y-4">
          <div className="border-b border-[#E4E0D6] pb-3">
            <h2 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk']">
              Working Capital Liquidity
            </h2>
            <p className="text-[11px] text-[#6B7280]">Current Assets vs Current Liabilities.</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-[#F6F4EF] rounded-lg flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#6B7280]">Current Assets</div>
                <div className="text-base font-bold text-[#14213D] font-mono">₹5.90 Cr</div>
                <div className="text-[10px] text-[#6B7280]">Cash + AR + Inventory RM/FG</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-[#6B7280]">Current Liab.</div>
                <div className="text-base font-bold text-[#E8622C] font-mono">₹0.22 Cr</div>
                <div className="text-[10px] text-[#6B7280]">AP + GST Output</div>
              </div>
            </div>

            <div className="p-3 bg-[#DCF0EF]/40 rounded-lg border border-[#0F8B8D]/20 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#0F8B8D]">Net Working Capital</div>
                <div className="text-lg font-bold text-[#0F8B8D] font-mono">₹5.68 Cr</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-[#0F8B8D]">Current Ratio</div>
                <div className="text-lg font-bold text-[#0F8B8D] font-mono">26.8x</div>
              </div>
            </div>

            <div className="pt-2 text-xs space-y-2">
              <div className="flex justify-between text-[#6B7280]">
                <span>Days Sales Outstanding (DSO):</span>
                <span className="font-mono font-bold text-[#14213D]">38 Days</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Days Payable Outstanding (DPO):</span>
                <span className="font-mono font-bold text-[#14213D]">28 Days</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Cash Conversion Cycle (CCC):</span>
                <span className="font-mono font-bold text-emerald-600">42 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent General Ledger Journal Postings Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#F6F4EF]/50">
          <div>
            <h2 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk']">
              Recent General Ledger Postings
            </h2>
            <p className="text-[11px] text-[#6B7280]">
              Real-time audit log of double-entry financial voucher transactions.
            </p>
          </div>
          <button
            onClick={() => onNavigate('jeList')}
            className="text-xs text-[#0F8B8D] hover:underline font-semibold"
          >
            All Journal Entries &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">Posting Date</th>
                <th className="py-2.5 px-3">Reference / Source</th>
                <th className="py-2.5 px-3">Memo / Narration</th>
                <th className="py-2.5 px-3">Debit / Credit Total</th>
                <th className="py-2.5 px-3">Created By</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {journalEntries.slice(0, 6).map((je) => {
                const totalDebit = je.lines.reduce((s, l) => s + (l.debit || 0), 0);
                return (
                  <tr key={je.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">
                      {je.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">
                      {je.date}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#14213D]">
                      {je.ref || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[#14213D] font-medium max-w-xs truncate">
                      {je.memo}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#14213D]">
                      ₹{totalDebit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-[#6B7280]">
                      {je.createdBy}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {je.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
