import React, { useState } from 'react';
import {
  TrendingUp,
  Filter,
  Download,
  Upload,
  CheckCircle2,
  Lock,
  Search,
  Plus,
  Sliders,
  BarChart3,
  Users,
  Box,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { mockDemandPlan } from '../../data/mockScmData';
import { DemandPlanItem } from '../../types/scm';

interface ScmDemandPlanningViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmDemandPlanningView: React.FC<ScmDemandPlanningViewProps> = ({ onNavigate, showToast }) => {
  const [plans, setPlans] = useState<DemandPlanItem[]>(mockDemandPlan);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerGroupFilter, setCustomerGroupFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'table' | 'analytics' | 'reconciliation'>('table');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adjustedQty, setAdjustedQty] = useState<number>(0);

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productFamily.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = customerGroupFilter === 'All' || p.customerGroup === customerGroupFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  const totalConsensusDemand = plans.reduce((acc, curr) => acc + curr.consensusDemandQty, 0);
  const avgAccuracy = (plans.reduce((acc, curr) => acc + curr.forecastAccuracyPct, 0) / plans.length).toFixed(1);

  const handleStartEdit = (plan: DemandPlanItem) => {
    setEditingId(plan.id);
    setAdjustedQty(plan.consensusDemandQty);
  };

  const handleSaveEdit = (id: string) => {
    if (adjustedQty < 0) {
      showToast('Error: Consensus demand cannot be negative');
      return;
    }
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const variance = ((adjustedQty - p.orderQty) / p.orderQty) * 100;
          return {
            ...p,
            consensusDemandQty: adjustedQty,
            variancePct: parseFloat(variance.toFixed(1)),
          };
        }
        return p;
      })
    );
    setEditingId(null);
    showToast(`Updated Consensus Demand for ${id} to ${adjustedQty.toLocaleString()} units`);
  };

  const handleApprovePlan = (id: string) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'Approved' } : p)));
    showToast(`Demand Plan ${id} has been Approved`);
  };

  const handleLockPlan = (id: string) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'Locked' } : p)));
    showToast(`Demand Plan ${id} has been Locked for MRP Supply Calculation`);
  };

  const handleConvertToSupply = () => {
    showToast('Converting approved consensus demand plans into production supply scheduling...');
    setTimeout(() => {
      onNavigate('scmMRP');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-semibold uppercase">
              Demand Architecture
            </span>
            <span className="text-xs text-slate-500">· Horizon: 3-12 Months Rolling</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Demand Planning &amp; Consensus Forecasting
          </h1>
          <p className="text-slate-500 text-xs">
            Synthesize OEM customer JIT release schedules, blanket purchase orders, and historical baseline trends into locked supply inputs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleConvertToSupply}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Convert to MRP Supply Plan</span>
          </button>
          <button
            onClick={() => showToast('Exported Demand Plan to Excel (XLSX)')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Consensus Demand Volume</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            {totalConsensusDemand.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Aligned with sales &amp; JIT schedules</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Average Forecast Accuracy (MAPE)</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-[#0F8B8D] mt-1">
            {avgAccuracy}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Historical monthly adherence</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Active Demand Accounts</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            {new Set(plans.map((p) => p.customer)).size} OEM Accounts
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automotive, FMCG, Appliance, Medical</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Plans Pending Lock</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-amber-600 mt-1">
            {plans.filter((p) => p.status !== 'Locked').length} Records
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Ready for review &amp; lock</div>
        </div>
      </div>

      {/* Main Content Area: Table vs Analytics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Navigation Tabs & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-[#14213D] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Consensus Demand Table
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#14213D] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Accuracy &amp; Variance Analytics
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Customer, Part, Resin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>

            <select
              value={customerGroupFilter}
              onChange={(e) => setCustomerGroupFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
            >
              <option value="All">All Customer Groups</option>
              <option value="Automotive Tier-1">Automotive Tier-1</option>
              <option value="FMCG Packaging">FMCG Packaging</option>
              <option value="Appliances & Consumer">Appliances &amp; Consumer</option>
              <option value="Industrial Pharma">Industrial Pharma</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Locked">Locked</option>
            </select>
          </div>
        </div>

        {activeTab === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Customer &amp; Group</th>
                  <th className="p-3">Item Code &amp; Resin</th>
                  <th className="p-3 text-right">Forecast Qty</th>
                  <th className="p-3 text-right">Order Qty</th>
                  <th className="p-3 text-right">Consensus Demand</th>
                  <th className="p-3 text-right">Variance %</th>
                  <th className="p-3 text-right">Accuracy %</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono font-medium text-slate-900">{plan.period}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{plan.customer}</div>
                      <div className="text-[11px] text-slate-500">{plan.customerGroup} · {plan.salesperson}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{plan.itemCode}</div>
                      <div className="text-[11px] text-slate-500">{plan.itemName}</div>
                      <div className="text-[10px] text-[#0F8B8D] font-mono">{plan.resinGrade}</div>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {plan.forecastQty.toLocaleString()} {plan.uom}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {plan.orderQty.toLocaleString()} {plan.uom}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {editingId === plan.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={adjustedQty}
                            onChange={(e) => setAdjustedQty(Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-white border border-[#0F8B8D] rounded text-right font-mono text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveEdit(plan.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="Save"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="font-bold text-slate-900">
                          {plan.consensusDemandQty.toLocaleString()} {plan.uom}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">
                      <span
                        className={`font-bold ${
                          plan.variancePct > 0
                            ? 'text-emerald-600'
                            : plan.variancePct < 0
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {plan.variancePct > 0 ? `+${plan.variancePct}%` : `${plan.variancePct}%`}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">
                      {plan.forecastAccuracyPct}%
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          plan.status === 'Locked'
                            ? 'bg-slate-100 text-slate-800 border border-slate-300'
                            : plan.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {plan.status !== 'Locked' ? (
                        <>
                          <button
                            onClick={() => handleStartEdit(plan)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                          >
                            Adjust
                          </button>
                          {plan.status !== 'Approved' && (
                            <button
                              onClick={() => handleApprovePlan(plan.id)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold transition"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleLockPlan(plan.id)}
                            className="px-2 py-1 bg-[#14213D] hover:bg-[#1C2B4D] text-white rounded text-[11px] font-semibold transition"
                            title="Lock for MRP Run"
                          >
                            <Lock className="w-3 h-3 inline mr-1" />
                            Lock
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">MRP Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Analytics & Accuracy Charts View */
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 font-['Space_Grotesk'] uppercase tracking-wider">
                  Top Customer Demand Accounts
                </h4>
                <div className="space-y-2.5">
                  {plans.map((p) => (
                    <div key={p.id} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-800">{p.customer}</span>
                        <span className="font-mono text-slate-900">{p.consensusDemandQty.toLocaleString()} {p.uom}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-[#0F8B8D] h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (p.consensusDemandQty / 750000) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 font-['Space_Grotesk'] uppercase tracking-wider">
                  Forecast Bias &amp; Accuracy by Product Line
                </h4>
                <div className="space-y-2.5">
                  {plans.map((p) => (
                    <div key={p.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{p.productFamily}</div>
                        <div className="text-[11px] text-slate-500">{p.itemName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-600">{p.forecastAccuracyPct}% Accuracy</div>
                        <div className="text-[10px] text-slate-400">Variance: {p.variancePct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
