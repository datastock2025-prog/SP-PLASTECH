import React, { useState } from 'react';
import {
  PieChart as PieChartIcon,
  Layers,
  Crown,
  TrendingUp,
  ShieldAlert,
  Star,
  Users,
  Building2,
  Download,
  Filter,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { mockAccounts } from '../../data/mockCrmData';

interface CrmCustomerSegmentationViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
}

const TIER_COLORS: { [key: string]: string } = {
  'Tier 1 - Strategic': '#0f766e',
  'Tier 2 - Growth': '#6366f1',
  'Tier 3 - Transactional': '#eab308',
  'Dormant Account': '#94a3b8',
};

export const CrmCustomerSegmentationView: React.FC<CrmCustomerSegmentationViewProps> = ({
  onNavigate,
  showToast,
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Segment calculations
  const tier1Count = mockAccounts.filter(a => a.segmentTier === 'Tier 1 - Strategic').length;
  const tier2Count = mockAccounts.filter(a => a.segmentTier === 'Tier 2 - Growth').length;
  const tier3Count = mockAccounts.filter(a => a.segmentTier === 'Tier 3 - Transactional').length;

  const tierDistributionData = [
    { name: 'Tier 1 Strategic', value: tier1Count, color: '#0f766e' },
    { name: 'Tier 2 Growth', value: tier2Count, color: '#6366f1' },
    { name: 'Tier 3 Transactional', value: tier3Count, color: '#eab308' },
  ];

  const industryBreakdownData = [
    { industry: 'Automotive', revenue: 4.8 },
    { industry: 'Packaging', revenue: 3.2 },
    { industry: 'Medical', revenue: 1.9 },
    { industry: 'Industrial', revenue: 1.4 },
    { industry: 'Appliances', revenue: 0.8 },
  ];

  const filteredAccounts = mockAccounts.filter(acc => {
    if (selectedTier !== 'All' && acc.segmentTier !== selectedTier) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        acc.accountName.toLowerCase().includes(q) ||
        acc.customerGroup.toLowerCase().includes(q) ||
        acc.industry.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Commercial RFM Matrix
            </span>
            <span className="text-xs text-slate-500">Tier Analysis & Revenue Concentration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Customer Segmentation & Strategic Tiers</h1>
          <p className="text-sm text-slate-600">
            Categorize plastic converter accounts by annual polymer volume, gross margin contribution, and growth potential.
          </p>
        </div>

        <button
          onClick={() => showToast('Exported customer tier matrix')}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
        >
          <Download className="w-4 h-4" />
          Export Matrix
        </button>
      </div>

      {/* Tier Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 border-l-4 border-l-teal-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-teal-600" />
              Tier 1 - Strategic Accounts
            </span>
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold text-xs">{tier1Count} Accounts</span>
          </div>
          <div className="text-2xl font-black text-slate-900">₹6.45 Cr</div>
          <p className="text-xs text-slate-500">Accounts with annual polymer purchase &gt; ₹1.0 Cr or OEM Tier-1 status.</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Tier 2 - Growth Accounts
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-bold text-xs">{tier2Count} Accounts</span>
          </div>
          <div className="text-2xl font-black text-slate-900">₹2.80 Cr</div>
          <p className="text-xs text-slate-500">Accounts with high compounding growth potential (₹25L - ₹1 Cr).</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              Tier 3 - Transactional
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-xs">{tier3Count} Accounts</span>
          </div>
          <div className="text-2xl font-black text-slate-900">₹1.15 Cr</div>
          <p className="text-xs text-slate-500">Spot polymer purchases and periodic tooling maintenance customers.</p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Account Distribution by Strategic Tier</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tierDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} Accounts`, 'Count']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs">
            {tierDistributionData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Industry Revenue Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Revenue Contribution by Industry Segment (₹ Crores)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={industryBreakdownData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="industry" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`₹${value} Cr`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-slate-500">
            Automotive OEM and FMCG Packaging comprise 76% of total revenue.
          </div>
        </div>
      </div>

      {/* Customer Segmentation Directory */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter customer accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTier('All')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${selectedTier === 'All' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setSelectedTier('Tier 1 - Strategic')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${selectedTier === 'Tier 1 - Strategic' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Tier 1 Strategic
            </button>
            <button
              onClick={() => setSelectedTier('Tier 2 - Growth')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${selectedTier === 'Tier 2 - Growth' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Tier 2 Growth
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="p-3">Account Name</th>
                <th className="p-3">Segment Tier</th>
                <th className="p-3">Industry</th>
                <th className="p-3">YTD Revenue</th>
                <th className="p-3">Open Orders</th>
                <th className="p-3">Credit Health</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAccounts.map(acc => (
                <tr
                  key={acc.id}
                  onClick={() => onNavigate('crmCustomer360', { accountId: acc.id })}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="p-3 font-bold text-slate-900">{acc.accountName}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {acc.segmentTier}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700">{acc.industry}</td>
                  <td className="p-3 font-bold text-teal-800">{formatCurrency(acc.totalRevenueYtd)}</td>
                  <td className="p-3 font-semibold text-indigo-700">{formatCurrency(acc.openOrdersValue)}</td>
                  <td className="p-3">
                    <span className="font-semibold text-emerald-700">{acc.creditStatus}</span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('crmCustomer360', { accountId: acc.id });
                      }}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded text-[11px]"
                    >
                      360 View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
