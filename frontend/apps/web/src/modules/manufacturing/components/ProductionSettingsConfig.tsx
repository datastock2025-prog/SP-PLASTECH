import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Clock,
  Cpu,
  Layers,
  Save,
  Check
} from 'lucide-react';

interface SettingsProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ProductionSettingsConfig: React.FC<SettingsProps> = ({
  onNavigate,
  showToast,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
              System Configuration
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Shift Timings &bull; OPC-UA Edge Gateways &bull; Work Centers
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Production &amp; Plant Floor Settings</h1>
        </div>

        <button
          onClick={() => showToast('Configuration saved successfully.')}
          className="px-4 py-2.5 rounded-xl bg-[#0F8B8D] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#0c7072] transition-colors"
        >
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Shift Definitions */}
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-[#14213D]">Shift Schedules</h3>
          <div className="space-y-2">
            <div className="p-3 bg-[#F6F4EF] rounded-xl flex justify-between items-center">
              <div>
                <b className="text-[#14213D]">Shift A (Morning)</b>
                <div className="text-[11px] text-[#6B7280]">06:00 &mdash; 14:00 (8.0 Hours)</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span>
            </div>
            <div className="p-3 bg-[#F6F4EF] rounded-xl flex justify-between items-center">
              <div>
                <b className="text-[#14213D]">Shift B (Evening)</b>
                <div className="text-[11px] text-[#6B7280]">14:00 &mdash; 22:00 (8.0 Hours)</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">Scheduled</span>
            </div>
            <div className="p-3 bg-[#F6F4EF] rounded-xl flex justify-between items-center">
              <div>
                <b className="text-[#14213D]">Shift C (Night)</b>
                <div className="text-[11px] text-[#6B7280]">22:00 &mdash; 06:00 (8.0 Hours)</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">Scheduled</span>
            </div>
          </div>
        </div>

        {/* IoT Edge Gateway */}
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-[#14213D]">OPC-UA Edge Telemetry Gateways</h3>
          <div className="space-y-2">
            <div className="p-3 bg-[#F6F4EF] rounded-xl flex justify-between items-center">
              <div>
                <b className="text-[#14213D]">Molding Line 1 &amp; 3 Gateway</b>
                <div className="text-[11px] font-mono text-[#6B7280]">opc.tcp://192.168.10.50:4840</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Connected</span>
            </div>
            <div className="p-3 bg-[#F6F4EF] rounded-xl flex justify-between items-center">
              <div>
                <b className="text-[#14213D]">Blow Molding Line 4 Gateway</b>
                <div className="text-[11px] font-mono text-[#6B7280]">opc.tcp://192.168.10.51:4840</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
