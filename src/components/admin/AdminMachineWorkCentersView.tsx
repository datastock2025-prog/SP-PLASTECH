import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Search,
  Filter,
  Cpu,
  Activity,
  Zap,
  Gauge,
  CheckCircle2,
  Wrench,
  AlertCircle,
  Clock,
  Layers,
  Edit2,
  Tag,
} from 'lucide-react';
import { MachineWorkCenterConfig, mockMachineWorkCenters } from '../../data/mockAdminExtendedData';

interface AdminMachineWorkCentersViewProps {
  showToast?: (msg: string) => void;
}

export const AdminMachineWorkCentersView: React.FC<AdminMachineWorkCentersViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [machines, setMachines] = useState<MachineWorkCenterConfig[]>(mockMachineWorkCenters);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMachine, setSelectedMachine] = useState<MachineWorkCenterConfig>(machines[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    'ALL',
    'Injection Molding',
    'Blow Molding',
    'Twin-Screw Extrusion',
    'Ultrasonic Welding',
  ];

  const filteredMachines = machines.filter((mc) => {
    const matchSearch =
      mc.code.toLowerCase().includes(search.toLowerCase()) ||
      mc.name.toLowerCase().includes(search.toLowerCase()) ||
      mc.bayNumber.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || mc.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleUpdateStatus = (id: string, newStatus: MachineWorkCenterConfig['currentStatus']) => {
    setMachines((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          showToast(`Machine ${m.code} status changed to ${newStatus}.`);
          return { ...m, currentStatus: newStatus };
        }
        return m;
      })
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-[#0F8B8D]" />
            <span>Plant Assets &amp; Primary Production Work Centers</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Machine / Work Center Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage injection molding presses, clamping tonnage, tie-bar clearances, screw diameter, hourly cost absorption, and PLC IoT gateways.
          </p>
        </div>

        <button
          onClick={() => {
            showToast('Opened new Work Center registration wizard.');
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Register Machine / Work Center
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search machines by code, model, bay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0F8B8D] text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Machine Work Center List */}
        <div className="lg:col-span-7 space-y-3">
          {filteredMachines.map((mc) => {
            const isSelected = selectedMachine.id === mc.id;
            return (
              <div
                key={mc.id}
                onClick={() => setSelectedMachine(mc)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F8B8D]/5 border-[#0F8B8D] shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {mc.code}
                      </span>
                      <span className="text-[11px] font-semibold text-[#0F8B8D]">{mc.tonnageRating}T Press</span>
                    </div>
                    <h3 className="font-bold text-xs text-slate-900 mt-1">{mc.name}</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {mc.bayNumber} &middot; {mc.plantName}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      mc.currentStatus === 'Running'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : mc.currentStatus === 'Tool Changeover'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {mc.currentStatus}
                  </span>
                </div>

                {/* Technical Specs Strip */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Shot Weight</span>
                    <span className="font-mono font-bold text-slate-800">{mc.maxShotWeightGrams}g Max</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Screw Dia</span>
                    <span className="font-mono font-bold text-slate-800">{mc.screwDiameterMm} mm</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">OEE Real-time</span>
                    <span
                      className={`font-mono font-bold ${
                        mc.currentOeePct >= mc.oeeTargetPct ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {mc.currentOeePct}% (Tgt: {mc.oeeTargetPct}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Specification Inspector */}
        {selectedMachine && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5 h-fit sticky top-4">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#0F8B8D] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {selectedMachine.code}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">{selectedMachine.name}</h2>
                <p className="text-xs text-slate-500">{selectedMachine.category}</p>
              </div>

              <select
                value={selectedMachine.currentStatus}
                onChange={(e) =>
                  handleUpdateStatus(selectedMachine.id, e.target.value as MachineWorkCenterConfig['currentStatus'])
                }
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Running">Running</option>
                <option value="Tool Changeover">Tool Changeover</option>
                <option value="Idle">Idle</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            {/* Injection Mechanical Specifications */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#0F8B8D]" />
                Mechanical Clamping &amp; Injection Parameters
              </h3>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Clamping Force:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedMachine.clampingForceKn} kN ({selectedMachine.tonnageRating} Tons)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tie-Bar Clearance:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedMachine.tieBarSpacingMm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Screw Barrel Diameter:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedMachine.screwDiameterMm} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hourly Absorption Cost:</span>
                  <span className="font-mono font-bold text-emerald-700">₹{selectedMachine.hourlyCostRateInr} / hr</span>
                </div>
              </div>
            </div>

            {/* Industry 4.0 / IoT Gateway */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                PLC Euromap 63 / 77 &amp; Telemetry
              </h3>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">PLC Gateway IP:</span>
                  <span className="font-mono font-bold text-indigo-600">{selectedMachine.plcInterfaceIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sub-meter Energy ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedMachine.energyMeterId}</span>
                </div>
              </div>
            </div>

            {/* Compatible Mold Die Assets */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-600" />
                Active Tool / Mold Die Assignments
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedMachine.assignedMolds.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-1 rounded bg-teal-50 border border-teal-200 font-mono text-[11px] text-[#0F8B8D] font-semibold"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => showToast(`Calibrated energy & shot telemetry for ${selectedMachine.code}.`)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sync PLC Telemetry
              </button>
              <button
                onClick={() => showToast(`Saved work center parameters for ${selectedMachine.code}.`)}
                className="px-3 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0c7274]"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
