import React, { useState } from 'react';
import { ProductionVariance, JournalEntry } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Sliders,
  DollarSign,
  Filter,
  Search,
  ArrowRight,
  RotateCcw,
  Zap,
  Package,
  Layers,
} from 'lucide-react';

interface Props {
  variances?: ProductionVariance[];
  onCreateJE?: (je: JournalEntry) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const ProductionVarianceView: React.FC<Props> = ({
  variances: initialVariances,
  onCreateJE,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [varianceList, setVarianceList] = useState<ProductionVariance[]>(
    initialVariances && initialVariances.length > 0
      ? initialVariances
      : [
          {
            id: 'VAR-2026-001',
            woId: 'WO-8801',
            item: 'FG-CTN-500',
            category: 'Material Usage (MQV)',
            standardCost: 198000,
            actualCost: 204600,
            variance: -6600,
            status: 'unfavorable',
            rootCause: 'Purging resin scrap during color changeover (Natural to White)',
          },
          {
            id: 'VAR-2026-002',
            woId: 'WO-8802',
            item: 'FG-PET-030',
            category: 'Material Price (MPV)',
            standardCost: 92000,
            actualCost: 88500,
            variance: 3500,
            status: 'favorable',
            rootCause: 'Spot procurement discount on bulk Reliance PET resin delivery',
          },
          {
            id: 'VAR-2026-003',
            woId: 'WO-8803',
            item: 'FG-BKT-010',
            category: 'Machine Overhead / Energy',
            standardCost: 142000,
            actualCost: 153200,
            variance: -11200,
            status: 'unfavorable',
            rootCause: 'Mold cooling channel scale buildup extending cycle time by 4.2s',
          },
          {
            id: 'VAR-2026-004',
            woId: 'WO-8804',
            item: 'FG-CAP-028',
            category: 'Labor Efficiency (LEV)',
            standardCost: 45000,
            actualCost: 43200,
            variance: 1800,
            status: 'favorable',
            rootCause: 'Dual-robot automated part extraction reduced operator handling hours',
          },
        ]
  );

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const totalVariance = varianceList.reduce((s, v) => s + v.variance, 0);
  const favorableTotal = varianceList
    .filter((v) => v.status === 'favorable')
    .reduce((s, v) => s + v.variance, 0);
  const unfavorableTotal = varianceList
    .filter((v) => v.status === 'unfavorable')
    .reduce((s, v) => s + Math.abs(v.variance), 0);

  const filteredVariances = varianceList.filter((v) => {
    const matchesCat = filterCategory === 'all' || v.category.toLowerCase().includes(filterCategory.toLowerCase());
    const matchesSearch =
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.woId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.rootCause.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handlePostVarianceSettlement = () => {
    if (onCreateJE) {
      const jeId = `JE-${new Date().getFullYear()}-VAR-${Date.now().toString().slice(-4)}`;
      onCreateJE({
        id: jeId,
        date: new Date().toISOString().slice(0, 10),
        ref: 'WO-VAR-CLOSE-AUG',
        memo: `Manufacturing Production Variance Settlement - August 2026`,
        currency: 'INR',
        status: 'posted',
        createdBy: 'Cost Controller',
        approvedBy: 'Priya Rao (CFO)',
        lines: [
          { account: '5110', desc: 'Material Price Variance (MPV)', debit: 0, credit: 3500, cc: 'CC-PROD-01', tax: '' },
          { account: '5120', desc: 'Material Usage Variance (MQV)', debit: 6600, credit: 0, cc: 'CC-PROD-01', tax: '' },
          { account: '5220', desc: 'Labor Efficiency Variance (LEV)', debit: 0, credit: 1800, cc: 'CC-PROD-01', tax: '' },
          { account: '5310', desc: 'Overhead Efficiency Variance', debit: 11200, credit: 0, cc: 'CC-PROD-01', tax: '' },
          { account: '1330', desc: 'WIP Inventory Adjustment Clearing', debit: 0, credit: 12500, cc: '', tax: '' },
        ],
      });
      showToast(`Variance settlement voucher ${jeId} posted to General Ledger!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Finance &middot; Cost Controlling &amp; Manufacturing Variances
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Production Variance Analysis
          </h1>
          <p className="text-xs text-[#6B7280]">
            Standard cost vs actual execution variance decomposition: material usage, price, labor rate, and machine overhead.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePostVarianceSettlement}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C] flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Post Variance Settlement to GL
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Net Production Variance</div>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              totalVariance >= 0 ? 'text-emerald-600' : 'text-[#E8622C]'
            }`}
          >
            {totalVariance >= 0 ? '+' : '-'}₹{Math.abs(totalVariance).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-[#6B7280]">
            {totalVariance >= 0 ? 'Net Favorable to COGS' : 'Net Unfavorable (Cost overrun)'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Favorable Savings</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            ₹{favorableTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-700">Resin volume discounts &amp; automation speed</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Unfavorable Variances</div>
          <div className="text-2xl font-bold text-[#E8622C] font-mono mt-1">
            ₹{unfavorableTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-[#E8622C]">Purge scrap &amp; cooling channel cycle delays</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {['all', 'material', 'labor', 'overhead'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                filterCategory === cat
                  ? 'bg-[#14213D] text-white'
                  : 'text-[#6B7280] hover:bg-[#F6F4EF]'
              }`}
            >
              {cat === 'all' ? 'All Variances' : `${cat} Variances`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search WO, item, or root cause..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Variances Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Variance ID</th>
                <th className="py-2.5 px-3">Work Order</th>
                <th className="py-2.5 px-3">Product Item</th>
                <th className="py-2.5 px-3">Variance Category</th>
                <th className="py-2.5 px-3 text-right">Standard (₹)</th>
                <th className="py-2.5 px-3 text-right">Actual (₹)</th>
                <th className="py-2.5 px-3 text-right">Variance Amount (₹)</th>
                <th className="py-2.5 px-3 text-center">Impact</th>
                <th className="py-2.5 px-3">Engineering Root Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {filteredVariances.map((v) => (
                <tr key={v.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{v.id}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#14213D]">{v.woId}</td>
                  <td className="py-2.5 px-3 font-mono text-[#14213D]">{v.item}</td>
                  <td className="py-2.5 px-3 font-medium text-[#14213D]">{v.category}</td>
                  <td className="py-2.5 px-3 font-mono text-right text-[#6B7280]">
                    ₹{v.standardCost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right text-[#14213D]">
                    ₹{v.actualCost.toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-2.5 px-3 font-mono font-bold text-right ${
                      v.status === 'favorable' ? 'text-emerald-600' : 'text-[#E8622C]'
                    }`}
                  >
                    {v.variance > 0 ? '+' : ''}₹{v.variance.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        v.status === 'favorable'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-orange-50 text-[#E8622C] border border-orange-200'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#6B7280] max-w-xs">{v.rootCause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
