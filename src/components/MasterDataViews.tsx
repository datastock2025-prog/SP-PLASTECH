import React, { useState, useEffect } from 'react';
import {
  ItemMaster,
  BomMaster,
  MachineMaster,
  ApprovalStatus,
  ItemType,
  AuthUser,
} from '../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Printer,
  Copy,
  ArrowLeft,
  FileSpreadsheet,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  X,
  ThumbsUp,
  ThumbsDown,
  Layers,
  History,
  ShieldCheck,
  Lock,
  Unlock,
  Settings,
  Box,
  Sliders,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Download,
  Upload,
  Paperclip,
  ExternalLink,
  Activity,
  TrendingUp,
  CheckCircle2,
  Cpu,
  Wrench,
  FileCheck2,
  ShieldAlert,
  Boxes,
} from 'lucide-react';
import { PaginationBar } from './common/PaginationBar';
import { CreateItemWizardModal } from './masterdata/CreateItemWizardModal';
import { ManufacturingBomWizardModal } from './engineering/bomWizard/ManufacturingBomWizardModal';
import {
  AuditHistoryModal,
  GovernancePermissionsModal,
} from './masterdata/GovernanceModals';
import { itemService } from '../services/itemService';
import {
  masterDataGovernanceService,
  MasterDataChangeRecord,
  MasterDataGovernancePermissions,
} from '../services/masterDataGovernanceService';
import { adminEventBus } from '../services/adminService';

interface MasterDataProps {
  view: string;
  items: ItemMaster[];
  boms: BomMaster[];
  machines: MachineMaster[];
  currentUser?: AuthUser | null;
  selectedCode?: string;
  selectedId?: string;
  onNavigate: (view: string, code?: string, id?: string) => void;
  onUpdateItem: (item: ItemMaster) => void;
  onDeleteItem: (code: string) => void;
  onCreateItem: (item: ItemMaster) => void;
  onUpdateBom: (bom: BomMaster) => void;
  onDeleteBom: (id: string) => void;
  onCreateBom: (bom: BomMaster) => void;
  onUpdateMachine: (machine: MachineMaster) => void;
  onDeleteMachine: (id: string) => void;
  onCreateMachine: (machine: MachineMaster) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

interface QuickModifyItemModalProps {
  item: ItemMaster | null;
  allItems: ItemMaster[];
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSave: (updated: ItemMaster) => void;
  onDelete: (code: string) => void;
  onOpenWizard: (item: ItemMaster) => void;
  showToast: (msg: string) => void;
}

const QuickModifyItemModal: React.FC<QuickModifyItemModalProps> = ({
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

  const [activeTab, setActiveTab] = useState<string>('Tooling & Specs');

  useEffect(() => {
    setForm({ ...item });
    const isFg = item.type === 'Finished Good' || item.type === 'Semi-Finished Good';
    const initTab = isFg
      ? 'Tooling & Specs'
      : item.type === 'Raw Material' || item.type === 'Regrind'
      ? 'Resin & Rheology'
      : item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive'
      ? 'Color & Formulation'
      : item.type === 'Packaging Material'
      ? 'Packaging Specs'
      : 'Plant Asset Specs';
    setActiveTab(initTab);
  }, [item]);

  const cycle = Number(form.standardCycleTime || form.cycleTime || 24.5);
  const cavities = Number(form.cavityCount || 1);
  const partWt = Number(form.partWeightGrams || 25);
  const runnerWt = Number(form.runnerWeightGrams || 0);
  const singleShotWt = Number((partWt + runnerWt).toFixed(2));
  const totalMoldShotWt = Number(((partWt * cavities) + runnerWt).toFixed(2));
  const hourlyOutput = cycle > 0 ? Math.round((3600 / cycle) * cavities) : 0;

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

  const handleSave = (e: React.FormEvent) => {
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
      standardCycleTime: isFgItem ? cycle : 0,
      cycleTime: isFgItem ? cycle : 0,
      partWeightGrams: isFgItem ? partWt : undefined,
      cavityCount: isFgItem ? cavities : undefined,
      runnerWeightGrams: isFgItem ? runnerWt : undefined,
      shotWeightGrams: isFgItem ? singleShotWt : undefined,
      netWeightGrams: isFgItem ? partWt : undefined,
    };

    onSave(updatedItem);
    onClose();
  };

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
          {([firstTabTitle, 'Basic & Stock', 'Documents'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === t
                  ? 'border-[#0F8B8D] text-[#0F8B8D] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t} {t === 'Documents' && form.documents && form.documents.length > 0 && `(${form.documents.length})`}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {activeTab === firstTabTitle && isFgItem && (
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
                    value={form.moldToolId || 'MOLD-001'}
                    onChange={(e) => setForm({ ...form, moldToolId: e.target.value.toUpperCase() })}
                    placeholder="MOLD-001"
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

          {activeTab === firstTabTitle && (form.type === 'Raw Material' || form.type === 'Regrind') && (
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

          {activeTab === firstTabTitle && (form.type === 'Masterbatch' || form.type === 'Colorant' || form.type === 'Additive') && (
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

          {activeTab === firstTabTitle && form.type === 'Packaging Material' && (
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

          {activeTab === firstTabTitle && (form.type === 'Spare Part' || form.type === 'Consumable') && (
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

          {activeTab === 'Basic & Stock' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
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

              <div className="grid grid-cols-3 gap-3">
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

          {activeTab === 'Documents' && (
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
                  className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MasterDataViews: React.FC<MasterDataProps> = ({
  view,
  items,
  boms,
  machines,
  currentUser,
  selectedCode,
  selectedId,
  onNavigate,
  onUpdateItem,
  onDeleteItem,
  onCreateItem,
  onUpdateBom,
  onDeleteBom,
  onCreateBom,
  onUpdateMachine,
  onDeleteMachine,
  onCreateMachine,
  openDrawer,
  closeDrawer,
  openConfirm,
  showToast,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [editingItemCell, setEditingItemCell] = useState<{ code: string; field: string } | null>(null);
  const [itemCellVal, setItemCellVal] = useState<string>('');
  const [selectedItemCodes, setSelectedItemCodes] = useState<string[]>([]);
  const [itemPage, setItemPage] = useState<number>(1);
  const [itemPageSize, setItemPageSize] = useState<number>(25);
  const [itemSortField, setItemSortField] = useState<string>('code');
  const [itemSortDirection, setItemSortDirection] = useState<'asc' | 'desc'>('asc');
  const [jumpItemPageInput, setJumpItemPageInput] = useState<string>('');
  const [quickModifyItem, setQuickModifyItem] = useState<ItemMaster | null>(null);
  const [machinePage, setMachinePage] = useState<number>(1);
  const [machinePageSize, setMachinePageSize] = useState<number>(10);

  // 10-Step Item Wizard State
  const [isItemWizardOpen, setIsItemWizardOpen] = useState<boolean>(false);
  const [wizardEditItem, setWizardEditItem] = useState<ItemMaster | null>(null);

  // Task 3: Audit Change History Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditTarget, setAuditTarget] = useState<{ type?: string; code?: string; name?: string }>({});

  // Task 4: Governance & RBAC Configuration Modal State
  const [isGovModalOpen, setIsGovModalOpen] = useState<boolean>(false);
  const [govPerms, setGovPerms] = useState<MasterDataGovernancePermissions>(
    masterDataGovernanceService.getGovernancePermissions()
  );

  useEffect(() => {
    const unsub = adminEventBus.on('GOVERNANCE_PERMISSIONS_SAVED', (updated) => {
      if (updated) setGovPerms(updated);
    });
    return () => unsub();
  }, []);

  // RBAC Permission checks
  const isSuperAdmin =
    !currentUser ||
    currentUser.roleType === 'admin' ||
    (currentUser.role || '').toLowerCase().includes('admin') ||
    (currentUser.role || '').toLowerCase().includes('director');

  const canCreateItem = masterDataGovernanceService.canUserPerformAction('create_item', currentUser?.role);
  const canEditItem = masterDataGovernanceService.canUserPerformAction('edit_item', currentUser?.role);
  const canApproveItem = masterDataGovernanceService.canUserPerformAction('approve_item', currentUser?.role);
  const canDeleteItem = masterDataGovernanceService.canUserPerformAction('delete_item', currentUser?.role);
  const canCreateBom = masterDataGovernanceService.canUserPerformAction('create_bom', currentUser?.role);
  const canEditBom = masterDataGovernanceService.canUserPerformAction('edit_bom', currentUser?.role);

  const handleOpenCreateItemWizard = () => {
    if (!canCreateItem && !isSuperAdmin) {
      showToast('Admin permission required to create items in catalog.');
      return;
    }
    setWizardEditItem(null);
    setIsItemWizardOpen(true);
  };

  const handleOpenEditItemWizard = (item: ItemMaster) => {
    if (!canEditItem && !isSuperAdmin) {
      showToast('Admin permission required to edit item specifications.');
      return;
    }
    setWizardEditItem(item);
    setIsItemWizardOpen(true);
  };

  const handleSaveWizardItem = (savedItem: ItemMaster) => {
    itemService.saveItem(savedItem);
    const exists = items.some((i) => i.code === savedItem.code);
    if (exists) {
      onUpdateItem(savedItem);
      masterDataGovernanceService.recordAudit({
        entityType: 'ITEM_MASTER',
        entityCode: savedItem.code,
        entityName: savedItem.name,
        action: 'UPDATE',
        changedBy: currentUser?.name || 'Priya Rao (Admin)',
        userRole: currentUser?.role || 'admin',
        changeSummary: `Updated Item Master SKU ${savedItem.code} attributes and tooling specifications.`,
      });
      showToast(`✓ Updated Item ${savedItem.code} in Master Data & recorded in PostgreSQL audit history.`);
    } else {
      onCreateItem(savedItem);
      masterDataGovernanceService.recordAudit({
        entityType: 'ITEM_MASTER',
        entityCode: savedItem.code,
        entityName: savedItem.name,
        action: 'CREATE',
        changedBy: currentUser?.name || 'Priya Rao (Admin)',
        userRole: currentUser?.role || 'admin',
        changeSummary: `Created new Item Master SKU ${savedItem.code} with approval status ${savedItem.approval}.`,
      });
      showToast(`✓ Created Item ${savedItem.code} in Master Data & recorded in PostgreSQL audit history.`);
    }
    setIsItemWizardOpen(false);
    setWizardEditItem(null);
  };

  const handleApproveItem = (item: ItemMaster) => {
    if (!canApproveItem && !isSuperAdmin) {
      showToast('Only Admin or Authorized Approvers can approve items.');
      return;
    }
    const updated: ItemMaster = { ...item, approval: 'approved', status: 'active' };
    itemService.saveItem(updated);
    onUpdateItem(updated);
    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: item.code,
      entityName: item.name,
      action: 'APPROVE',
      changedBy: currentUser?.name || 'Priya Rao (Admin)',
      userRole: currentUser?.role || 'admin',
      changeSummary: `Approved Item ${item.code} (${item.name}) - Released to live operational modules.`,
      diff: { approval: { before: item.approval, after: 'approved' } },
    });
    showToast(`✓ Approved ${item.code} - Released to all operational modules!`);
  };

  const handleRejectItem = (item: ItemMaster) => {
    if (!canApproveItem && !isSuperAdmin) {
      showToast('Only Admin or Authorized Approvers can reject items.');
      return;
    }
    const updated: ItemMaster = { ...item, approval: 'rejected', status: 'inactive' };
    itemService.saveItem(updated);
    onUpdateItem(updated);
    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: item.code,
      entityName: item.name,
      action: 'REJECT',
      changedBy: currentUser?.name || 'Priya Rao (Admin)',
      userRole: currentUser?.role || 'admin',
      changeSummary: `Rejected Item ${item.code} (${item.name}). Quarantined and hidden from all operational modules.`,
      diff: { approval: { before: item.approval, after: 'rejected' } },
    });
    showToast(`Rejected ${item.code}. Hidden from operational modules.`);
  };

  // Manufacturing BOM Wizard State
  const [isMfgBomWizardOpen, setIsMfgBomWizardOpen] = useState<boolean>(false);
  const [bomWizardParentItem, setBomWizardParentItem] = useState<ItemMaster | null>(null);

  const handleOpenMfgBomWizard = (targetItem: ItemMaster) => {
    if (!canCreateBom && !isSuperAdmin) {
      showToast('Admin or Tooling Lead permission required to create BOMs.');
      return;
    }
    setBomWizardParentItem(targetItem);
    setIsMfgBomWizardOpen(true);
  };

  // Status helper badge
  const renderStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      active: { cls: 'green', label: 'Active' },
      low: { cls: 'amber', label: 'Low stock' },
      hold: { cls: 'purple', label: 'Quality hold' },
      blocked: { cls: 'red', label: 'Blocked' },
      inactive: { cls: 'gray', label: 'Inactive' },
    };
    const res = map[status] || { cls: 'gray', label: status };
    return <span className={`badge ${res.cls}`}>{res.label}</span>;
  };

  const renderApprovalBadge = (approval: ApprovalStatus) => {
    const map: Record<string, { cls: string; label: string }> = {
      draft: { cls: 'gray', label: 'Draft' },
      pending: { cls: 'amber', label: 'Pending approval' },
      approved: { cls: 'green', label: 'Approved' },
      released: { cls: 'green', label: 'Released' },
      under_review: { cls: 'teal', label: 'Under review' },
      rejected: { cls: 'red', label: 'Rejected' },
      obsolete: { cls: 'gray', label: 'Obsolete' },
    };
    const res = map[approval] || { cls: 'gray', label: approval };
    return <span className={`badge ${res.cls}`}>{res.label}</span>;
  };

  /* ----------------------------------------------------
     ITEM MASTER LIST & DETAIL (100k+ Scalable Architecture & Mold Tooling Specs)
  ---------------------------------------------------- */
  const renderViewContent = () => {
    if (view === 'itemList') {
      const filteredItems = items.filter((i) => {
        if (!i) return false;

        // Task 5: Never show rejected items to non-admins
        if (!isSuperAdmin && (i.approval === 'rejected' || i.status === 'rejected')) {
          return false;
        }

        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          (i.code || '').toLowerCase().includes(q) ||
          (i.name || '').toLowerCase().includes(q) ||
          (i.cat || '').toLowerCase().includes(q) ||
          (i.resinType || '').toLowerCase().includes(q) ||
          (i.wh || '').toLowerCase().includes(q) ||
          (i.moldToolId || '').toLowerCase().includes(q);

        if (!matchSearch) return false;
        if (filterType === 'all') return true;
        if (filterType === 'pending_approval') return i.approval === 'pending';
        if (filterType === 'draft') return i.approval === 'draft';
        if (filterType === 'rejected') return i.approval === 'rejected';
        if (filterType === 'Masterbatch') return i.type === 'Masterbatch' || i.type === 'Additive';
        return i.type === filterType;
      });

      // Multi-column sorting
      const sortedItems = [...filteredItems].sort((a, b) => {
        let aVal: any = a[itemSortField as keyof ItemMaster] ?? '';
        let bVal: any = b[itemSortField as keyof ItemMaster] ?? '';

        if (itemSortField === 'stock') {
          aVal = parseFloat(a.stock) || 0;
          bVal = parseFloat(b.stock) || 0;
        } else if (itemSortField === 'cycleTime') {
          aVal = Number(a.standardCycleTime || a.cycleTime || 0);
          bVal = Number(b.standardCycleTime || b.cycleTime || 0);
        }

        if (typeof aVal === 'string') {
          const comp = aVal.localeCompare(String(bVal));
          return itemSortDirection === 'asc' ? comp : -comp;
        }
        if (typeof aVal === 'number') {
          return itemSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });

      const lowStockCount = items.filter((i) => i && i.status === 'low').length;
      const pendingCount = items.filter((i) => i && i.approval === 'pending').length;
      const draftCount = items.filter((i) => i && i.approval === 'draft').length;
      const fgCount = items.filter((i) => i && i.type === 'Finished Good').length;
      const rejectedCount = items.filter((i) => i && (i.approval === 'rejected' || i.status === 'rejected')).length;

      const totalItemPages = Math.max(1, Math.ceil(sortedItems.length / itemPageSize));
      const safeItemPage = Math.min(Math.max(1, itemPage), totalItemPages);
      const startItemIdx = (safeItemPage - 1) * itemPageSize;
      const pagedItems = sortedItems.slice(startItemIdx, startItemIdx + itemPageSize);

      const handleItemSort = (field: string) => {
        if (itemSortField === field) {
          setItemSortDirection(itemSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
          setItemSortField(field);
          setItemSortDirection('asc');
        }
        setItemPage(1);
      };

      const handleJumpItemPage = (e: React.FormEvent) => {
        e.preventDefault();
        const p = parseInt(jumpItemPageInput, 10);
        if (!isNaN(p) && p >= 1 && p <= totalItemPages) {
          setItemPage(p);
          setJumpItemPageInput('');
        } else {
          showToast(`Please enter a valid page between 1 and ${totalItemPages}`);
        }
      };

      return (
        <div className="space-y-5 max-w-[1600px] mx-auto pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5" /> Master Data &bull; Enterprise Catalog (100k+ Items Scale)
              </div>
              <h1 className="text-xl font-bold text-[#14213D] flex items-center gap-2">
                Item Master Catalog
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
                  {items.length} Registered SKUs
                </span>
              </h1>
              <p className="text-xs text-[#6B7280]">
                High-throughput polymer parts catalog with injection molding tooling specs, live shot calculations &amp; RBAC governance.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="btn btn-sm btn-ghost border border-[#E4E0D6] flex items-center gap-1.5"
                onClick={() => {
                  setAuditTarget({});
                  setIsAuditModalOpen(true);
                }}
                title="View PostgreSQL Master Data Audit & Change History Logs"
              >
                <History className="w-3.5 h-3.5 text-[#0F8B8D]" />
                Audit History
              </button>
              {isSuperAdmin && (
                <button
                  className="btn btn-sm btn-ghost border border-[#E4E0D6] flex items-center gap-1.5"
                  onClick={() => setIsGovModalOpen(true)}
                  title="Configure Role-Based Access Controls for Master Data & BOM Grids"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Governance RBAC
                </button>
              )}
              <button
                className="btn btn-sm btn-ghost border border-[#E4E0D6]"
                onClick={() => showToast(`Exported ${items.length} items to CSV`)}
              >
                Export CSV
              </button>
              <button
                className="btn btn-sm btn-primary shadow-sm flex items-center gap-1.5"
                onClick={handleOpenCreateItemWizard}
              >
                <Plus className="w-3.5 h-3.5" /> Create Item
              </button>
            </div>
          </div>

          {/* Scalable KPI Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Items</div>
                <div className="text-lg font-bold text-[#14213D] font-mono leading-none mt-0.5">{items.length}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">100k+ Scale Ready</div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0F8B8D] flex items-center justify-center flex-shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Finished Goods</div>
                <div className="text-lg font-bold text-[#0F8B8D] font-mono leading-none mt-0.5">{fgCount}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Tooling &amp; Mold Specs</div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending QA Review</div>
                <div className="text-lg font-bold text-amber-700 font-mono leading-none mt-0.5">{pendingCount}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{draftCount} Drafts</div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Low Stock Alert</div>
                <div className="text-lg font-bold text-rose-700 font-mono leading-none mt-0.5">{lowStockCount}</div>
                <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Reorder Needed</div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Catalog</div>
                <div className="text-lg font-bold text-emerald-700 font-mono leading-none mt-0.5">
                  {items.filter((i) => i.status === 'active' && i.approval === 'approved').length}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Production Released</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-lg bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg px-3 py-1.5 text-xs focus-within:border-[#0F8B8D] focus-within:bg-white transition-all">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" />
              <input
                type="text"
                placeholder="Instant search SKU code, name, category, resin, mold tool..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setItemPage(1);
                }}
                className="w-full bg-transparent border-none outline-none text-xs text-[#14213D]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-700 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap bg-[#F6F4EF] p-1 rounded-lg border border-[#E4E0D6]">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'Finished Good', label: 'Finished Goods' },
                { id: 'Raw Material', label: 'Raw Materials' },
                { id: 'Masterbatch', label: 'Masterbatch' },
                { id: 'Regrind', label: 'Regrind' },
                { id: 'draft', label: `Drafts (${draftCount})` },
                { id: 'pending_approval', label: `Pending (${pendingCount})` },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => {
                    setFilterType(chip.id);
                    setItemPage(1);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded capitalize transition-all ${
                    filterType === chip.id
                      ? 'bg-[#14213D] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#14213D] hover:bg-white/60'
                  }`}
                >
                  {chip.label}
                </button>
              ))}

              {isSuperAdmin && rejectedCount > 0 && (
                <button
                  onClick={() => {
                    setFilterType('rejected');
                    setItemPage(1);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all ${
                    filterType === 'rejected'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  🚫 Rejected ({rejectedCount})
                </button>
              )}
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedItemCodes.length > 0 && (
            <div className="p-2.5 bg-[#14213D] text-white rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150 shadow-md">
              <div className="flex items-center gap-2 font-semibold">
                <CheckSquare className="w-4 h-4 text-[#E8622C]" />
                <span>{selectedItemCodes.length} Item(s) selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!isSuperAdmin && !canApproveItem) {
                      showToast('Admin access required for bulk approval');
                      return;
                    }
                    selectedItemCodes.forEach((code) => {
                      const itm = items.find((i) => i.code === code);
                      if (itm) {
                        onUpdateItem({ ...itm, approval: 'approved', status: 'active' });
                      }
                    });
                    showToast(`Bulk approved ${selectedItemCodes.length} item(s)`);
                    setSelectedItemCodes([]);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-bold transition-colors"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => {
                    if (!isSuperAdmin && !canApproveItem) {
                      showToast('Admin access required for bulk rejection');
                      return;
                    }
                    selectedItemCodes.forEach((code) => {
                      const itm = items.find((i) => i.code === code);
                      if (itm) {
                        onUpdateItem({ ...itm, approval: 'rejected', status: 'inactive' });
                      }
                    });
                    showToast(`Marked ${selectedItemCodes.length} item(s) as Rejected`);
                    setSelectedItemCodes([]);
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 rounded text-xs font-bold transition-colors"
                >
                  Bulk Reject
                </button>
                <button
                  onClick={() => {
                    showToast(`Exported ${selectedItemCodes.length} items to CSV`);
                    setSelectedItemCodes([]);
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-semibold transition-colors"
                >
                  Export Selected
                </button>
                <button
                  onClick={() => setSelectedItemCodes([])}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Table with Mold Spec & Tooling Columns (Scrollbar-Free Clean Container) */}
          <div className="panel bg-white rounded-xl border border-[#E4E0D6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="p-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={pagedItems.length > 0 && pagedItems.every((i) => selectedItemCodes.includes(i.code))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const pageCodes = pagedItems.map((i) => i.code);
                            setSelectedItemCodes(Array.from(new Set([...selectedItemCodes, ...pageCodes])));
                          } else {
                            const pageCodes = new Set(pagedItems.map((i) => i.code));
                            setSelectedItemCodes(selectedItemCodes.filter((c) => !pageCodes.has(c)));
                          }
                        }}
                        className="rounded text-[#0F8B8D]"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-amber-50/50" onClick={() => handleItemSort('code')}>
                      <div className="flex items-center gap-1">
                        Item Code
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-amber-50/50" onClick={() => handleItemSort('name')}>
                      <div className="flex items-center gap-1">
                        Item Name &amp; Family
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-amber-50/50" onClick={() => handleItemSort('type')}>
                      <div className="flex items-center gap-1">
                        Type
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="p-3">Tooling / Material Spec</th>
                    <th className="p-3 cursor-pointer hover:bg-amber-50/50" onClick={() => handleItemSort('cycleTime')}>
                      <div className="flex items-center gap-1">
                        Process &amp; Attributes
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:bg-amber-50/50" onClick={() => handleItemSort('stock')}>
                      <div className="flex items-center justify-end gap-1">
                        On Hand
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="p-3 text-right">Available</th>
                    <th className="p-3">Warehouse</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Approval</th>
                    <th className="p-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D6]">
                  {pagedItems.length > 0 ? (
                    pagedItems.map((item) => {
                      const isSelected = selectedItemCodes.includes(item.code);
                      const isFg = item.type === 'Finished Good' || item.type === 'Semi-Finished Good';
                      const cycle = Number(item.standardCycleTime || item.cycleTime || 24.5);
                      const cavities = Number(item.cavityCount || 1);
                      const partWt = Number(item.partWeightGrams || 25);
                      const runnerWt = Number(item.runnerWeightGrams || 0);
                      const shotWt = item.shotWeightGrams || Number((partWt + runnerWt).toFixed(2));
                      const hourlyOutput = cycle > 0 ? Math.round((3600 / cycle) * cavities) : 0;

                      return (
                        <tr
                          key={item.code}
                          className={`hover:bg-amber-50/30 transition-colors cursor-pointer group ${
                            isSelected ? 'bg-teal-50/40' : ''
                          }`}
                          onClick={() => onNavigate('itemDetail', { code: item.code })}
                          title="Click to view detailed item master info, tooling specs, BOM usage & documents"
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItemCodes([...selectedItemCodes, item.code]);
                                } else {
                                  setSelectedItemCodes(selectedItemCodes.filter((c) => c !== item.code));
                                }
                              }}
                              className="rounded text-[#0F8B8D]"
                            />
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[#0F8B8D]">{item.code}</span>
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-amber-600 transition-opacity" />
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-[#14213D] flex items-center gap-1.5 group-hover:text-[#0F8B8D] transition-colors">
                              <span>{item.icon}</span> <span>{item.name}</span>
                            </div>
                            <div className="text-[11px] text-[#6B7280] flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span>{item.cat}</span>
                              {item.resinType && (
                                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 rounded">
                                  {item.resinType}
                                </span>
                              )}
                              {(item.isDol || item.routingDestination === 'DOL') && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  DOL &rarr; FG
                                </span>
                              )}
                              {(item.isAssembly || item.routingDestination === 'ASSEMBLY') && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  ASSEMPLY &rarr; Assembly
                                </span>
                              )}
                              {(item.isDeflash || item.routingDestination === 'DEFLASH') && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  DEFLASH &rarr; Deflash
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F6F4EF] text-[#14213D] border border-[#E4E0D6]">
                              {item.type}
                            </span>
                          </td>

                          {/* Dynamic Col 5: Tooling / Material Spec */}
                          <td className="p-3 font-mono text-[11px]">
                            {isFg ? (
                              <>
                                <div className="text-[#14213D] font-bold">{item.moldToolId || 'MOLD-001'}</div>
                                <div className="text-[10px] text-gray-500">{cavities} Cavit{cavities === 1 ? 'y' : 'ies'}</div>
                              </>
                            ) : (item.type === 'Raw Material' || item.type === 'Regrind') ? (
                              <>
                                <div className="text-emerald-900 font-bold">{item.resinType || 'Polypropylene (PP)'}</div>
                                <div className="text-[10px] text-slate-500 truncate">{item.polymerGrade || 'Virgin Polymer'}</div>
                              </>
                            ) : (item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive') ? (
                              <>
                                <div className="text-purple-900 font-bold truncate">{item.color || 'Custom Shade'}</div>
                                <div className="text-[10px] text-slate-500 truncate">{item.carrierResin || item.resinType || 'Universal Carrier'}</div>
                              </>
                            ) : item.type === 'Packaging Material' ? (
                              <>
                                <div className="text-amber-900 font-bold truncate">{item.packagingStandard || item.cat || 'Standard Box'}</div>
                                <div className="text-[10px] text-slate-500">{item.boxDimensions || '600x400x350 mm'}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-slate-900 font-bold truncate">{item.machineCompat || 'All Machines'}</div>
                                <div className="text-[10px] text-slate-500">{item.moldToolId || 'PLANT-ASSET'}</div>
                              </>
                            )}
                          </td>

                          {/* Dynamic Col 6: Process & Attributes */}
                          <td className="p-3 font-mono text-[11px]">
                            {isFg ? (
                              <>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-amber-700">{cycle}s</span>
                                  <span className="text-gray-400">&bull;</span>
                                  <span className="text-gray-700">{shotWt}g Shot</span>
                                  <span className="text-gray-400">&bull;</span>
                                  <span className="text-emerald-700 font-bold">{hourlyOutput} pcs/h</span>
                                </div>
                                <div className="mt-0.5">
                                  <span className="inline-flex items-center text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                    MOLD SPEC GATE
                                  </span>
                                </div>
                              </>
                            ) : (item.type === 'Raw Material' || item.type === 'Regrind') ? (
                              <>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-emerald-800">MFI: {item.mfi || '12.0'}</span>
                                  <span className="text-gray-400">&bull;</span>
                                  <span className="text-slate-600">Dens: {item.density || '0.905'}</span>
                                  <span className="text-gray-400">&bull;</span>
                                  <span className="text-emerald-700 font-bold">Regrind: {item.regrind || '20%'}</span>
                                </div>
                                <div className="mt-0.5">
                                  <span className="inline-flex items-center text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    RESIN FEEDSTOCK
                                  </span>
                                </div>
                              </>
                            ) : (item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive') ? (
                              <>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-purple-800">LDR: {item.masterbatchDosage || '2.5%'}</span>
                                  <span className="text-gray-400">&bull;</span>
                                  <span className="text-slate-600">Heat: {item.heatStability || '280°C'}</span>
                                </div>
                                <div className="mt-0.5">
                                  <span className="inline-flex items-center text-[9px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                    COLOR MASTERBATCH
                                  </span>
                                </div>
                              </>
                            ) : item.type === 'Packaging Material' ? (
                              <>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-amber-800">{item.unitsPerPack || 250} pcs/box</span>
                                  <span className="text-gray-400">&bull;</span>
                                  <span className="text-slate-600">HSN: {item.hsCode || '48191010'}</span>
                                </div>
                                <div className="mt-0.5">
                                  <span className="inline-flex items-center text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    PACKAGING SPEC
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-800">Lead: {item.leadTime || '7d'}</span>
                                  <span className="text-gray-400">&bull;</span>
                                  <span className="text-slate-600">Buffer: {item.safetyStock || '2'} {item.baseUOM}</span>
                                </div>
                                <div className="mt-0.5">
                                  <span className="inline-flex items-center text-[9px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    PLANT ASSET
                                  </span>
                                </div>
                              </>
                            )}
                          </td>

                          <td className="p-3 text-right font-semibold text-[#14213D] font-mono">
                            {item.stock}
                          </td>
                          <td className="p-3 text-right font-mono text-[#4B5563]">{item.avail}</td>
                          <td className="p-3 font-mono text-xs text-[#6B7280]">{item.wh}</td>
                          <td className="p-3 text-center">{renderStatusBadge(item.status)}</td>
                          <td className="p-3 text-center">{renderApprovalBadge(item.approval)}</td>

                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                className="p-1 text-[#6B7280] hover:text-[#E8622C] hover:bg-orange-50 rounded transition-colors"
                                title="Quick Modify SKU & Tooling"
                                onClick={() => setQuickModifyItem(item)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                className="p-1 text-[#6B7280] hover:text-[#0066CC] hover:bg-blue-50 rounded transition-colors"
                                title="Clone / Duplicate Item"
                                onClick={() => {
                                  if (!isSuperAdmin && !canCreateItem) {
                                    showToast('Admin permission required to clone items');
                                    return;
                                  }
                                  let copyCode = `${item.code}-COPY`;
                                  let copyName = `${item.name} (Copy)`;
                                  let copyNum = 1;
                                  while (items.some((i) => i.code.toLowerCase() === copyCode.toLowerCase())) {
                                    copyNum++;
                                    copyCode = `${item.code}-COPY${copyNum}`;
                                    copyName = `${item.name} (Copy ${copyNum})`;
                                  }
                                  const clone: ItemMaster = {
                                    ...item,
                                    code: copyCode,
                                    name: copyName,
                                    approval: 'draft',
                                    status: 'inactive',
                                    createdOn: 'Today',
                                  };
                                  onCreateItem(clone);
                                  itemService.saveItem(clone);
                                  showToast(`✓ Cloned ${item.code} to new SKU ${copyCode}`);
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                className="p-1 text-[#6B7280] hover:text-[#0F8B8D] hover:bg-teal-50 rounded transition-colors"
                                title="Create / View Manufacturing BOM"
                                onClick={() => {
                                  if (item.type === 'Raw Material') {
                                    openConfirm(
                                      'Raw Material BOM Notice',
                                      'Raw Materials typically do not have a Manufacturing BOM. Do you want to proceed?',
                                      () => handleOpenMfgBomWizard(item)
                                    );
                                  } else {
                                    handleOpenMfgBomWizard(item);
                                  }
                                }}
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                              <button
                                className="p-1 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Delete Item (Admin Only)"
                                onClick={() => {
                                  if (!isSuperAdmin && !canDeleteItem) {
                                    showToast('Admin privileges required to delete items');
                                    return;
                                  }
                                  openConfirm(
                                    `Delete ${item.code}?`,
                                    `This will remove ${item.name} from the master catalog.`,
                                    () => {
                                      itemService.deleteItem(item.code);
                                      onDeleteItem(item.code);
                                      showToast(`Item ${item.code} deleted`);
                                    }
                                  );
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={12}>
                        <div className="py-12 px-6 text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 text-[#0F8B8D] mb-3">
                            <Plus className="w-6 h-6" />
                          </div>
                          <h3 className="text-sm font-bold text-[#14213D] mb-1">
                            {items.length === 0 ? 'No Master Items in Catalog' : 'No matching items found'}
                          </h3>
                          <p className="text-xs text-[#6B7280] max-w-md mx-auto mb-4">
                            {items.length === 0
                              ? 'The catalog is empty and ready for live data entry. Click below to register your first Raw Material or Finished Good.'
                              : 'No items match your active search or filter. Try clearing filters or changing search query.'}
                          </p>
                          {items.length === 0 && (
                            <button
                              onClick={handleOpenCreateItemWizard}
                              className="btn btn-sm btn-primary inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" /> Create First Item
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* High-Performance Scalable Pagination Bar */}
            <div className="p-3 bg-[#F9F8F5] border-t border-[#E4E0D6] text-xs text-[#6B7280] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span>
                  Showing <strong className="text-[#14213D] font-mono">{sortedItems.length === 0 ? 0 : startItemIdx + 1}</strong> to{' '}
                  <strong className="text-[#14213D] font-mono">{Math.min(startItemIdx + itemPageSize, sortedItems.length)}</strong> of{' '}
                  <strong className="text-[#14213D] font-mono">{sortedItems.length}</strong> items
                  {sortedItems.length !== items.length && (
                    <span className="text-gray-400 font-normal"> (filtered from {items.length} total)</span>
                  )}
                </span>

                {/* Rows Per Page Selector */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-[#E4E0D6]">
                  <span className="text-[11px] text-gray-500">Rows:</span>
                  <select
                    value={itemPageSize}
                    onChange={(e) => {
                      setItemPageSize(Number(e.target.value));
                      setItemPage(1);
                    }}
                    className="py-1 px-2 border border-[#E4E0D6] rounded-md bg-white text-xs font-semibold text-[#14213D]"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                    <option value={250}>250 / page</option>
                    <option value={500}>500 / page</option>
                  </select>
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={() => setItemPage(1)}
                  disabled={safeItemPage === 1}
                  className="p-1.5 border border-[#E4E0D6] rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setItemPage((p) => Math.max(1, p - 1))}
                  disabled={safeItemPage === 1}
                  className="p-1.5 border border-[#E4E0D6] rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 text-xs font-semibold text-[#14213D]">
                  Page <span className="font-mono font-bold text-[#0F8B8D]">{safeItemPage}</span> of{' '}
                  <span className="font-mono font-bold">{totalItemPages}</span>
                </span>

                <button
                  onClick={() => setItemPage((p) => Math.min(totalItemPages, p + 1))}
                  disabled={safeItemPage === totalItemPages}
                  className="p-1.5 border border-[#E4E0D6] rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setItemPage(totalItemPages)}
                  disabled={safeItemPage === totalItemPages}
                  className="p-1.5 border border-[#E4E0D6] rounded bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>

                {/* Jump to Page Form */}
                <form onSubmit={handleJumpItemPage} className="flex items-center gap-1 pl-2 border-l border-[#E4E0D6]">
                  <input
                    type="number"
                    min={1}
                    max={totalItemPages}
                    placeholder="Go to"
                    value={jumpItemPageInput}
                    onChange={(e) => setJumpItemPageInput(e.target.value)}
                    className="w-14 py-1 px-1.5 border border-[#E4E0D6] rounded bg-white text-xs font-mono text-center"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-[#14213D] text-white rounded text-[11px] font-semibold hover:bg-gray-800"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ----------------------------------------------------
       ITEM DETAIL VIEW (With All 10 Full Tabs & Mold Spec Tooling)
    ---------------------------------------------------- */
    if (view === 'itemDetail') {
      const item = items.find((i) => i.code === selectedCode) || (items.length > 0 ? items[0] : null);
      if (!item) {
        return (
          <div className="space-y-5">
            <div className="back-link" onClick={() => onNavigate('itemList')}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Item Master
            </div>
            <div className="p-12 text-center bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-500 mb-3">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#14213D] mb-1">Item Not Found in Catalog</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto mb-4">
                The requested item code is not available or the master catalog is currently empty.
              </p>
              <button className="btn btn-sm btn-primary" onClick={() => onNavigate('itemList')}>
                Return to Catalog
              </button>
            </div>
          </div>
        );
      }

      const isFg = item.type === 'Finished Good' || item.type === 'Semi-Finished Good';
      const itemBoms = boms.filter((b) => (b.lines || []).some((l) => l.item === item.code) || b.parent === item.code);
      const cycle = Number(item.standardCycleTime || item.cycleTime || 24.5);
      const cavities = Number(item.cavityCount || 1);
      const partWt = Number(item.partWeightGrams || 25);
      const runnerWt = Number(item.runnerWeightGrams || 0);
      const singleShotWt = partWt + runnerWt;
      const totalMoldShotWt = (partWt * cavities) + runnerWt;
      const hourlyOutput = cycle > 0 ? Math.round((3600 / cycle) * cavities) : 0;

      const tabs = [
        'Overview',
        'Inventory',
        'Purchasing',
        'Quality',
        isFg ? 'Cycle Time & Mold Spec' : 'Material & Rheology Specs',
        'BOM usage',
        'Documents',
        'Barcode / Label',
        'Approval',
        'Audit history',
      ];

      return (
        <div className="space-y-5 max-w-[1500px] mx-auto pb-8">
          <div
            className="back-link"
            onClick={() => onNavigate('itemList')}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Item Master
          </div>

          {/* Detail Header */}
          <div className="detail-header">
            <div className="dh-left">
              <div className="item-thumb">{item.icon}</div>
              <div>
                <div className="dh-title">
                  <h2>{item.name}</h2>
                  {renderStatusBadge(item.status)}
                  {renderApprovalBadge(item.approval)}
                </div>
                <div className="dh-meta">
                  <div className="m">
                    Item Code: <b>{item.code}</b>
                  </div>
                  <div className="m">
                    Type: <b>{item.type}</b>
                  </div>
                  <div className="m">
                    Category: <b>{item.cat}</b>
                  </div>
                  <div className="m">
                    Warehouse: <b>{item.wh}</b>
                  </div>
                  {isFg ? (
                    <div className="m">
                      Mold: <b>{item.moldToolId || 'MOLD-001'} ({cavities} Cav)</b>
                    </div>
                  ) : item.type === 'Raw Material' || item.type === 'Regrind' ? (
                    <div className="m">
                      Polymer: <b>{item.resinType || item.polymerGrade || 'PP Copolymer'}</b>
                    </div>
                  ) : item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive' ? (
                    <div className="m">
                      Color: <b>{item.color || 'Standard'} ({item.masterbatchDosage || '2%'} LDR)</b>
                    </div>
                  ) : item.type === 'Packaging Material' ? (
                    <div className="m">
                      Pack Spec: <b>{item.packagingStandard || 'Corrugated Box'}</b>
                    </div>
                  ) : (
                    <div className="m">
                      Fitment: <b>{item.moldToolId || 'Universal'}</b>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="dh-actions">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setQuickModifyItem(item)}
              >
                <Edit2 className="w-3.5 h-3.5 text-[#E8622C]" /> Quick Modify
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => handleOpenEditItemWizard(item)}
              >
                <Sliders className="w-3.5 h-3.5" /> 10-Step Wizard
              </button>
              <button
                className="btn btn-sm btn-ghost flex items-center gap-1.5"
                onClick={() => {
                  setAuditTarget({ type: 'ITEM_MASTER', code: item.code, name: item.name });
                  setIsAuditModalOpen(true);
                }}
                title="View change history for this item in PostgreSQL vault"
              >
                <History className="w-3.5 h-3.5 text-[#0F8B8D]" /> Audit History
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => showToast(`Label sent to Zebra printer for ${item.code}`)}
              >
                <Printer className="w-3.5 h-3.5" /> Print Label
              </button>
              {isFg && (
                <button
                  className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
                  onClick={() => handleOpenMfgBomWizard(item)}
                >
                  <Layers className="w-3.5 h-3.5" /> Create Manufacturing BOM
                </button>
              )}
              {item.approval !== 'approved' && (
                <button
                  className="btn btn-sm btn-ghost border-[#E4E0D6] text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  onClick={() => handleApproveItem(item)}
                >
                  Approve &amp; Release
                </button>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="lbl">On Hand Stock</div>
              <div className="val text-lg">{item.stock}</div>
            </div>
            <div className="kpi-card">
              <div className="lbl">Available Stock</div>
              <div className="val text-lg">{item.avail}</div>
            </div>
            {isFg ? (
              <>
                <div className="kpi-card">
                  <div className="lbl">Std Cycle Time</div>
                  <div className="val text-lg">{cycle}s</div>
                </div>
                <div className="kpi-card">
                  <div className="lbl">Est. Hourly Output</div>
                  <div className="val text-lg text-emerald-700">{hourlyOutput} pcs/h</div>
                </div>
              </>
            ) : item.type === 'Raw Material' || item.type === 'Regrind' ? (
              <>
                <div className="kpi-card">
                  <div className="lbl">Melt Flow Index</div>
                  <div className="val text-lg font-mono">{item.mfi || '12.0 g/10m'}</div>
                </div>
                <div className="kpi-card">
                  <div className="lbl">Density Gradient</div>
                  <div className="val text-lg font-mono text-emerald-700">{item.density || '0.905 g/cm³'}</div>
                </div>
              </>
            ) : item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive' ? (
              <>
                <div className="kpi-card">
                  <div className="lbl">Target Dosage (LDR)</div>
                  <div className="val text-lg font-mono">{item.masterbatchDosage || '2.0%'}</div>
                </div>
                <div className="kpi-card">
                  <div className="lbl">Heat Stability</div>
                  <div className="val text-lg font-mono text-emerald-700">{item.heatStability || '280°C'}</div>
                </div>
              </>
            ) : item.type === 'Packaging Material' ? (
              <>
                <div className="kpi-card">
                  <div className="lbl">Box Dimensions</div>
                  <div className="val text-sm font-mono truncate">{item.boxDimensions || '600x400x300 mm'}</div>
                </div>
                <div className="kpi-card">
                  <div className="lbl">Packaging Standard</div>
                  <div className="val text-sm font-semibold text-emerald-700 truncate">{item.packagingStandard || 'Corrugated Box'}</div>
                </div>
              </>
            ) : (
              <>
                <div className="kpi-card">
                  <div className="lbl">Lead Time</div>
                  <div className="val text-lg font-mono">{item.leadTime || '7 days'}</div>
                </div>
                <div className="kpi-card">
                  <div className="lbl">Safety Stock</div>
                  <div className="val text-lg font-mono text-emerald-700">{item.safetyStock || '10 EA'}</div>
                </div>
              </>
            )}
            <div className="kpi-card">
              <div className="lbl">BOM References</div>
              <div className="val text-lg">{itemBoms.length}</div>
            </div>
          </div>

          {/* Tabs Bar */}
          <div className="tabs">
            {tabs.map((tab) => (
              <div
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'Overview' && (
            <div className="space-y-5">
              {/* Dynamic Spec Header Card */}
              {isFg ? (
                <div className="p-5 bg-white rounded-2xl border border-blue-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14213D]">
                          Finished Good &mdash; Injection Molding Tooling &amp; Process Parameters
                        </h3>
                        <p className="text-xs text-gray-500">
                          Core rheology, cycle timing, mold cavity metrics, and automatic shot weight balancing.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      MOLD SPEC GATE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Cycle Time (seconds) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{cycle} sec</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Part Weight (grams/pc) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{partWt} g</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Mold Cavities (count) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{cavities} cav</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Runner Weight (grams) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{runnerWt} g</span>
                    </div>
                  </div>

                  {/* Live Formula Breakdown Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-emerald-50/50 to-teal-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <strong className="text-[#14213D]">Calculated Shot Weight:</strong>
                        <span className="px-2.5 py-0.5 rounded-md bg-white border border-blue-200 font-mono font-bold text-blue-800">
                          {singleShotWt} g / pc shot
                        </span>
                        <span className="text-gray-400">&bull;</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 font-mono font-bold text-emerald-800">
                          {totalMoldShotWt} g (Total {cavities}-Cavity Shot)
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 font-mono">
                        Formula: Part Weight ({partWt}g) + Runner Weight ({runnerWt}g) = {singleShotWt}g &bull; ({partWt}g &times; {cavities} Cavities) + {runnerWt}g = {totalMoldShotWt}g Total Mold Shot
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-4 border-l border-blue-200/80">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Est. Hourly Output</span>
                      <span className="text-base font-mono font-bold text-emerald-700">{hourlyOutput} pcs / hr</span>
                    </div>
                  </div>
                </div>
              ) : item.type === 'Raw Material' || item.type === 'Regrind' ? (
                <div className="p-5 bg-white rounded-2xl border border-emerald-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14213D]">
                          Raw Polymer Feedstock &mdash; Rheology &amp; Technical Parameters
                        </h3>
                        <p className="text-xs text-gray-500">
                          Resin grade, melt flow rate, density index, and moisture pre-drying limits.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      RESIN FEEDSTOCK
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Polymer Grade *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.polymerGrade || item.resinType || 'PP Copolymer'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Melt Flow Index (MFI) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.mfi || '12.0 g/10min'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Specific Density *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.density || '0.905 g/cm³'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Moisture Limit</span>
                      <span className="font-mono text-base font-bold text-emerald-700">{item.moistureLimit || '< 0.05%'}</span>
                    </div>
                  </div>
                </div>
              ) : item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive' ? (
                <div className="p-5 bg-white rounded-2xl border border-purple-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14213D]">
                          Colorant &amp; Additive Masterbatch Formulation
                        </h3>
                        <p className="text-xs text-gray-500">
                          Target let-down ratio (LDR), carrier resin compatibility, and heat stability thresholds.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      COLOR MASTERBATCH
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Carrier Resin *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.carrierResin || 'PP Homopolymer'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Shade / Color Name *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.color || 'Standard Shade'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Target Dosage (LDR %) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.masterbatchDosage || '2.0%'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Heat Stability</span>
                      <span className="font-mono text-base font-bold text-purple-700">{item.heatStability || '280°C'}</span>
                    </div>
                  </div>
                </div>
              ) : item.type === 'Packaging Material' ? (
                <div className="p-5 bg-white rounded-2xl border border-amber-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14213D]">
                          Packaging Engineering &amp; Logistics Specifications
                        </h3>
                        <p className="text-xs text-gray-500">
                          Box standards, dimensional tolerances, palletizing schemes, and burst test ratings.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      PACKAGING SPEC
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Packaging Standard *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.packagingStandard || 'Corrugated Box (5-Ply)'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Box Dimensions (LxWxH) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.boxDimensions || '600 x 400 x 300 mm'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Pallet Pattern</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">4 Boxes/Layer &bull; 5 Tiers</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">ECT / Bursting Strength</span>
                      <span className="font-mono text-base font-bold text-amber-700">32 ECT / 200#</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14213D]">
                          Plant Asset Maintenance &amp; Equipment Fitment
                        </h3>
                        <p className="text-xs text-gray-500">
                          Machine fitment, manufacturer part numbers, PM intervals, and criticality flags.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      PLANT ASSET
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Machine Fitment *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.moldToolId || 'Toshiba / Haitian 250T'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">OEM Part Number *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.code}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">PM Cycle</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">500,000 Cycles</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Criticality Flag</span>
                      <span className="font-mono text-base font-bold text-slate-700">Class-A Critical</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Classification & Properties */}
              <div className="detail-grid">
                <div className="panel p-5 space-y-4">
                  <div className="section-title">
                    {isFg ? 'Classification & Polymer Properties' : 'Item Classification & Technical Properties'}
                  </div>
                  <div className="kv-grid">
                    <div className="kv"><label>Item Type</label><div className="v">{item.type}</div></div>
                    <div className="kv"><label>Material Family</label><div className="v">{item.cat}</div></div>
                    <div className="kv"><label>Base UOM</label><div className="v mono">{item.baseUOM}</div></div>
                    {isFg ? (
                      <>
                        <div className="kv"><label>Resin Grade</label><div className="v">{item.resinType || 'PP Copolymer'}</div></div>
                        <div className="kv"><label>Melt Flow Index</label><div className="v mono">{item.mfi || '12.0 g/10min'}</div></div>
                        <div className="kv"><label>Density</label><div className="v mono">{item.density || '0.905 g/cm³'}</div></div>
                        <div className="kv"><label>Mold Tool ID</label><div className="v mono font-bold text-[#0F8B8D]">{item.moldToolId || 'MOLD-001'}</div></div>
                      </>
                    ) : item.type === 'Raw Material' || item.type === 'Regrind' ? (
                      <>
                        <div className="kv"><label>Resin / Grade</label><div className="v">{item.polymerGrade || item.resinType || 'PP Copolymer'}</div></div>
                        <div className="kv"><label>Melt Flow Index</label><div className="v mono">{item.mfi || '12.0 g/10min'}</div></div>
                        <div className="kv"><label>Density</label><div className="v mono">{item.density || '0.905 g/cm³'}</div></div>
                        <div className="kv"><label>Moisture Limit</label><div className="v mono text-emerald-700">{item.moistureLimit || '< 0.05%'}</div></div>
                      </>
                    ) : item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive' ? (
                      <>
                        <div className="kv"><label>Carrier Resin</label><div className="v">{item.carrierResin || 'PP Homopolymer'}</div></div>
                        <div className="kv"><label>Color / Shade</label><div className="v">{item.color || 'Standard Shade'}</div></div>
                        <div className="kv"><label>Target LDR Dosage</label><div className="v mono">{item.masterbatchDosage || '2.0%'}</div></div>
                        <div className="kv"><label>Heat Stability</label><div className="v mono text-purple-700">{item.heatStability || '280°C'}</div></div>
                      </>
                    ) : item.type === 'Packaging Material' ? (
                      <>
                        <div className="kv"><label>Packaging Spec</label><div className="v">{item.packagingStandard || 'Corrugated Box'}</div></div>
                        <div className="kv"><label>Box Dimensions</label><div className="v mono">{item.boxDimensions || '600x400x300 mm'}</div></div>
                        <div className="kv"><label>HSN / SAC Code</label><div className="v mono">{item.hsnCode || '4819.10.00'}</div></div>
                        <div className="kv"><label>Storage Form</label><div className="v">Flat Packed on Pallet</div></div>
                      </>
                    ) : (
                      <>
                        <div className="kv"><label>Machine Fitment</label><div className="v mono">{item.moldToolId || 'Toshiba / Haitian 250T'}</div></div>
                        <div className="kv"><label>OEM Part Number</label><div className="v mono">{item.code}</div></div>
                        <div className="kv"><label>Maintenance Interval</label><div className="v">500,000 Cycles</div></div>
                        <div className="kv"><label>Critical Spare</label><div className="v font-bold text-amber-700">Yes (PM Essential)</div></div>
                      </>
                    )}
                    <div className="kv"><label>Country of Origin</label><div className="v">{item.countryOrigin || 'India'}</div></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="side-block">
                    <h4>Planning &amp; Inventory Parameters</h4>
                    <div className="side-row"><span>Reorder Level</span><span className="mono">{item.reorderLevel || '4,000 KG'}</span></div>
                    <div className="side-row"><span>Safety Stock</span><span className="mono">{item.safetyStock || '2,000 KG'}</span></div>
                    <div className="side-row"><span>Lead Time</span><span>{item.leadTime || '7 days'}</span></div>
                    <div className="side-row"><span>Preferred Supplier</span><span>{item.supplier || 'Reliance Polymers'}</span></div>
                    <div className="side-row">
                      <span>{isFg ? 'Post-Molding Destination' : 'Receiving Inspection Gate'}</span>
                      <span className="font-bold text-[#0F8B8D]">{isFg ? (item.routingDestination || 'DOL') : 'IQC Pass Gate'}</span>
                    </div>
                  </div>

                  <div className="side-block">
                    <h4>Quality Controls</h4>
                    <div className="side-row"><span>Incoming Inspection</span><span>{item.qc ? 'Required' : 'Not required'}</span></div>
                    <div className="side-row"><span>Lot Controlled</span><span>{item.lot ? 'Yes' : 'No'}</span></div>
                    <div className="side-row"><span>COA / TDS Required</span><span>{item.qc ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Inventory */}
          {activeTab === 'Inventory' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border bg-emerald-50/80 border-emerald-200 text-emerald-900 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs font-bold flex items-center gap-2">
                    <span>{isFg ? 'Default Post-Molding Store Routing:' : 'Default Inbound Receiving Location:'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-white border shadow-2xs">
                      {isFg ? `${item.routingDestination || 'DOL'} → ${item.wh || 'FG-WH-01'}` : `${item.wh || 'RM-WH-01'} (IQC Accepted)`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    {isFg
                      ? `Output from injection molding machine auto-backflushes into ${item.wh || 'FG-WH-01'}.`
                      : `Inbound materials are received, batch-tested, and routed to ${item.wh || 'RM-WH-01'}.`}
                  </div>
                </div>
                <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white border">
                  Target Store: {item.wh || (isFg ? 'FG-WH-01' : 'RM-WH-01')}
                </div>
              </div>

              <div className="panel bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
                <div className="panel-head p-4 bg-[#F9F8F5] border-b border-[#E4E0D6]">
                  <h3 className="text-sm font-bold text-[#14213D]">Warehouse Stock by Lot</h3>
                </div>
                <div className="panel-body p-0">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-gray-600 font-semibold">
                        <th className="py-2.5 px-3">Lot Number</th>
                        <th className="py-2.5 px-3">Warehouse</th>
                        <th className="py-2.5 px-3">Bin</th>
                        <th className="py-2.5 px-3 text-right">On Hand</th>
                        <th className="py-2.5 px-3">Mfg Date</th>
                        <th className="py-2.5 px-3">Expiry</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">LOT-2026-0842</td>
                        <td className="py-2.5 px-3">{item.wh}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-[#0F8B8D] font-bold">{item.locationCode || 'BIN-01'}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{item.stock}</td>
                        <td className="py-2.5 px-3 font-mono">2026-06-01</td>
                        <td className="py-2.5 px-3 font-mono">2027-06-01</td>
                        <td className="py-2.5 px-3 text-center"><span className="badge green">available</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Dynamic Technical Specs (Cycle Time & Mold Spec for FG vs Material & Rheology for non-FG) */}
          {(activeTab === 'Cycle Time & Mold Spec' || activeTab === 'Material & Rheology Specs') && (
            <div className="space-y-5">
              {isFg ? (
                <div className="p-5 bg-white rounded-2xl border border-[#E4E0D6] shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#14213D]">Standard Cycle Time Study &amp; Rheology Balance</h3>
                      <p className="text-xs text-gray-500">Injection molding cavity timing, cooling metrics &amp; shot breakdown.</p>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setQuickModifyItem(item)}
                    >
                      Edit Tooling Specs
                    </button>
                  </div>

                  <div className="flex items-baseline gap-3 pt-2">
                    <span className="font-mono text-4xl font-bold text-[#14213D]">{cycle}</span>
                    <span className="text-sm font-semibold text-gray-500">sec / cycle</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Mold Tool Cavities</span>
                      <strong className="text-sm text-[#14213D]">{cavities} Cavities</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Single Part Weight</span>
                      <strong className="text-sm text-[#14213D]">{partWt} grams</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Runner &amp; Sprue Weight</span>
                      <strong className="text-sm text-[#14213D]">{runnerWt} grams</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Total Shot Weight</span>
                      <strong className="text-sm text-emerald-700">{totalMoldShotWt} grams</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-white rounded-2xl border border-[#E4E0D6] shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#14213D]">Material Rheology &amp; Technical Data Sheet</h3>
                      <p className="text-xs text-gray-500">Melt flow behavior, density, drying requirements, and processing conditions.</p>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setQuickModifyItem(item)}
                    >
                      Edit Material Specs
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Melt Flow Index (MFI)</span>
                      <strong className="text-sm text-[#14213D]">{item.mfi || '12.0 g/10min'}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Specific Gravity / Density</span>
                      <strong className="text-sm text-[#14213D]">{item.density || '0.905 g/cm³'}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Moisture Limit</span>
                      <strong className="text-sm text-[#14213D]">{item.moistureLimit || '< 0.05%'}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Recommended Melt Temp</span>
                      <strong className="text-sm text-emerald-700">210°C &ndash; 240°C</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <strong className="text-emerald-900 block font-bold">Resin Handling &amp; Drying Requirement:</strong>
                    <p className="text-emerald-800">
                      Pre-dry for hygroscopic polymers (e.g., PA6, PET, ABS, PC) at 80°C for 3-4 hours prior to injection hopper loading. For non-hygroscopic polyolefins (PP/HDPE), hopper loading with dehumidified air is recommended.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 7: Documents (Live Uploaded PC Documents) */}
          {activeTab === 'Documents' && (
            <div className="p-5 bg-white rounded-2xl border border-[#E4E0D6] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#E8622C]" /> Attached Technical Drawings &amp; Documents
                  </h3>
                  <p className="text-xs text-gray-500">2D/3D part drawings, mold setup sheets, TDS, and quality inspection specs.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickModifyItem(item)}
                  className="btn btn-sm btn-primary flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Attach Document from PC
                </button>
              </div>

              {(item.documents && item.documents.length > 0) ? (
                <div className="overflow-x-auto border border-[#E4E0D6] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold">
                        <th className="py-2.5 px-3">Document Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Version</th>
                        <th className="py-2.5 px-3">Effective Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {item.documents.map((doc, idx) => (
                        <tr key={doc.id || idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-semibold text-[#14213D] flex items-center gap-2">
                            <Paperclip className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                            <span>{doc.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">({doc.fileSize || '2.4 MB'})</span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">{doc.type}</td>
                          <td className="py-2.5 px-3 font-mono">{doc.version || 'v1.0'}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-600">{doc.uploadedDate || '2026-09-22'}</td>
                          <td className="py-2.5 px-3 text-right">
                            {doc.link && (
                              <a
                                href={doc.link}
                                download={doc.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-[#F9F8F5] rounded-xl border border-[#E4E0D6] space-y-3">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                  <div>
                    <h4 className="font-bold text-sm text-[#14213D]">No technical documents attached yet.</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-0.5">
                      Upload part drawings (STEP/DWG/PDF), mold setup sheets, or packaging specifications.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickModifyItem(item)}
                    className="btn btn-sm btn-primary inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Attach Document from PC
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 6: BOM Usage */}
          {activeTab === 'BOM usage' && (
            <div className="panel bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
              <div className="panel-head p-4 bg-[#F9F8F5] border-b border-[#E4E0D6] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D]">Manufacturing BOM &amp; Recipe Records</h3>
                  <p className="text-xs text-gray-500">Multi-level polymer formulas, routing operations, and standard cost rollups.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenMfgBomWizard(item)}
                  className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Manufacturing BOM
                </button>
              </div>
              <div className="panel-body p-0">
                {itemBoms.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-gray-600 font-semibold">
                          <th className="py-2.5 px-3">BOM ID</th>
                          <th className="py-2.5 px-3">Parent Product</th>
                          <th className="py-2.5 px-3">Version</th>
                          <th className="py-2.5 px-3">Process</th>
                          <th className="py-2.5 px-3">Std Unit Cost</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {itemBoms.map((b) => (
                          <tr
                            key={b.id}
                            onClick={() => onNavigate('bomDetail', { id: b.id })}
                            className="hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{b.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-[#14213D]">{b.parentName}</td>
                            <td className="py-2.5 px-3 font-mono">{b.version}</td>
                            <td className="py-2.5 px-3 text-gray-600">{b.processType || 'Injection Molding'}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-800">
                              ₹{(b.standardCost || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3">{renderApprovalBadge(b.status)}</td>
                            <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => onNavigate('bomDetail', { id: b.id })}
                                className="text-xs text-[#0F8B8D] font-bold hover:underline"
                              >
                                Open Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 space-y-3 bg-[#F9F8F5]">
                    <div className="w-12 h-12 rounded-full bg-white border border-[#E4E0D6] text-gray-400 flex items-center justify-center mx-auto shadow-xs">
                      <Layers className="w-6 h-6 text-[#0F8B8D]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#14213D]">No Manufacturing BOM exists for this item.</h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                        Configure multi-component resin percentages, secondary degating operations, machine routing, and live cost rollups.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenMfgBomWizard(item)}
                      className="btn btn-sm btn-primary flex items-center gap-1.5 mx-auto shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Manufacturing BOM
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 8: Barcode / Label */}
          {activeTab === 'Barcode / Label' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="panel p-5">
                <h3 className="font-bold text-sm text-[#14213D] mb-4">Label Specifications</h3>
                <div className="space-y-2 text-xs">
                  <div className="side-row"><span>Symbology</span><span>QR Code + Code 128</span></div>
                  <div className="side-row"><span>Lot Number Included</span><span>Yes</span></div>
                  <div className="side-row"><span>Warehouse Location Tag</span><span>Yes ({item.wh})</span></div>
                  <div className="side-row"><span>Hazard / Moisture Warning</span><span>{item.hazardous ? 'Hazardous' : 'Standard'}</span></div>
                </div>
                <button
                  className="btn btn-sm btn-primary w-full mt-4"
                  onClick={() => showToast(`Sent label for ${item.code} to Zebra printer`)}
                >
                  <Printer className="w-3.5 h-3.5" /> Print 4x6" Thermal Label
                </button>
              </div>

              <div className="panel p-5 flex flex-col items-center justify-center bg-[#F6F4EF]/60 border-dashed border-2 border-[#E4E0D6]">
                <div className="p-4 bg-white border border-[#E4E0D6] rounded-lg shadow-sm w-64 text-center font-mono text-[11px] space-y-1.5">
                  <div className="font-bold font-['Space_Grotesk'] text-xs">DATASTOCK PLASTICS</div>
                  <div className="text-[10px] text-[#6B7280] border-b border-[#E4E0D6] pb-1">PLANT 01 &middot; HOSUR</div>
                  <div className="font-bold text-xs pt-1">{item.code}</div>
                  <div className="text-[10px] truncate">{item.name}</div>
                  <div className="text-[10px]">MOLD: {item.moldToolId || 'MOLD-001'}</div>
                  <div className="text-[10px]">QTY: {item.stock} &middot; {item.wh}</div>
                  <div className="py-2 text-2xl tracking-widest text-[#14213D]">
                    ||||| | ||||| | ||
                  </div>
                  <div className="text-[9px] text-[#9CA3AF]">* {item.code} *</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 9: Approval */}
          {activeTab === 'Approval' && (
            <div className="panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#14213D]">Master Data Approval Workflow</h3>
                {renderApprovalBadge(item.approval)}
              </div>
              <div className="space-y-3">
                <div className="timeline-item">
                  <div className="t-dot" style={{ background: 'var(--success)' }} />
                  <div>
                    <div className="t-text"><b>Item Created</b> &mdash; {item.name}</div>
                    <div className="t-time">{item.createdOn} &middot; Initial draft</div>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="t-dot" style={{ background: item.approval === 'approved' ? 'var(--success)' : 'var(--warning)' }} />
                  <div>
                    <div className="t-text">
                      <b>QA &amp; Technical Review</b> &mdash; {item.approval === 'approved' ? 'Approved by Priya Rao' : 'Awaiting Review'}
                    </div>
                    <div className="t-time">Master catalog release authority</div>
                  </div>
                </div>
              </div>
              {item.approval !== 'approved' && (
                <div className="flex gap-2 pt-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleApproveItem(item)}
                  >
                    Approve Item
                  </button>
                  <button
                    className="btn btn-sm btn-ghost text-[#C4433A] border-[#C4433A]/30 hover:bg-[#FBE1DE]"
                    onClick={() => handleRejectItem(item)}
                  >
                    Reject Item
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 10: Audit History */}
          {activeTab === 'Audit history' && (
            <div className="panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                    <History className="w-4 h-4 text-[#0F8B8D]" /> Immutable Change Audit Logs (PostgreSQL)
                  </h3>
                  <p className="text-xs text-gray-500">Chronological history of revisions, approvals, and tooling changes.</p>
                </div>
                <button
                  className="btn btn-sm btn-ghost border"
                  onClick={() => {
                    setAuditTarget({ type: 'ITEM_MASTER', code: item.code, name: item.name });
                    setIsAuditModalOpen(true);
                  }}
                >
                  Open Full Audit Vault
                </button>
              </div>

              <div className="timeline-item">
                <div className="t-dot" style={{ background: 'var(--success)' }} />
                <div>
                  <div className="t-text font-bold text-xs text-[#14213D]">Item Created &amp; Tooling Linked</div>
                  <div className="text-[11px] text-gray-500">{item.createdOn} &bull; Recorded with standard cycle time {cycle}s and mold {item.moldToolId || 'MOLD-001'}.</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Purchasing */}
          {activeTab === 'Purchasing' && (
            <div className="panel p-5 space-y-4">
              <div className="section-title">Supplier &amp; Procurement Rates</div>
              <div className="kv-grid">
                <div className="kv"><label>Preferred Supplier</label><div className="v">{item.supplier || 'Reliance Polymers Ltd'}</div></div>
                <div className="kv"><label>Procurement Lead Time</label><div className="v">{item.leadTime || '7 days'}</div></div>
                <div className="kv"><label>Valuation Standard</label><div className="v">{item.valuation || 'Weighted Avg Cost'}</div></div>
                <div className="kv"><label>Standard Unit Cost</label><div className="v mono font-bold">₹{(item.standardCost || item.cost || 0).toFixed(2)}</div></div>
              </div>
            </div>
          )}

          {/* Tab 4: Quality */}
          {activeTab === 'Quality' && (
            <div className="panel p-5 space-y-4">
              <div className="section-title">Quality Control &amp; Tolerances</div>
              <div className="kv-grid">
                <div className="kv"><label>Incoming IQC Mandatory</label><div className="v">{item.qc ? 'Yes' : 'No'}</div></div>
                <div className="kv"><label>Certificate of Analysis (COA)</label><div className="v">{item.qc ? 'Mandatory Gate' : 'Optional'}</div></div>
                <div className="kv"><label>Statistical Sampling</label><div className="v">AQL 1.0 General Level II</div></div>
                <div className="kv"><label>Dimensional Tolerance</label><div className="v mono">&plusmn;0.05 mm</div></div>
              </div>
            </div>
          )}
        </div>
      );
    }

  /* ----------------------------------------------------
     BOM / FORMULA MASTER LIST & DETAIL
  ---------------------------------------------------- */
  if (view === 'bomList') {
    const openCreateBomModal = () => {
      if (!isSuperAdmin && !canCreateBom) {
        showToast('Admin permission required to create BOM recipes.');
        return;
      }
      const fgItems = items.filter((i) => i.type === 'Finished Good');
      let parent = fgItems.length > 0 ? fgItems[0].code : '';
      let version = 'v1';
      const handleSave = () => {
        const parentItem = items.find((i) => i.code === parent);
        const rawMaterials = items.filter((i) => i.type === 'Raw Material' || i.type === 'Masterbatch');
        const lines = rawMaterials.length > 0
          ? rawMaterials.slice(0, 2).map((rm) => ({
              item: rm.code,
              name: rm.name,
              qty: 1,
              uom: rm.baseUOM || 'KG',
              scrap: 0,
              cost: 0,
            }))
          : [];

        const newBom: BomMaster = {
          id: `BOM-${1050 + boms.length}`,
          parent: parent || 'NEW-FG-RECIPE',
          parentName: parentItem?.name || parent || 'New Product Recipe',
          version,
          status: 'released',
          updated: 'Today',
          lines,
        };
        onCreateBom(newBom);
        closeDrawer();
        showToast(`BOM ${newBom.id} created for ${newBom.parentName}`);
      };

      openDrawer(
        'Create New BOM / Recipe',
        <div className="space-y-4">
          <div className="field">
            <label>Parent Finished Good</label>
            <select defaultValue={parent} onChange={(e) => (parent = e.target.value)}>
              {items.filter((i) => i.type === 'Finished Good').map((i) => (
                <option key={i.code} value={i.code}>{i.code} &mdash; {i.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Version Tag</label>
            <input defaultValue={version} onChange={(e) => (version = e.target.value)} />
          </div>
        </div>,
        <div className="flex justify-end gap-2 w-full">
          <button className="btn btn-sm btn-ghost" onClick={closeDrawer}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={handleSave}>Create BOM</button>
        </div>
      );
    };

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
              Master Data &middot; Engineering
            </div>
            <h1 className="text-xl font-bold text-[#14213D]">BOM / Formula Master</h1>
            <p className="text-xs text-[#6B7280]">
              Multi-level recipes, resin, masterbatch and regrind blending ratios.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
              onClick={() => {
                if (!isSuperAdmin && !canCreateBom) {
                  showToast('Admin permission required to create/modify Manufacturing BOMs.');
                  return;
                }
                const defaultParent = items.find((i) => i.type === 'Finished Goods' || i.type === 'Finished Good') || (items.length > 0 ? items[0] : null);
                if (defaultParent) {
                  handleOpenMfgBomWizard(defaultParent);
                } else {
                  showToast('Please create a Finished Good item first in Item Master before building a BOM.');
                }
              }}
            >
              <Layers className="w-3.5 h-3.5" /> Create Manufacturing BOM
            </button>
            <button className="btn btn-sm btn-ghost border-[#E4E0D6]" onClick={openCreateBomModal}>
              <Plus className="w-3.5 h-3.5" /> Quick BOM
            </button>
          </div>
        </div>

        <div className="kpi-row">
          <div className="kpi-card"><div className="lbl">Total BOMs</div><div className="val">{boms.length}</div></div>
          <div className="kpi-card"><div className="lbl">Released</div><div className="val">{boms.filter((b) => b.status === 'released').length}</div></div>
          <div className="kpi-card"><div className="lbl">Under Review</div><div className="val">{boms.filter((b) => b.status === 'under_review').length}</div></div>
          <div className="kpi-card"><div className="lbl">Drafts</div><div className="val">{boms.filter((b) => b.status === 'draft').length}</div></div>
        </div>

        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>BOM ID</th>
                <th>Parent Product</th>
                <th>Version</th>
                <th>Lines</th>
                <th>Rollup Cost</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {boms.length > 0 ? (
                boms.map((b) => {
                  const totalCost = (b.lines || []).reduce((s, l) => s + (l.cost || 0), 0);
                  return (
                    <tr key={b.id} onClick={() => onNavigate('bomDetail', { id: b.id })}>
                      <td><span className="cell-code">{b.id}</span></td>
                      <td className="cell-name"><b>{b.parentName}</b><div className="cell-sub">{b.parent}</div></td>
                      <td>{b.version}</td>
                      <td>{(b.lines || []).length} components</td>
                      <td className="font-mono font-bold">₹{totalCost.toFixed(2)}</td>
                      <td>{renderApprovalBadge(b.status)}</td>
                      <td className="mono text-xs text-[#6B7280]">{b.updated}</td>
                      <td>
                        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="row-ic danger"
                            onClick={() => {
                              if (!isSuperAdmin && !canEditBom) {
                                showToast('Admin permission required to delete BOM records.');
                                return;
                              }
                              openConfirm(`Delete ${b.id}?`, `Delete recipe for ${b.parentName}?`, () => {
                                onDeleteBom(b.id);
                                showToast(`BOM ${b.id} deleted`);
                              });
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#6B7280]">
                    No Bill of Materials configured yet. Click 'Create Manufacturing BOM' to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
     BOM DETAIL VIEW
  ---------------------------------------------------- */
  if (view === 'bomDetail') {
    const bom = boms.find((b) => b.id === selectedId) || (boms.length > 0 ? boms[0] : null);
    if (!bom) {
      return (
        <div className="space-y-5">
          <div className="back-link" onClick={() => onNavigate('bomList')}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to BOM Master
          </div>
          <div className="p-12 text-center bg-white rounded-xl border border-[#E4E0D6]">
            <h3 className="text-sm font-bold text-[#14213D] mb-1">BOM Not Found</h3>
            <p className="text-xs text-[#6B7280] mb-4">The requested Bill of Materials record does not exist.</p>
            <button className="btn btn-sm btn-primary" onClick={() => onNavigate('bomList')}>
              Return to BOM List
            </button>
          </div>
        </div>
      );
    }
    const totalCost = (bom.lines || []).reduce((s, l) => s + (l.cost || 0), 0);

    return (
      <div className="space-y-5">
        <div className="back-link" onClick={() => onNavigate('bomList')}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to BOM Master
        </div>

        <div className="detail-header">
          <div className="dh-left">
            <div className="item-thumb" style={{ background: 'linear-gradient(135deg, var(--teal), #12a3a5)' }}>
              🏷
            </div>
            <div>
              <div className="dh-title">
                <h2>{bom.parentName}</h2>
                {renderApprovalBadge(bom.status)}
              </div>
              <div className="dh-meta">
                <div className="m">BOM ID: <b>{bom.id}</b></div>
                <div className="m">Version: <b>{bom.version}</b></div>
                <div className="m">Parent Item: <b>{bom.parent}</b></div>
                <div className="m">Last Updated: <b>{bom.updated}</b></div>
              </div>
            </div>
          </div>
          <div className="dh-actions">
            {bom.status !== 'released' && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  if (!isSuperAdmin && !canEditBom) {
                    showToast('Admin permission required to release BOM to production.');
                    return;
                  }
                  onUpdateBom({ ...bom, status: 'released' });
                  showToast(`BOM ${bom.id} approved & released`);
                }}
              >
                Release to Production
              </button>
            )}
          </div>
        </div>

        {/* Component Lines Table with Unique Formula Code and Core Material Summation */}
        {(() => {
          const recipeCode = bom.recipeCode || bom.formulaCode || `RCP-${bom.id}-${bom.version || 'v1.0'}`;
          
          const isAuxiliaryLine = (line: BomLine) => {
            const code = (line.item || '').toUpperCase();
            const cat = (line.category || '').toUpperCase();
            const uom = (line.uom || '').toUpperCase();
            return (
              code.startsWith('BOP-') ||
              code.startsWith('CON-') ||
              code.startsWith('PK-') ||
              code.startsWith('PCK-') ||
              cat.includes('PACK') ||
              cat.includes('BOUGHT') ||
              cat.includes('CONSUMABLE') ||
              cat.includes('HARDWARE') ||
              uom === 'PCS' ||
              uom === 'SET' ||
              uom === 'BOX' ||
              uom === 'ROLL'
            );
          };

          const getLineRoleBadge = (line: BomLine) => {
            const code = (line.item || '').toUpperCase();
            const cat = (line.category || '').toUpperCase();
            if (code.startsWith('PK-') || code.startsWith('PCK-') || cat.includes('PACK')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">PCK &middot; Packaging</span>;
            }
            if (code.startsWith('BOP-') || cat.includes('BOUGHT') || cat.includes('HARDWARE')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">BOP &middot; Bought Out</span>;
            }
            if (code.startsWith('CON-') || cat.includes('CONSUMABLE')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">CON &middot; Consumable</span>;
            }
            if (code.startsWith('MB-')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">MB &middot; Masterbatch</span>;
            }
            if (code.startsWith('AD-')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">AD &middot; Additive</span>;
            }
            if (code.startsWith('RG-')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">RG &middot; Regrind</span>;
            }
            return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">RM &middot; Core Resin</span>;
          };

          const coreMaterialLines = (bom.lines || []).filter((l) => !isAuxiliaryLine(l));
          const auxiliaryLines = (bom.lines || []).filter((l) => isAuxiliaryLine(l));

          const totalMaterialUnitQty = coreMaterialLines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
          const totalMaterialBatchQty = totalMaterialUnitQty * (bom.batchSize || 1000);
          const materialUom = coreMaterialLines[0]?.uom || 'KG';

          return (
            <div className="space-y-4">
              {/* Top Formula Formulation Header Card */}
              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-emerald-50/60 to-teal-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-900 shadow-2xs">
                      <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                      <span>RECIPE / FORMULA ID: {recipeCode}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100/70 text-blue-800 border border-blue-200">
                      Linked to BOM {bom.id} (v{bom.version})
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Batch Size: <strong className="text-[#14213D] font-mono">{bom.batchSize || 1000} {bom.baseUOM || 'PCS'}</strong>
                  </div>
                </div>

                {/* Summary Metrics: Core Material Sum (excluding BOP, CON, PCK) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-white/95 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                      Core Material Sum Unit Qty
                    </span>
                    <span className="font-mono text-base font-bold text-blue-900">
                      {totalMaterialUnitQty.toFixed(4)} {materialUom} <span className="text-[10px] text-gray-400 font-normal">/ PC</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/95 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                      Core Material Sum Batch Qty
                    </span>
                    <span className="font-mono text-base font-bold text-emerald-800">
                      {totalMaterialBatchQty.toFixed(2)} {materialUom} <span className="text-[10px] text-gray-400 font-normal">/ Batch</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/95 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                      Core Formulation Blend
                    </span>
                    <span className="font-mono text-base font-bold text-teal-800">
                      {coreMaterialLines.length} Material{coreMaterialLines.length !== 1 ? 's' : ''} (100%)
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/95 rounded-lg border border-amber-100 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                      Excluded Auxiliaries
                    </span>
                    <span className="font-mono text-base font-bold text-amber-800">
                      {auxiliaryLines.length} Items (BOP/CON/PCK)
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipe Lines Table */}
              <div className="panel bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
                <div className="panel-head p-4 bg-[#F9F8F5] border-b border-[#E4E0D6] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0F8B8D]" /> Formula &amp; Recipe Components ({bom.lines?.length || 0})
                  </h3>
                  <span className="text-xs font-mono font-bold text-[#E8622C]">Unit Material Cost: ₹{totalCost.toFixed(2)}</span>
                </div>
                <div className="panel-body p-0">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold">
                        <th className="py-2.5 px-3">Component Item</th>
                        <th className="py-2.5 px-3">Role / Classification</th>
                        <th className="py-2.5 px-3 text-right">Quantity / Unit</th>
                        <th className="py-2.5 px-3 text-center">UOM</th>
                        <th className="py-2.5 px-3 text-right">Formula %</th>
                        <th className="py-2.5 px-3 text-right">Scrap Factor %</th>
                        <th className="py-2.5 px-3 text-right">Line Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bom.lines.map((line, idx) => {
                        const isAux = isAuxiliaryLine(line);
                        const formulaPct = !isAux && totalMaterialUnitQty > 0
                          ? ((Number(line.qty) / totalMaterialUnitQty) * 100).toFixed(1)
                          : null;

                        return (
                          <tr
                            key={idx}
                            onClick={() => onNavigate('itemDetail', { code: line.item })}
                            className={`hover:bg-gray-50 cursor-pointer ${isAux ? 'bg-amber-50/20' : ''}`}
                          >
                            <td className="py-2.5 px-3">
                              <span className="cell-code font-bold text-[#0F8B8D]">{line.item}</span>
                              <div className="cell-sub text-gray-600">{line.name}</div>
                            </td>
                            <td className="py-2.5 px-3">{getLineRoleBadge(line)}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">{line.qty}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-gray-600">{line.uom}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {formulaPct ? (
                                <span className="text-blue-700">{formulaPct}%</span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">N/A (BOP)</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-600">{line.scrap}%</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-right text-gray-800">₹{line.cost.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[#F9F8F5] border-t-2 border-[#E4E0D6] font-semibold text-xs text-[#14213D]">
                      <tr className="bg-blue-50/50">
                        <td colSpan={2} className="py-2.5 px-3 text-blue-900 font-bold">
                          Core Material Formula Sum (Excl. BOP / CON / PCK):
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                          {totalMaterialUnitQty.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-blue-900">{materialUom}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">100.0%</td>
                        <td className="py-2.5 px-3 text-right text-[11px] text-gray-500">Net Resin</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          ₹{coreMaterialLines.reduce((s, l) => s + (l.cost || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  /* ----------------------------------------------------
     MACHINES & MOLDS LIST
  ---------------------------------------------------- */
  if (view === 'machineList') {
    const [machSearch, setMachSearch] = useState('');
    const [machStatusFilter, setMachStatusFilter] = useState('all');

    const filteredMachines = machines.filter((m) => {
      const matchQ =
        m.id.toLowerCase().includes(machSearch.toLowerCase()) ||
        m.name.toLowerCase().includes(machSearch.toLowerCase()) ||
        m.line.toLowerCase().includes(machSearch.toLowerCase()) ||
        m.type.toLowerCase().includes(machSearch.toLowerCase());
      if (!matchQ) return false;
      if (machStatusFilter !== 'all' && m.status !== machStatusFilter) return false;
      return true;
    });

    const totalMachinePages = Math.ceil(filteredMachines.length / machinePageSize) || 1;
    const pagedMachines = filteredMachines.slice(
      (machinePage - 1) * machinePageSize,
      machinePage * machinePageSize
    );

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
              Master Data &middot; Plant Assets
            </div>
            <h1 className="text-xl font-bold text-[#14213D]">Machines &amp; Molds</h1>
            <p className="text-xs text-[#6B7280]">
              Injection molding machines, extrusion lines, molds/tooling and granulators.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                let id = `IMM-250T-0${machines.length + 1}`;
                let name = 'Injection Molding Machine 250T';
                let line = 'Line 4';
                let tonnage = '250T';

                openDrawer(
                  'Register New Plant Machine / Mold',
                  <div className="space-y-4">
                    <div className="field"><label>Asset ID</label><input defaultValue={id} onChange={(e) => (id = e.target.value)} /></div>
                    <div className="field"><label>Asset Name</label><input defaultValue={name} onChange={(e) => (name = e.target.value)} /></div>
                    <div className="field"><label>Line Location</label><input defaultValue={line} onChange={(e) => (line = e.target.value)} /></div>
                    <div className="field"><label>Tonnage / Specification</label><input defaultValue={tonnage} onChange={(e) => (tonnage = e.target.value)} /></div>
                  </div>,
                  <div className="flex justify-end gap-2 w-full">
                    <button className="btn btn-sm btn-ghost" onClick={closeDrawer}>Cancel</button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        onCreateMachine({
                          id,
                          name,
                          type: 'Injection Molding Machine',
                          line,
                          status: 'idle',
                          job: '—',
                          lastPM: 'Today',
                          nextPM: 'In 30 days',
                          tonnage,
                          approval: 'approved',
                          createdOn: 'Today',
                        });
                        closeDrawer();
                        showToast(`Asset ${id} registered`);
                      }}
                    >
                      Register Asset
                    </button>
                  </div>
                );
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Machine / Mold
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search asset ID, machine name, line location..."
              value={machSearch}
              onChange={(e) => {
                setMachSearch(e.target.value);
                setMachinePage(1);
              }}
              className="w-full bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg px-3 py-1.5 text-xs text-[#14213D] focus:outline-none focus:border-[#0F8B8D]"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={machStatusFilter}
              onChange={(e) => {
                setMachStatusFilter(e.target.value);
                setMachinePage(1);
              }}
              className="bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#14213D] focus:outline-none focus:border-[#0F8B8D]"
            >
              <option value="all">Status: All Assets</option>
              <option value="running">Status: Running</option>
              <option value="idle">Status: Idle</option>
              <option value="breakdown">Status: Breakdown / Alert</option>
            </select>
          </div>
        </div>

        <div className="panel bg-white rounded-xl border border-[#E4E0D6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3">Asset ID</th>
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Line Location</th>
                  <th className="p-3">Current Job</th>
                  <th className="p-3">Next PM Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Approval</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {pagedMachines.length > 0 ? (
                  pagedMachines.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F9F8F5] transition-colors">
                      <td className="p-3"><span className="cell-code">{m.id}</span></td>
                      <td className="p-3 cell-name"><b>{m.name}</b><div className="cell-sub">{m.tonnage !== '—' ? m.tonnage : m.type}</div></td>
                      <td className="p-3"><span className="type-pill">{m.type}</span></td>
                      <td className="p-3">{m.line}</td>
                      <td className="p-3 mono text-xs">{m.job}</td>
                      <td className="p-3 mono text-xs text-[#6B7280]">{m.nextPM}</td>
                      <td className="p-3">
                        <span className={`badge ${m.status === 'running' ? 'green' : m.status === 'breakdown' ? 'red' : 'gray'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3">{renderApprovalBadge(m.approval)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Asset"
                            onClick={() => {
                              openConfirm(`Delete asset ${m.id}?`, `Remove from registry?`, () => {
                                onDeleteMachine(m.id);
                                showToast(`Asset ${m.id} deleted`);
                              });
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-[#9CA3AF]">
                      No machines or molds found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            currentPage={machinePage}
            totalPages={totalMachinePages}
            pageSize={machinePageSize}
            totalItems={filteredMachines.length}
            onPageChange={setMachinePage}
            onPageSizeChange={setMachinePageSize}
            itemName="machines"
          />
        </div>
      </div>
    );
  }

    return null;
  };

  return (
    <>
      {renderViewContent()}

      {/* 10-Step Item Wizard Modal */}
      <CreateItemWizardModal
        key={wizardEditItem ? `edit-${wizardEditItem.code}` : 'new-item-wizard'}
        isOpen={isItemWizardOpen}
        onClose={() => {
          setIsItemWizardOpen(false);
          setWizardEditItem(null);
        }}
        onSaveItem={handleSaveWizardItem}
        editItem={wizardEditItem}
        allItems={items}
        showToast={showToast}
      />

      {/* 9-Step Manufacturing BOM Wizard Modal */}
      {isMfgBomWizardOpen && bomWizardParentItem && (
        <ManufacturingBomWizardModal
          key={bomWizardParentItem.code}
          isOpen={isMfgBomWizardOpen}
          onClose={() => {
            setIsMfgBomWizardOpen(false);
            setBomWizardParentItem(null);
          }}
          parentItem={bomWizardParentItem}
          allItems={items}
          existingBoms={boms}
          onSaveBom={(newBom) => {
            onCreateBom(newBom);
            setIsMfgBomWizardOpen(false);
            setBomWizardParentItem(null);
          }}
          showToast={showToast}
          onViewBomDetails={(b) => onNavigate('bomDetail', { id: b.id })}
        />
      )}

      {/* Task 3: PostgreSQL Audit & Change History Modal */}
      <AuditHistoryModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        targetFilter={auditTarget}
        onNavigate={onNavigate}
      />

      {/* Task 4: Governance & RBAC Configuration Modal */}
      <GovernancePermissionsModal
        isOpen={isGovModalOpen}
        onClose={() => setIsGovModalOpen(false)}
        permissions={govPerms}
        showToast={showToast}
      />

      {/* Quick Modify Item & Tooling Modal */}
      {quickModifyItem && (
        <QuickModifyItemModal
          item={quickModifyItem}
          allItems={items}
          isOpen={!!quickModifyItem}
          isAdmin={isSuperAdmin || canEditItem}
          onClose={() => setQuickModifyItem(null)}
          onSave={(updated) => {
            handleSaveWizardItem(updated);
            setQuickModifyItem(null);
          }}
          onDelete={(code) => {
            openConfirm(
              `Delete ${code}?`,
              `Are you sure you want to permanently delete SKU ${code} from Master Catalog?`,
              () => {
                itemService.deleteItem(code);
                onDeleteItem(code);
                showToast(`Item ${code} deleted.`);
                setQuickModifyItem(null);
              }
            );
          }}
          onOpenWizard={(itemToEdit) => {
            setQuickModifyItem(null);
            handleOpenEditItemWizard(itemToEdit);
          }}
          showToast={showToast}
        />
      )}
    </>
  );
};
