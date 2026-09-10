import React, { useState } from 'react';
import {
  BarChart3,
  Plus,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Settings,
  RefreshCw,
  Info,
  Layers,
  Sliders,
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

interface SpcSubgroup {
  id: number;
  time: string;
  samples: number[];
  xBar: number;
  range: number;
  inControl: boolean;
}

const INITIAL_SUBGROUPS: SpcSubgroup[] = [
  { id: 1, time: '08:00', samples: [1.248, 1.250, 1.252, 1.249, 1.251], xBar: 1.250, range: 0.004, inControl: true },
  { id: 2, time: '08:30', samples: [1.251, 1.253, 1.249, 1.252, 1.250], xBar: 1.251, range: 0.004, inControl: true },
  { id: 3, time: '09:00', samples: [1.253, 1.255, 1.252, 1.254, 1.251], xBar: 1.253, range: 0.004, inControl: true },
  { id: 4, time: '09:30', samples: [1.249, 1.250, 1.248, 1.252, 1.251], xBar: 1.250, range: 0.004, inControl: true },
  { id: 5, time: '10:00', samples: [1.255, 1.256, 1.254, 1.252, 1.253], xBar: 1.254, range: 0.004, inControl: true },
  { id: 6, time: '10:30', samples: [1.252, 1.251, 1.253, 1.250, 1.254], xBar: 1.252, range: 0.004, inControl: true },
  { id: 7, time: '11:00', samples: [1.250, 1.249, 1.252, 1.251, 1.253], xBar: 1.251, range: 0.004, inControl: true },
  { id: 8, time: '11:30', samples: [1.254, 1.255, 1.253, 1.252, 1.256], xBar: 1.254, range: 0.004, inControl: true },
  { id: 9, time: '12:00', samples: [1.251, 1.250, 1.252, 1.249, 1.253], xBar: 1.251, range: 0.004, inControl: true },
  { id: 10, time: '12:30', samples: [1.253, 1.254, 1.252, 1.255, 1.251], xBar: 1.253, range: 0.004, inControl: true },
  { id: 11, time: '13:00', samples: [1.248, 1.249, 1.251, 1.250, 1.247], xBar: 1.249, range: 0.004, inControl: true },
  { id: 12, time: '13:30', samples: [1.252, 1.253, 1.251, 1.254, 1.250], xBar: 1.252, range: 0.004, inControl: true },
  { id: 13, time: '14:00', samples: [1.255, 1.254, 1.256, 1.253, 1.257], xBar: 1.255, range: 0.004, inControl: true },
  { id: 14, time: '14:30', samples: [1.250, 1.252, 1.249, 1.251, 1.253], xBar: 1.251, range: 0.004, inControl: true },
  { id: 15, time: '15:00', samples: [1.252, 1.253, 1.251, 1.250, 1.254], xBar: 1.252, range: 0.004, inControl: true },
];

export const SpcMonitorView: React.FC<Props> = ({
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [subgroups, setSubgroups] = useState<SpcSubgroup[]>(INITIAL_SUBGROUPS);
  const [selectedChar, setSelectedChar] = useState<'wall' | 'weight' | 'od' | 'cycle'>('wall');
  const [selectedMachine, setSelectedMachine] = useState<string>('IMM-250T-03');

  // Characteristic Configuration
  const charConfig = {
    wall: {
      name: 'Base Wall Thickness',
      unit: 'mm',
      nominal: 1.25,
      usl: 1.30,
      lsl: 1.20,
      ucl: 1.265,
      lcl: 1.235,
      targetCpk: 1.33,
    },
    weight: {
      name: 'Single Shot Part Weight',
      unit: 'g',
      nominal: 25.0,
      usl: 25.5,
      lsl: 24.5,
      ucl: 25.35,
      lcl: 24.65,
      targetCpk: 1.33,
    },
    od: {
      name: 'Neck Outer Diameter (OD)',
      unit: 'mm',
      nominal: 50.0,
      usl: 50.2,
      lsl: 49.8,
      ucl: 50.12,
      lcl: 49.88,
      targetCpk: 1.33,
    },
    cycle: {
      name: 'Total Cycle Time',
      unit: 'sec',
      nominal: 12.0,
      usl: 12.8,
      lsl: 11.2,
      ucl: 12.35,
      lcl: 11.65,
      targetCpk: 1.33,
    },
  }[selectedChar];

  // Calculate SPC statistics
  const grandMean = subgroups.reduce((s, g) => s + g.xBar, 0) / (subgroups.length || 1);
  const avgRange = subgroups.reduce((s, g) => s + g.range, 0) / (subgroups.length || 1);
  const estSigma = avgRange / 2.326; // d2 factor for n=5
  const cp = (charConfig.usl - charConfig.lsl) / (6 * estSigma);
  const cpkUpper = (charConfig.usl - grandMean) / (3 * estSigma);
  const cpkLower = (grandMean - charConfig.lsl) / (3 * estSigma);
  const cpk = Math.min(cpkUpper, cpkLower);

  const handleOpenRecordSubgroup = () => {
    let s1 = charConfig.nominal.toString();
    let s2 = (charConfig.nominal + 0.002).toString();
    let s3 = (charConfig.nominal - 0.001).toString();
    let s4 = (charConfig.nominal + 0.001).toString();
    let s5 = charConfig.nominal.toString();

    openDrawer(
      `Record 5-Sample Subgroup — ${charConfig.name}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
          <div className="font-bold text-[#14213D]">Machine: {selectedMachine} &middot; Tool: Mold M-1001</div>
          <div className="text-[11px] text-[#6B7280]">
            Specification: {charConfig.nominal} {charConfig.unit} &plusmn; {(charConfig.usl - charConfig.nominal).toFixed(3)}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block font-bold text-[#14213D]">Cavity 1 to 5 Readings ({charConfig.unit}):</label>
          <div className="grid grid-cols-5 gap-2">
            <div>
              <label className="text-[10px] text-[#6B7280] block mb-0.5">Cavity 1</label>
              <input
                type="number"
                step="0.001"
                className="w-full px-2 py-1.5 border border-[#E4E0D6] rounded font-mono font-bold"
                defaultValue={s1}
                onChange={(e) => (s1 = e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280] block mb-0.5">Cavity 2</label>
              <input
                type="number"
                step="0.001"
                className="w-full px-2 py-1.5 border border-[#E4E0D6] rounded font-mono font-bold"
                defaultValue={s2}
                onChange={(e) => (s2 = e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280] block mb-0.5">Cavity 3</label>
              <input
                type="number"
                step="0.001"
                className="w-full px-2 py-1.5 border border-[#E4E0D6] rounded font-mono font-bold"
                defaultValue={s3}
                onChange={(e) => (s3 = e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280] block mb-0.5">Cavity 4</label>
              <input
                type="number"
                step="0.001"
                className="w-full px-2 py-1.5 border border-[#E4E0D6] rounded font-mono font-bold"
                defaultValue={s4}
                onChange={(e) => (s4 = e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280] block mb-0.5">Cavity 5</label>
              <input
                type="number"
                step="0.001"
                className="w-full px-2 py-1.5 border border-[#E4E0D6] rounded font-mono font-bold"
                defaultValue={s5}
                onChange={(e) => (s5 = e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 text-teal-800 text-[11px]">
          Digital caliper data logged via RS-232 direct serial gauge interface.
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-1.5 text-xs font-semibold border border-[#E4E0D6] rounded text-[#6B7280] hover:bg-[#F6F4EF]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const raw = [parseFloat(s1), parseFloat(s2), parseFloat(s3), parseFloat(s4), parseFloat(s5)];
            const mean = raw.reduce((a, b) => a + b, 0) / raw.length;
            const r = Math.max(...raw) - Math.min(...raw);
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const newGroup: SpcSubgroup = {
              id: subgroups.length + 1,
              time: timeStr,
              samples: raw,
              xBar: parseFloat(mean.toFixed(3)),
              range: parseFloat(r.toFixed(3)),
              inControl: mean <= charConfig.ucl && mean >= charConfig.lcl,
            };

            setSubgroups((prev) => [...prev, newGroup]);
            closeDrawer();
            showToast(`Logged subgroup #${newGroup.id} (X̄ = ${newGroup.xBar} ${charConfig.unit}). SPC recalculated.`);
          }}
          className="px-4 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded hover:bg-[#1f3158]"
        >
          Compute &amp; Plot Sample
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Quality &middot; Statistical Process Control (SPC)
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            In-Process SPC Control Charts
          </h1>
          <p className="text-xs text-[#6B7280]">
            Real-time X-bar and Range (R) control charts with automated Nelson Rules and Cpk capability analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenRecordSubgroup}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> + Record Subgroup Sample
          </button>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#6B7280]">Parameter:</span>
            <select
              value={selectedChar}
              onChange={(e) => setSelectedChar(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg text-[#14213D]"
            >
              <option value="wall">Base Wall Thickness (mm)</option>
              <option value="weight">Part Weight (g)</option>
              <option value="od">Outer Diameter (mm)</option>
              <option value="cycle">Injection Cycle Time (sec)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#6B7280]">Work Center:</span>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg text-[#14213D]"
            >
              <option value="IMM-250T-03">IMM-250T-03 (Line 3 — WO-1188)</option>
              <option value="IMM-450T-01">IMM-450T-01 (Line 1 — WO-1190)</option>
              <option value="EXT-LINE-02">EXT-LINE-02 (Line 2 — WO-1189)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Nelson Rules: In Control
          </span>
        </div>
      </div>

      {/* SPC Capability Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Process Mean (X̄)</div>
          <div className="text-xl font-bold text-[#14213D] font-mono mt-1">
            {grandMean.toFixed(3)} <span className="text-xs font-normal text-[#6B7280]">{charConfig.unit}</span>
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Target: {charConfig.nominal}</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Process Capability (Cpk)</div>
          <div className="text-xl font-bold text-[#0F8B8D] font-mono mt-1">
            {cpk.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            {cpk >= 1.33 ? 'Capability &ge; 1.33 Pass' : 'Low Capability Warning'}
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Potential (Cp)</div>
          <div className="text-xl font-bold text-[#14213D] font-mono mt-1">{cp.toFixed(2)}</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Process spread capability</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Upper Control (UCL)</div>
          <div className="text-xl font-bold text-[#14213D] font-mono mt-1">
            {charConfig.ucl.toFixed(3)} <span className="text-xs font-normal text-[#6B7280]">{charConfig.unit}</span>
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">+3&sigma; statistical limit</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">Lower Control (LCL)</div>
          <div className="text-xl font-bold text-[#14213D] font-mono mt-1">
            {charConfig.lcl.toFixed(3)} <span className="text-xs font-normal text-[#6B7280]">{charConfig.unit}</span>
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">-3&sigma; statistical limit</div>
        </div>
      </div>

      {/* Main SPC Run Chart Panel */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk'] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0F8B8D]" />
              X-Bar Subgroup Run Chart ({charConfig.name})
            </h2>
            <p className="text-[11px] text-[#6B7280]">
              Subgroup size n=5 cavity measurements per 30-minute sampling interval.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-500 rounded" /> UCL: {charConfig.ucl}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#0F8B8D] rounded" /> CL: {charConfig.nominal}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-500 rounded" /> LCL: {charConfig.lcl}
            </span>
          </div>
        </div>

        {/* Visual Bar / Point Chart */}
        <div className="h-56 relative flex items-end justify-between gap-2 pt-6 px-4 bg-[#F6F4EF]/50 rounded-xl border border-[#E4E0D6]">
          {/* Reference Line UCL */}
          <div className="absolute top-10 left-0 right-0 border-b border-dashed border-rose-400 z-0 pointer-events-none">
            <span className="absolute -top-4 right-2 text-[9px] font-mono text-rose-600 font-bold">
              UCL {charConfig.ucl}
            </span>
          </div>

          {/* Centerline */}
          <div className="absolute top-28 left-0 right-0 border-b border-teal-500 z-0 pointer-events-none">
            <span className="absolute -top-4 right-2 text-[9px] font-mono text-teal-700 font-bold">
              CL {charConfig.nominal}
            </span>
          </div>

          {/* Reference Line LCL */}
          <div className="absolute bottom-12 left-0 right-0 border-b border-dashed border-rose-400 z-0 pointer-events-none">
            <span className="absolute -top-4 right-2 text-[9px] font-mono text-rose-600 font-bold">
              LCL {charConfig.lcl}
            </span>
          </div>

          {/* Subgroups Plot */}
          {subgroups.map((group, idx) => {
            const minScale = charConfig.lcl - 0.01;
            const maxScale = charConfig.ucl + 0.01;
            const pct = Math.max(10, Math.min(90, ((group.xBar - minScale) / (maxScale - minScale)) * 100));

            return (
              <div key={group.id} className="flex-1 flex flex-col items-center gap-1 group relative z-10">
                <div
                  className="w-full max-w-[28px] bg-[#0F8B8D] rounded-t-sm group-hover:bg-[#E8622C] transition-all"
                  style={{ height: `${pct}%` }}
                />
                <span className="text-[10px] text-[#6B7280] font-mono font-semibold">#{group.id}</span>

                {/* Tooltip */}
                <div className="absolute -top-12 hidden group-hover:block bg-[#14213D] text-white text-[10px] p-1.5 rounded-lg shadow-xl font-mono z-30 whitespace-nowrap">
                  <div className="font-bold text-[#0F8B8D]">Subgroup #{group.id} ({group.time})</div>
                  <div>Mean: {group.xBar.toFixed(3)} {charConfig.unit}</div>
                  <div>Range: {group.range.toFixed(3)} {charConfig.unit}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subgroups Log Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E4E0D6] bg-[#F6F4EF]/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
            Recent Subgroup Inspection Runs
          </h3>
          <span className="text-xs text-[#6B7280] font-mono">
            {subgroups.length} logged intervals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Subgroup #</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3 text-center">Raw Samples (Cavity 1-5)</th>
                <th className="py-2.5 px-3 text-right">Subgroup Mean (X̄)</th>
                <th className="py-2.5 px-3 text-right">Range (R)</th>
                <th className="py-2.5 px-3 text-center">Nelson Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {subgroups.slice(-8).reverse().map((g) => (
                <tr key={g.id} className="hover:bg-[#F6F4EF]/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">#{g.id}</td>
                  <td className="py-2.5 px-3 font-mono text-[#6B7280]">{g.time}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#14213D]">
                    [{g.samples.join(', ')}]
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">
                    {g.xBar.toFixed(3)} {charConfig.unit}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right text-[#E8622C]">
                    {g.range.toFixed(3)} {charConfig.unit}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                      In Control
                    </span>
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
