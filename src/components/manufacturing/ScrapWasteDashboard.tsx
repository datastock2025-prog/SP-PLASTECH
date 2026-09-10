import React, { useState } from 'react';
import { WorkOrder, ItemMaster } from '../../types';
import {
  Trash2,
  Recycle,
  AlertTriangle,
  BarChart2,
  TrendingDown,
  Sparkles,
  Plus,
  Layers,
  Scale
} from 'lucide-react';

interface ScrapDashboardProps {
  workOrders: WorkOrder[];
  items: ItemMaster[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScrapWasteDashboard: React.FC<ScrapDashboardProps> = ({
  workOrders,
  items,
  onNavigate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'pareto' | 'regrind' | 'entry'>('pareto');
  const [regrindKg, setRegrindKg] = useState<number>(45);

  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;

  // Scrap Pareto categories data
  const paretoDefects = [
    { defect: 'Short Shots (Underfilled Cavities)', count: 480, pct: 42, color: 'bg-rose-500' },
    { defect: 'Excess Flash / Parting Line Burrs', count: 280, pct: 25, color: 'bg-amber-500' },
    { defect: 'Sink Marks & Thermal Voids', count: 180, pct: 16, color: 'bg-purple-500' },
    { defect: 'Color Streaks / Contamination', count: 110, pct: 10, color: 'bg-blue-500' },
    { defect: 'Burn Marks & Polymer Degradation', count: 80, pct: 7, color: 'bg-slate-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C4433A]/10 text-[#C4433A]">
              Zero-Waste Circular Loop
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Hierarchical Defect Taxonomy &bull; Regrind Recycling Tracking
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Scrap &amp; Waste Management</h1>
        </div>

        <div className="flex bg-[#F6F4EF] p-1 rounded-xl border border-[#E4E0D6] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pareto')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'pareto' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
            }`}
          >
            Scrap Pareto (80/20)
          </button>
          <button
            onClick={() => setActiveTab('regrind')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'regrind' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
            }`}
          >
            Regrind Recycling Loop
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[#6B7280]">Total Scrap Today</div>
          <div className="text-2xl font-bold text-[#C4433A] mt-1">1,130 pcs</div>
          <div className="text-[11px] text-[#6B7280]">1.8% of gross output</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[#6B7280]">Regrind Material Recovered</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">420 KG</div>
          <div className="text-[11px] text-emerald-800">88.5% waste diversion rate</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[#6B7280]">Material Cost of Scrap</div>
          <div className="text-2xl font-bold text-[#14213D] mt-1">$ 384.20</div>
          <div className="text-[11px] text-[#6B7280]">Saved $310 via regrind</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[#6B7280]">Top Root Cause Defect</div>
          <div className="text-xl font-bold text-[#14213D] mt-1">Short Shots (42%)</div>
          <div className="text-[11px] text-[#6B7280]">Bay Line 4 check</div>
        </div>
      </div>

      {/* Tab 1: Scrap Pareto */}
      {activeTab === 'pareto' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#14213D]">Pareto Breakdown by Defect Code</h3>
            <div className="space-y-3">
              {paretoDefects.map((def, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-[#14213D]">
                    <span>{def.defect}</span>
                    <span>{def.count} pcs ({def.pct}%)</span>
                  </div>
                  <div className="w-full bg-[#E4E0D6] h-2.5 rounded-full overflow-hidden">
                    <div className={`${def.color} h-full rounded-full`} style={{ width: `${def.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Granulator Bay Quick Action</h3>
            <p className="text-[#6B7280]">
              Convert runners, sprues, and defective moldings into clean, re-usable regrind granules.
            </p>

            <div className="space-y-2">
              <label className="font-bold text-[#14213D]">Granulator Scale Reading (KG)</label>
              <input
                type="number"
                value={regrindKg}
                onChange={(e) => setRegrindKg(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-mono font-bold text-sm"
              />
            </div>

            <button
              onClick={() => showToast(`Added +${regrindKg} KG to Regrind Lot RG-00322 in Bay GRN-01`)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
            >
              + Log Regrind Batch
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Regrind Closed Loop */}
      {activeTab === 'regrind' && (
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-[#14213D]">Regrind Ratio Limits by Product Recipe</h3>
          <table className="w-full border-collapse">
            <thead className="bg-[#F6F4EF] text-[#6B7280]">
              <tr className="border-b border-[#E4E0D6]">
                <th className="p-2.5 text-left font-bold">Product Item</th>
                <th className="p-2.5 text-center font-bold">Max Allowed Regrind %</th>
                <th className="p-2.5 text-center font-bold">Current Shift Dosage</th>
                <th className="p-2.5 text-center font-bold">Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Household Bucket 10L (FG-HD-TUB-01)', max: '25%', act: '15%', status: 'Within Spec' },
                { name: 'Square Container 500ml (FG-CTN-500)', max: '15%', act: '10%', status: 'Within Spec' },
                { name: 'PET Bottle Preform (FG-PET-030)', max: '0% (Virgin Only - Food Grade)', act: '0%', status: 'Virgin Enforced' }
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-[#E4E0D6]">
                  <td className="p-2.5 font-semibold text-[#14213D]">{row.name}</td>
                  <td className="p-2.5 text-center font-mono font-bold">{row.max}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-700">{row.act}</td>
                  <td className="p-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
