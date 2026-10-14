import React, { useState } from 'react';
import { MoldMaster } from '../../data/manufacturingData';
import { MachineMaster } from '../../types';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  Calendar,
  Activity
} from 'lucide-react';

interface MoldProps {
  molds: MoldMaster[];
  machines: MachineMaster[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const MoldToolingManager: React.FC<MoldProps> = ({
  molds,
  machines,
  onNavigate,
  showToast,
}) => {
  const [selectedMoldId, setSelectedMoldId] = useState<string>(molds[0]?.id || 'MLD-1001');

  const currentMold = molds.find((m) => m.id === selectedMoldId) || molds[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
              Toolroom &amp; Asset Management
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Shot Counter Telemetry &bull; Preventive PM Alerts &bull; Cavity Defect Map
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Mold &amp; Tooling Management</h1>
        </div>

        <button
          onClick={() => showToast('New Mold Creation Drawer Opened')}
          className="px-4 py-2.5 rounded-xl bg-[#0F8B8D] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#0c7072] transition-colors"
        >
          <Plus className="w-4 h-4" />
          + Register New Mold
        </button>
      </div>

      {/* Grid of Molds */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {molds.map((mold) => {
          const shotPct = Math.round((mold.currentShots / mold.expectedLifeShots) * 100);
          const isPmDue = mold.currentShots >= mold.pmIntervalShots;

          return (
            <div
              key={mold.id}
              onClick={() => setSelectedMoldId(mold.id)}
              className={`bg-white rounded-2xl border p-4 shadow-xs hover:border-[#0F8B8D] transition-all cursor-pointer ${
                selectedMoldId === mold.id ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/20' : 'border-[#E4E0D6]'
              }`}
            >
              <div className="flex items-start justify-between pb-3 border-b border-[#E4E0D6]">
                <div>
                  <div className="font-mono font-bold text-sm text-[#0F8B8D]">{mold.id}</div>
                  <div className="font-bold text-xs text-[#14213D]">{mold.name}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  mold.status === 'in_production' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {mold.status.replace('_', ' ')}
                </span>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Cavity Layout:</span>
                  <span className="font-bold text-[#14213D]">{mold.cavities} Cavities ({mold.runnerType})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Assigned Machine:</span>
                  <span className="font-mono font-semibold text-[#14213D]">{mold.assignedMachine || 'Toolroom Bay'}</span>
                </div>

                {/* Shot Count Progress */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#6B7280]">Shot Utilization:</span>
                    <span className="font-mono font-bold text-[#14213D]">
                      {mold.currentShots.toLocaleString()} / {mold.expectedLifeShots.toLocaleString()} ({shotPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#E4E0D6] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${shotPct > 80 ? 'bg-amber-500' : 'bg-[#0F8B8D]'}`}
                      style={{ width: `${shotPct}%` }}
                    />
                  </div>
                </div>

                {isPmDue && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    PM Polishing Due in {(mold.pmIntervalShots - (mold.currentShots % mold.pmIntervalShots)).toLocaleString()} shots
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Mold Detail & Cavity Defect Map */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#14213D]">
          {currentMold.id} &mdash; Cavity Health &amp; Defect Heatmap ({currentMold.cavities} Cavities)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: currentMold.cavities }).map((_, idx) => {
            const cavityNo = idx + 1;
            const hasDefect = cavityNo === 3 && currentMold.id === 'MLD-1001';

            return (
              <div
                key={cavityNo}
                className={`p-4 rounded-2xl border text-center space-y-1 transition-all ${
                  hasDefect ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-emerald-50/40 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="font-mono font-black text-lg">CAVITY #{cavityNo}</div>
                <div className="text-xs font-semibold">
                  {hasDefect ? 'Active Flash Defect (Flagged)' : '100% Nominal Dimension'}
                </div>
                <div className="text-[10px] text-[#6B7280]">
                  Weight: {hasDefect ? '48.9g (+0.9g)' : '48.0g (±0.2g)'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
