import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Award,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CrmAnalyticsReportsViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
}

const MONTHLY_SALES_DATA = [
  { month: 'Apr 2026', target: 80, actual: 85, pipeline: 140 },
  { month: 'May 2026', target: 85, actual: 92, pipeline: 160 },
  { month: 'Jun 2026', target: 90, actual: 88, pipeline: 175 },
  { month: 'Jul 2026', target: 95, actual: 104, pipeline: 190 },
  { month: 'Aug 2026', target: 100, actual: 112, pipeline: 210 },
  { month: 'Sep 2026', target: 110, actual: 98, pipeline: 245 },
];

const WIN_LOSS_REASONS = [
  { reason: 'Price / RM Index', count: 14, color: '#f43f5e' },
  { reason: 'Tooling Lead Time', count: 8, color: '#f59e0b' },
  { reason: 'Specification Fit', count: 5, color: '#6366f1' },
  { reason: 'OEM Project Canceled', count: 3, color: '#94a3b8' },
];

const SALES_REP_PERFORMANCE = [
  { rep: 'Rajesh Sharma', quotaAchieved: 114, dealsWon: 12, revenue: '₹3.42 Cr', winRate: '68%', avgCycle: '18 Days' },
  { rep: 'Pooja Nair', quotaAchieved: 108, dealsWon: 9, revenue: '₹2.85 Cr', winRate: '62%', avgCycle: '22 Days' },
  { rep: 'Amit Verma', quotaAchieved: 94, dealsWon: 7, revenue: '₹1.95 Cr', winRate: '54%', avgCycle: '26 Days' },
  { rep: 'Sunil Mehta', quotaAchieved: 88, dealsWon: 5, revenue: '₹1.40 Cr', winRate: '48%', avgCycle: '30 Days' },
];

const MARGIN_BY_PRODUCT = [
  { category: 'Color Masterbatch', margin: 28.5 },
  { category: 'Automotive Molded Parts', margin: 24.2 },
  { category: 'Medical Components', margin: 31.0 },
  { category: 'Packaging Containers', margin: 18.4 },
  { category: 'Raw Polymer Resins', margin: 12.5 },
];

export const CrmAnalyticsReportsView: React.FC<CrmAnalyticsReportsViewProps> = ({
  onNavigate,
  showToast,
}) => {
  const [timeRange, setTimeRange] = useState('FY 2026-27');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Commercial Intelligence
            </span>
            <span className="text-xs text-slate-500">Executive & Sales KPI Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">CRM Analytics & Revenue Intelligence</h1>
          <p className="text-sm text-slate-600">
            Real-time tracking of deal pipeline velocity, win/loss telemetry, sales rep quota realization, and product margin contribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="FY 2026-27">Current Fiscal Year (FY 26-27)</option>
            <option value="Q2 2026">Q2 (Jul - Sep 2026)</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>

          <button
            onClick={() => showToast('Exported Executive Sales Report to PDF/Excel')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Booked Sales</span>
          <div className="text-2xl font-black text-slate-900">₹9.62 Cr</div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            +14.2% YoY Growth
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Pipeline Conversion Rate</span>
          <div className="text-2xl font-black text-teal-800">58.4%</div>
          <div className="text-xs text-slate-500">Qualification to Won Deal</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Avg Sales Cycle Time</span>
          <div className="text-2xl font-black text-indigo-700">21.5 Days</div>
          <div className="text-xs text-emerald-600 font-semibold">-3.2 Days vs Q1</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Blended Gross Margin</span>
          <div className="text-2xl font-black text-emerald-700">23.8%</div>
          <div className="text-xs text-slate-500">Across 5 product families</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Sales Revenue vs Target (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Revenue vs Quota Target (₹ Lakhs)</h3>
              <p className="text-xs text-slate-500">Demonstrating actual sales bookings against planned targets and open pipeline.</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_SALES_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [`₹${value}L`, name === 'actual' ? 'Actual Sales' : name === 'target' ? 'Target Quota' : 'Pipeline Size']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="target" fill="#94a3b8" name="Target Quota" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#0f766e" name="Actual Sales" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win / Loss Reasons Pie Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Lost Opportunity Root Causes</h3>
            <p className="text-xs text-slate-500">Distribution of dropped negotiations.</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={WIN_LOSS_REASONS}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {WIN_LOSS_REASONS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} Deals`, 'Lost Count']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs">
            {WIN_LOSS_REASONS.map(item => (
              <div key={item.reason} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.reason}
                </span>
                <span className="font-bold text-slate-800">{item.count} Deals</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Rep Quota Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sales Account Executive Leaderboard</h3>
            <p className="text-xs text-slate-500">Individual performance metrics and deal velocities.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="p-3">Salesperson</th>
                <th className="p-3">Quota Realization</th>
                <th className="p-3">Closed Revenue</th>
                <th className="p-3">Deals Won</th>
                <th className="p-3">Win Rate</th>
                <th className="p-3">Avg Cycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {SALES_REP_PERFORMANCE.map((rep, idx) => (
                <tr key={rep.rep} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    {rep.rep}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, rep.quotaAchieved)}%` }}
                        />
                      </div>
                      <span className="font-bold text-teal-800">{rep.quotaAchieved}%</span>
                    </div>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{rep.revenue}</td>
                  <td className="p-3 font-semibold text-slate-800">{rep.dealsWon} Deals</td>
                  <td className="p-3 font-bold text-emerald-700">{rep.winRate}</td>
                  <td className="p-3 text-slate-600">{rep.avgCycle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Family Margin Analysis */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Polymer Product Family Gross Margin % Contribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {MARGIN_BY_PRODUCT.map(item => (
            <div key={item.category} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px] block truncate" title={item.category}>
                {item.category}
              </span>
              <div className="text-xl font-black text-teal-800">{item.margin}%</div>
              <span className="text-[10px] text-emerald-600 font-semibold">Healthy Margin</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
