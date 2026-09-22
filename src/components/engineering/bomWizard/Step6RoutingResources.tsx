import React, { useState, useEffect, useRef } from 'react';
import { ManufacturingBomWizardState } from './types';
import { RoutingResourceDetail } from '../../../types';
import { masterDataGovernanceService } from '../../../services/masterDataGovernanceService';
import { adminEventBus } from '../../../services/adminService';
import {
  Factory,
  Plus,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  Cpu,
  Wrench,
  ShieldCheck,
  Check,
  X,
  Gauge,
  Users,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';

interface Step6Props {
  state: ManufacturingBomWizardState;
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
  showToast: (msg: string) => void;
}

export const Step6RoutingResources: React.FC<Step6Props> = ({ state, onChange, showToast }) => {
  const { routingResources } = state;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Master data lists for autocompletes
  const [operationsList, setOperationsList] = useState(masterDataGovernanceService.getOperations());
  const [workCentersList, setWorkCentersList] = useState(masterDataGovernanceService.getWorkCenters());
  const [machinesList, setMachinesList] = useState(masterDataGovernanceService.getMachines());
  const [moldsList, setMoldsList] = useState(masterDataGovernanceService.getMolds());

  // Listen to admin event bus updates
  useEffect(() => {
    const unsubOp = adminEventBus.on('OPERATION_MASTER_SAVED', () => {
      setOperationsList(masterDataGovernanceService.getOperations());
    });
    const unsubWc = adminEventBus.on('WORK_CENTER_MASTER_SAVED', () => {
      setWorkCentersList(masterDataGovernanceService.getWorkCenters());
    });
    const unsubMch = adminEventBus.on('MACHINE_MASTER_SAVED', () => {
      setMachinesList(masterDataGovernanceService.getMachines());
    });
    const unsubMold = adminEventBus.on('MOLD_MASTER_SAVED', () => {
      setMoldsList(masterDataGovernanceService.getMolds());
    });
    return () => {
      unsubOp();
      unsubWc();
      unsubMch();
      unsubMold();
    };
  }, []);

  // Form modal state
  const [opNo, setOpNo] = useState<number>(10);
  const [opName, setOpName] = useState<string>('Injection Molding & Cooling');
  const [opType, setOpType] = useState<string>('Primary Molding');
  const [workCenter, setWorkCenter] = useState<string>('WC-INJ-01 - 250T Injection Bay');
  const [machineId, setMachineId] = useState<string>('IMM 250T - Line 1 (Engel)');
  const [moldId, setMoldId] = useState<string>('MOLD-INJ-084 (4-Cavity Hot Runner)');
  const [cavities, setCavities] = useState<number>(state.moldCavities || state.parentItem?.cavityCount || 4);
  const [setupTimeMin, setSetupTimeMin] = useState<number>(45);
  const [runTimeHours, setRunTimeHours] = useState<number>(state.estimatedProductionTimeHours || 4.2);
  const [cycleTimeSec, setCycleTimeSec] = useState<number>(
    state.standardCycleTimeSec || state.parentItem?.cycleTime || state.parentItem?.standardCycleTime || 14.5
  );
  const [crewSize, setCrewSize] = useState<number>(1);
  const [laborSkill, setLaborSkill] = useState<string>('Level 2 Molding Technician');
  const [qualityCheckpoint, setQualityCheckpoint] = useState<boolean>(true);
  const [instructions, setInstructions] = useState<string>(
    'Check barrel temperatures and ensure mold chilled water flow is 12L/min.'
  );

  // Dropdown open states
  const [isOpDropdownOpen, setIsOpDropdownOpen] = useState(false);
  const [isWcDropdownOpen, setIsWcDropdownOpen] = useState(false);
  const [isMchDropdownOpen, setIsMchDropdownOpen] = useState(false);
  const [isMoldDropdownOpen, setIsMoldDropdownOpen] = useState(false);

  // Creation Sub-Modals
  const [isCreateOpModalOpen, setIsCreateOpModalOpen] = useState(false);
  const [newOpForm, setNewOpForm] = useState({ name: '', category: 'Molding', setupMin: 30, cycleSec: 15 });

  const [isCreateWcModalOpen, setIsCreateWcModalOpen] = useState(false);
  const [newWcForm, setNewWcForm] = useState({ code: '', name: '', plant: 'PLANT-01', ratePerHour: 65 });

  const [isCreateMchModalOpen, setIsCreateMchModalOpen] = useState(false);
  const [newMchForm, setNewMchForm] = useState({ code: '', name: '', brand: 'Engel', tonnage: 250 });

  const [isCreateMoldModalOpen, setIsCreateMoldModalOpen] = useState(false);
  const [newMoldForm, setNewMoldForm] = useState({
    code: '',
    name: '',
    cavities: state.moldCavities || state.parentItem?.cavityCount || 4,
    runnerType: 'Hot Runner (Valve Gated)',
  });

  const handleOpenAddModal = (preset?: Partial<RoutingResourceDetail>) => {
    // Task 5: Number of cavity and cycle time are auto filled from parent item
    const parentCavities = state.moldCavities || state.parentItem?.cavityCount || 4;
    const parentCycleTime =
      state.standardCycleTimeSec || state.parentItem?.cycleTime || state.parentItem?.standardCycleTime || 14.5;

    setEditingIndex(null);
    setOpNo((routingResources.length + 1) * 10);
    setOpName(preset?.operationName || 'Injection Molding & Degating');
    setOpType(preset?.operationType || 'Primary Molding');
    setWorkCenter(preset?.workCenter || (workCentersList[0]?.name ?? 'WC-INJ-01 - 250T Injection Bay'));
    setMachineId(preset?.machineId || (machinesList[0]?.name ?? 'IMM 250T - Line 1 (Engel)'));
    setMoldId(preset?.moldId || (moldsList[0]?.name ?? 'MOLD-INJ-084 (4-Cavity Hot Runner)'));
    setCavities(preset?.cavities ?? parentCavities);
    setSetupTimeMin(45);
    setRunTimeHours(state.estimatedProductionTimeHours || 4.0);
    setCycleTimeSec(preset?.cycleTimeSec ?? parentCycleTime);
    setCrewSize(1);
    setLaborSkill('Level 2 Molding Technician');
    setQualityCheckpoint(true);
    setInstructions('Verify cooling cycle and nozzle seal prior to full-speed cycle.');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (idx: number) => {
    const r = routingResources[idx];
    setEditingIndex(idx);
    setOpNo(r.operationNo);
    setOpName(r.operationName);
    setOpType(r.operationType);
    setWorkCenter(r.workCenter);
    setMachineId(r.machineId);
    setMoldId(r.moldId);
    setCavities(r.cavities);
    setSetupTimeMin(r.setupTimeMin);
    setRunTimeHours(r.runTimeHours);
    setCycleTimeSec(r.cycleTimeSec);
    setCrewSize(r.crewSize);
    setLaborSkill(r.laborSkill);
    setQualityCheckpoint(r.qualityCheckpoint);
    setInstructions(r.instructions);
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    const outputPerHour = cycleTimeSec > 0 ? Math.round((3600 / cycleTimeSec) * cavities) : 0;
    const newStep: RoutingResourceDetail = {
      id: editingIndex !== null ? routingResources[editingIndex].id : `ROUT-${Date.now()}`,
      operationNo: opNo,
      operationName: opName,
      operationType: opType,
      workCenter,
      machineId,
      moldId,
      cavities,
      setupTimeMin,
      runTimeHours,
      cycleTimeSec,
      crewSize,
      laborSkill,
      outputPerHour,
      qualityCheckpoint,
      instructions,
    };

    let updated: RoutingResourceDetail[];
    if (editingIndex !== null) {
      updated = [...routingResources];
      updated[editingIndex] = newStep;
      showToast(`Updated operation ${newStep.operationName}`);
    } else {
      updated = [...routingResources, newStep];
      showToast(`Added operation ${newStep.operationName}`);
    }

    onChange({ routingResources: updated });
    setIsModalOpen(false);
  };

  const handleRemove = (idx: number) => {
    const updated = routingResources.filter((_, i) => i !== idx);
    onChange({ routingResources: updated });
    showToast('Routing step removed');
  };

  const handleMove = (idx: number, dir: 'up' | 'down') => {
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= routingResources.length) return;
    const updated = [...routingResources];
    const temp = updated[idx];
    updated[idx] = updated[newIdx];
    updated[newIdx] = temp;
    updated.forEach((r, i) => (r.operationNo = (i + 1) * 10));
    onChange({ routingResources: updated });
  };

  // Creation Sub-modal handlers
  const handleSaveNewOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpForm.name.trim()) {
      showToast('Please enter an operation name');
      return;
    }
    const saved = masterDataGovernanceService.saveOperation({
      name: newOpForm.name.trim(),
      category: newOpForm.category,
      defaultSetupMin: Number(newOpForm.setupMin) || 30,
      defaultCycleSec: Number(newOpForm.cycleSec) || 15,
    });
    setOperationsList(masterDataGovernanceService.getOperations());
    setOpName(saved.name);
    setOpType(saved.category);
    if (saved.defaultSetupMin) setSetupTimeMin(saved.defaultSetupMin);
    if (saved.defaultCycleSec) setCycleTimeSec(saved.defaultCycleSec);
    setIsCreateOpModalOpen(false);
    setNewOpForm({ name: '', category: 'Molding', setupMin: 30, cycleSec: 15 });
    showToast(`✓ Created Operation "${saved.name}" in Master Data Governance`);
  };

  const handleSaveNewWorkCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWcForm.name.trim()) {
      showToast('Please enter a work center name');
      return;
    }
    const autoCode = newWcForm.code.trim() || `WC-${Date.now().toString().slice(-4)}`;
    const saved = masterDataGovernanceService.saveWorkCenter({
      code: autoCode,
      name: `${autoCode} - ${newWcForm.name.trim()}`,
      plant: newWcForm.plant,
      ratePerHour: Number(newWcForm.ratePerHour) || 65,
    });
    setWorkCentersList(masterDataGovernanceService.getWorkCenters());
    setWorkCenter(saved.name);
    setIsCreateWcModalOpen(false);
    setNewWcForm({ code: '', name: '', plant: 'PLANT-01', ratePerHour: 65 });
    showToast(`✓ Created Work Center "${saved.name}" in Master Data Governance`);
  };

  const handleSaveNewMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMchForm.name.trim()) {
      showToast('Please enter a machine name');
      return;
    }
    const autoCode = newMchForm.code.trim() || `IMM-${Date.now().toString().slice(-4)}`;
    const saved = masterDataGovernanceService.saveMachine({
      code: autoCode,
      name: newMchForm.name.trim(),
      brand: newMchForm.brand,
      tonnage: Number(newMchForm.tonnage) || 250,
    });
    setMachinesList(masterDataGovernanceService.getMachines());
    setMachineId(saved.name);
    setIsCreateMchModalOpen(false);
    setNewMchForm({ code: '', name: '', brand: 'Engel', tonnage: 250 });
    showToast(`✓ Registered Machine "${saved.name}" in Master Data Governance`);
  };

  const handleSaveNewMold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMoldForm.name.trim()) {
      showToast('Please enter a mold tool name');
      return;
    }
    const autoCode = newMoldForm.code.trim() || `MOLD-INJ-${Date.now().toString().slice(-4)}`;
    const saved = masterDataGovernanceService.saveMold({
      code: autoCode,
      name: `${autoCode} (${newMoldForm.name.trim()})`,
      cavities: Number(newMoldForm.cavities) || 4,
      runnerType: newMoldForm.runnerType,
    });
    setMoldsList(masterDataGovernanceService.getMolds());
    setMoldId(saved.name);
    setCavities(saved.cavities);
    setIsCreateMoldModalOpen(false);
    setNewMoldForm({
      code: '',
      name: '',
      cavities: state.moldCavities || state.parentItem?.cavityCount || 4,
      runnerType: 'Hot Runner (Valve Gated)',
    });
    showToast(`✓ Registered Mold "${saved.name}" in Master Data Governance`);
  };

  // Filtered master data lists for autocompletes with null safety
  const safeOpName = (opName || '').toLowerCase();
  const safeWc = (workCenter || '').toLowerCase();
  const safeMch = (machineId || '').toLowerCase();
  const safeMold = (moldId || '').toLowerCase();

  const filteredOps = (operationsList || []).filter((op) =>
    (op?.name || '').toLowerCase().includes(safeOpName) ||
    (op?.category || '').toLowerCase().includes(safeOpName)
  );
  const filteredWcs = (workCentersList || []).filter((wc) =>
    (wc?.name || '').toLowerCase().includes(safeWc) ||
    (wc?.code || '').toLowerCase().includes(safeWc)
  );
  const filteredMchs = (machinesList || []).filter((mch) =>
    (mch?.name || '').toLowerCase().includes(safeMch) ||
    (mch?.code || '').toLowerCase().includes(safeMch)
  );
  const filteredMolds = (moldsList || []).filter((m) =>
    (m?.name || '').toLowerCase().includes(safeMold) ||
    (m?.code || '').toLowerCase().includes(safeMold)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E0D6] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <span>Routing, Work Centers &amp; Mold Tooling</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono">
              {routingResources.length} step{routingResources.length === 1 ? '' : 's'}
            </span>
          </h3>
          <p className="text-xs text-gray-500">
            Link injection molding presses, chilling lines, mold cavities, and labor skill requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              handleOpenAddModal({
                operationName: 'Automatic Packaging & Case Seal',
                operationType: 'Pack-out',
                workCenter: 'WC-PACK-01 - Automatic Case Packer',
                machineId: 'Case Packer Line 2',
                moldId: 'N/A',
                cavities: 1,
              })
            }
            className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs"
          >
            + Pack-out Step
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Routing Step
          </button>
        </div>
      </div>

      {/* Machine & Mold Compatibility Pill Banner */}
      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Parent Item Auto-Fill Active:</strong> Standard cycle time ({state.standardCycleTimeSec || state.parentItem?.cycleTime || 14.5}s) and mold cavities ({state.moldCavities || state.parentItem?.cavityCount || 4} Cavities) linked from Item Master ({state.parentItem.code || 'FG Item'}).
          </span>
        </div>
        <span className="font-bold font-mono text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded">
          {state.moldCavities || state.parentItem?.cavityCount || 4} Cavities &bull; {state.standardCycleTimeSec || state.parentItem?.cycleTime || 14.5}s Cycle
        </span>
      </div>

      {/* Routing Table */}
      {routingResources.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-[#E4E0D6] space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#14213D]">No routing operations configured</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              No routing operations configured. Add machining, molding, cooling, or packaging operations to complete routing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="btn btn-sm btn-primary inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Primary Molding Step
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">Op #</th>
                  <th className="py-2.5 px-3">Operation Name</th>
                  <th className="py-2.5 px-3">Work Center / Machine</th>
                  <th className="py-2.5 px-3">Mold Tool / Cavities</th>
                  <th className="py-2.5 px-3 text-right">Cycle (s)</th>
                  <th className="py-2.5 px-3 text-right">Setup (m)</th>
                  <th className="py-2.5 px-3 text-right">Output/Hr</th>
                  <th className="py-2.5 px-3">Crew / Skill</th>
                  <th className="py-2.5 px-3 text-center">QC Gate</th>
                  <th className="py-2.5 px-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {routingResources.map((step, idx) => (
                  <tr key={step.id || idx} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2 px-3 text-center font-mono font-bold text-gray-500">
                      {step.operationNo}
                    </td>
                    <td className="py-2 px-3 font-semibold text-[#14213D]">
                      {step.operationName}
                      <span className="block text-[10px] text-gray-500">{step.operationType}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-gray-800 block truncate max-w-[150px]">
                        {step.workCenter}
                      </span>
                      <span className="font-mono text-[10px] text-blue-700 block truncate max-w-[150px]">
                        {step.machineId}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-mono text-[11px] text-gray-800 block truncate max-w-[140px]">
                        {step.moldId}
                      </span>
                      <span className="text-[10px] text-gray-500">{step.cavities} Cavities</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                      {step.cycleTimeSec}s
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-700">
                      {step.setupTimeMin}m
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      {step.outputPerHour}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-gray-600">
                      {step.crewSize} &bull; {step.laborSkill}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {step.qualityCheckpoint ? (
                        <span className="inline-flex items-center text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Required
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === routingResources.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(idx)}
                          className="p-1 text-gray-500 hover:text-[#0F8B8D]"
                          title="Edit Step"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
                          className="p-1 text-gray-400 hover:text-rose-600"
                          title="Remove Step"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Routing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Factory className="w-4 h-4 text-[#0F8B8D]" />
                {editingIndex !== null ? 'Edit Routing Operation' : 'Add Routing Operation'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Op Number */}
              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Operation Number</label>
                <input
                  type="number"
                  value={opNo}
                  onChange={(e) => setOpNo(parseInt(e.target.value) || 10)}
                  className="w-full text-xs font-mono font-bold py-1.5 px-2 border rounded"
                />
              </div>

              {/* Task 5: Operation Name Autocomplete & Create */}
              <div className="field mb-0 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#14213D]">Operation Name</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewOpForm({ name: opName || '', category: 'Molding', setupMin: setupTimeMin, cycleSec: cycleTimeSec });
                      setIsCreateOpModalOpen(true);
                    }}
                    className="text-[10px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="w-2.5 h-2.5" /> Create Operation
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={opName}
                    onFocus={() => setIsOpDropdownOpen(true)}
                    onChange={(e) => {
                      setOpName(e.target.value);
                      setIsOpDropdownOpen(true);
                    }}
                    placeholder="Search or enter operation..."
                    className="w-full text-xs py-1.5 px-2 pr-6 border rounded"
                  />
                  <ChevronDown
                    className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none cursor-pointer"
                    onClick={() => setIsOpDropdownOpen(!isOpDropdownOpen)}
                  />
                </div>

                {isOpDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E4E0D6] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                      <div className="p-1 border-b border-gray-100 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500 font-semibold px-2">
                        <span>Select Operation or Create New</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpDropdownOpen(false);
                            setNewOpForm({ name: opName || '', category: 'Molding', setupMin: setupTimeMin, cycleSec: cycleTimeSec });
                            setIsCreateOpModalOpen(true);
                          }}
                          className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" /> + New in Admin
                        </button>
                      </div>
                      {filteredOps.map((op) => (
                        <div
                          key={op.id}
                          onClick={() => {
                            setOpName(op.name);
                            setOpType(op.category);
                            if (op.defaultSetupMin) setSetupTimeMin(op.defaultSetupMin);
                            if (op.defaultCycleSec) setCycleTimeSec(op.defaultCycleSec);
                            setIsOpDropdownOpen(false);
                          }}
                          className="px-2.5 py-1.5 hover:bg-teal-50 cursor-pointer text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{op.name}</div>
                            <div className="text-[10px] text-gray-500">{op.category}</div>
                          </div>
                          {op.defaultCycleSec && (
                            <span className="text-[10px] font-mono text-gray-500">{op.defaultCycleSec}s cycle</span>
                          )}
                        </div>
                      ))}
                      {filteredOps.length === 0 && (
                        <div className="p-3 text-center text-gray-500 text-xs">
                          No matching operations.
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpDropdownOpen(false);
                              setNewOpForm({ name: opName, category: 'Molding', setupMin: setupTimeMin, cycleSec: cycleTimeSec });
                              setIsCreateOpModalOpen(true);
                            }}
                            className="block mx-auto mt-1.5 text-xs text-teal-700 font-bold hover:underline"
                          >
                            + Create "{opName}" as new Operation
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Task 5: Work Center Autocomplete & Create */}
              <div className="field mb-0 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#14213D]">Work Center</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewWcForm({ code: '', name: workCenter || '', plant: 'PLANT-01', ratePerHour: 65 });
                      setIsCreateWcModalOpen(true);
                    }}
                    className="text-[10px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="w-2.5 h-2.5" /> Create Work Center
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={workCenter}
                    onFocus={() => setIsWcDropdownOpen(true)}
                    onChange={(e) => {
                      setWorkCenter(e.target.value);
                      setIsWcDropdownOpen(true);
                    }}
                    placeholder="Search or enter work center..."
                    className="w-full text-xs py-1.5 px-2 pr-6 border rounded"
                  />
                  <ChevronDown
                    className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none cursor-pointer"
                    onClick={() => setIsWcDropdownOpen(!isWcDropdownOpen)}
                  />
                </div>

                {isWcDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsWcDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E4E0D6] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                      <div className="p-1 border-b border-gray-100 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500 font-semibold px-2">
                        <span>Select Work Center</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsWcDropdownOpen(false);
                            setNewWcForm({ code: '', name: workCenter || '', plant: 'PLANT-01', ratePerHour: 65 });
                            setIsCreateWcModalOpen(true);
                          }}
                          className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" /> + New in Admin
                        </button>
                      </div>
                      {filteredWcs.map((wc) => (
                        <div
                          key={wc.id}
                          onClick={() => {
                            setWorkCenter(wc.name);
                            setIsWcDropdownOpen(false);
                          }}
                          className="px-2.5 py-1.5 hover:bg-teal-50 cursor-pointer text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{wc.name}</div>
                            <div className="text-[10px] text-gray-500">{wc.plant} &bull; ${wc.ratePerHour}/hr</div>
                          </div>
                        </div>
                      ))}
                      {filteredWcs.length === 0 && (
                        <div className="p-3 text-center text-gray-500 text-xs">
                          No matching work centers.
                          <button
                            type="button"
                            onClick={() => {
                              setIsWcDropdownOpen(false);
                              setNewWcForm({ code: '', name: workCenter, plant: 'PLANT-01', ratePerHour: 65 });
                              setIsCreateWcModalOpen(true);
                            }}
                            className="block mx-auto mt-1.5 text-xs text-teal-700 font-bold hover:underline"
                          >
                            + Create "{workCenter}" as new Work Center
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Task 5: Machine / Line Autocomplete & Create */}
              <div className="field mb-0 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#14213D]">Machine / Line</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewMchForm({ code: '', name: machineId || '', brand: 'Engel', tonnage: 250 });
                      setIsCreateMchModalOpen(true);
                    }}
                    className="text-[10px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="w-2.5 h-2.5" /> Create Machine
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={machineId}
                    onFocus={() => setIsMchDropdownOpen(true)}
                    onChange={(e) => {
                      setMachineId(e.target.value);
                      setIsMchDropdownOpen(true);
                    }}
                    placeholder="Search or enter machine..."
                    className="w-full text-xs py-1.5 px-2 pr-6 border rounded"
                  />
                  <ChevronDown
                    className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none cursor-pointer"
                    onClick={() => setIsMchDropdownOpen(!isMchDropdownOpen)}
                  />
                </div>

                {isMchDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsMchDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E4E0D6] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                      <div className="p-1 border-b border-gray-100 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500 font-semibold px-2">
                        <span>Select Machine / Press</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMchDropdownOpen(false);
                            setNewMchForm({ code: '', name: machineId || '', brand: 'Engel', tonnage: 250 });
                            setIsCreateMchModalOpen(true);
                          }}
                          className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" /> + New in Admin
                        </button>
                      </div>
                      {filteredMchs.map((mch) => (
                        <div
                          key={mch.id}
                          onClick={() => {
                            setMachineId(mch.name);
                            setIsMchDropdownOpen(false);
                          }}
                          className="px-2.5 py-1.5 hover:bg-teal-50 cursor-pointer text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{mch.name}</div>
                            <div className="text-[10px] text-gray-500">{mch.brand} &bull; {mch.tonnage} Ton Press</div>
                          </div>
                        </div>
                      ))}
                      {filteredMchs.length === 0 && (
                        <div className="p-3 text-center text-gray-500 text-xs">
                          No matching machines.
                          <button
                            type="button"
                            onClick={() => {
                              setIsMchDropdownOpen(false);
                              setNewMchForm({ code: '', name: machineId, brand: 'Engel', tonnage: 250 });
                              setIsCreateMchModalOpen(true);
                            }}
                            className="block mx-auto mt-1.5 text-xs text-teal-700 font-bold hover:underline"
                          >
                            + Register "{machineId}" as new Machine
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Task 5: Mold Tool Number Autocomplete & Create */}
              <div className="field mb-0 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#14213D]">Mold Tool Number</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewMoldForm({
                        code: '',
                        name: moldId || '',
                        cavities: cavities || 4,
                        runnerType: 'Hot Runner (Valve Gated)',
                      });
                      setIsCreateMoldModalOpen(true);
                    }}
                    className="text-[10px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="w-2.5 h-2.5" /> Create Mold
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={moldId}
                    onFocus={() => setIsMoldDropdownOpen(true)}
                    onChange={(e) => {
                      setMoldId(e.target.value);
                      setIsMoldDropdownOpen(true);
                    }}
                    placeholder="Search or enter mold..."
                    className="w-full text-xs font-mono py-1.5 px-2 pr-6 border rounded"
                  />
                  <ChevronDown
                    className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none cursor-pointer"
                    onClick={() => setIsMoldDropdownOpen(!isMoldDropdownOpen)}
                  />
                </div>

                {isMoldDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsMoldDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E4E0D6] rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                      <div className="p-1 border-b border-gray-100 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500 font-semibold px-2">
                        <span>Select Mold Tool</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoldDropdownOpen(false);
                            setNewMoldForm({
                              code: '',
                              name: moldId || '',
                              cavities: cavities || 4,
                              runnerType: 'Hot Runner (Valve Gated)',
                            });
                            setIsCreateMoldModalOpen(true);
                          }}
                          className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" /> + New in Admin
                        </button>
                      </div>
                      {filteredMolds.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setMoldId(m.name);
                            if (m.cavities) setCavities(m.cavities);
                            setIsMoldDropdownOpen(false);
                          }}
                          className="px-2.5 py-1.5 hover:bg-teal-50 cursor-pointer text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold font-mono text-gray-900">{m.name}</div>
                            <div className="text-[10px] text-gray-500">{m.runnerType}</div>
                          </div>
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {m.cavities} Cavities
                          </span>
                        </div>
                      ))}
                      {filteredMolds.length === 0 && (
                        <div className="p-3 text-center text-gray-500 text-xs">
                          No matching molds.
                          <button
                            type="button"
                            onClick={() => {
                              setIsMoldDropdownOpen(false);
                              setNewMoldForm({
                                code: '',
                                name: moldId,
                                cavities: cavities || 4,
                                runnerType: 'Hot Runner (Valve Gated)',
                              });
                              setIsCreateMoldModalOpen(true);
                            }}
                            className="block mx-auto mt-1.5 text-xs text-teal-700 font-bold hover:underline"
                          >
                            + Register "{moldId}" as new Mold Tool
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Task 5: Number of Cavities (Auto-filled from Parent Item) */}
              <div className="field mb-0">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#14213D]">Number of Cavities</label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Auto-filled from Item
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={cavities}
                  onChange={(e) => setCavities(parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-mono font-bold py-1.5 px-2 border border-emerald-300 bg-emerald-50/30 rounded"
                />
              </div>

              {/* Task 5: Cycle Time (Auto-filled from Parent Item) */}
              <div className="field mb-0">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#14213D]">Cycle Time (seconds)</label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Auto-filled from Item
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={cycleTimeSec}
                  onChange={(e) => setCycleTimeSec(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold py-1.5 px-2 border border-emerald-300 bg-emerald-50/30 rounded"
                />
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Setup Time (minutes)</label>
                <input
                  type="number"
                  value={setupTimeMin}
                  onChange={(e) => setSetupTimeMin(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-mono py-1.5 px-2 border rounded"
                />
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Crew Size &amp; Labor Skill</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={crewSize}
                    onChange={(e) => setCrewSize(parseInt(e.target.value) || 1)}
                    className="w-16 text-xs font-mono py-1.5 px-2 border rounded"
                  />
                  <input
                    type="text"
                    value={laborSkill}
                    onChange={(e) => setLaborSkill(e.target.value)}
                    className="flex-1 text-xs py-1.5 px-2 border rounded"
                  />
                </div>
              </div>

              <div className="field mb-0 sm:col-span-2">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Operator Instructions</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full text-xs p-2 border rounded resize-none"
                />
              </div>

              <div className="field mb-0 sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qualityCheckpoint}
                    onChange={(e) => setQualityCheckpoint(e.target.checked)}
                    className="rounded text-[#0F8B8D]"
                  />
                  <span className="font-bold text-[#14213D]">Mark as mandatory Quality Sign-off Checkpoint</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#E4E0D6] pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="btn btn-sm btn-primary text-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Save Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task 5 Modal: Create New Operation Master */}
      {isCreateOpModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Factory className="w-4 h-4 text-teal-600" />
                Create Operation in Admin Master Data
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewOperation} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">
                  Operation Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newOpForm.name}
                  onChange={(e) => setNewOpForm({ ...newOpForm, name: e.target.value })}
                  placeholder="e.g. Ultrasonic Welding & Leak Test"
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Operation Category</label>
                <select
                  value={newOpForm.category}
                  onChange={(e) => setNewOpForm({ ...newOpForm, category: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white"
                >
                  <option value="Primary Molding">Primary Molding</option>
                  <option value="Secondary Finishing">Secondary Finishing</option>
                  <option value="Assembly & Welding">Assembly &amp; Welding</option>
                  <option value="Inspection & Quality">Inspection &amp; Quality</option>
                  <option value="Pack-out">Pack-out &amp; Palletization</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Default Setup (min)</label>
                  <input
                    type="number"
                    value={newOpForm.setupMin}
                    onChange={(e) => setNewOpForm({ ...newOpForm, setupMin: Number(e.target.value) || 0 })}
                    className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Default Cycle (sec)</label>
                  <input
                    type="number"
                    value={newOpForm.cycleSec}
                    onChange={(e) => setNewOpForm({ ...newOpForm, cycleSec: Number(e.target.value) || 0 })}
                    className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpModalOpen(false)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary bg-teal-700 hover:bg-teal-800 text-white text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save &amp; Select Operation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task 5 Modal: Create New Work Center Master */}
      {isCreateWcModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Factory className="w-4 h-4 text-teal-600" />
                Create Work Center in Admin Master Data
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateWcModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewWorkCenter} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Work Center Code</label>
                  <input
                    type="text"
                    value={newWcForm.code}
                    onChange={(e) => setNewWcForm({ ...newWcForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. WC-INJ-07"
                    className="w-full text-xs font-mono py-2 px-3 border border-[#E4E0D6] rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Operating Plant</label>
                  <select
                    value={newWcForm.plant}
                    onChange={(e) => setNewWcForm({ ...newWcForm, plant: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white"
                  >
                    <option value="PLANT-01">PLANT-01 (Main Injection Plant)</option>
                    <option value="PLANT-02">PLANT-02 (Precision Tooling)</option>
                    <option value="PLANT-03">PLANT-03 (Automotive Cell)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">
                  Work Center Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newWcForm.name}
                  onChange={(e) => setNewWcForm({ ...newWcForm, name: e.target.value })}
                  placeholder="e.g. 500T Cleanroom Injection Bay"
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Standard Machine Rate ($/hr)</label>
                <input
                  type="number"
                  value={newWcForm.ratePerHour}
                  onChange={(e) => setNewWcForm({ ...newWcForm, ratePerHour: Number(e.target.value) || 0 })}
                  className="w-full text-xs font-mono py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
                <button
                  type="button"
                  onClick={() => setIsCreateWcModalOpen(false)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary bg-teal-700 hover:bg-teal-800 text-white text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save &amp; Select Work Center
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task 5 Modal: Register New Machine / Line Master */}
      {isCreateMchModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-600" />
                Register Machine in Admin Master Data
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateMchModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewMachine} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Machine Code</label>
                  <input
                    type="text"
                    value={newMchForm.code}
                    onChange={(e) => setNewMchForm({ ...newMchForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. IMM-350-07"
                    className="w-full text-xs font-mono py-2 px-3 border border-[#E4E0D6] rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Clamping Tonnage (Tons)</label>
                  <input
                    type="number"
                    value={newMchForm.tonnage}
                    onChange={(e) => setNewMchForm({ ...newMchForm, tonnage: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-mono py-2 px-3 border border-[#E4E0D6] rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">
                  Machine / Line Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMchForm.name}
                  onChange={(e) => setNewMchForm({ ...newMchForm, name: e.target.value })}
                  placeholder="e.g. IMM 350T - Line 7 (KraussMaffei CX)"
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Manufacturer Brand</label>
                <input
                  type="text"
                  value={newMchForm.brand}
                  onChange={(e) => setNewMchForm({ ...newMchForm, brand: e.target.value })}
                  placeholder="e.g. Engel, KraussMaffei, Sumitomo, Haitian"
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
                <button
                  type="button"
                  onClick={() => setIsCreateMchModalOpen(false)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary bg-teal-700 hover:bg-teal-800 text-white text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save &amp; Select Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task 5 Modal: Register New Mold Tool Master */}
      {isCreateMoldModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-teal-600" />
                Register Mold Tool in Admin Master Data
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateMoldModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewMold} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Mold Tool Code</label>
                  <input
                    type="text"
                    value={newMoldForm.code}
                    onChange={(e) => setNewMoldForm({ ...newMoldForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. MOLD-INJ-210"
                    className="w-full text-xs font-mono py-2 px-3 border border-[#E4E0D6] rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">
                    Number of Cavities <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMoldForm.cavities}
                    onChange={(e) => setNewMoldForm({ ...newMoldForm, cavities: Number(e.target.value) || 1 })}
                    className="w-full text-xs font-mono py-2 px-3 border border-[#E4E0D6] rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">
                  Mold Tool Name / Description <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMoldForm.name}
                  onChange={(e) => setNewMoldForm({ ...newMoldForm, name: e.target.value })}
                  placeholder="e.g. 4-Cavity Hot Runner Medical Vial"
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Runner System Type</label>
                <select
                  value={newMoldForm.runnerType}
                  onChange={(e) => setNewMoldForm({ ...newMoldForm, runnerType: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white"
                >
                  <option value="Hot Runner (Valve Gated)">Hot Runner (Valve Gated)</option>
                  <option value="Hot Runner (Thermal Gated)">Hot Runner (Thermal Gated)</option>
                  <option value="Cold Runner (2-Plate Submarine)">Cold Runner (2-Plate Submarine)</option>
                  <option value="Cold Runner (3-Plate Pin-Point)">Cold Runner (3-Plate Pin-Point)</option>
                  <option value="Insulated Runner">Insulated Runner</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
                <button
                  type="button"
                  onClick={() => setIsCreateMoldModalOpen(false)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary bg-teal-700 hover:bg-teal-800 text-white text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save &amp; Select Mold Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
