import React, { useState } from 'react';
import {
  Thermometer,
  Wind,
  Droplets,
  Activity,
  Sliders,
  Settings,
  Power,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Wrench,
  ChevronRight,
  RefreshCw,
  Layers,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import { MepEquipment, MepMetric } from '../../types';

interface MepMechanicalViewProps {
  equipment: MepEquipment[];
  onOpenEquipmentDetail: (item: MepEquipment) => void;
  onCreateWorkOrder: (equipmentId: string, title: string) => void;
  showToast: (msg: string) => void;
}

export const MepMechanicalView: React.FC<MepMechanicalViewProps> = ({
  equipment,
  onOpenEquipmentDetail,
  onCreateWorkOrder,
  showToast,
}) => {
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chillerSetpoint, setChillerSetpoint] = useState<number>(7.0);

  const mechanicalEquip = equipment.filter(
    (e) => e.category === 'Mechanical' || e.subSystem.includes('Cooling') || e.subSystem.includes('Pneumatics')
  );

  const filtered = mechanicalEquip.filter((item) => {
    if (selectedSubsystem !== 'all' && item.subSystem !== selectedSubsystem) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.subSystem.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const subsystems = Array.from(new Set(mechanicalEquip.map((e) => e.subSystem)));

  const handleToggleUnit = (eq: MepEquipment) => {
    if (eq.status === 'Running') {
      showToast(`Transitioning ${eq.name} to Standby mode...`);
    } else {
      showToast(`Starting ${eq.name} into Primary Duty cycle...`);
    }
  };

  const handleUpdateSetpoint = (newVal: number) => {
    setChillerSetpoint(newVal);
    showToast(`Central Chiller supply setpoint updated to ${newVal.toFixed(1)}°C. BMS VFD adapting.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5" />
              Thermal &amp; Pneumatic Plant
            </span>
            <span className="text-xs text-slate-500 font-mono">Central Utility SCADA</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Mechanical, Chillers &amp; Compressed Air Systems
          </h1>
          <p className="text-sm text-slate-600">
            Water-cooled &amp; modular chillers, cooling towers, rotary screw compressors &amp; desiccant dew-point monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Chiller Setpoint Control */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <span className="text-xs font-semibold text-slate-600">Chiller Setpoint:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleUpdateSetpoint(Math.max(5.0, chillerSetpoint - 0.5))}
                className="w-6 h-6 rounded bg-white border border-slate-300 font-bold text-xs hover:bg-slate-100"
              >
                -
              </button>
              <span className="font-mono font-bold text-xs px-1.5 text-blue-900">{chillerSetpoint.toFixed(1)}°C</span>
              <button
                onClick={() => handleUpdateSetpoint(Math.min(12.0, chillerSetpoint + 0.5))}
                className="w-6 h-6 rounded bg-white border border-slate-300 font-bold text-xs hover:bg-slate-100"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={() => showToast('Swapped Compressor #1 / #2 Auto Lead-Lag duty schedule.')}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 border border-slate-300"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Switch Lead-Lag Duty
          </button>
        </div>
      </div>

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Cooling Duty</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900 font-mono">185.0 TR</span>
            <span className="text-xs text-slate-500 font-medium">(74% of 250 TR)</span>
          </div>
          <span className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">
            Delta-T: 5.4 °C (6.8°C / 12.2°C)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Chiller Plant Efficiency</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">0.62 kW/TR</span>
            <span className="text-xs text-slate-500 font-medium">COP 5.67</span>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">
            High Efficiency Tier A
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Compressed Air Delivery</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">785 CFM</span>
            <span className="text-xs text-slate-500 font-medium">@ 7.35 bar</span>
          </div>
          <span className="text-xs text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">
            Specific Power: 0.158 kW/CFM
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cooling Tower Approach</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-900 font-mono">3.8 °C</span>
            <span className="text-xs text-slate-500 font-medium">Wet-Bulb 26.2°C</span>
          </div>
          <span className="text-xs text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">
            Flow: 215 m³/hr (Sum: 30°C)
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedSubsystem('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedSubsystem === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Subsystems ({mechanicalEquip.length})
          </button>
          {subsystems.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubsystem(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedSubsystem === sub
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search mechanical units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] focus:bg-white"
          />
        </div>
      </div>

      {/* Equipment Detailed Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((eq) => {
          const isRunning = eq.status === 'Running';
          const isWarning = eq.status === 'Warning';
          const isStandby = eq.status === 'Standby';

          return (
            <div
              key={eq.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        {eq.id}
                      </span>
                      <span className="text-slate-300">&middot;</span>
                      <span className="text-xs font-semibold text-slate-600">{eq.subSystem}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{eq.name}</h3>
                    <p className="text-xs text-slate-500">{eq.manufacturer} {eq.model} (S/N: {eq.serialNumber})</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isRunning
                          ? 'bg-emerald-100 text-emerald-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {eq.status}
                    </span>
                  </div>
                </div>

                {/* Main Specs & Live Metrics */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Capacity</span>
                    <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">{eq.capacity}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Current Load</span>
                    <span className="text-xs font-bold text-slate-800 font-mono block mt-0.5">{eq.currentLoadPct}%</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Health Score</span>
                    <span
                      className={`text-xs font-bold font-mono block mt-0.5 ${
                        eq.healthScore > 90 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {eq.healthScore}/100
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Running Hours</span>
                    <span className="text-xs font-bold text-slate-800 font-mono block mt-0.5">
                      {eq.runningHours.toLocaleString()} hrs
                    </span>
                  </div>
                </div>

                {/* Telemetry Sensor List */}
                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Live Telemetry Channels
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(eq.metrics).map(([key, metric]: [string, MepMetric]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs"
                      >
                        <span className="text-slate-600 truncate pr-2">{metric.label}</span>
                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono font-bold ${
                              metric.status === 'crit'
                                ? 'text-red-600'
                                : metric.status === 'warn'
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {metric.value} {metric.uom}
                          </span>
                          {metric.target && (
                            <span className="block text-[9.5px] text-slate-400 font-mono">
                              Spec: {metric.target}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  <span>Last PM: <strong className="text-slate-700 font-mono">{eq.lastPmDate}</strong></span>
                  <span className="mx-2">&middot;</span>
                  <span>Due: <strong className="text-slate-700 font-mono">{eq.nextPmDue}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleUnit(eq)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1"
                  >
                    <Power className="w-3.5 h-3.5" />
                    {isRunning ? 'Set Standby' : 'Start Duty'}
                  </button>
                  <button
                    onClick={() => onCreateWorkOrder(eq.id, `PM Inspection for ${eq.name}`)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Log PM
                  </button>
                  <button
                    onClick={() => onOpenEquipmentDetail(eq)}
                    className="px-3 py-1.5 text-xs font-bold rounded bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white transition flex items-center gap-1 shadow-sm"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
