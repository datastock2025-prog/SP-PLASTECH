import React, { useState } from 'react';
import { MachineMaster, WorkOrder, ItemMaster } from '../../types';
import { MoldMaster } from '../../data/manufacturingData';
import {
  Activity,
  Flame,
  Gauge,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  Clock
} from 'lucide-react';

interface TelemetryProps {
  machines: MachineMaster[];
  workOrders: WorkOrder[];
  items: ItemMaster[];
  molds: MoldMaster[];
  selectedMachineId?: string;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const MachineMonitoringTelemetry: React.FC<TelemetryProps> = ({
  machines,
  workOrders,
  items,
  molds,
  selectedMachineId = 'IMM-250T-03',
  onNavigate,
  showToast,
}) => {
  const [activeMachineId, setActiveMachineId] = useState<string>(selectedMachineId);
  const currentMachine = machines.find((m) => m.id === activeMachineId) || machines[0];
  const activeWO = workOrders.find((w) => w.machine === currentMachine.id && w.status === 'in_progress');
  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;

  // Real-time sensor channels
  const telemetryData = {
    barrelZ1: { name: 'Zone 1 (Feed Throat)', setpoint: 205, actual: 205.8, uom: '°C', inSpec: true },
    barrelZ2: { name: 'Zone 2 (Compression)', setpoint: 212, actual: 213.1, uom: '°C', inSpec: true },
    barrelZ3: { name: 'Zone 3 (Metering)', setpoint: 215, actual: 215.0, uom: '°C', inSpec: true },
    nozzle: { name: 'Nozzle Tip Temp', setpoint: 220, actual: 221.4, uom: '°C', inSpec: true },
    moldStationary: { name: 'Mold Core Temp (Water A)', setpoint: 35, actual: 36.2, uom: '°C', inSpec: true },
    moldMoving: { name: 'Mold Cavity Temp (Water B)', setpoint: 35, actual: 35.8, uom: '°C', inSpec: true },
    injPressure: { name: 'Peak Injection Pressure', setpoint: 850, actual: 848, uom: 'bar', inSpec: true },
    holdPressure: { name: 'Holding Pressure', setpoint: 450, actual: 452, uom: 'bar', inSpec: true },
    screwSpeed: { name: 'Screw Recovery Speed', setpoint: 120, actual: 119, uom: 'RPM', inSpec: true },
    cycleTime: { name: 'Current Shot Cycle Time', setpoint: 12.0, actual: 12.3, uom: 'sec', inSpec: true },
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D]">
              IoT Edge Gateway
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#1F8A5F] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#1F8A5F] animate-pulse" />
              OPC-UA Stream Active &bull; 100ms Polling
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Machine Telemetry &amp; Process Sensors</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeMachineId}
            onChange={(e) => setActiveMachineId(e.target.value)}
            className="p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-bold text-xs text-[#14213D]"
          >
            {machines.filter(m => m.type.includes('Molding') || m.type.includes('Extrusion')).map((m) => (
              <option key={m.id} value={m.id}>{m.id} &mdash; {m.name}</option>
            ))}
          </select>
          <button
            onClick={() => showToast('OPC-UA sensor telemetry refreshed.')}
            className="p-2.5 rounded-xl bg-[#F6F4EF] hover:bg-[#FAF9F5] border border-[#E4E0D6]"
          >
            <RefreshCw className="w-4 h-4 text-[#14213D]" />
          </button>
        </div>
      </div>

      {/* Main Machine Telemetry View */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Barrel & Mold Temperature Profile */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#E8622C]" />
              <h3 className="font-bold text-sm text-[#14213D]">
                Thermal Zones &amp; Hydraulic Pressure Setpoint vs Actual
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#14213D] bg-[#F6F4EF] px-2 py-0.5 rounded">
              {currentMachine.id} &bull; {currentMachine.tonnage || '250 Ton'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(telemetryData).map(([key, sensor]) => (
              <div key={key} className="p-3 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-[#6B7280]">
                  <span>{sensor.name}</span>
                  <span className="font-mono">Set: {sensor.setpoint} {sensor.uom}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-mono font-bold text-[#14213D]">
                    {sensor.actual} <span className="text-xs font-normal text-[#6B7280]">{sensor.uom}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    In Spec (±2%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Machine Cycle Time Trend Chart simulation */}
          <div className="pt-4 border-t border-[#E4E0D6] space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#14213D]">Recent 50 Shots Cycle Time Stability</span>
              <span className="text-[#1F8A5F]">Cpk = 1.64 (Excellent Process Capability)</span>
            </div>
            <div className="h-20 bg-[#F6F4EF] rounded-xl p-2 flex items-end gap-1 overflow-hidden border border-[#E4E0D6]">
              {Array.from({ length: 40 }).map((_, idx) => {
                const height = 40 + Math.sin(idx) * 15 + (idx % 3 === 0 ? 5 : 0);
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-[#0F8B8D] rounded-t-xs hover:bg-[#0c7072] transition-all"
                    style={{ height: `${height}%` }}
                    title={`Shot #${842000 + idx}: ${(12.0 + (height - 40) / 40).toFixed(2)}s`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Active Job on Machine + Health Metrics */}
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D]">Active Bay Job Context</h3>
          {activeWO ? (
            <div className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-2 text-xs">
              <div className="flex justify-between font-bold text-[#14213D]">
                <span className="font-mono text-[#0F8B8D]">{activeWO.id}</span>
                <span className="text-emerald-700">Running In Progress</span>
              </div>
              <div className="font-semibold text-[#14213D]">{itemName(activeWO.item)}</div>
              <div className="text-[11px] text-[#6B7280]">
                Output: <b>{activeWO.completed.toLocaleString()}</b> / {activeWO.qty.toLocaleString()} pcs
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 text-xs text-[#6B7280]">
              Machine is currently idle or on standby.
            </div>
          )}

          <div className="space-y-2.5 text-xs pt-2 border-t border-[#E4E0D6]">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Hydraulic Oil Temperature:</span>
              <span className="font-mono font-bold text-[#14213D]">42.5 °C (Normal &lt; 50°C)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Clamping Force Applied:</span>
              <span className="font-mono font-bold text-[#14213D]">248 Tons / 250T Max</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Machine Lifetime Shots:</span>
              <span className="font-mono font-bold text-[#14213D]">4,821,900 Shots</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Next Scheduled Preventive Maintenance:</span>
              <span className="font-bold text-emerald-700">02 Sep 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
