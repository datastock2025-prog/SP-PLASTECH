import React, { useState } from 'react';
import { WorkOrder, MachineMaster, ItemMaster, BomMaster } from '../../types';
import { MoldMaster } from '../../data/manufacturingData';
import {
  Sparkles,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  FileSpreadsheet,
  Zap,
  Check
} from 'lucide-react';

interface BulkWizardProps {
  machines: MachineMaster[];
  items: ItemMaster[];
  boms: BomMaster[];
  molds: MoldMaster[];
  onGenerateBulk: (newOrders: WorkOrder[]) => void;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const BulkWizardModal: React.FC<BulkWizardProps> = ({
  machines,
  items,
  boms,
  molds,
  onGenerateBulk,
  onClose,
  showToast,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1 State
  const [planDate, setPlanDate] = useState<string>('2026-08-28');
  const [planBasis, setPlanBasis] = useState<string>('single_day');

  // Step 2 State
  const [selectedShifts, setSelectedShifts] = useState<string[]>(['Shift A', 'Shift B']);
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([
    'IMM-250T-03', 'IMM-450T-01', 'EXT-LINE-02'
  ]);

  // Step 3 State: Items selected
  const fgItems = items.filter((i) => i.type === 'Finished Good');
  const [selectedItemCodes, setSelectedItemCodes] = useState<string[]>([
    'FG-CTN-500', 'FG-HD-TUB-01', 'FG-PET-030'
  ]);

  // Step 4 State: Batch size per WO
  const [batchQtyPerWO, setBatchQtyPerWO] = useState<number>(2500);
  const [totalOrdersToCreate, setTotalOrdersToCreate] = useState<number>(25);

  // Step 5 State: Warehouse locations
  const [inputWh, setInputWh] = useState<string>('RM-WH-01');
  const [outputWh, setOutputWh] = useState<string>('FG-WH-01');

  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;

  // Generate preview list
  const generatedPreviewList: WorkOrder[] = React.useMemo(() => {
    const orders: WorkOrder[] = [];
    const baseDateNum = planDate.replace(/-/g, '');

    for (let i = 1; i <= totalOrdersToCreate; i++) {
      const itemCode = selectedItemCodes[(i - 1) % selectedItemCodes.length] || 'FG-CTN-500';
      const machineId = selectedMachineIds[(i - 1) % selectedMachineIds.length] || 'IMM-250T-03';
      const shift = selectedShifts[(i - 1) % selectedShifts.length] || 'Shift A';
      const bom = boms.find((b) => b.parent === itemCode && b.status === 'released') || boms[0];
      const seqStr = String(i).padStart(3, '0');
      const woId = `WO-${baseDateNum}-${seqStr}`;

      orders.push({
        id: woId,
        item: itemCode,
        bomId: bom?.id || 'BOM-1042',
        machine: machineId,
        day: 'Fri',
        qty: batchQtyPerWO,
        uom: 'PCS',
        completed: 0,
        scrap: 0,
        status: 'planned',
        priority: i % 4 === 0 ? 'High' : 'Medium',
        dueDate: planDate,
        operator: i % 2 === 0 ? 'R. Kumar' : 'A. Sharma',
        downtimeMin: 0,
        mold: 'MLD-1001',
        jitSeq: i,
        shift,
        planDate,
        cycleTimeStd: 12.0,
        locInput: inputWh,
        locOutput: outputWh,
        outputLogs: [],
        downtimeLogs: [],
        checklist: [
          { label: 'Visual inspection — no flash/burrs', done: false },
          { label: 'Wall thickness within tolerance', done: false },
          { label: 'Weight check (±2g)', done: false },
        ],
        history: [{ event: 'Bulk created via JIT Wizard', time: 'Just now' }],
      });
    }
    return orders;
  }, [totalOrdersToCreate, selectedItemCodes, selectedMachineIds, selectedShifts, batchQtyPerWO, planDate, inputWh, outputWh, boms]);

  const handleFinish = () => {
    onGenerateBulk(generatedPreviewList);
    showToast(`Successfully created ${generatedPreviewList.length} Work Orders under date ${planDate}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E4E0D6] max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header & Stepper */}
        <div className="p-6 bg-[#FAFAF8] border-b border-[#E4E0D6] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Bulk Work Order Generator (100+ Orders Engine)
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#14213D]">
              Step {currentStep} of 6: {
                currentStep === 1 ? 'Planning Basis & Date' :
                currentStep === 2 ? 'Shifts & Bay Allocation' :
                currentStep === 3 ? 'Item Selection & BOM Check' :
                currentStep === 4 ? 'Batch Sizes & Cycle Times' :
                currentStep === 5 ? 'Warehouse Routing & Material' :
                'Review & Generate 100+ Work Orders'
              }
            </h2>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="px-6 pt-3 flex gap-1.5 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((st) => (
            <div
              key={st}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                st === currentStep
                  ? 'bg-purple-600'
                  : st < currentStep
                  ? 'bg-emerald-500'
                  : 'bg-[#E4E0D6]'
              }`}
            />
          ))}
        </div>

        {/* Step Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-[#14213D] block mb-1">Production Planning Date</label>
                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E4E0D6] bg-white font-bold text-sm text-[#14213D]"
                />
              </div>

              <div>
                <label className="font-bold text-[#14213D] block mb-1">Planning Basis</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'single_day', title: 'Single Day Multi-Batch Schedule', desc: 'Create 10 to 100+ work orders for all shifts on this date' },
                    { id: 'so_backlog', title: 'Sales Order Backlog Demand', desc: 'Auto-explode pending customer orders into shop floor WOs' }
                  ].map((basis) => (
                    <div
                      key={basis.id}
                      onClick={() => setPlanBasis(basis.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        planBasis === basis.id ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20' : 'bg-[#F6F4EF] border-[#E4E0D6]'
                      }`}
                    >
                      <div className="font-bold text-[#14213D]">{basis.title}</div>
                      <div className="text-[11px] text-[#6B7280] mt-1">{basis.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-[#14213D] block mb-1">Select Shifts to Schedule</label>
                <div className="flex gap-2">
                  {['Shift A', 'Shift B', 'Shift C'].map((sh) => {
                    const isSelected = selectedShifts.includes(sh);
                    return (
                      <button
                        key={sh}
                        onClick={() => {
                          setSelectedShifts((prev) =>
                            isSelected ? prev.filter((s) => s !== sh) : [...prev, sh]
                          );
                        }}
                        className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                          isSelected ? 'bg-[#0F8B8D] text-white border-[#0F8B8D]' : 'bg-[#F6F4EF] text-[#6B7280] border-[#E4E0D6]'
                        }`}
                      >
                        {sh}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-[#14213D] block mb-1">Target Production Machines / Bays</label>
                <div className="grid grid-cols-2 gap-2">
                  {machines.filter(m => m.type.includes('Molding') || m.type.includes('Extrusion')).map((m) => {
                    const isSelected = selectedMachineIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMachineIds((prev) =>
                            isSelected ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                          );
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${
                          isSelected ? 'bg-purple-50 border-purple-300' : 'bg-[#F6F4EF] border-[#E4E0D6]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-[#14213D]">{m.id}</div>
                          <div className="text-[10px] text-[#6B7280]">{m.name}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-700 font-bold" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <label className="font-bold text-[#14213D] block mb-1">Select Products / Finished Goods</label>
              <div className="space-y-2">
                {fgItems.map((item) => {
                  const isSelected = selectedItemCodes.includes(item.code);
                  const bom = boms.find((b) => b.parent === item.code);
                  return (
                    <div
                      key={item.code}
                      onClick={() => {
                        setSelectedItemCodes((prev) =>
                          isSelected ? prev.filter((c) => c !== item.code) : [...prev, item.code]
                        );
                      }}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${
                        isSelected ? 'bg-purple-50 border-purple-300' : 'bg-[#F6F4EF] border-[#E4E0D6]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-[#14213D]">{item.name}</div>
                        <div className="text-[11px] font-mono text-[#6B7280]">{item.code} &bull; BOM: {bom ? bom.id : 'No BOM'}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${bom ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {bom ? 'BOM Validated' : 'Missing BOM'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#14213D] block mb-1">Target Quantity Per Work Order</label>
                  <input
                    type="number"
                    value={batchQtyPerWO}
                    onChange={(e) => setBatchQtyPerWO(parseInt(e.target.value) || 100)}
                    className="w-full p-3 rounded-xl border border-[#E4E0D6] font-mono font-bold text-sm text-[#14213D]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#14213D] block mb-1">Number of Work Orders to Generate</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={totalOrdersToCreate}
                    onChange={(e) => setTotalOrdersToCreate(Math.min(120, parseInt(e.target.value) || 1))}
                    className="w-full p-3 rounded-xl border border-[#E4E0D6] font-mono font-bold text-sm text-purple-700"
                  />
                  <div className="text-[10px] text-[#6B7280] mt-1">Supports up to 120 work orders in a single bulk batch.</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5 */}
          {currentStep === 5 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#14213D] block mb-1">Raw Material Stage Warehouse</label>
                <select
                  value={inputWh}
                  onChange={(e) => setInputWh(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E4E0D6] bg-white font-semibold"
                >
                  <option value="RM-WH-01">RM-WH-01 (Main Silo / Resin WH)</option>
                  <option value="RM-WH-02">RM-WH-02 (Additive &amp; Masterbatch)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#14213D] block mb-1">Finished Goods Putaway Warehouse</label>
                <select
                  value={outputWh}
                  onChange={(e) => setOutputWh(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E4E0D6] bg-white font-semibold"
                >
                  <option value="FG-WH-01">FG-WH-01 (Primary Staging Bay)</option>
                  <option value="FG-WH-02">FG-WH-02 (Export Dock Warehouse)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 6 */}
          {currentStep === 6 && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950">
                <b>Ready to Generate:</b> {generatedPreviewList.length} Work Orders will be created under date <b>{planDate}</b> across {selectedShifts.length} shifts.
              </div>

              <div className="max-h-60 overflow-y-auto border border-[#E4E0D6] rounded-xl">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-[#F6F4EF] sticky top-0">
                    <tr>
                      <th className="p-2 text-left font-bold">WO #</th>
                      <th className="p-2 text-left font-bold">Item</th>
                      <th className="p-2 text-left font-bold">Machine</th>
                      <th className="p-2 text-left font-bold">Shift</th>
                      <th className="p-2 text-right font-bold">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedPreviewList.slice(0, 15).map((wo) => (
                      <tr key={wo.id} className="border-b border-[#E4E0D6]">
                        <td className="p-2 font-mono font-bold text-[#0F8B8D]">{wo.id}</td>
                        <td className="p-2 font-medium">{itemName(wo.item)}</td>
                        <td className="p-2 font-mono">{wo.machine}</td>
                        <td className="p-2">{wo.shift}</td>
                        <td className="p-2 text-right font-mono font-bold">{wo.qty.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {generatedPreviewList.length > 15 && (
                <div className="text-center text-[11px] text-[#6B7280]">
                  + {generatedPreviewList.length - 15} more work orders in this bulk creation batch...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#FAFAF8] border-t border-[#E4E0D6] flex justify-between items-center">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center gap-1 text-[#14213D]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : <div />}

          {currentStep < 6 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1 shadow-md"
            >
              Next Step &rarr;
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4 font-bold" /> Generate {generatedPreviewList.length} Work Orders Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
