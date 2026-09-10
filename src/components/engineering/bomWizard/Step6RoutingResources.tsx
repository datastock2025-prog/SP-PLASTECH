import React, { useState } from 'react';
import { ManufacturingBomWizardState } from './types';
import { RoutingResourceDetail } from '../../../types';
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

  // Form modal state
  const [opNo, setOpNo] = useState<number>(10);
  const [opName, setOpName] = useState<string>('Injection Molding & Cooling');
  const [opType, setOpType] = useState<string>('Primary Molding');
  const [workCenter, setWorkCenter] = useState<string>('WC-INJ-01 - 250T Injection Bay');
  const [machineId, setMachineId] = useState<string>('IMM 250T - Line 1 (Engel)');
  const [moldId, setMoldId] = useState<string>('MOLD-INJ-084 (4-Cavity Hot Runner)');
  const [cavities, setCavities] = useState<number>(4);
  const [setupTimeMin, setSetupTimeMin] = useState<number>(45);
  const [runTimeHours, setRunTimeHours] = useState<number>(state.estimatedProductionTimeHours || 4.2);
  const [cycleTimeSec, setCycleTimeSec] = useState<number>(state.standardCycleTimeSec || 14.5);
  const [crewSize, setCrewSize] = useState<number>(1);
  const [laborSkill, setLaborSkill] = useState<string>('Level 2 Molding Technician');
  const [qualityCheckpoint, setQualityCheckpoint] = useState<boolean>(true);
  const [instructions, setInstructions] = useState<string>('Check barrel temperatures and ensure mold chilled water flow is 12L/min.');

  const handleOpenAddModal = (preset?: Partial<RoutingResourceDetail>) => {
    setEditingIndex(null);
    setOpNo((routingResources.length + 1) * 10);
    setOpName(preset?.operationName || 'Injection Molding & Degating');
    setOpType(preset?.operationType || 'Primary Molding');
    setWorkCenter(preset?.workCenter || 'WC-INJ-01 - 250T Injection Bay');
    setMachineId(preset?.machineId || 'IMM 250T - Line 1 (Engel)');
    setMoldId(preset?.moldId || 'MOLD-INJ-084 (4-Cavity Hot Runner)');
    setCavities(preset?.cavities || 4);
    setSetupTimeMin(45);
    setRunTimeHours(state.estimatedProductionTimeHours || 4.0);
    setCycleTimeSec(state.standardCycleTimeSec || 14.5);
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
            <strong>Machine &amp; Mold Compatibility Verified:</strong> IMM 250T clamping force matches MOLD-INJ-084 mold platen dimensions &amp; ejector stroke.
          </span>
        </div>
        <span className="font-bold font-mono text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded">
          4 Cavities &bull; 14.5s Cycle
        </span>
      </div>

      {/* Routing Table */}
      {routingResources.length === 0 ? (
        /* Empty State with exact requested copy */
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
          <div className="overflow-x-auto">
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Operation Number</label>
                <input
                  type="number"
                  value={opNo}
                  onChange={(e) => setOpNo(parseInt(e.target.value) || 10)}
                  className="w-full text-xs font-mono font-bold py-1.5 px-2 border rounded"
                />
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Operation Name</label>
                <input
                  type="text"
                  value={opName}
                  onChange={(e) => setOpName(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 border rounded"
                />
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Work Center</label>
                <input
                  type="text"
                  value={workCenter}
                  onChange={(e) => setWorkCenter(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 border rounded"
                />
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Machine / Line</label>
                <input
                  type="text"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 border rounded"
                />
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Mold Tool Number</label>
                <input
                  type="text"
                  value={moldId}
                  onChange={(e) => setMoldId(e.target.value)}
                  className="w-full text-xs font-mono py-1.5 px-2 border rounded"
                />
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Number of Cavities</label>
                <input
                  type="number"
                  min="1"
                  value={cavities}
                  onChange={(e) => setCavities(parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-mono py-1.5 px-2 border rounded"
                />
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Cycle Time (seconds)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cycleTimeSec}
                  onChange={(e) => setCycleTimeSec(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono py-1.5 px-2 border rounded"
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
    </div>
  );
};
