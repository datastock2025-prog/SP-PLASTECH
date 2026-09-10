import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  Play,
  Share2,
  FileSpreadsheet,
  Download,
  Calendar,
  Building,
} from 'lucide-react';
import { mockSopScenarios } from '../../data/mockScmData';
import { SOPScenario } from '../../types/scm';

interface ScmSopViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmSopView: React.FC<ScmSopViewProps> = ({ onNavigate, showToast }) => {
  const [scenarios, setScenarios] = useState<SOPScenario[]>(mockSopScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('SCEN-01');
  const [activeSection, setActiveSection] = useState<'overview' | 'capacity' | 'financials' | 'scenarios'>('overview');

  const selectedScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const handleApproveConsensus = (id: string) => {
    setScenarios((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.id === id ? 'Approved Consensus' : s.status === 'Approved Consensus' ? 'Active' : s.status,
      }))
    );
    showToast(`Scenario ${id} set as Executive S&OP Consensus Plan`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono text-xs font-semibold uppercase">
              S&amp;OP Executive Consensus
            </span>
            <span className="text-xs text-slate-500">· Monthly Cross-Functional Alignment</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Sales &amp; Operations Planning (S&amp;OP) Command Center
          </h1>
          <p className="text-slate-500 text-xs">
            Align unconstrained demand forecasts with polymer procurement allocations, injection molding machine capacity, and working capital constraints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Generated S&OP Executive Consensus Deck (PDF)')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Executive Pack</span>
          </button>
          <button
            onClick={() => handleApproveConsensus(selectedScenario.id)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publish Consensus Plan</span>
          </button>
        </div>
      </div>

      {/* S&OP Alignment Scorecard Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Active Plan Revenue</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-600 mt-1">
            {selectedScenario.projectedRevenue}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{selectedScenario.name}</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Polymer Procurement Cost</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-slate-900 mt-1">
            {selectedScenario.procurementCost}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Resin &amp; Additives Bill</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Machine Capacity Utilization</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-[#0F8B8D] mt-1">
            {selectedScenario.capacityUtilizationPct}%
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">18 Tonnage Presses</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Stock Coverage Duration</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-indigo-600 mt-1">
            {selectedScenario.stockCoverageDays} Days
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Optimal buffer: 20-25 days</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Manufacturing Feasibility</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">
            {selectedScenario.mfgFeasibilityPct}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero tool conflicts</div>
        </div>
      </div>

      {/* S&OP Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSection === 'overview' ? 'bg-[#14213D] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          S&amp;OP Executive Dashboard
        </button>
        <button
          onClick={() => setActiveSection('capacity')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSection === 'capacity' ? 'bg-[#14213D] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Molding Capacity &amp; Bottlenecks
        </button>
        <button
          onClick={() => setActiveSection('scenarios')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSection === 'scenarios' ? 'bg-[#14213D] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          What-If Scenario Simulation
        </button>
        <button
          onClick={() => setActiveSection('financials')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            activeSection === 'financials' ? 'bg-[#14213D] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Financial Impact &amp; Carrying Costs
        </button>
      </div>

      {/* Tab Panels */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Demand Summary Panel */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-xs text-slate-900 font-['Space_Grotesk'] uppercase tracking-wider">
                1. Demand Summary
              </h4>
              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">Unconstrained</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Confirmed Orders (SO):</span>
                <span className="font-mono font-bold text-slate-900">42 Orders (₹3.84 Cr)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer JIT Schedules:</span>
                <span className="font-mono font-bold text-slate-900">14,500 PCS / Week</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">New Product Trials (NPI):</span>
                <span className="font-mono font-bold text-indigo-600">3 Molds in Validation</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consensus Demand Vol:</span>
                <span className="font-mono font-bold text-slate-900">860,700 PCS</span>
              </div>
            </div>
          </div>

          {/* Supply Summary Panel */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-xs text-slate-900 font-['Space_Grotesk'] uppercase tracking-wider">
                2. Supply Summary
              </h4>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold">Polymers</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Virgin Resin on Hand:</span>
                <span className="font-mono font-bold text-slate-900">72.5 Metric Tons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Open Inbound POs:</span>
                <span className="font-mono font-bold text-slate-900">65.0 Metric Tons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Closed-Loop Regrind:</span>
                <span className="font-mono font-bold text-emerald-600">4.6 MT Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Import Sea Lead Time:</span>
                <span className="font-mono font-bold text-amber-600">28 Days (Sabic)</span>
              </div>
            </div>
          </div>

          {/* Capacity Panel */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-xs text-slate-900 font-['Space_Grotesk'] uppercase tracking-wider">
                3. Molding Capacity
              </h4>
              <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-bold">18 Presses</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Available Machine Hours:</span>
                <span className="font-mono font-bold text-slate-900">8,640 Hrs / Month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Production:</span>
                <span className="font-mono font-bold text-slate-900">7,300 Hrs (84.5%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Identified Bottlenecks:</span>
                <span className="font-mono font-bold text-rose-600">IMM-04 (650T Press)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Planned Mold PM:</span>
                <span className="font-mono font-bold text-slate-900">32 Hrs Scheduled</span>
              </div>
            </div>
          </div>

          {/* Financial Impact Panel */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-xs text-slate-900 font-['Space_Grotesk'] uppercase tracking-wider">
                4. Financial Impact
              </h4>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold">P&amp;L</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Margin Target:</span>
                <span className="font-mono font-bold text-emerald-700">28.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Carrying Cost Expense:</span>
                <span className="font-mono font-bold text-slate-900">₹34.8 Lakh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Freight Expedite Cost:</span>
                <span className="font-mono font-bold text-amber-600">₹4.2 Lakh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Overtime Budget:</span>
                <span className="font-mono font-bold text-slate-900">₹6.5 Lakh</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios Comparison View */}
      {activeSection === 'scenarios' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk']">
                What-If Scenario Simulation &amp; Comparison Table
              </h3>
              <p className="text-slate-500 text-xs">Compare financial and operational trade-offs across 5 simulation models.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Scenario Model</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Projected Revenue</th>
                  <th className="p-3 text-right">Procurement Cost</th>
                  <th className="p-3 text-right">Carrying Cost</th>
                  <th className="p-3 text-right">Expedite Cost</th>
                  <th className="p-3 text-right">Stockout Risk Cost</th>
                  <th className="p-3 text-right">Capacity Util %</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {scenarios.map((scen) => (
                  <tr
                    key={scen.id}
                    className={`hover:bg-slate-50 transition ${
                      scen.status === 'Approved Consensus' ? 'bg-emerald-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{scen.name}</div>
                      <div className="text-[10px] text-slate-400">{scen.id}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                        {scen.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{scen.projectedRevenue}</td>
                    <td className="p-3 text-right font-mono text-slate-900">{scen.procurementCost}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{scen.inventoryCarryingCost}</td>
                    <td className="p-3 text-right font-mono text-amber-700">{scen.expediteCost}</td>
                    <td className="p-3 text-right font-mono text-rose-700">{scen.stockoutRiskCost}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">{scen.capacityUtilizationPct}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          scen.status === 'Approved Consensus'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {scen.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {scen.status !== 'Approved Consensus' && (
                        <button
                          onClick={() => handleApproveConsensus(scen.id)}
                          className="px-2.5 py-1 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded text-[11px] font-bold transition cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Machine Capacity & Bottlenecks View */}
      {(activeSection === 'capacity' || activeSection === 'financials') && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk']">
            {activeSection === 'capacity' ? 'Molding Machine Capacity & Bottlenecks' : 'Working Capital & Carrying Cost Dynamics'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800">IMM-04 (650 Ton Haitian Press)</div>
              <p className="text-slate-500 text-[11px]">Primary machine for OEM Front Bumper shell molding.</p>
              <div className="font-mono text-xs font-bold text-rose-600">Capacity Util: 94.8% (Bottleneck Risk)</div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '94.8%' }} />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800">IMM-08 (350 Ton Toshiba Electric)</div>
              <p className="text-slate-500 text-[11px]">Cleanroom 32-cavity Flip Top Cap mold runner.</p>
              <div className="font-mono text-xs font-bold text-emerald-600">Capacity Util: 81.2% (Optimal)</div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '81.2%' }} />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800">IMM-12 (200 Ton Engel Tie-bar-less)</div>
              <p className="text-slate-500 text-[11px]">Medical cartridge base &amp; POM appliance flanges.</p>
              <div className="font-mono text-xs font-bold text-blue-600">Capacity Util: 76.5% (Spare Capacity)</div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '76.5%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
