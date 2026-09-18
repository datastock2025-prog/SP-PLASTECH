import React, { useState } from 'react';
import { ManufacturingBomWizardState } from './types';
import { SecondaryOperationDetail, ItemMaster } from '../../../types';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Tag,
  Scissors,
  Check,
  X,
  Package,
  Boxes,
  MapPin,
} from 'lucide-react';

interface Step5Props {
  state: ManufacturingBomWizardState;
  items: ItemMaster[];
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
  showToast: (msg: string) => void;
}

export const Step5SecondaryOps: React.FC<Step5Props> = ({ state, items, onChange, showToast }) => {
  const { secondaryOperations, parentItem } = state;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form modal fields
  const [partCode, setPartCode] = useState<string>('');
  const [partName, setPartName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [inputItem, setInputItem] = useState<string>(parentItem?.code || '');
  const [outputItem, setOutputItem] = useState<string>(parentItem?.code || '');
  const [operationType, setOperationType] = useState<SecondaryOperationDetail['operationType']>('Trimming');
  const [workCenter, setWorkCenter] = useState<string>('WC-SEC-01 - Post-Molding Finishing Cell');
  const [locationBefore, setLocationBefore] = useState<string>('WIP-STAGE-01');
  const [locationAfter, setLocationAfter] = useState<string>('SEC-AREA-01');
  const [stockStatusBefore, setStockStatusBefore] = useState<string>('WIP');
  const [stockStatusAfter, setStockStatusAfter] = useState<string>('Available');
  const [qualityCheckRequired, setQualityCheckRequired] = useState<boolean>(true);
  const [standardTimeMin, setStandardTimeMin] = useState<number>(2.5);
  const [scrapPct, setScrapPct] = useState<number>(0.5);
  const [inventoryImpact, setInventoryImpact] = useState<SecondaryOperationDetail['inventoryImpact']>('Same Item Status Update');

  // Task 4: Items & Consumables required for this secondary operation
  const [consumedComponents, setConsumedComponents] = useState<SecondaryOperationDetail['consumedComponents']>([]);

  const OPERATION_TYPES: SecondaryOperationDetail['operationType'][] = [
    'Trimming',
    'Degating',
    'Sticker Placement',
    'Labeling',
    'Printing',
    'Assembly',
    'Insert Fitting',
    'Welding',
    'Packing',
    'Inspection',
    'Quality sorting',
    'Rework',
    'Other',
  ];

  const handleOpenAddModal = (presetType?: SecondaryOperationDetail['operationType']) => {
    setEditingIndex(null);
    const op = presetType || 'Trimming';
    setOperationType(op);
    setPartCode(`SEC-${(op || '').toUpperCase().slice(0, 4)}-${secondaryOperations.length + 1}`);
    setPartName(`${op} for ${parentItem?.name || parentItem?.code || 'Finished Good'}`);
    setDescription(`Standard post-molding ${(op || '').toLowerCase()} step.`);
    setInputItem(parentItem?.code || '');
    setOutputItem(parentItem?.code || '');
    setWorkCenter('WC-SEC-01 - Post-Molding Finishing Cell');
    setLocationBefore('WIP-STAGE-01');
    setLocationAfter('SEC-AREA-01');
    setStockStatusBefore('WIP');
    setStockStatusAfter('Available');
    setQualityCheckRequired(true);
    setStandardTimeMin(2.5);
    setScrapPct(0.5);
    setInventoryImpact('Same Item Status Update');
    setConsumedComponents([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (idx: number) => {
    const op = secondaryOperations[idx];
    setEditingIndex(idx);
    setPartCode(op.partCode);
    setPartName(op.partName);
    setDescription(op.description);
    setInputItem(op.inputItem);
    setOutputItem(op.outputItem);
    setOperationType(op.operationType);
    setWorkCenter(op.workCenter);
    setLocationBefore(op.locationBefore);
    setLocationAfter(op.locationAfter);
    setStockStatusBefore(op.stockStatusBefore);
    setStockStatusAfter(op.stockStatusAfter);
    setQualityCheckRequired(op.qualityCheckRequired);
    setStandardTimeMin(op.standardTimeMin);
    setScrapPct(op.scrapPct);
    setInventoryImpact(op.inventoryImpact);
    setConsumedComponents(op.consumedComponents || []);
    setIsModalOpen(true);
  };

  // Consumed item management inside operation modal
  const handleAddConsumedItem = () => {
    const defaultItem = items.find((i) => i.type === 'Raw Material' || i.type === 'Consumable' || i.type === 'Packaging') || (items.length > 0 ? items[0] : null);
    const newItem = {
      itemCode: defaultItem?.code || `RAW-INSERT-${consumedComponents.length + 1}`,
      itemName: defaultItem?.name || 'Secondary Consumable Item',
      qty: 1,
      uom: defaultItem?.baseUOM || 'PCS',
      scrapPct: 0,
      issueMethod: 'Backflush',
      locationCode: locationBefore || 'WIP-STAGE-01',
      substituteAllowed: true,
    };
    setConsumedComponents([...consumedComponents, newItem]);
  };

  const handleUpdateConsumedItem = (index: number, patch: Partial<SecondaryOperationDetail['consumedComponents'][0]>) => {
    const updated = [...consumedComponents];
    updated[index] = { ...updated[index], ...patch };
    setConsumedComponents(updated);
  };

  const handleRemoveConsumedItem = (index: number) => {
    setConsumedComponents(consumedComponents.filter((_, i) => i !== index));
  };

  const handleSaveModal = () => {
    const newOp: SecondaryOperationDetail = {
      id: editingIndex !== null ? secondaryOperations[editingIndex].id : `SEC-OP-${Date.now()}`,
      sequence: (secondaryOperations.length + 1) * 10,
      partCode: partCode || `SEC-${Date.now()}`,
      partName: partName || 'Secondary Operation',
      description,
      inputItem,
      outputItem,
      operationType,
      workCenter,
      locationBefore,
      locationAfter,
      stockStatusBefore,
      stockStatusAfter,
      qualityCheckRequired,
      standardTimeMin,
      scrapPct,
      inventoryImpact,
      consumedComponents,
    };

    let updated: SecondaryOperationDetail[];
    if (editingIndex !== null) {
      updated = [...secondaryOperations];
      updated[editingIndex] = newOp;
      showToast(`Updated operation ${newOp.operationType} with ${consumedComponents.length} required items`);
    } else {
      updated = [...secondaryOperations, newOp];
      showToast(`Added secondary operation ${newOp.operationType} with ${consumedComponents.length} required items`);
    }

    onChange({ secondaryOperations: updated });
    setIsModalOpen(false);
  };

  const handleRemove = (idx: number) => {
    const updated = secondaryOperations.filter((_, i) => i !== idx);
    onChange({ secondaryOperations: updated });
    showToast('Secondary operation removed');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E0D6] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#14213D]">Secondary Operations &amp; Assembly Details</h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-orange-100 text-[#E8622C] border border-orange-200">
              Optional / Post-Molding
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Define trimming, degating, sticker placement, pad printing, and subassembly transformations with required bill of materials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAddModal('Trimming')}
            className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs"
          >
            + Trimming
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('Sticker Placement')}
            className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs"
          >
            + Sticker
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('Assembly')}
            className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Operation
          </button>
        </div>
      </div>

      {/* Visual Operation Flow Diagram */}
      {secondaryOperations.length > 0 && (
        <div className="p-4 bg-[#F9F8F5] border border-[#E4E0D6] rounded-xl space-y-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
            Visual Process Sequence:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs font-mono scrollbar-none">
            {/* Initial molded part */}
            <div className="px-3 py-1.5 rounded-lg bg-white border border-[#E4E0D6] font-bold text-[#14213D] shrink-0">
              {parentItem?.code || 'Molded Part'} (Molded)
            </div>

            {secondaryOperations.map((op) => (
              <React.Fragment key={op.id}>
                <ArrowRight className="w-4 h-4 text-[#E8622C] shrink-0" />
                <div className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-950 font-bold shrink-0 flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 text-[#E8622C]" />
                  <span>
                    Op {op.sequence}: {op.operationType}
                    {(op.consumedComponents || []).length > 0 && ` (${op.consumedComponents.length} items)`}
                  </span>
                </div>
              </React.Fragment>
            ))}

            <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 font-bold text-emerald-950 shrink-0">
              {parentItem?.code || 'Ready Part'} (Ready for FG)
            </div>
          </div>
        </div>
      )}

      {/* Operations List / Table */}
      {secondaryOperations.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-[#E4E0D6] space-y-3">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#E8622C] flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#14213D]">No secondary operations configured</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              If this item requires trimming, degating, stickers, printing, inserts, or assembly items, add them here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAddModal('Trimming')}
            className="btn btn-sm btn-primary inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Secondary Operation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {secondaryOperations.map((op, idx) => (
            <div
              key={op.id}
              className="bg-white rounded-xl border border-[#E4E0D6] p-4 shadow-xs space-y-3 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    Seq {op.sequence}
                  </span>
                  <span className="font-bold text-sm text-[#14213D]">{op.partName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#E8622C]">
                    {op.operationType}
                  </span>
                  {op.qualityCheckRequired && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-blue-600" /> QC Checkpoint
                    </span>
                  )}
                  {(op.consumedComponents || []).length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                      <Package className="w-3 h-3 text-teal-600" />
                      {op.consumedComponents.length} Required Item{op.consumedComponents.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(idx)}
                    className="p-1.5 text-gray-400 hover:text-[#0F8B8D] rounded"
                    title="Edit Operation"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded"
                    title="Remove Operation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Detail fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Work Center</span>
                  <span className="font-semibold text-gray-800 truncate block">{op.workCenter}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Std Time</span>
                  <span className="font-mono font-bold text-amber-700">{op.standardTimeMin} mins</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Scrap Allowance</span>
                  <span className="font-mono font-bold text-rose-700">{op.scrapPct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Location Before ➔ After</span>
                  <span className="font-mono text-gray-700 text-[11px] truncate block">
                    {op.locationBefore} ➔ {op.locationAfter}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Inventory Impact</span>
                  <span className="font-semibold text-[#0F8B8D]">{op.inventoryImpact}</span>
                </div>
              </div>

              {/* Task 4: Display consumed items for this operation */}
              {(op.consumedComponents || []).length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Required Materials &amp; Consumables ({op.consumedComponents.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {op.consumedComponents.map((item, cIdx) => (
                      <div
                        key={cIdx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF9F5] border border-[#E4E0D6] text-xs"
                      >
                        <Package className="w-3.5 h-3.5 text-[#0F8B8D]" />
                        <span className="font-mono font-bold text-slate-800">{item.itemCode}</span>
                        <span className="text-slate-600">&mdash; {item.itemName}</span>
                        <span className="font-mono font-bold text-[#E8622C] bg-white px-1.5 py-0.2 rounded border shadow-2xs">
                          {item.qty} {item.uom}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit Secondary Operation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#E8622C]" />
                {editingIndex !== null ? 'Edit Secondary Operation' : 'Configure Secondary Operation'}
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
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Operation Type</label>
                <select
                  value={operationType}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    setOperationType(t);
                    setPartName(`${t} for ${parentItem?.name || parentItem?.code || 'Finished Good'}`);
                  }}
                  className="w-full text-xs py-1.5 px-2 border rounded bg-white font-semibold"
                >
                  {OPERATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Operation Name</label>
                <input
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
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
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Standard Cycle (mins)</label>
                <input
                  type="number"
                  step="0.1"
                  value={standardTimeMin}
                  onChange={(e) => setStandardTimeMin(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono py-1.5 px-2 border rounded"
                />
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Staging Before</label>
                <input
                  type="text"
                  value={locationBefore}
                  onChange={(e) => setLocationBefore(e.target.value)}
                  className="w-full text-xs font-mono py-1.5 px-2 border rounded"
                />
              </div>

              <div className="field mb-0">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Putaway After</label>
                <input
                  type="text"
                  value={locationAfter}
                  onChange={(e) => setLocationAfter(e.target.value)}
                  className="w-full text-xs font-mono py-1.5 px-2 border rounded"
                />
              </div>

              <div className="field mb-0 sm:col-span-2">
                <label className="text-[11px] font-bold text-[#14213D] block mb-1">Inventory Transformation Impact</label>
                <select
                  value={inventoryImpact}
                  onChange={(e) => setInventoryImpact(e.target.value as any)}
                  className="w-full text-xs py-1.5 px-2 border rounded bg-white"
                >
                  <option value="Same Item Status Update">Same Item Status Update (WIP ➔ Available)</option>
                  <option value="Transform to New Item">Transform to New Item Code (Parent Assembly)</option>
                  <option value="Move to New Location">Move to New Location Only (Physical Staging)</option>
                  <option value="No Inventory Impact">No Inventory Impact (Inline Touchup)</option>
                </select>
              </div>

              <div className="field mb-0 sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qualityCheckRequired}
                    onChange={(e) => setQualityCheckRequired(e.target.checked)}
                    className="rounded text-[#0F8B8D]"
                  />
                  <span className="font-bold text-[#14213D]">Require Quality Inspection Gate for this operation</span>
                </label>
              </div>

              {/* ========================================================================= */}
              {/* TASK 4: SMALL GRID WITH ADD BUTTON FOR ITEMS NEEDED IN SECONDARY PROCESS */}
              {/* ========================================================================= */}
              <div className="field mb-0 sm:col-span-2 border-t border-[#E4E0D6] pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#14213D] flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#0F8B8D]" />
                      Required Items / Materials for this Secondary Operation
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Add any threaded inserts, screws, decals, labels, boxes or packaging required in this step.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddConsumedItem}
                    className="px-2.5 py-1 bg-[#0F8B8D] hover:bg-[#0c7274] text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Item
                  </button>
                </div>

                <div className="border border-[#E4E0D6] rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-gray-600 font-bold text-[11px]">
                        <th className="p-2.5">Item Code &amp; Name</th>
                        <th className="p-2.5 w-24">Qty / Pc</th>
                        <th className="p-2.5 w-20">UOM</th>
                        <th className="p-2.5 w-24">Scrap %</th>
                        <th className="p-2.5 w-28">Location</th>
                        <th className="p-2.5 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E0D6] bg-white">
                      {consumedComponents.length > 0 ? (
                        consumedComponents.map((comp, cIdx) => (
                          <tr key={cIdx} className="hover:bg-gray-50/70">
                            <td className="p-2">
                              <select
                                value={comp.itemCode}
                                onChange={(e) => {
                                  const selected = items.find((i) => i.code === e.target.value);
                                  handleUpdateConsumedItem(cIdx, {
                                    itemCode: e.target.value,
                                    itemName: selected?.name || e.target.value,
                                    uom: selected?.baseUOM || comp.uom,
                                  });
                                }}
                                className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white font-medium"
                              >
                                {items.map((i) => (
                                  <option key={i.code} value={i.code}>
                                    {i.code} &mdash; {i.name} ({i.type})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0.001"
                                value={comp.qty}
                                onChange={(e) => handleUpdateConsumedItem(cIdx, { qty: parseFloat(e.target.value) || 0 })}
                                className="w-full p-1.5 border border-gray-300 rounded font-mono font-bold text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={comp.uom}
                                onChange={(e) => handleUpdateConsumedItem(cIdx, { uom: e.target.value })}
                                className="w-full p-1.5 border border-gray-300 rounded text-xs font-semibold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={comp.scrapPct}
                                onChange={(e) => handleUpdateConsumedItem(cIdx, { scrapPct: parseFloat(e.target.value) || 0 })}
                                className="w-full p-1.5 border border-gray-300 rounded font-mono text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={comp.locationCode}
                                onChange={(e) => handleUpdateConsumedItem(cIdx, { locationCode: e.target.value })}
                                placeholder="WIP-STAGE-01"
                                className="w-full p-1.5 border border-gray-300 rounded text-xs font-mono"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveConsumedItem(cIdx)}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                                title="Remove Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-xs text-gray-400">
                            No consumable or assembly components added. Click <strong>+ Add Item</strong> if this step consumes materials.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
                <Check className="w-3.5 h-3.5" /> Save Operation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
