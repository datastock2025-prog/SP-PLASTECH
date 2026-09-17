import React, { useState, useEffect } from 'react';
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
  X,
  ArrowRight,
  ArrowLeft,
  Building2,
  Check,
  Radio,
} from 'lucide-react';
import { MachineWorkCenterConfig, mockMachineWorkCenters } from '../../data/mockAdminExtendedData';
import { adminService } from '../../services/adminService';
import { PlantDetails } from '../../types/admin';
import { mockCompanyProfile } from '../../data/mockAdminData';

interface AdminMachineWorkCentersViewProps {
  showToast?: (msg: string) => void;
}

export const AdminMachineWorkCentersView: React.FC<AdminMachineWorkCentersViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [machines, setMachines] = useState<MachineWorkCenterConfig[]>(mockMachineWorkCenters);
  const [plants, setPlants] = useState<PlantDetails[]>(mockCompanyProfile.plants);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMachine, setSelectedMachine] = useState<MachineWorkCenterConfig>(machines[0]);

  // Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MachineWorkCenterConfig>>({
    code: '',
    name: '',
    plantId: 'PLANT-01',
    plantName: 'Plant 01 — Pune / Chakan Hub',
    bayNumber: 'Bay 01 — IMM Press Line',
    category: 'Injection Molding',
    tonnageRating: 450,
    clampingForceKn: 4415,
    tieBarSpacingMm: '820 x 780',
    maxShotWeightGrams: 1450,
    screwDiameterMm: 65,
    hourlyCostRateInr: 2400,
    currentStatus: 'Idle',
    plcInterfaceIp: '192.168.10.150',
    energyMeterId: 'EM-BAY-01-A',
    oeeTargetPct: 85,
    currentOeePct: 82.5,
    assignedMolds: ['MOLD-BUMPER-01'],
  });

  const [newMoldTag, setNewMoldTag] = useState('');

  // Load live plants
  useEffect(() => {
    adminService.getPlants().then((livePlants) => {
      if (livePlants && livePlants.length > 0) {
        setPlants(livePlants);
      }
    });
  }, []);

  const categories = [
    'ALL',
    'Injection Molding',
    'Blow Molding',
    'Twin-Screw Extrusion',
    'Ultrasonic Welding',
    'Auxiliary Chiller & Dehumidifier',
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
    if (selectedMachine.id === id) {
      setSelectedMachine((prev) => ({ ...prev, currentStatus: newStatus }));
    }
  };

  const handleOpenRegisterWizard = () => {
    setEditingMachineId(null);
    setWizardStep(1);
    const selectedPlant = plants[0] || mockCompanyProfile.plants[0];
    setFormData({
      code: `IMM-${(machines.length + 1).toString().padStart(2, '0')}`,
      name: '',
      plantId: selectedPlant.id,
      plantName: selectedPlant.plantName,
      bayNumber: `Bay 0${(machines.length % 5) + 1} — Processing Area`,
      category: 'Injection Molding',
      tonnageRating: 450,
      clampingForceKn: 4415,
      tieBarSpacingMm: '820 x 780',
      maxShotWeightGrams: 1450,
      screwDiameterMm: 65,
      hourlyCostRateInr: 2400,
      currentStatus: 'Idle',
      plcInterfaceIp: `192.168.10.${150 + machines.length}`,
      energyMeterId: `EM-BAY-0${(machines.length % 5) + 1}-A`,
      oeeTargetPct: 85,
      currentOeePct: 82.5,
      assignedMolds: ['MOLD-BUMPER-01'],
    });
    setIsWizardOpen(true);
  };

  const handleOpenEditWizard = (mc: MachineWorkCenterConfig) => {
    setEditingMachineId(mc.id);
    setWizardStep(1);
    setFormData({ ...mc });
    setIsWizardOpen(true);
  };

  const handleTonnageChange = (tonnage: number) => {
    const kn = Math.round(tonnage * 9.81);
    setFormData((prev) => ({
      ...prev,
      tonnageRating: tonnage,
      clampingForceKn: kn,
    }));
  };

  const handleAddMoldTag = () => {
    if (!newMoldTag.trim()) return;
    const cleanTag = newMoldTag.trim().toUpperCase();
    if (!formData.assignedMolds?.includes(cleanTag)) {
      setFormData((prev) => ({
        ...prev,
        assignedMolds: [...(prev.assignedMolds || []), cleanTag],
      }));
    }
    setNewMoldTag('');
  };

  const handleRemoveMoldTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedMolds: prev.assignedMolds?.filter((t) => t !== tagToRemove) || [],
    }));
  };

  const handleSaveMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      showToast('Please enter both Machine Code and Description Name.');
      return;
    }

    if (editingMachineId) {
      const updated = { ...(formData as MachineWorkCenterConfig), id: editingMachineId };
      setMachines((prev) => prev.map((m) => (m.id === editingMachineId ? updated : m)));
      setSelectedMachine(updated);
      showToast(`Work Center ${updated.code} specifications updated.`);
    } else {
      const newId = `MC-${Date.now().toString().slice(-4)}`;
      const newMachine: MachineWorkCenterConfig = {
        ...(formData as MachineWorkCenterConfig),
        id: newId,
      };
      setMachines((prev) => [newMachine, ...prev]);
      setSelectedMachine(newMachine);
      showToast(`Machine Work Center ${newMachine.code} successfully registered and online.`);
    }
    setIsWizardOpen(false);
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
          onClick={handleOpenRegisterWizard}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto cursor-pointer"
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
            const isSelected = selectedMachine?.id === mc.id;
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

                  <div className="flex items-center gap-1.5">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditWizard(mc);
                      }}
                      className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Edit Machine Specifications"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Sync PLC Telemetry
              </button>
              <button
                onClick={() => handleOpenEditWizard(selectedMachine)}
                className="px-3 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0c7274] cursor-pointer"
              >
                Edit Work Center
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* REGISTER / EDIT MACHINE WORK CENTER WIZARD MODAL */}
      {/* ========================================================================= */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header with Progress Stepper */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0F8B8D] uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-[#0F8B8D]" />
                  <span>{editingMachineId ? 'Edit Work Center' : 'New Asset Registration Wizard'}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {editingMachineId ? `Configure ${formData.code}` : 'Register Machine / Work Center Asset'}
                </h2>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
              <div
                onClick={() => setWizardStep(1)}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  wizardStep === 1
                    ? 'text-[#0F8B8D] font-bold'
                    : wizardStep > 1
                    ? 'text-slate-700 font-medium'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 1
                      ? 'bg-[#0F8B8D] text-white'
                      : wizardStep > 1
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {wizardStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                </div>
                <span>Asset Identity &amp; Location</span>
              </div>

              <div className="w-8 h-px bg-slate-200" />

              <div
                onClick={() => formData.name && formData.code && setWizardStep(2)}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  wizardStep === 2
                    ? 'text-[#0F8B8D] font-bold'
                    : wizardStep > 2
                    ? 'text-slate-700 font-medium'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 2
                      ? 'bg-[#0F8B8D] text-white'
                      : wizardStep > 2
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {wizardStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                </div>
                <span>Mechanical Parameters</span>
              </div>

              <div className="w-8 h-px bg-slate-200" />

              <div
                onClick={() => formData.name && formData.code && setWizardStep(3)}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  wizardStep === 3
                    ? 'text-[#0F8B8D] font-bold'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 3
                      ? 'bg-[#0F8B8D] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  3
                </div>
                <span>IoT &amp; Mold Tools</span>
              </div>
            </div>

            {/* Modal Body / Wizard Steps */}
            <form onSubmit={handleSaveMachine} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* STEP 1: General & Location */}
              {wizardStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Machine Asset Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. IMM-ENGEL-650-01"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-[#0F8B8D] focus:border-[#0F8B8D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Process Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-[#0F8B8D]"
                      >
                        <option value="Injection Molding">Injection Molding</option>
                        <option value="Blow Molding">Blow Molding</option>
                        <option value="Twin-Screw Extrusion">Twin-Screw Extrusion</option>
                        <option value="Ultrasonic Welding">Ultrasonic Welding</option>
                        <option value="Auxiliary Chiller & Dehumidifier">Auxiliary Chiller &amp; Dehumidifier</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Machine Model &amp; Description <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Engel Victory 650T Duo Eco-Drive Injection Press"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-[#0F8B8D] focus:border-[#0F8B8D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Assigned Manufacturing Plant</label>
                      <select
                        value={formData.plantId}
                        onChange={(e) => {
                          const p = plants.find((pl) => pl.id === e.target.value);
                          setFormData({
                            ...formData,
                            plantId: e.target.value,
                            plantName: p?.plantName || e.target.value,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-[#0F8B8D]"
                      >
                        {plants.map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            {pl.plantCode} — {pl.plantName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bay &amp; Floor Location</label>
                      <input
                        type="text"
                        value={formData.bayNumber || ''}
                        onChange={(e) => setFormData({ ...formData, bayNumber: e.target.value })}
                        placeholder="e.g. Bay 04 — Heavy IMM Section"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Initial Operational Status</label>
                      <select
                        value={formData.currentStatus}
                        onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-[#0F8B8D]"
                      >
                        <option value="Running">Running (In Production)</option>
                        <option value="Idle">Idle (Available for Setup)</option>
                        <option value="Tool Changeover">Tool Changeover</option>
                        <option value="Maintenance">Maintenance &amp; Calibration</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Mechanical Parameters */}
              {wizardStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Clamping Tonnage (Tons)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="5000"
                        value={formData.tonnageRating || 450}
                        onChange={(e) => handleTonnageChange(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Calculated Clamping Force (kN)
                      </label>
                      <input
                        type="number"
                        value={formData.clampingForceKn || 4415}
                        onChange={(e) => setFormData({ ...formData, clampingForceKn: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-mono text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Tie-Bar Clearance (W x H mm)
                      </label>
                      <input
                        type="text"
                        value={formData.tieBarSpacingMm || '820 x 780'}
                        onChange={(e) => setFormData({ ...formData, tieBarSpacingMm: e.target.value })}
                        placeholder="e.g. 1100 x 980"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Screw Barrel Diameter (mm)
                      </label>
                      <input
                        type="number"
                        min="15"
                        max="300"
                        value={formData.screwDiameterMm || 65}
                        onChange={(e) => setFormData({ ...formData, screwDiameterMm: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Max Shot Weight (grams PP)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="50000"
                        value={formData.maxShotWeightGrams || 1450}
                        onChange={(e) => setFormData({ ...formData, maxShotWeightGrams: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Machine Hourly Cost Rate (₹ / hr)
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={formData.hourlyCostRateInr || 2400}
                        onChange={(e) => setFormData({ ...formData, hourlyCostRateInr: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-emerald-700 font-bold focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Target OEE Benchmark (%)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={formData.oeeTargetPct || 85}
                        onChange={(e) => setFormData({ ...formData, oeeTargetPct: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Industry 4.0 IoT & Mold Assignments */}
              {wizardStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        PLC Euromap 63 / 77 Gateway IP
                      </label>
                      <input
                        type="text"
                        value={formData.plcInterfaceIp || ''}
                        onChange={(e) => setFormData({ ...formData, plcInterfaceIp: e.target.value })}
                        placeholder="e.g. 192.168.10.150"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-indigo-700 focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Sub-meter Energy ID
                      </label>
                      <input
                        type="text"
                        value={formData.energyMeterId || ''}
                        onChange={(e) => setFormData({ ...formData, energyMeterId: e.target.value })}
                        placeholder="e.g. EM-BAY-01-A"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                    </div>
                  </div>

                  {/* Mold / Tooling Assignment */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-700">
                      Compatible Mold Die Tooling Assignments
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMoldTag}
                        onChange={(e) => setNewMoldTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMoldTag();
                          }
                        }}
                        placeholder="Enter mold code e.g. MOLD-DOOR-TRIM-02"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                      <button
                        type="button"
                        onClick={handleAddMoldTag}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                      >
                        + Add Tool
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.assignedMolds?.map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 font-mono text-[11px] text-[#0F8B8D] font-semibold"
                        >
                          {m}
                          <button
                            type="button"
                            onClick={() => handleRemoveMoldTag(m)}
                            className="hover:text-rose-600 transition-colors"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {wizardStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setWizardStep((prev) => ((prev - 1) as 1 | 2 | 3))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWizardOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  {wizardStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!formData.name || !formData.code) {
                          showToast('Please specify machine asset code and model name.');
                          return;
                        }
                        setWizardStep((prev) => ((prev + 1) as 1 | 2 | 3));
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Next Step
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {editingMachineId ? 'Save Work Center Changes' : 'Complete Registration'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
