import React, { useState } from 'react';
import { CostCenter, Account } from '../../types';
import {
  Building,
  Plus,
  Sliders,
  DollarSign,
  TrendingUp,
  Percent,
  Play,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  costCenters: CostCenter[];
  accounts?: Account[];
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const CostCentersView: React.FC<Props> = ({
  costCenters: initialCostCenters,
  accounts = [],
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>(initialCostCenters);
  const [searchTerm, setSearchTerm] = useState('');

  const totalBudget = costCenters.reduce((s, c) => s + c.budget, 0);
  const totalActual = costCenters.reduce((s, c) => s + c.actual, 0);
  const totalVariance = totalBudget - totalActual;

  const handleOpenNewCostCenter = () => {
    let code = '';
    let name = '';
    let manager = '';
    let allocBase: CostCenter['allocBase'] = 'Machine Hours';
    let budget = 500000;
    let rate = 450;

    openDrawer(
      'Create New Production Cost Center',
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Cost Center Code *</label>
            <input
              type="text"
              placeholder="e.g. CC-BLOW-01"
              className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono"
              onChange={(e) => {
                code = e.target.value;
              }}
            />
          </div>
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Cost Center Name *</label>
            <input
              type="text"
              placeholder="e.g. Blow Molding Cell 2"
              className="w-full p-2 border border-[#E4E0D6] rounded-lg"
              onChange={(e) => {
                name = e.target.value;
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Department Head / Manager</label>
            <input
              type="text"
              placeholder="e.g. Rajesh Sharma"
              className="w-full p-2 border border-[#E4E0D6] rounded-lg"
              onChange={(e) => {
                manager = e.target.value;
              }}
            />
          </div>
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Absorption Base *</label>
            <select
              defaultValue={allocBase}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-white"
              onChange={(e) => {
                allocBase = e.target.value as any;
              }}
            >
              <option value="Machine Hours">Machine Hours</option>
              <option value="Labor Hours">Labor Hours</option>
              <option value="Material Cost">Material Cost</option>
              <option value="Headcount">Headcount</option>
              <option value="Square Footage">Square Footage</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Monthly Budget (₹) *</label>
            <input
              type="number"
              defaultValue={budget}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono"
              onChange={(e) => {
                budget = parseFloat(e.target.value) || 0;
              }}
            />
          </div>
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Planned Rate / Unit (₹) *</label>
            <input
              type="number"
              defaultValue={rate}
              className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono"
              onChange={(e) => {
                rate = parseFloat(e.target.value) || 0;
              }}
            />
          </div>
        </div>
      </div>,
      <div className="flex justify-end gap-2">
        <button className="px-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg" onClick={closeDrawer}>
          Cancel
        </button>
        <button
          className="px-4 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C]"
          onClick={() => {
            if (!code || !name) {
              showToast('Please enter both Cost Center Code and Name');
              return;
            }
            const newCC: CostCenter = {
              code,
              name,
              type: 'Production',
              department: 'Manufacturing',
              manager: manager || 'Plant Supervisor',
              allocBase,
              budget,
              actual: 0,
            };
            setCostCenters((prev) => [...prev, newCC]);
            closeDrawer();
            showToast(`Cost Center ${code} (${name}) created!`);
          }}
        >
          Save Cost Center
        </button>
      </div>
    );
  };

  const handleRunOverheadAbsorption = () => {
    showToast('Recalculating monthly machine-hour absorption and overhead distribution...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Finance &middot; Cost Accounting &amp; Controlling
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Cost Centers &amp; Overhead Absorption
          </h1>
          <p className="text-xs text-[#6B7280]">
            Manufacturing department budget controlling, machine hour absorption rates, and unabsorbed variance analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunOverheadAbsorption}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF] flex items-center gap-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-[#0F8B8D]" /> Run Overhead Allocation
          </button>
          <button
            onClick={handleOpenNewCostCenter}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> + New Cost Center
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Total Overhead Budget</div>
          <div className="text-2xl font-bold text-[#14213D] font-mono mt-1">
            ₹{(totalBudget / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-[#6B7280]">{costCenters.length} active cost centers</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Actual Absorbed Overheads</div>
          <div className="text-2xl font-bold text-[#0F8B8D] font-mono mt-1">
            ₹{(totalActual / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-emerald-700">
            {((totalActual / totalBudget) * 100).toFixed(1)}% overall budget absorption
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Absorption Variance</div>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              totalVariance >= 0 ? 'text-emerald-600' : 'text-[#E8622C]'
            }`}
          >
            {totalVariance >= 0 ? '+' : ''}₹{(totalVariance / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-[#6B7280]">
            {totalVariance >= 0 ? 'Under-budget (Favorable)' : 'Over-budget (Unfavorable)'}
          </div>
        </div>
      </div>

      {/* Cost Centers Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">CC Code</th>
                <th className="py-2.5 px-3">Cost Center Name</th>
                <th className="py-2.5 px-3">Department Head</th>
                <th className="py-2.5 px-3">Allocation Base</th>
                <th className="py-2.5 px-3 text-right">Standard Rate / Unit</th>
                <th className="py-2.5 px-3 text-right">Monthly Budget (₹)</th>
                <th className="py-2.5 px-3 text-right">Actual Absorbed (₹)</th>
                <th className="py-2.5 px-3 text-center">Absorption %</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {costCenters.map((cc) => {
                const utilPct = Math.round((cc.actual / cc.budget) * 100);
                const isOver = cc.actual > cc.budget;
                return (
                  <tr key={cc.code} className="hover:bg-[#F6F4EF]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{cc.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#14213D]">{cc.name}</td>
                    <td className="py-2.5 px-3 text-[#6B7280]">{cc.manager}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-[#F6F4EF] text-[#14213D] rounded font-mono text-[10px]">
                        {cc.allocBase}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-[#14213D]">
                      ₹{cc.rate.toFixed(2)} / {cc.allocBase === 'Machine Hours' ? 'hr' : 'unit'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-[#6B7280]">
                      ₹{cc.budget.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">
                      ₹{cc.actual.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-24 mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className={isOver ? 'text-[#E8622C] font-bold' : 'text-[#0F8B8D]'}>
                            {utilPct}%
                          </span>
                        </div>
                        <div className="w-full bg-[#E4E0D6] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isOver ? 'bg-[#E8622C]' : 'bg-[#0F8B8D]'}`}
                            style={{ width: `${Math.min(utilPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isOver ? 'bg-orange-50 text-[#E8622C]' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOver ? 'Over Absorbed' : 'Under Budget'}
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
