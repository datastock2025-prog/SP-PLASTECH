import React, { useState } from 'react';
import {
  Layers,
  Wind,
  Thermometer,
  ShieldCheck,
  Activity,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Download,
  RotateCw,
  Search,
  Wrench,
  ChevronRight,
  Filter,
  Eye,
} from 'lucide-react';
import { MepEquipment, MepCleanroomZone, MepMetric } from '../../types';

interface MepHvacCleanroomViewProps {
  equipment: MepEquipment[];
  cleanroomZones: MepCleanroomZone[];
  onOpenEquipmentDetail: (item: MepEquipment) => void;
  onCreateWorkOrder: (equipmentId: string, title: string) => void;
  showToast: (msg: string) => void;
}

export const MepHvacCleanroomView: React.FC<MepHvacCleanroomViewProps> = ({
  equipment,
  cleanroomZones,
  onOpenEquipmentDetail,
  onCreateWorkOrder,
  showToast,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('all');

  const hvacEquip = equipment.filter(
    (e) => e.category === 'HVAC & Cleanroom' || e.subSystem.includes('AHU') || e.subSystem.includes('Scrubber')
  );

  const handleAdjustAirflow = (zoneName: string) => {
    showToast(`VFD inverter modulation command sent to AHU supply fan for ${zoneName}. Adjusting airflow.`);
  };

  const handleGenerateIsoCert = () => {
    showToast('Generating ISO 14644-1 Cleanroom Environmental Classification & Validation Certificate PDF...');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              ISO 14644 Cleanroom BMS
            </span>
            <span className="text-xs text-slate-500 font-mono">Medical &amp; Precision Molding</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            HVAC, Cleanroom &amp; Environmental Control
          </h1>
          <p className="text-sm text-slate-600">
            Positive pressure barrier cascade, AHU HEPA H14 filtration, 21°C/50% RH conditioning &amp; VOC scrubbers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateIsoCert}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            ISO 14644 Certificate
          </button>
        </div>
      </div>

      {/* Cleanroom Zone Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cleanroomZones.map((zone) => {
          const isWarn = zone.status === 'Warning';
          return (
            <div
              key={zone.id}
              className={`p-4 rounded-xl border shadow-sm transition bg-white ${
                isWarn ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <span className="text-[10.5px] font-mono font-bold text-slate-400 block uppercase">
                    {zone.id}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{zone.name}</h3>
                  <span className="text-xs font-semibold text-purple-700 block mt-0.5">{zone.isoClass}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold shrink-0 ${
                    zone.status === 'Normal'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}
                >
                  {zone.status}
                </span>
              </div>

              <div className="mt-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Room Temp</span>
                  <span className="font-mono font-bold text-slate-900">{zone.tempC}°C</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Rel. Humidity</span>
                  <span className="font-mono font-bold text-slate-900">{zone.rhPct}% RH</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Diff. Pressure</span>
                  <span
                    className={`font-mono font-bold ${
                      zone.diffPressurePa < 20 ? 'text-amber-600' : 'text-emerald-700'
                    }`}
                  >
                    {zone.diffPressurePa > 0 ? `+${zone.diffPressurePa}` : zone.diffPressurePa} Pa
                  </span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">HEPA Status</span>
                  <span
                    className={`font-semibold ${
                      zone.hepaFilterStatus === 'Good' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {zone.hepaFilterStatus}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleAdjustAirflow(zone.name)}
                  className="text-xs text-[#0F8B8D] font-bold hover:underline"
                >
                  Adjust VAV &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AHU & Scrubber Unit Details */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wind className="w-4 h-4 text-purple-600" />
              Air Handling Units (AHUs) &amp; Environmental Scrubbers
            </h2>
            <p className="text-xs text-slate-500">
              Filter bank differential pressures (Pre-filter G4, Bag F9, HEPA H14) and fan motors
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {hvacEquip.map((eq) => (
            <div
              key={eq.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                      {eq.id}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{eq.name}</h3>
                    <p className="text-xs text-slate-500">{eq.capacity}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                      eq.status === 'Running'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {eq.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {Object.entries(eq.metrics).map(([key, metric]: [string, MepMetric]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200/70 text-xs"
                    >
                      <span className="text-slate-600 truncate pr-2">{metric.label}</span>
                      <span
                        className={`font-mono font-bold ${
                          metric.status === 'warn' ? 'text-amber-600' : 'text-slate-900'
                        }`}
                      >
                        {metric.value} {metric.uom}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <button
                  onClick={() => onCreateWorkOrder(eq.id, `Filter Replacement for ${eq.name}`)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
                >
                  Schedule PM
                </button>
                <button
                  onClick={() => onOpenEquipmentDetail(eq)}
                  className="px-3 py-1.5 text-xs font-bold rounded bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white transition flex items-center gap-1"
                >
                  Inspect <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
