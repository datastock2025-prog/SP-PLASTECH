import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Droplets,
  Wind,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Clock,
  ChevronRight,
  Filter,
  Check,
  AlertOctagon,
  Layers,
  Thermometer,
  Gauge,
  Power,
  Wrench,
  Download,
} from 'lucide-react';
import {
  MepEquipment,
  MepAlarm,
  MepEnergyReading,
  MepUtilityReading,
  MepCleanroomZone,
} from '../../types';

interface MepOperationsDashProps {
  equipment: MepEquipment[];
  alarms: MepAlarm[];
  energyMeters: MepEnergyReading[];
  utilityReadings: MepUtilityReading[];
  cleanroomZones: MepCleanroomZone[];
  onNavigate: (view: string, param?: any) => void;
  onAcknowledgeAlarm: (alarmId: string) => void;
  onOpenEquipmentDetail: (item: MepEquipment) => void;
  showToast: (msg: string) => void;
}

export const MepOperationsDash: React.FC<MepOperationsDashProps> = ({
  equipment,
  alarms,
  energyMeters,
  utilityReadings,
  cleanroomZones,
  onNavigate,
  onAcknowledgeAlarm,
  onOpenEquipmentDetail,
  showToast,
}) => {
  const [selectedZoneTab, setSelectedZoneTab] = useState<'all' | 'mechanical' | 'electrical' | 'plumbing' | 'hvac'>('all');
  const [alarmFilter, setAlarmFilter] = useState<'all' | 'active' | 'ack'>('active');

  const totalGridPowerKw = energyMeters.find((m) => m.meterId === 'EM-GRID-01')?.activePowerKw || 1485.6;
  const totalGridPF = energyMeters.find((m) => m.meterId === 'EM-GRID-01')?.powerFactor || 0.994;
  const chwSupplyTemp = utilityReadings.find((u) => u.type === 'Chilled Water')?.temperature || 6.8;
  const chwPressure = utilityReadings.find((u) => u.type === 'Chilled Water')?.pressure || 4.4;
  const airPressure = utilityReadings.find((u) => u.type === 'Compressed Air')?.pressure || 7.35;
  const airDewPoint = utilityReadings.find((u) => u.type === 'Compressed Air')?.dewPointC || -42.5;
  const roFlowRate = utilityReadings.find((u) => u.type === 'RO Water')?.flowRate || 19.1;

  const activeAlarms = alarms.filter((a) => a.status === 'Active');
  const criticalAlarms = activeAlarms.filter((a) => a.severity === 'Critical');

  const filteredEquipment = equipment.filter((item) => {
    if (selectedZoneTab === 'all') return true;
    if (selectedZoneTab === 'mechanical') return item.category === 'Mechanical';
    if (selectedZoneTab === 'electrical') return item.category === 'Electrical';
    if (selectedZoneTab === 'plumbing') return item.category === 'Plumbing';
    if (selectedZoneTab === 'hvac') return item.category === 'HVAC & Cleanroom';
    return true;
  });

  const displayedAlarms = alarms.filter((a) => {
    if (alarmFilter === 'all') return true;
    if (alarmFilter === 'active') return a.status === 'Active';
    if (alarmFilter === 'ack') return a.status === 'Acknowledged';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SCADA BMS Live
            </span>
            <span className="text-xs text-slate-500 font-mono">Telemetry Refreshed 5s ago</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Plant Utilities &amp; MEP Command Center
          </h1>
          <p className="text-sm text-slate-600">
            Real-time mechanical chillers, 11kV electrical grid, compressed air, RO/ETP water balance &amp; cleanroom BMS telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => showToast('Initiating cooling tower automated blowdown cycle...')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 border border-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Auto Blowdown Cycle
          </button>
          <button
            onClick={() => onNavigate('mepWorkOrders')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5" />
            MEP Work Orders ({equipment.filter((e) => e.status === 'Warning' || e.status === 'Tripped').length} Due)
          </button>
        </div>
      </div>

      {/* Critical Alarm Alert Banner (if any) */}
      {criticalAlarms.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-600 shrink-0">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-red-900 uppercase tracking-wide">
                  CRITICAL UTILITY ALARM ({criticalAlarms.length})
                </span>
                <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded font-mono font-bold">
                  {criticalAlarms[0].id}
                </span>
              </div>
              <p className="text-sm text-red-800 mt-0.5 font-medium">
                {criticalAlarms[0].title}
              </p>
              <p className="text-xs text-red-700 mt-1">
                {criticalAlarms[0].actionRequired}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onAcknowledgeAlarm(criticalAlarms[0].id)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
            >
              Acknowledge Alarm
            </button>
            <button
              onClick={() => onNavigate('mepMechanical')}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-red-900 border border-red-300 text-xs font-semibold rounded-lg transition"
            >
              View Compressor
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Active Power & PF */}
        <div
          onClick={() => onNavigate('mepElectrical')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Substation Power</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {totalGridPowerKw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-semibold">kW Active</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1 font-mono">
              <span className="text-slate-400">PF:</span>
              <span className="font-bold text-emerald-600">{totalGridPF.toFixed(3)}</span>
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-semibold">
              No Penalty (0.99)
            </span>
          </div>
        </div>

        {/* 2. Chilled Water Loop */}
        <div
          onClick={() => onNavigate('mepMechanical')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chilled Water Plant</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900 font-mono tracking-tight">
              {chwSupplyTemp.toFixed(1)}°C
            </span>
            <span className="text-xs text-slate-500 font-semibold">Supply (4.4 bar)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-mono">Chiller #1 (250 TR)</span>
            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] font-semibold">
              COP 5.67 (0.62 kW/TR)
            </span>
          </div>
        </div>

        {/* 3. Compressed Air Header */}
        <div
          onClick={() => onNavigate('mepMechanical')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-cyan-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compressed Air</span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 group-hover:scale-110 transition-transform">
              <Wind className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {airPressure.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-semibold">bar Main Header</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-mono">Dew Point:</span>
            <span className="font-mono font-bold text-slate-700">{airDewPoint}°C</span>
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-semibold">
              ISO Class 1.2
            </span>
          </div>
        </div>

        {/* 4. RO Water & ETP ZLD */}
        <div
          onClick={() => onNavigate('mepPlumbing')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Water &amp; Effluent ZLD</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-900 font-mono tracking-tight">
              {roFlowRate.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-semibold">m³/hr RO Pure</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-mono">TDS 14.8 ppm</span>
            <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[11px] font-semibold">
              92% ZLD Recycled
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Equipment Matrix & Energy Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Plant Equipment Status Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Plant Utility Equipment Matrix ({filteredEquipment.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Continuous telemetry monitoring for critical utility machines and subsystems
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(['all', 'mechanical', 'electrical', 'plumbing', 'hvac'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedZoneTab(tab)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition capitalize ${
                      selectedZoneTab === tab
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'all' ? 'All Units' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Grid Cards */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredEquipment.map((eq) => {
                const isRunning = eq.status === 'Running';
                const isWarning = eq.status === 'Warning';
                const isStandby = eq.status === 'Standby';

                return (
                  <div
                    key={eq.id}
                    onClick={() => onOpenEquipmentDetail(eq)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition bg-white cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                            {eq.id} &middot; {eq.subSystem}
                          </span>
                          <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-[#0F8B8D] transition-colors">
                            {eq.name}
                          </h3>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
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

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10.5px]">Capacity / Rating</span>
                          <span className="font-semibold text-slate-700 truncate block">{eq.capacity}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10.5px]">Current Load</span>
                          <span className="font-mono font-bold text-slate-800">{eq.currentLoadPct}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10.5px]">Health Score</span>
                          <span
                            className={`font-mono font-bold ${
                              eq.healthScore > 90
                                ? 'text-emerald-600'
                                : eq.healthScore > 75
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}
                          >
                            {eq.healthScore}/100
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10.5px]">Next PM Due</span>
                          <span className="font-mono text-slate-600">{eq.nextPmDue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate text-[11px]">{eq.location}</span>
                      <span className="text-[#0F8B8D] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cleanroom Environmental Status Block */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0F8B8D]" />
                  Cleanroom ISO 14644 Environmental Monitoring
                </h3>
                <p className="text-xs text-slate-500">
                  Positive pressure barrier, temperature &amp; %RH stabilization for medical molding
                </p>
              </div>
              <button
                onClick={() => onNavigate('mepHvac')}
                className="text-xs text-[#0F8B8D] font-bold hover:underline flex items-center gap-1"
              >
                View HVAC Details <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {cleanroomZones.slice(0, 2).map((cr) => (
                <div
                  key={cr.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{cr.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{cr.isoClass}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cr.status === 'Normal'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {cr.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-white p-2 rounded border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Temp</span>
                      <span className="font-bold font-mono text-slate-800">{cr.tempC}°C</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Humidity</span>
                      <span className="font-bold font-mono text-slate-800">{cr.rhPct}% RH</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Diff. Press</span>
                      <span
                        className={`font-bold font-mono ${
                          cr.diffPressurePa < 20 ? 'text-amber-600' : 'text-emerald-700'
                        }`}
                      >
                        {cr.diffPressurePa} Pa
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Alarms & Energy Sub-metering */}
        <div className="space-y-6">
          {/* Active Alarms Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  Utility Alarm Stream
                </h3>
                <span className="text-xs text-slate-500">
                  {activeAlarms.length} Active &middot; {alarms.filter((a) => a.status === 'Acknowledged').length} Ack
                </span>
              </div>

              <div className="flex items-center gap-1">
                {(['active', 'ack', 'all'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAlarmFilter(mode)}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded capitalize ${
                      alarmFilter === mode
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 divide-y divide-slate-100 max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {displayedAlarms.map((alm) => {
                const isCrit = alm.severity === 'Critical';
                const isMajor = alm.severity === 'Major';
                const isWarn = alm.severity === 'Warning';

                return (
                  <div key={alm.id} className="pt-2.5 first:pt-0 pb-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isCrit
                            ? 'bg-red-100 text-red-800'
                            : isMajor
                            ? 'bg-orange-100 text-orange-800'
                            : isWarn
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {alm.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{alm.timestamp}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-1 leading-tight">{alm.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{alm.desc}</p>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">{alm.equipmentId}</span>
                      {alm.status === 'Active' ? (
                        <button
                          onClick={() => onAcknowledgeAlarm(alm.id)}
                          className="px-2 py-1 text-[10.5px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-[10.5px] text-slate-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {alm.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Substation Energy Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Energy Sub-Metering
                </h3>
                <span className="text-xs text-slate-500">Live active load by manufacturing zone</span>
              </div>
              <button
                onClick={() => onNavigate('mepElectrical')}
                className="text-xs text-[#0F8B8D] font-bold hover:underline"
              >
                Analytics &rarr;
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {energyMeters.slice(1, 5).map((m) => {
                const pctOfTotal = ((m.activePowerKw / totalGridPowerKw) * 100).toFixed(1);
                return (
                  <div key={m.meterId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate">{m.name}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {m.activePowerKw.toFixed(1)} kW{' '}
                        <span className="text-slate-400 font-normal">({pctOfTotal}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0F8B8D] to-[#E8622C] rounded-full"
                        style={{ width: `${Math.min(100, Number(pctOfTotal) * 2.2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
              <span className="text-[11.5px]">Today's Est Energy Cost:</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{energyMeters.reduce((acc, m) => acc + (m.costEstToday || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
