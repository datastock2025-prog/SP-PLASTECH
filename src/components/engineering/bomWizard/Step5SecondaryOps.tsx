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
  const [inputItem, setInputItem] = useState<string>(parentItem.code);
  const [outputItem, setOutputItem] = useState<string>(parentItem.code);
  const [operationType, setOperationType] = useState<SecondaryOperationDetail['operationType']>('Trimming');
  const [workCenter, setWorkCenter] = useState<string>('WC-SEC-01 - Post-Molding Cell');
  const [locationBefore, setLocationBefore] = useState<string>('WIP-STAGE-01');
  const [locationAfter, setLocationAfter] = useState<string>('SEC-AREA-01');
  const [stockStatusBefore, setStockStatusBefore] = useState<string>('WIP');
  const [stockStatusAfter, setStockStatusAfter] = useState<string>('Available');
  const [qualityCheckRequired, setQualityCheckRequired] = useState<boolean>(true);
  const [standardTimeMin, setStandardTimeMin] = useState<number>(2.5);
  const [scrapPct, setScrapPct] = useState<number>(0.5);
  const [inventoryImpact, setInventoryImpact] = useState<SecondaryOperationDetail['inventoryImpact']>('Same Item Status Update');

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
    setPartName(`${op} for ${parentItem.name}`);
    setDescription(`Standard post-molding ${op.toLowerCase()} step.`);
    setInputItem(parentItem.code);
    setOutputItem(parentItem.code);
    setWorkCenter('WC-SEC-01 - Post-Molding Finishing Cell');
    setLocationBefore('WIP-STAGE-01');
    setLocationAfter('SEC-AREA-01');
    setStockStatusBefore('WIP');
    setStockStatusAfter('Available');
    setQualityCheckRequired(true);
    setStandardTimeMin(2.5);
    setScrapPct(0.5);
    setInventoryImpact('Same Item Status Update');
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
    setIsModalOpen(true);
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
      consumedComponents: [],
    };

    let updated: SecondaryOperationDetail[];
    if (editingIndex !== null) {
      updated = [...secondaryOperations];
      updated[editingIndex] = newOp;
      showToast(`Updated operation ${newOp.operationType}`);
    } else {
      updated = [...secondaryOperations, newOp];
      showToast(`Added secondary operation ${newOp.operationType}`);
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
            Define trimming, degating, sticker placement, pad printing, and subassembly transformations.
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
              {parentItem.code} (Molded)
            </div>

            {secondaryOperations.map((op, idx) => (
              <React.Fragment key={op.id}>
                <ArrowRight className="w-4 h-4 text-[#E8622C] shrink-0" />
                <div className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-950 font-bold shrink-0 flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 text-[#E8622C]" />
                  <span>
                    Op {op.sequence}: {op.operationType}
                  </span>
                </div>
              </React.Fragment>
            ))}

            <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 font-bold text-emerald-950 shrink-0">
              {parentItem.code} (Ready for FG)
            </div>
          </div>
        </div>
      )}

      {/* Operations List / Table */}
      {secondaryOperations.length === 0 ? (
        /* Empty State with exact requested copy */
        <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-[#E4E0D6] space-y-3">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#E8622C] flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#14213D]">No secondary operations configured</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              No secondary operations configured. If this item requires trimming, degating, stickers, printing, or assembly, add them here.
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
                <div className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit Secondary Operation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
                  onChange={(e) => setOperationType(e.target.value as any)}
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
