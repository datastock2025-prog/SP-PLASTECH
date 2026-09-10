import React, { useState } from 'react';
import {
  RotateCw,
  Plus,
  CheckCircle2,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { RegrindScrapRun } from '../../types/warehouse';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';

interface Props {
  runs: RegrindScrapRun[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  onCreateRun?: (run: RegrindScrapRun) => void;
}

export const RegrindScrapClosedLoopView: React.FC<Props> = ({
  runs,
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
  onCreateRun,
}) => {
  const [runList, setRunList] = useState<RegrindScrapRun[]>(runs);

  const totalProcessedKg = runList.reduce((a, b) => a + b.outputRegrindWeightKg, 0);
  const avgYieldPct = (runList.reduce((a, b) => a + b.yieldPct, 0) / (runList.length || 1)).toFixed(1);
  const totalSavingsInr = totalProcessedKg * 38; // ₹38/kg savings vs virgin resin

  const openLogRunDrawer = () => {
    let granulator = 'GRN-01 (Rapid Soundproof Granulator 15 HP)';
    let polymer = 'Polypropylene (PP Natural Sprues)';
    let inputKg = 1000;
    let outputKg = 980;
    let targetSilo = 'REGRIND-SILO-01';
    let operator = 'Mahesh B (Shift A)';

    openDrawer(
      'Log Granulator Regrind Batch Run',
      <div className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Granulator Station</label>
          <select
            defaultValue={granulator}
            onChange={(e) => (granulator = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          >
            <option value="GRN-01 (Rapid Soundproof Granulator 15 HP)">GRN-01 (Rapid Soundproof Granulator 15 HP)</option>
            <option value="GRN-02 (Hosokawa Alpine Granulator 25 HP)">GRN-02 (Hosokawa Alpine Granulator 25 HP)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Input Scrap Material Type</label>
          <input
            type="text"
            defaultValue={polymer}
            onChange={(e) => (polymer = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Input Weight (KG)</label>
            <input
              type="number"
              defaultValue={inputKg}
              onChange={(e) => (inputKg = parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Output Flakes (KG)</label>
            <input
              type="number"
              defaultValue={outputKg}
              onChange={(e) => (outputKg = parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-600 focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Target Regrind Silo</label>
            <input
              type="text"
              defaultValue={targetSilo}
              onChange={(e) => (targetSilo = e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Operator</label>
            <input
              type="text"
              defaultValue={operator}
              onChange={(e) => (operator = e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const yieldPct = inputKg > 0 ? parseFloat(((outputKg / inputKg) * 100).toFixed(1)) : 100;
            const newRun: RegrindScrapRun = {
              id: `RG-${Date.now()}`,
              batchNumber: `REGRIND-RUN-0${runList.length + 46}`,
              date: new Date().toISOString().slice(0, 10),
              granulatorId: 'GRN-01',
              granulatorName: granulator,
              shift: 'Shift A',
              operatorName: operator,
              inputPolymerType: polymer,
              sourceMoldRunners: 'Injection Mold Runner Sprues',
              inputWeightKg: inputKg,
              outputRegrindWeightKg: outputKg,
              scrapDustLossKg: Math.max(0, inputKg - outputKg),
              granulatorScreenSizeMm: 4.0,
              yieldPct,
              targetRegrindSilo: targetSilo,
              recommendedBlendRatioMaxPct: 15,
              status: 'completed',
            };
            setRunList((prev) => [newRun, ...prev]);
            if (onCreateRun) onCreateRun(newRun);
            closeDrawer();
            showToast(`Logged Granulator Batch ${newRun.batchNumber} (${outputKg} KG clean flakes)`);
          }}
          className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold"
        >
          Record Granulator Batch
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
              Circular Economy &middot; Closed-Loop Scrap
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Regrind Granulation &amp; Closed-Loop Recycling
          </h1>
          <p className="text-xs text-slate-500">
            Granulator throughput, clean 4mm regrind flake inventory, and max 15% virgin blend ratio compliance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openLogRunDrawer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> + Log Granulator Run
          </button>
        </div>
      </div>

      {/* 3 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500 text-xs flex items-center justify-between">
            <span>Clean Regrind Produced</span>
            <RotateCw className="w-4 h-4 text-[#0F8B8D]" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            {totalProcessedKg.toLocaleString()} KG
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Stored in Silos ready for blending
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500 text-xs flex items-center justify-between">
            <span>Granulator Yield Efficiency</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700">
            {avgYieldPct}%
          </div>
          <div className="text-[10px] text-slate-400">Dust &amp; fine loss &lt; 2.5%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500 text-xs flex items-center justify-between">
            <span>Virgin Polymer Cost Savings</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            ₹{(totalSavingsInr / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[10px] text-teal-600 font-semibold">Closed loop economic recovery</div>
        </div>
      </div>

      {/* Granulator Batch Runs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold font-['Space_Grotesk'] text-base text-[#14213D]">
            Granulator Batch Run Log
          </h3>
          <span className="text-xs text-slate-500 font-mono">Max Blend Allowance: 15% Virgin Proportional</span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Batch Number</th>
                <th className="py-2.5 px-3">Granulator Station</th>
                <th className="py-2.5 px-3">Material Source</th>
                <th className="py-2.5 px-3 text-right">Input Weight</th>
                <th className="py-2.5 px-3 text-right">Output Regrind</th>
                <th className="py-2.5 px-3 text-right">Yield %</th>
                <th className="py-2.5 px-3">Target Silo</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runList.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{run.batchNumber}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-[#14213D]">{run.granulatorName}</div>
                    <div className="text-[10px] text-slate-500">{run.operatorName} &bull; {run.shift}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-800 font-medium">{run.inputPolymerType}</div>
                    <div className="text-[10px] text-slate-400">{run.sourceMoldRunners}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold">{run.inputWeightKg.toLocaleString()} KG</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                    {run.outputRegrindWeightKg.toLocaleString()} KG
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{run.yieldPct}%</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{run.targetRegrindSilo}</td>
                  <td className="py-2.5 px-3 text-center">
                    <WarehouseStatusBadge status={run.status} size="xs" />
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
