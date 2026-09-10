import React, { useState } from 'react';
import {
  Droplets,
  ShieldCheck,
  Flame,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Download,
  Search,
  Wrench,
  ChevronRight,
  Sparkles,
  Gauge,
} from 'lucide-react';
import { MepEquipment, MepUtilityReading, MepMetric } from '../../types';

interface MepPlumbingWaterViewProps {
  equipment: MepEquipment[];
  utilityReadings: MepUtilityReading[];
  onOpenEquipmentDetail: (item: MepEquipment) => void;
  onCreateWorkOrder: (equipmentId: string, title: string) => void;
  showToast: (msg: string) => void;
}

export const MepPlumbingWaterView: React.FC<MepPlumbingWaterViewProps> = ({
  equipment,
  utilityReadings,
  onOpenEquipmentDetail,
  onCreateWorkOrder,
  showToast,
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'ro' | 'softener' | 'etp' | 'fire'>('all');

  const plumbingEquip = equipment.filter(
    (e) => e.category === 'Plumbing' || e.subSystem.includes('Water') || e.subSystem.includes('ETP') || e.subSystem.includes('Fire')
  );

  const filtered = plumbingEquip.filter((item) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'ro') return item.subSystem.includes('RO');
    if (selectedTab === 'softener') return item.subSystem.includes('Softening');
    if (selectedTab === 'etp') return item.subSystem.includes('ETP');
    if (selectedTab === 'fire') return item.subSystem.includes('Fire');
    return true;
  });

  const handleTriggerSoftenerRegen = () => {
    showToast('Duplex Softener Column B regeneration cycle initiated with saturated brine.');
  };

  const handleTestFirePump = () => {
    showToast('Simulating Fire Hydrant main ring pressure drop: Jockey pump auto-started @ 7.8 bar.');
  };

  const handleExportEcbReport = () => {
    showToast('Exporting Central Pollution Control Board (CPCB/SPCB) ZLD environmental compliance audit sheet...');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              Industrial Water, RO &amp; ETP ZLD
            </span>
            <span className="text-xs text-slate-500 font-mono">Zero Liquid Discharge Certified</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Plumbing, Industrial Water &amp; Effluent Treatment (ETP)
          </h1>
          <p className="text-sm text-slate-600">
            Reverse Osmosis (RO), process softening, closed-loop cooling chemistry, ETP recycling &amp; fire protection ring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTriggerSoftenerRegen}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 border border-slate-300"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Softener Column Regen
          </button>
          <button
            onClick={handleTestFirePump}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Flame className="w-3.5 h-3.5" />
            Fire Jockey Auto Test
          </button>
          <button
            onClick={handleExportEcbReport}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            PCB Compliance Report
          </button>
        </div>
      </div>

      {/* Top Water Stream Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">RO Permeate Flow</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-900 font-mono">19.1 m³/hr</span>
            <span className="text-xs text-slate-500 font-semibold">TDS 14.8 ppm</span>
          </div>
          <span className="text-xs text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">
            Recovery: 76.2% | Salt Rejection 98.9%
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Softened Process Water</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900 font-mono">2.1 ppm</span>
            <span className="text-xs text-slate-500 font-semibold">Hardness as CaCO3</span>
          </div>
          <span className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">
            Target: &lt; 5 ppm (Zero Scaling)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">ETP ZLD Effluent Treated</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">92.0%</span>
            <span className="text-xs text-slate-500 font-semibold">Recycled to Plant</span>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">
            BOD: 11.4 | COD: 42.0 mg/L (Safe)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Fire Ring Main Pressure</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-700 font-mono">8.8 bar</span>
            <span className="text-xs text-slate-500 font-semibold">Pressurized 24x7</span>
          </div>
          <span className="text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">
            450,000L Dedicated Sump
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        {[
          { id: 'all', label: 'All Water & Safety Units' },
          { id: 'ro', label: 'RO Treatment Plant' },
          { id: 'softener', label: 'Water Softening' },
          { id: 'etp', label: 'ETP / ZLD Effluent' },
          { id: 'fire', label: 'Fire Hydrant Skid' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Equipment Detailed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((eq) => (
          <div
            key={eq.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10.5px] font-mono font-bold text-slate-400 uppercase">
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

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
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
                  Live Water Quality &amp; Pressure Telemetry
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(eq.metrics).map(([key, metric]: [string, MepMetric]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded bg-slate-50/70 border border-slate-100 text-xs"
                    >
                      <span className="text-slate-600 truncate pr-2">{metric.label}</span>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold ${
                            metric.status === 'warn' ? 'text-amber-600' : 'text-slate-900'
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

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onCreateWorkOrder(eq.id, `Water Utility PM for ${eq.name}`)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Log Maintenance
              </button>
              <button
                onClick={() => onOpenEquipmentDetail(eq)}
                className="px-3 py-1.5 text-xs font-bold rounded bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white transition flex items-center gap-1"
              >
                Full Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
