import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Droplets,
  Wind,
  Wrench,
  Layers,
  Thermometer,
  ShieldCheck,
  Plus,
  X,
  Lock,
  Download,
  AlertTriangle,
  Radio,
  RefreshCw,
} from 'lucide-react';
import {
  MepEquipment,
  MepAlarm,
  MepEnergyReading,
  MepUtilityReading,
  MepWorkOrder,
  MepCleanroomZone,
  MepMetric,
} from '../types';
import {
  INITIAL_MEP_EQUIPMENT,
  INITIAL_MEP_ALARMS,
  INITIAL_MEP_ENERGY_METERS,
  INITIAL_MEP_UTILITY_READINGS,
  INITIAL_MEP_WORK_ORDERS,
  INITIAL_MEP_CLEANROOM_ZONES,
} from '../data/mepData';
import { MepOperationsDash } from './mep/MepOperationsDash';
import { MepMechanicalView } from './mep/MepMechanicalView';
import { MepElectricalView } from './mep/MepElectricalView';
import { MepPlumbingWaterView } from './mep/MepPlumbingWaterView';
import { MepHvacCleanroomView } from './mep/MepHvacCleanroomView';
import { MepWorkOrdersView } from './mep/MepWorkOrdersView';

interface MepViewsProps {
  currentView: string;
  viewParams?: any;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const MepViews: React.FC<MepViewsProps> = ({
  currentView,
  viewParams,
  onNavigate,
  showToast,
}) => {
  const [equipment, setEquipment] = useState<MepEquipment[]>(INITIAL_MEP_EQUIPMENT);
  const [alarms, setAlarms] = useState<MepAlarm[]>(INITIAL_MEP_ALARMS);
  const [energyMeters, setEnergyMeters] = useState<MepEnergyReading[]>(INITIAL_MEP_ENERGY_METERS);
  const [utilityReadings, setUtilityReadings] = useState<MepUtilityReading[]>(INITIAL_MEP_UTILITY_READINGS);
  const [workOrders, setWorkOrders] = useState<MepWorkOrder[]>(INITIAL_MEP_WORK_ORDERS);
  const [cleanroomZones, setCleanroomZones] = useState<MepCleanroomZone[]>(INITIAL_MEP_CLEANROOM_ZONES);

  // Live SCADA telemetry streaming simulation state
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [lastPollTime, setLastPollTime] = useState<string>(new Date().toLocaleTimeString());

  // Drawer inspection state
  const [inspectedEquipment, setInspectedEquipment] = useState<MepEquipment | null>(null);

  // Auto-open equipment or work order from viewParams (e.g. from Global Search)
  useEffect(() => {
    if (viewParams?.openEquipmentId) {
      const found = equipment.find((e) => e.id === viewParams.openEquipmentId);
      if (found) {
        setInspectedEquipment(found);
      }
    }
  }, [viewParams?.openEquipmentId, equipment]);

  // Periodic subtle sensor telemetry jitter to simulate live SCADA data
  useEffect(() => {
    if (!isLiveStreaming) return;

    const timer = setInterval(() => {
      setLastPollTime(new Date().toLocaleTimeString());

      // Jitter grid active power slightly (+/- 2 kW)
      setEnergyMeters((prev) =>
        prev.map((meter) => {
          const deltaKw = (Math.random() - 0.5) * 2.5;
          const newKw = Math.max(0, +(meter.activePowerKw + deltaKw).toFixed(1));
          return {
            ...meter,
            activePowerKw: newKw,
            currentL1L2L3: meter.currentL1L2L3.map((c) => +(c + (Math.random() - 0.5) * 1.2).toFixed(1)),
          };
        })
      );

      // Jitter utility readings
      setUtilityReadings((prev) =>
        prev.map((u) => {
          if (u.id === 'UTIL-CHW') {
            const jitterTemp = +(6.8 + (Math.random() - 0.5) * 0.2).toFixed(1);
            return { ...u, temperature: jitterTemp };
          }
          if (u.id === 'UTIL-AIR') {
            const jitterBar = +(7.35 + (Math.random() - 0.5) * 0.06).toFixed(2);
            return { ...u, pressure: jitterBar };
          }
          if (u.id === 'UTIL-RO') {
            const jitterFlow = +(19.1 + (Math.random() - 0.5) * 0.2).toFixed(1);
            return { ...u, flowRate: jitterFlow };
          }
          return u;
        })
      );

      // Jitter cleanroom diff pressure
      setCleanroomZones((prev) =>
        prev.map((zone) => {
          const jitterDp = +(zone.diffPressurePa + (Math.random() - 0.5) * 0.4).toFixed(1);
          return { ...zone, diffPressurePa: jitterDp };
        })
      );
    }, 3500);

    return () => clearInterval(timer);
  }, [isLiveStreaming]);

  const handleUpdateEquipment = (updatedEq: MepEquipment) => {
    setEquipment((prev) => prev.map((e) => (e.id === updatedEq.id ? updatedEq : e)));
    if (inspectedEquipment?.id === updatedEq.id) {
      setInspectedEquipment(updatedEq);
    }
  };

  const handleManualPoll = () => {
    setLastPollTime(new Date().toLocaleTimeString());
    showToast('Manual SCADA polling cycle executed. All PLC & BACnet gateways synced.');
  };

  const handleSimulateAlarm = () => {
    const testAlarm: MepAlarm = {
      id: `ALM-${Date.now().toString().slice(-4)}`,
      equipmentId: 'MEP-CT-01',
      equipmentName: 'Induced Draft Cooling Tower Bank A',
      category: 'Mechanical',
      severity: 'Warning',
      title: 'Cooling Tower Basin Low Water Level',
      desc: 'Basin water level low (74% < 80% threshold). Makeup valve actuated.',
      timestamp: new Date().toLocaleTimeString(),
      status: 'Active',
      actionRequired: 'Inspect makeup float sensor & auxiliary supply line solenoid valve.',
    };
    setAlarms((prev) => [testAlarm, ...prev]);
    showToast('Simulated SCADA telemetry threshold alert injected: Cooling Tower Basin.');
  };

  const handleExportAllTelemetryCsv = () => {
    const rows = [
      ['Equipment / Meter ID', 'Name / Subsystem', 'Category', 'Status', 'Load / Reading', 'Power (kW)', 'Timestamp'],
      ...equipment.map((eq) => [
        eq.id,
        eq.name,
        eq.category,
        eq.status,
        `${eq.currentLoadPct}%`,
        eq.powerKw ?? '',
        new Date().toISOString(),
      ]),
      ...energyMeters.map((m) => [
        m.meterId,
        m.name,
        'Electrical Meter',
        m.status,
        `PF ${m.powerFactor}`,
        m.activePowerKw,
        new Date().toISOString(),
      ]),
      ...utilityReadings.map((u) => [
        u.id,
        u.type,
        'Utility Header',
        u.status,
        `${u.flowRate} ${u.flowUom} | ${u.pressure} ${u.pressureUom}`,
        '',
        new Date().toISOString(),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `plant01_scada_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Complete SCADA telemetry dataset exported to CSV.');
  };

  // Create WO modal state
  const [isCreateWoOpen, setIsCreateWoOpen] = useState<boolean>(false);
  const [newWoForm, setNewWoForm] = useState<{
    title: string;
    equipmentId: string;
    category: 'Mechanical' | 'Electrical' | 'Plumbing' | 'HVAC & Cleanroom';
    type: 'Preventative (PM)' | 'Breakdown' | 'Calibration' | 'Overhaul';
    priority: 'Emergency' | 'High' | 'Medium' | 'Low';
    assignedTo: string;
    dueDate: string;
    permitRequired: boolean;
    permitType: 'LOTO (Lockout/Tagout)' | 'Hot Work' | 'Confined Space' | 'Electrical Safety';
  }>({
    title: '',
    equipmentId: 'MEP-CHILL-01',
    category: 'Mechanical',
    type: 'Preventative (PM)',
    priority: 'Medium',
    assignedTo: 'S. Kumar (MEP Specialist)',
    dueDate: '2026-09-20',
    permitRequired: true,
    permitType: 'LOTO (Lockout/Tagout)',
  });

  const handleAcknowledgeAlarm = (alarmId: string) => {
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === alarmId
          ? { ...a, status: 'Acknowledged', acknowledgedBy: 'Priya Rao (Plant Eng)' }
          : a
      )
    );
    showToast(`Alarm ${alarmId} acknowledged.`);
  };

  const handleUpdateWorkOrder = (updatedWo: MepWorkOrder) => {
    setWorkOrders((prev) => prev.map((w) => (w.id === updatedWo.id ? updatedWo : w)));
  };

  const handleCreateWorkOrderFromQuickAction = (equipmentId: string, defaultTitle: string) => {
    const target = equipment.find((e) => e.id === equipmentId);
    setNewWoForm((prev) => ({
      ...prev,
      equipmentId: equipmentId,
      title: defaultTitle,
      category: target ? target.category : 'Mechanical',
    }));
    setIsCreateWoOpen(true);
  };

  const handleSaveNewWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWoForm.title.trim()) {
      showToast('Please provide a title for the work order');
      return;
    }

    const targetEq = equipment.find((e) => e.id === newWoForm.equipmentId);
    const newWo: MepWorkOrder = {
      id: `WO-MEP-2026-${String(workOrders.length + 101).padStart(3, '0')}`,
      title: newWoForm.title,
      equipmentId: newWoForm.equipmentId,
      equipmentName: targetEq ? targetEq.name : newWoForm.equipmentId,
      category: newWoForm.category,
      type: newWoForm.type,
      priority: newWoForm.priority,
      assignedTo: newWoForm.assignedTo,
      status: 'Assigned',
      dueDate: newWoForm.dueDate,
      scheduledDate: new Date().toISOString().split('T')[0],
      estimatedHours: 4,
      permitRequired: newWoForm.permitRequired,
      permitType: newWoForm.permitRequired ? newWoForm.permitType : undefined,
      tasks: [
        { id: 1, desc: 'Conduct initial safety isolation & verify zero energy state', done: false },
        { id: 2, desc: 'Inspect mechanical/electrical components per standard procedure', done: false },
        { id: 3, desc: 'Perform cleaning, lubrication or part replacement', done: false },
        { id: 4, desc: 'Test run under load and document baseline telemetry', done: false },
      ],
      partsRequired: [],
    };

    setWorkOrders([newWo, ...workOrders]);
    setIsCreateWoOpen(false);
    showToast(`Work order ${newWo.id} successfully generated and assigned to ${newWo.assignedTo}.`);
    onNavigate('mepWorkOrders');
  };

  // MEP Sub-navigation tabs
  const mepTabs = [
    { id: 'mepDash', label: 'MEP Operations Center', icon: Activity },
    { id: 'mepMechanical', label: 'Mechanical & Chillers', icon: Thermometer },
    { id: 'mepElectrical', label: 'Electrical Substation', icon: Zap },
    { id: 'mepPlumbing', label: 'Plumbing & ETP Water', icon: Droplets },
    { id: 'mepHvac', label: 'HVAC & Cleanrooms', icon: Wind },
    { id: 'mepWorkOrders', label: 'PM & Work Orders', icon: Wrench },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-navigation bar and SCADA telemetry controls */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {mepTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-[#14213D] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E8622C]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live SCADA Telemetry Controls */}
        <div className="flex items-center gap-2">
          {/* Live Indicator Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              {isLiveStreaming && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLiveStreaming ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              ></span>
            </span>
            <span className="font-semibold text-slate-700">
              {isLiveStreaming ? 'SCADA Live' : 'SCADA Paused'}
            </span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">({lastPollTime})</span>
          </div>

          {/* Toggle Stream */}
          <button
            onClick={() => {
              setIsLiveStreaming(!isLiveStreaming);
              showToast(isLiveStreaming ? 'SCADA telemetry streaming paused.' : 'SCADA live telemetry stream resumed.');
            }}
            className="p-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            title={isLiveStreaming ? 'Pause SCADA Streaming' : 'Resume SCADA Streaming'}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveStreaming ? 'text-emerald-600' : 'text-slate-400'}`} />
          </button>

          {/* Manual Poll */}
          <button
            onClick={handleManualPoll}
            className="p-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            title="Poll Gateways Now"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          </button>

          {/* Inject Test Alarm */}
          <button
            onClick={handleSimulateAlarm}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition cursor-pointer"
            title="Inject simulated threshold alarm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Test Alert</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportAllTelemetryCsv}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer"
            title="Export SCADA telemetry logs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {currentView === 'mepDash' && (
        <MepOperationsDash
          equipment={equipment}
          alarms={alarms}
          energyMeters={energyMeters}
          utilityReadings={utilityReadings}
          cleanroomZones={cleanroomZones}
          onNavigate={onNavigate}
          onAcknowledgeAlarm={handleAcknowledgeAlarm}
          onOpenEquipmentDetail={(eq) => setInspectedEquipment(eq)}
          showToast={showToast}
        />
      )}

      {currentView === 'mepMechanical' && (
        <MepMechanicalView
          equipment={equipment}
          onOpenEquipmentDetail={(eq) => setInspectedEquipment(eq)}
          onCreateWorkOrder={handleCreateWorkOrderFromQuickAction}
          showToast={showToast}
        />
      )}

      {currentView === 'mepElectrical' && (
        <MepElectricalView
          equipment={equipment}
          energyMeters={energyMeters}
          onOpenEquipmentDetail={(eq) => setInspectedEquipment(eq)}
          onCreateWorkOrder={handleCreateWorkOrderFromQuickAction}
          showToast={showToast}
        />
      )}

      {currentView === 'mepPlumbing' && (
        <MepPlumbingWaterView
          equipment={equipment}
          utilityReadings={utilityReadings}
          onOpenEquipmentDetail={(eq) => setInspectedEquipment(eq)}
          onCreateWorkOrder={handleCreateWorkOrderFromQuickAction}
          showToast={showToast}
        />
      )}

      {currentView === 'mepHvac' && (
        <MepHvacCleanroomView
          equipment={equipment}
          cleanroomZones={cleanroomZones}
          onOpenEquipmentDetail={(eq) => setInspectedEquipment(eq)}
          onCreateWorkOrder={handleCreateWorkOrderFromQuickAction}
          showToast={showToast}
        />
      )}

      {currentView === 'mepWorkOrders' && (
        <MepWorkOrdersView
          workOrders={workOrders}
          equipment={equipment}
          selectedWoId={viewParams?.openWoId}
          onUpdateWorkOrder={handleUpdateWorkOrder}
          onCreateWorkOrderModal={() => setIsCreateWoOpen(true)}
          showToast={showToast}
        />
      )}

      {/* Equipment Detailed Drawer Modal */}
      {inspectedEquipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400 block uppercase">
                    {inspectedEquipment.id} &middot; {inspectedEquipment.subSystem}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {inspectedEquipment.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {inspectedEquipment.manufacturer} {inspectedEquipment.model} &middot; S/N: {inspectedEquipment.serialNumber}
                  </p>
                </div>
                <button
                  onClick={() => setInspectedEquipment(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Rating */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10.5px] text-slate-400 block uppercase font-bold">Status</span>
                  <span className="font-bold text-emerald-700 block mt-0.5">{inspectedEquipment.status}</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-400 block uppercase font-bold">Health Score</span>
                  <span className="font-mono font-bold text-slate-800 block mt-0.5">{inspectedEquipment.healthScore}/100</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-400 block uppercase font-bold">Load</span>
                  <span className="font-mono font-bold text-slate-800 block mt-0.5">{inspectedEquipment.currentLoadPct}%</span>
                </div>
              </div>

              {/* Equipment Specifications */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Technical Specifications &amp; Location
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[10.5px]">Rated Capacity</span>
                    <span className="font-bold text-slate-800">{inspectedEquipment.capacity}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[10.5px]">Efficiency / Metric</span>
                    <span className="font-semibold text-slate-800 truncate block">{inspectedEquipment.efficiency}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[10.5px]">Installed Location</span>
                    <span className="font-semibold text-slate-800 truncate block">{inspectedEquipment.location}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[10.5px]">Total Running Hours</span>
                    <span className="font-mono font-bold text-slate-800">{inspectedEquipment.runningHours.toLocaleString()} hrs</span>
                  </div>
                </div>
              </div>

              {/* Full Telemetry List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live SCADA Sensors &amp; Diagnostic Channels
                </h3>
                <div className="space-y-1.5">
                  {Object.entries(inspectedEquipment.metrics).map(([key, metric]: [string, MepMetric]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">{metric.label}</span>
                        {metric.target && (
                          <span className="text-[10px] text-slate-400 font-mono">Operating Spec: {metric.target}</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {metric.value} {metric.uom}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setInspectedEquipment(null);
                  handleCreateWorkOrderFromQuickAction(inspectedEquipment.id, `PM Overhaul for ${inspectedEquipment.name}`);
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                <Wrench className="w-4 h-4" />
                Schedule Maintenance
              </button>
              <button
                onClick={() => setInspectedEquipment(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Work Order Modal */}
      {isCreateWoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#0F8B8D]" />
                Create MEP Maintenance Work Order
              </h2>
              <button
                onClick={() => setIsCreateWoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewWorkOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Order Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chiller Condenser Tube Descaling"
                  value={newWoForm.title}
                  onChange={(e) => setNewWoForm({ ...newWoForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Equipment</label>
                  <select
                    value={newWoForm.equipmentId}
                    onChange={(e) => {
                      const target = equipment.find((eq) => eq.id === e.target.value);
                      setNewWoForm({
                        ...newWoForm,
                        equipmentId: e.target.value,
                        category: target ? target.category : 'Mechanical',
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                  >
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maintenance Type</label>
                  <select
                    value={newWoForm.type}
                    onChange={(e) => setNewWoForm({ ...newWoForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                  >
                    <option value="Preventative (PM)">Preventative (PM)</option>
                    <option value="Breakdown">Breakdown</option>
                    <option value="Calibration">Calibration</option>
                    <option value="Overhaul">Overhaul</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newWoForm.priority}
                    onChange={(e) => setNewWoForm({ ...newWoForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                  >
                    <option value="Emergency">Emergency</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={newWoForm.dueDate}
                    onChange={(e) => setNewWoForm({ ...newWoForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Lead Technician</label>
                <input
                  type="text"
                  value={newWoForm.assignedTo}
                  onChange={(e) => setNewWoForm({ ...newWoForm, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
              </div>

              {/* Safety Permit Toggle */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newWoForm.permitRequired}
                    onChange={(e) => setNewWoForm({ ...newWoForm, permitRequired: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Require Formal Safety Isolation Permit
                  </span>
                </label>

                {newWoForm.permitRequired && (
                  <select
                    value={newWoForm.permitType}
                    onChange={(e) => setNewWoForm({ ...newWoForm, permitType: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="LOTO (Lockout/Tagout)">LOTO (Lockout/Tagout)</option>
                    <option value="Electrical Safety">Electrical Safety Isolation</option>
                    <option value="Confined Space">Confined Space Entry</option>
                    <option value="Hot Work">Hot Work Permit</option>
                  </select>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateWoOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white transition shadow-sm"
                >
                  Generate Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
