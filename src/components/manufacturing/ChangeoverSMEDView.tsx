import React, { useState } from 'react';
import { MachineMaster, WorkOrder } from '../../types';
import {
  Timer,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Flame
} from 'lucide-react';

interface SMEDProps {
  machines: MachineMaster[];
  workOrders: WorkOrder[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ChangeoverSMEDView: React.FC<SMEDProps> = ({
  machines,
  workOrders,
  onNavigate,
  showToast,
}) => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(2);

  const smedSteps = [
    { name: '1. Material Purging & Barrel Cleaning (Dyna-Purge compound)', targetMin: 10, actualMin: 8, status: 'completed', type: 'Internal' },
    { name: '2. Unclamp Previous Mold & Disconnect Water Lines', targetMin: 12, actualMin: 11, status: 'completed', type: 'Internal' },
    { name: '3. Crane Hoist & Rigging of New Mold (MLD-1007)', targetMin: 15, actualMin: 14, status: 'in_progress', type: 'Internal' },
    { name: '4. Quick Clamp Locking & Core Pull Hookup', targetMin: 8, actualMin: 0, status: 'pending', type: 'Internal' },
    { name: '5. Heat Barrel to 215°C Setpoint (Pre-heated externally)', targetMin: 5, actualMin: 0, status: 'pending', type: 'External' },
    { name: '6. First Article Sample Shots & Quality Approval', targetMin: 10, actualMin: 0, status: 'pending', type: 'Internal' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
              Single-Minute Exchange of Die (SMED)
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Standardized Tooling Changeover &bull; Target Duration &lt; 35 Min
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">SMED Tooling &amp; Color Changeover</h1>
        </div>

        <button
          onClick={() => showToast('Changeover step timer started for Step 3')}
          className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Play className="w-4 h-4" />
          Start Active SMED Step Timer
        </button>
      </div>

      {/* Main SMED Checklist & Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Changeover Workflow &mdash; Bay IMM-250T-03</h3>
              <div className="text-xs text-[#6B7280]">
                From: <b>Container 500ml (Natural)</b> &rarr; To: <b>Bucket 10L (Black)</b>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
              Step 3 of 6 Active
            </span>
          </div>

          <div className="space-y-3">
            {smedSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  step.status === 'in_progress'
                    ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20'
                    : step.status === 'completed'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-[#F6F4EF] border-[#E4E0D6]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-[#14213D]">{step.name}</div>
                  <div className="text-[11px] text-[#6B7280]">
                    Classification: <b>{step.type}</b> &bull; Target Time: <b>{step.targetMin} min</b>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {step.status === 'completed' && (
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {step.actualMin} min
                    </span>
                  )}
                  {step.status === 'in_progress' && (
                    <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white font-bold text-[10px] animate-pulse">
                      Timing: 14m 20s
                    </span>
                  )}
                  {step.status === 'pending' && (
                    <span className="text-[#9CA3AF] font-semibold">Queued</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SMED Performance Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-[#14213D]">SMED Setup Analytics</h3>
          <div className="space-y-3">
            <div className="p-3 bg-[#F6F4EF] rounded-xl space-y-1">
              <div className="text-[#6B7280]">Historical Benchmark</div>
              <div className="text-xl font-bold text-[#14213D]">58 Minutes (Old Baseline)</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl space-y-1 text-purple-950">
              <div className="text-purple-700">Current SMED Target</div>
              <div className="text-xl font-bold text-purple-900">32 Minutes (-44% Time Saved)</div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E4E0D6] text-[11px] text-[#6B7280] space-y-1.5">
            <div className="font-bold text-[#14213D]">SMED Golden Rules Applied:</div>
            <div>&bull; Pre-heat molds with external manifold before line stops.</div>
            <div>&bull; Staged pre-weighed masterbatch and crane chains in bay prior to teardown.</div>
            <div>&bull; Standardized magnetic quick clamps installed on Line 3.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
