import React, { useState, useEffect } from 'react';
import { ItemMaster } from '@/src/types';
import {
  X,
  Box,
  Trash2,
  Edit2,
  Check,
  Lock,
  ExternalLink,
  Paperclip,
  Upload,
  Download,
  Sparkles,
  Cpu,
  Layers,
  FlaskConical,
  Palette,
  Package,
  Wrench,
  Factory,
  Sliders,
} from 'lucide-react';

export interface QuickModifyItemModalProps {
  item: ItemMaster | null;
  allItems: ItemMaster[];
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSave: (updated: ItemMaster) => void | Promise<void>;
  onDelete: (code: string) => void;
  onOpenWizard: (item: ItemMaster) => void;
  showToast: (msg: string) => void;
}

export const QuickModifyItemModal: React.FC<QuickModifyItemModalProps> = ({
  item,
  allItems,
  isOpen,
  isAdmin,
  onClose,
  onSave,
  onDelete,
  onOpenWizard,
  showToast,
}) => {
  if (!isOpen || !item) return null;

  const [form, setForm] = useState<ItemMaster>({ ...item });
  const [activeTab, setActiveTab] = useState<'specs' | 'basic' | 'docs'>('specs');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const isApprovedLocked = item.approval === 'approved';

  const isFgItem = form.type === 'Finished Good' || form.type === 'Semi-Finished Good';
  const firstTabTitle = isFgItem
    ? 'Tooling & Specs'
    : form.type === 'Raw Material' || form.type === 'Regrind'
    ? 'Resin & Rheology'
    : form.type === 'Masterbatch' || form.type === 'Colorant' || form.type === 'Additive'
    ? 'Color & Formulation'
    : form.type === 'Packaging Material'
    ? 'Packaging Specs'
    : 'Plant Asset Specs';

  useEffect(() => {
    setForm({ ...item });
    setActiveTab('specs');
  }, [item]);

  const cycle = Number(form.standardCycleTime ?? form.cycleTime ?? 0);
  const cavities = Number(form.cavityCount ?? (form.moldToolId ? 1 : 0));
  const partWt = Number(form.partWeightGrams ?? form.netWeightGrams ?? 0);
  const runnerWt = Number(form.runnerWeightGrams ?? 0);
  const singleShotWt = (partWt > 0 || runnerWt > 0) ? Number((partWt + runnerWt).toFixed(2)) : 0;
  const totalMoldShotWt = (partWt > 0 || runnerWt > 0) ? Number(((partWt * Math.max(1, cavities)) + runnerWt).toFixed(2)) : 0;
  const hourlyOutput = cycle > 0 && cavities > 0 ? Math.round((3600 / cycle) * cavities) : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newDocs = Array.from(e.target.files).map((file) => {
        const sizeKb =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
            : `${Math.round(file.size / 1024)} KB`;
        const ext = file.name.split('.').pop()?.toLowerCase();
        const type =
          ext === 'step' || ext === 'stp' || ext === 'dwg' || ext === 'dxf'
            ? 'CAD / 3D Model'
            : ext === 'pdf'
            ? 'PDF Spec / Drawing'
            : 'Technical Document';

        return {
          id: `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type,
          version: 'v1.0',
          fileSize: sizeKb,
          uploadedDate: new Date().toISOString().split('T')[0],
          uploadedBy: 'Current User',
          link: URL.createObjectURL(file),
        };
      });

      const updatedDocs = [...(form.documents || []), ...newDocs];
      setForm({ ...form, documents: updatedDocs });
      showToast(`✓ Attached ${newDocs.length} document(s) from PC!`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Admin permission required to save item modifications.');
      return;
    }

    if (!form.name.trim()) {
      showToast('Item Name cannot be empty.');
      return;
    }

    // Duplicate name check
    const isDupName = allItems.some(
      (i) => i.code !== item.code && (i.name || '').trim().toLowerCase() === form.name.trim().toLowerCase()
    );
    if (isDupName) {
      showToast(`Cannot save: Item Name "${form.name}" is already in use by another SKU.`);
      return;
    }

    const updatedItem: ItemMaster = {
      ...form,
      name: isApprovedLocked ? item.name : form.name,
      standardCycleTime: isFgItem ? cycle : 0,
      cycleTime: isFgItem ? cycle : 0,
      partWeightGrams: isFgItem ? partWt : undefined,
      cavityCount: isFgItem ? cavities : undefined,
      runnerWeightGrams: isFgItem ? runnerWt : undefined,
      shotWeightGrams: isFgItem ? singleShotWt : undefined,
      netWeightGrams: isFgItem ? partWt : undefined,
    };

    setIsSaving(true);
    try {
      await onSave(updatedItem);
      onClose();
    } catch (err: any) {
      console.error('[QuickModifyItemModal] Save error:', err);
      showToast(`⚠️ Save failed: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const tabsList = [
    { id: 'specs' as const, label: firstTabTitle },
    { id: 'basic' as const, label: 'Basic & Stock' },
    { id: 'docs' as const, label: `Documents${form.documents && form.documents.length > 0 ? ` (${form.documents.length})` : ''}` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-auto overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50/50 via-white to-amber-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F8B8D] text-white flex items-center justify-center text-lg font-bold shadow-xs">
              {form.icon || (isFgItem ? '▣' : '◇')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#0F8B8D]">{form.code}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F6F4EF] text-[#14213D] border">
                  {form.type}
                </span>
                {!isAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Read-Only (Admin Access Required)
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-[#14213D] mt-0.5">{form.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          {tabsList.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'border-[#0F8B8D] text-[#0F8B8D] bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {activeTab === 'specs' && isFgItem && (
            <div className="space-y-4">
              {/* Injection Molding Tooling & Process Parameters Card */}
              <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/40 via-white to-teal-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0066CC] text-white flex items-center justify-center">
                      <Box className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#14213D]">
                        {form.type} &mdash; Injection Molding Tooling &amp; Process Parameters
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Core rheology, cycle timing, mold cavity metrics, and automatic shot weight balancing.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    MOLD SPEC GATE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Cycle Time (seconds) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isAdmin}
                        value={form.standardCycleTime || form.cycleTime || ''}
                        onChange={(e) => setForm({ ...form, standardCycleTime: Number(e.target.value) || 0, cycleTime: Number(e.target.value) || 0 })}
                        placeholder="e.g. 24.5"
                        className="w-full py-1.5 px-2.5 pr-8 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">sec</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Part Weight (grams/pc) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isAdmin}
                        value={form.partWeightGrams || ''}
                        onChange={(e) => setForm({ ...form, partWeightGrams: Number(e.target.value) || 0 })}
                        placeholder="e.g. 142.5"
                        className="w-full py-1.5 px-2.5 pr-6 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">g</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Mold Cavities (count) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        disabled={!isAdmin}
                        value={form.cavityCount || 1}
                        onChange={(e) => setForm({ ...form, cavityCount: Number(e.target.value) || 1 })}
                        placeholder="1"
                        className="w-full py-1.5 px-2.5 pr-8 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">cav</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Runner Weight (grams) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isAdmin}
                        value={form.runnerWeightGrams || 0}
                        onChange={(e) => setForm({ ...form, runnerWeightGrams: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full py-1.5 px-2.5 pr-6 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">g</span>
                    </div>
                  </div>
                </div>

                {/* Calculated Readout Ribbon & Formula breakdown */}
                <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#14213D] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#0F8B8D]" />
                        Calculated Shot Weight:
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0066CC] font-mono font-bold border border-blue-200">
                        {singleShotWt} g / pc shot
                      </span>
                      <span className="text-gray-400">&bull;</span>
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-[#0F8B8D] font-mono font-bold border border-teal-200">
                        {totalMoldShotWt} g (Total {cavities}-Cavity Shot)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block">Est. Hourly Output:</span>
                      <strong className="font-mono text-sm text-emerald-700">{hourlyOutput.toLocaleString()} pcs / hr</strong>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                    <strong>Formula:</strong> Part Weight ({partWt}g) + Runner Weight ({runnerWt}g) = {singleShotWt}g &bull; ({partWt}g &times; {cavities} Cavities) + {runnerWt}g = {totalMoldShotWt}g Total Mold Shot
                  </div>
                </div>
              </div>

              {/* Linked Mold Tool ID & Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mold Tool Asset Code</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={form.moldToolId || ''}
                    onChange={(e) => setForm({ ...form, moldToolId: e.target.value.toUpperCase() })}
                    placeholder="e.g. MOLD-001"
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Post-Molding Routing Destination</label>
                  <select
                    disabled={!isAdmin}
                    value={form.routingDestination || 'WIP'}
                    onChange={(e) => setForm({ ...form, routingDestination: e.target.value as any })}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs bg-white disabled:bg-slate-100 font-semibold"
                  >
                    <option value="WIP">WIP (WIP-STORE - Intermediate)</option>
                    <option value="DOL">DOL (FG-STORE - Direct on Line)</option>
                    <option value="ASSEMBLY">ASSEMBLY (Secondary Assembly Line)</option>
                    <option value="DEFLASH">DEFLASH (Manual Degating / Trimming)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (form.type === 'Raw Material' || form.type === 'Regrind') && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#14213D]">
                        {form.type} &mdash; Polymer Feedstock &amp; Rheology Parameters
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Polymer grade, melt flow index (MFI), density, regrind limits, and moisture sensitivity.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    RESIN FEEDSTOCK
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Resin Type / Polymer</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.resinType || ''}
                      onChange={(e) => setForm({ ...form, resinType: e.target.value })}
                      placeholder="e.g. Polypropylene (PP)"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Polymer Grade</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.polymerGrade || ''}
                      onChange={(e) => setForm({ ...form, polymerGrade: e.target.value })}
                      placeholder="e.g. Repol H110MA"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Melt Flow Index (g/10m)</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.mfi || ''}
                      onChange={(e) => setForm({ ...form, mfi: e.target.value })}
                      placeholder="e.g. 11.0"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Density (g/cm³)</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.density || ''}
                      onChange={(e) => setForm({ ...form, density: e.target.value })}
                      placeholder="e.g. 0.905"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Regrind Allowance %</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.regrind || ''}
                      onChange={(e) => setForm({ ...form, regrind: e.target.value })}
                      placeholder="e.g. 20%"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        disabled={!isAdmin}
                        checked={form.moistureSensitive ?? false}
                        onChange={(e) => setForm({ ...form, moistureSensitive: e.target.checked })}
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span>Moisture Sensitive (Pre-Drying Required)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (form.type === 'Masterbatch' || form.type === 'Colorant' || form.type === 'Additive') && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/40 via-white to-pink-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#14213D]">
                        {form.type} &mdash; Color &amp; Formulation Parameters
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Pigment shade, carrier resin, letdown ratio (LDR %), and heat dispersion limits.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    COLOR MASTERBATCH
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Color / Shade</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.color || ''}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      placeholder="e.g. Jet Black (RAL 9005)"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Carrier Resin</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.carrierResin || ''}
                      onChange={(e) => setForm({ ...form, carrierResin: e.target.value })}
                      placeholder="e.g. Universal PE/PP Carrier"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">LDR Dosage %</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.masterbatchDosage || ''}
                      onChange={(e) => setForm({ ...form, masterbatchDosage: e.target.value })}
                      placeholder="e.g. 2.5%"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Heat Stability (°C)</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.heatStability || ''}
                      onChange={(e) => setForm({ ...form, heatStability: e.target.value })}
                      placeholder="e.g. 280°C"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && form.type === 'Packaging Material' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/40 via-white to-orange-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#14213D]">
                        Packaging Material &mdash; Box &amp; Container Specs
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Box dimensions, shipper capacity, standard packaging specs, and pallet stacking.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    PACKAGING SPEC
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Packaging Standard</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.packagingStandard || ''}
                      onChange={(e) => setForm({ ...form, packagingStandard: e.target.value })}
                      placeholder="e.g. 5-Ply Corrugated Shipper"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">Dimensions (L×W×H mm)</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.boxDimensions || ''}
                      onChange={(e) => setForm({ ...form, boxDimensions: e.target.value })}
                      placeholder="e.g. 600 x 400 x 350 mm"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14213D] mb-1">HSN Code</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.hsCode || ''}
                      onChange={(e) => setForm({ ...form, hsCode: e.target.value })}
                      placeholder="e.g. 48191010"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (form.type === 'Spare Part' || form.type === 'Consumable') && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-300 bg-gradient-to-r from-slate-100 via-white to-indigo-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#14213D]">
                        {form.type} &mdash; Plant Maintenance &amp; Tooling Asset Specs
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Equipment compatibility, maintenance lead time, and critical spare buffer.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    PLANT ASSET
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Machine / Mold Compatibility</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.machineCompat || ''}
                      onChange={(e) => setForm({ ...form, machineCompat: e.target.value })}
                      placeholder="e.g. Ferromatik 250T"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lead Time</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.leadTime || ''}
                      onChange={(e) => setForm({ ...form, leadTime: e.target.value })}
                      placeholder="e.g. 7d"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Safety Buffer Stock</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={form.safetyStock || ''}
                      onChange={(e) => setForm({ ...form, safetyStock: e.target.value })}
                      placeholder="e.g. 2"
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="space-y-4">
              {isApprovedLocked && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span><strong>Approved Item Governance:</strong> Item Name and Code are locked because this item is approved in catalog governance.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Item Name *
                    {isApprovedLocked && <span className="ml-1 text-[10px] text-amber-600 font-normal">(Locked)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin || isApprovedLocked}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={form.cat}
                    onChange={(e) => setForm({ ...form, cat: e.target.value })}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Factory className="w-3 h-3 text-[#0F8B8D]" />
                    Plant / Unit *
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={form.plant || 'Plant 1 - Pimpri Auto-Hub'}
                    onChange={(e) => setForm({ ...form, plant: e.target.value })}
                    className="w-full py-1.5 px-2 border border-slate-300 rounded-lg text-xs bg-white font-medium disabled:bg-slate-100"
                  >
                    <option value="Plant 1 - Pimpri Auto-Hub">Plant 1 - Pimpri Auto-Hub</option>
                    <option value="Plant 2 - Chakan Complex">Plant 2 - Chakan Complex</option>
                    <option value="Plant 3 - Sanand Mega Plant">Plant 3 - Sanand Mega Plant</option>
                    <option value="Plant 4 - Pantnagar Facility">Plant 4 - Pantnagar Facility</option>
                    <option value="All Plants (Global)">All Plants (Global)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Resin Type</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={form.resinType || ''}
                    onChange={(e) => setForm({ ...form, resinType: e.target.value })}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Warehouse</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={form.wh || 'FG-WH-01'}
                    onChange={(e) => setForm({ ...form, wh: e.target.value })}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Bin</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={form.locationCode || ''}
                    onChange={(e) => setForm({ ...form, locationCode: e.target.value })}
                    placeholder="BIN-A1"
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    disabled={!isAdmin}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs bg-white disabled:bg-slate-100"
                  >
                    <option value="active">Active</option>
                    <option value="low">Low stock</option>
                    <option value="hold">Quality hold</option>
                    <option value="blocked">Blocked</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approval Stage</label>
                  <select
                    disabled={!isAdmin}
                    value={form.approval}
                    onChange={(e) => setForm({ ...form, approval: e.target.value as any })}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs bg-white disabled:bg-slate-100 font-semibold"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="released">Released</option>
                    <option value="under_review">Under Review</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    disabled={!isAdmin}
                    value={form.reorderLevel || 0}
                    onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#14213D]">Attached Technical Documents &amp; Drawings</h4>
                  <p className="text-[11px] text-gray-500">Attach CAD STEP models, 2D drawings, TDS and MSDS sheets.</p>
                </div>
                {isAdmin && (
                  <label className="btn btn-sm btn-primary flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" /> Attach Files from PC
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.step,.stp,.dwg,.dxf,.png,.jpg,.jpeg,.doc,.docx,.xlsx"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>

              {form.documents && form.documents.length > 0 ? (
                <div className="space-y-2">
                  {form.documents.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Paperclip className="w-4 h-4 text-orange-600" />
                        <div>
                          <div className="font-bold text-xs text-slate-900">{doc.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {doc.type} &bull; <span className="font-mono">{doc.fileSize || '1.2 MB'}</span> &bull; {doc.uploadedDate || '2026-09-22'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.link && (
                          <a
                            href={doc.link}
                            download={doc.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-white border border-blue-200 text-blue-600 rounded text-[11px] font-bold hover:bg-blue-50 flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedDocs = (form.documents || []).filter((_, i) => i !== idx);
                              setForm({ ...form, documents: updatedDocs });
                              showToast(`Removed document "${doc.name}"`);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <div>No documents attached yet for this SKU.</div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenWizard(item);
                  onClose();
                }}
                className="btn btn-sm btn-ghost border text-xs flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-[#0F8B8D]" /> Open in 10-Step Wizard
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(item.code);
                    onClose();
                  }}
                  className="btn btn-sm btn-ghost border text-rose-600 border-rose-200 hover:bg-rose-50 text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete SKU
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-sm btn-ghost border text-xs"
              >
                Cancel
              </button>
              {isAdmin && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
