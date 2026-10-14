import React, { useState } from 'react';
import {
  Zap,
  Cpu,
  Activity,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Download,
  RotateCw,
  Power,
  Flame,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { MepEquipment, MepEnergyReading, MepMetric } from '../../types';

interface MepElectricalViewProps {
  equipment: MepEquipment[];
  energyMeters: MepEnergyReading[];
  onOpenEquipmentDetail: (item: MepEquipment) => void;
  onCreateWorkOrder: (equipmentId: string, title: string) => void;
  showToast: (msg: string) => void;
}

export const MepElectricalView: React.FC<MepElectricalViewProps> = ({
  equipment,
  energyMeters,
  onOpenEquipmentDetail,
  onCreateWorkOrder,
  showToast,
}) => {
  const [selectedMeterFilter, setSelectedMeterFilter] = useState<string>('all');
  const [apfcMode, setApfcMode] = useState<'Auto' | 'Manual'>('Auto');

  const electricalEquip = equipment.filter((e) => e.category === 'Electrical');
  const mainGridMeter = energyMeters.find((m) => m.meterId === 'EM-GRID-01');

  const totalKw = mainGridMeter ? mainGridMeter.activePowerKw : 1485.6;
  const totalKva = mainGridMeter ? mainGridMeter.apparentPowerKva : 1494.5;
  const currentPF = mainGridMeter ? mainGridMeter.powerFactor : 0.994;
  const contractDemandKva = 1800; // Contract demand limit
  const peakDemandKva = mainGridMeter ? mainGridMeter.peakDemandKva : 1610;
  const demandUtilPct = ((peakDemandKva / contractDemandKva) * 100).toFixed(1);

  const handleTestDgSet = () => {
    showToast('Executing AMF automated DG-1 starter simulation. Voltage: 415V, Frequency: 50.0Hz verified.');
  };

  const handleToggleApfcMode = () => {
    const next = apfcMode === 'Auto' ? 'Manual' : 'Auto';
    setApfcMode(next);
    showToast(`APFC controller mode switched to ${next}. Target PF set to 0.992+`);
  };

  const handleExportEnergyLog = () => {
    showToast('Exporting 15-minute sub-meter energy profile to CSV...');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              11kV / 415V Substation SCADA
            </span>
            <span className="text-xs text-slate-500 font-mono">Real-Time Power Quality</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Electrical Substation, Transformers &amp; Energy Management
          </h1>
          <p className="text-sm text-slate-600">
            Transformer health, APFC capacitor bank compensation, DG backup power &amp; zone sub-metering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleToggleApfcMode}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 border border-slate-300"
          >
            <RotateCw className="w-3.5 h-3.5" />
            APFC Mode: <strong className="text-slate-900">{apfcMode}</strong>
          </button>
          <button
            onClick={handleTestDgSet}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Flame className="w-3.5 h-3.5" />
            AMF DG Test Run
          </button>
          <button
            onClick={handleExportEnergyLog}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Energy CSV
          </button>
        </div>
      </div>

      {/* Substation Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Grid Active Power</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalKw.toFixed(1)} kW</span>
            <span className="text-xs text-slate-500 font-semibold">{totalKva.toFixed(1)} kVA</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-mono">11.08 kV Incomer</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
              50.02 Hz Stable
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Power Factor (PF)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">{currentPF.toFixed(3)}</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              No Utility Penalty
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-mono">APFC 450 kVAr</span>
            <span className="text-slate-700 font-semibold">6 of 9 Steps Active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Contract Demand Limit</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{peakDemandKva} kVA</span>
            <span className="text-xs text-slate-500 font-semibold">/ {contractDemandKva} kVA Max</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="text-slate-500">Utilization:</span>
            <span className="font-mono font-bold text-amber-700">{demandUtilPct}% (Safe Zone)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Harmonic Distortion (THD)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">4.2%</span>
            <span className="text-xs text-slate-500 font-semibold">Current THD</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="text-slate-500">Voltage THD: 1.8%</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
              IEEE 519 Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Primary Substation Equipment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {electricalEquip.map((eq) => (
          <div
            key={eq.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                    {eq.id} &middot; {eq.subSystem}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">{eq.name}</h3>
                  <p className="text-xs text-slate-500">{eq.manufacturer} {eq.model}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    eq.status === 'Running'
                      ? 'bg-emerald-100 text-emerald-800'
                      : eq.status === 'Warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {eq.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Rated Capacity</span>
                  <span className="font-bold text-slate-800 truncate block mt-0.5">{eq.capacity}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Load Status</span>
                  <span className="font-bold font-mono text-slate-800 block mt-0.5">{eq.currentLoadPct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Health Score</span>
                  <span className="font-bold font-mono text-emerald-600 block mt-0.5">{eq.healthScore}/100</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Next PM</span>
                  <span className="font-mono text-slate-700 block mt-0.5">{eq.nextPmDue}</span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Critical Electrical Telemetry
                </span>
                {Object.entries(eq.metrics).slice(0, 4).map(([key, metric]: [string, MepMetric]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded bg-slate-50/70 border border-slate-100 text-xs"
                  >
                    <span className="text-slate-600 truncate">{metric.label}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {metric.value} {metric.uom}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onCreateWorkOrder(eq.id, `Electrical Maintenance for ${eq.name}`)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Log Electrical PM
              </button>
              <button
                onClick={() => onOpenEquipmentDetail(eq)}
                className="px-3 py-1.5 text-xs font-bold rounded bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white transition flex items-center gap-1"
              >
                Full Telemetry <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Circuit Sub-Metering Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-500" />
              Zone Energy Sub-Metering &amp; Power Quality Log
            </h2>
            <p className="text-xs text-slate-500">
              Live power consumption, 3-phase voltages, current balance &amp; daily electricity cost
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-slate-500">Rate: ₹8.00 / kWh</span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Meter ID &amp; Location</th>
                <th className="py-2.5 px-3">Voltage L1-L2-L3 (V)</th>
                <th className="py-2.5 px-3">Current L1-L2-L3 (A)</th>
                <th className="py-2.5 px-3">Active (kW)</th>
                <th className="py-2.5 px-3">Apparent (kVA)</th>
                <th className="py-2.5 px-3">PF</th>
                <th className="py-2.5 px-3">THD (I)</th>
                <th className="py-2.5 px-3">Today kWh</th>
                <th className="py-2.5 px-3 text-right">Est. Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {energyMeters.map((m) => (
                <tr key={m.meterId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{m.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{m.meterId} &middot; {m.zone}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {m.voltageL1L2L3[0]} / {m.voltageL1L2L3[1]} / {m.voltageL1L2L3[2]}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {m.currentL1L2L3[0]} / {m.currentL1L2L3[1]} / {m.currentL1L2L3[2]}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {m.activePowerKw.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {m.apparentPowerKva.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                    {m.powerFactor.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {m.thdCurrentPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                    {m.todayKwh.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-right text-slate-900">
                    ₹{m.costEstToday.toLocaleString()}
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
