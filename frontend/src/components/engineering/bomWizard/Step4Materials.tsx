import React, { useState } from 'react';
import { ManufacturingBomWizardState } from './types';
import { ItemMaster, BomLine } from '../../../types';
import { ItemAutocompleteInput } from './ItemAutocompleteInput';
import { LocationAutocompleteInput } from './LocationAutocompleteInput';
import { masterDataGovernanceService } from '../../../services/masterDataGovernanceService';
import { systemSettingsService } from '../../../services/systemSettingsService';
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  ArrowUp,
  ArrowDown,
  Search,
  Check,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
  X,
  Package,
  RotateCcw,
  Percent,
  TrendingDown,
  CheckCircle2,
  Zap,
  Link2,
  GitBranch,
  Fingerprint,
  CheckSquare,
  Square,
  Sliders,
  MapPin,
} from 'lucide-react';

interface Step4Props {
  state: ManufacturingBomWizardState;
  items: ItemMaster[];
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
  errors: Record<string, string>;
  showToast: (msg: string) => void;
}

export const Step4Materials: React.FC<Step4Props> = ({
  state,
  items,
  onChange,
  errors,
  showToast,
}) => {
  const isFormulaMode = state.mfgCategory === 'Formula / Recipe BOM';
  const components = state.components;

  // Calculate cost rollup dynamically based on material lines
  const recalculateRollup = (lines: BomLine[]) => {
    const matCost = lines
      .filter((l) => l.category !== 'Packaging')
      .reduce((sum, l) => sum + (l.extendedCost || (l.cost || 0) * l.qty), 0);
    const pkgCost = lines
      .filter((l) => l.category === 'Packaging')
      .reduce((sum, l) => sum + (l.extendedCost || (l.cost || 0) * l.qty), 0);
    const total = Number((matCost + pkgCost + (state.costRollup.laborCost || 0) + (state.costRollup.machineCost || 0)).toFixed(2));
    const perUnit = state.batchSize > 0 ? Number((total / state.batchSize).toFixed(4)) : total;
    return {
      ...state.costRollup,
      materialCost: Number(matCost.toFixed(2)),
      packagingCost: Number(pkgCost.toFixed(2)),
      totalCost: total,
      costPerUnit: perUnit,
      costPerBatch: total,
    };
  };

  // Quick-Add bar state
  const [quickItemCode, setQuickItemCode] = useState<string>('');
  const [quickItem, setQuickItem] = useState<ItemMaster | null>(null);
  const [quickQty, setQuickQty] = useState<number>(1);
  const [quickUom, setQuickUom] = useState<string>('KG');
  const [quickLocation, setQuickLocation] = useState<string>('RM-WH-01');

  // Selected rows for bulk operations
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [bulkLocationModalOpen, setBulkLocationModalOpen] = useState<boolean>(false);
  const [bulkTargetLocation, setBulkTargetLocation] = useState<string>('RM-WH-01');

  const handleSelectQuickItem = (selected: ItemMaster) => {
    setQuickItem(selected);
    setQuickItemCode(selected.code);
    setQuickUom(selected.baseUOM || 'KG');
    setQuickLocation(selected.wh || selected.defaultLocation || 'RM-WH-01');
  };

  const handleQuickAdd = () => {
    if (!quickItem) {
      showToast('Please search and select an item from Item Master first');
      return;
    }
    const unitCost = quickItem.standardCost ?? quickItem.cost ?? 32.5;
    const cat = quickItem.cat || (quickItem.type === 'Raw Material' ? 'Virgin Resin' : 'Packaging');
    const newLine: BomLine = {
      id: `LINE-${Date.now()}`,
      sequence: (components.length + 1) * 10,
      item: quickItem.code,
      name: quickItem.name,
      category: cat,
      qty: quickQty,
      uom: quickUom,
      scrap: quickItem.scrapRate ?? 1.5,
      yield: Number((100 - (quickItem.scrapRate ?? 1.5)).toFixed(2)),
      cost: unitCost,
      extendedCost: Number((quickQty * unitCost).toFixed(2)),
      regrindPct: 0,
      dosageRate: `${quickQty}`,
      position: quickLocation || quickItem.wh || quickItem.defaultLocation || 'RM-WH-01',
      issueMethod: 'Auto Backflush',
      status: 'active',
    };
    const updated = [...components, newLine];
    onChange({ components: updated, costRollup: recalculateRollup(updated), costPreviewRan: true });
    setQuickItem(null);
    setQuickItemCode('');
    setQuickQty(1);
    showToast(`Added ${quickItem.code} (${quickItem.name}) to BOM`);
  };

  // Add/Edit component modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Search in modal
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal form fields
  const [modalItem, setModalItem] = useState<ItemMaster | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [modalUom, setModalUom] = useState<string>('KG');
  const [modalScrap, setModalScrap] = useState<number>(1.5);
  const [modalIssueMethod, setModalIssueMethod] = useState<'Auto Backflush' | 'Manual Issue' | 'Floor Stock'>('Auto Backflush');
  const [modalLocation, setModalLocation] = useState<string>('RM-WH-01');
  const [modalCategory, setModalCategory] = useState<string>('Virgin Resin');
  const [modalRegrindPct, setModalRegrindPct] = useState<number>(0);
  const [modalDosageRate, setModalDosageRate] = useState<string>('');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [modalSubstituteAllowed, setModalSubstituteAllowed] = useState<boolean>(false);
  const [modalSubGroup, setModalSubGroup] = useState<string>('');

  // Categories for plastic components
  const COMPONENT_CATEGORIES = [
    'Virgin Resin',
    'Masterbatch',
    'Additive',
    'Colorant',
    'Regrind',
    'Subassembly',
    'Packaging',
    'Label',
    'Sticker',
    'Insert',
    'Consumable',
    'Spare part',
  ];

  // Calculate total recipe formula percentage
  const totalFormulaPercentage = Number(
    components.reduce((acc, c) => acc + (c.dosageRate ? parseFloat(c.dosageRate) : c.qty), 0).toFixed(2)
  );

  // Open modal for new component
  const handleOpenAddModal = (presetCategory?: string) => {
    setEditingIndex(null);
    setSearchQuery('');
    setSelectedCategory(presetCategory || 'all');
    setModalItem(null);
    setModalQty(1);
    setModalUom('KG');
    setModalScrap(1.5);
    setModalIssueMethod('Auto Backflush');
    setModalLocation('RM-WH-01');
    setModalCategory(presetCategory || 'Virgin Resin');
    setModalRegrindPct(0);
    setModalDosageRate('1.0');
    setModalNotes('');
    setModalSubstituteAllowed(false);
    setModalSubGroup('');
    setIsModalOpen(true);
  };

  // Open modal for editing existing line
  const handleOpenEditModal = (idx: number) => {
    const line = components[idx];
    setEditingIndex(idx);
    const matchedItem = items.find((i) => i.code === line.item) || null;
    setModalItem(matchedItem);
    setModalQty(line.qty);
    setModalUom(line.uom);
    setModalScrap(line.scrap);
    setModalIssueMethod(line.issueMethod || 'Auto Backflush');
    setModalLocation(line.position || 'RM-WH-01');
    setModalCategory(line.category || 'Virgin Resin');
    setModalRegrindPct(line.regrindPct || 0);
    setModalDosageRate(line.dosageRate || String(line.qty));
    setModalNotes(line.instructions || '');
    setModalSubstituteAllowed(Boolean(line.substituteGroup));
    setModalSubGroup(line.substituteGroup || '');
    setIsModalOpen(true);
  };

  // Save modal component
  const handleSaveModal = () => {
    if (!modalItem) {
      showToast('Please select a component item');
      return;
    }

    const unitCost = modalItem.standardCost ?? modalItem.cost ?? 32.5;
    const newLine: BomLine = {
      id: editingIndex !== null ? components[editingIndex].id : `LINE-${Date.now()}`,
      sequence: editingIndex !== null ? components[editingIndex].sequence : (components.length + 1) * 10,
      item: modalItem.code,
      name: modalItem.name,
      category: modalCategory,
      qty: modalQty,
      uom: modalUom,
      scrap: modalScrap,
      yield: Number((100 - modalScrap).toFixed(2)),
      cost: unitCost,
      extendedCost: Number((modalQty * unitCost).toFixed(2)),
      regrindPct: modalRegrindPct,
      dosageRate: modalDosageRate,
      position: modalLocation || 'RM-WH-01',
      issueMethod: modalIssueMethod,
      substituteGroup: modalSubstituteAllowed ? (modalSubGroup || 'GRP-SUB-1') : undefined,
      instructions: modalNotes,
      status: 'active',
    };

    let updated: BomLine[];
    if (editingIndex !== null) {
      updated = [...components];
      updated[editingIndex] = newLine;
      showToast(`Updated component ${newLine.item}`);
    } else {
      updated = [...components, newLine];
      showToast(`Added ${newLine.item} to BOM`);
    }

    onChange({ components: updated, costRollup: recalculateRollup(updated), costPreviewRan: true });
    setIsModalOpen(false);
  };

  // Quick duplicate
  const handleDuplicate = (idx: number) => {
    const target = components[idx];
    const dup: BomLine = {
      ...target,
      id: `LINE-${Date.now()}`,
      sequence: (components.length + 1) * 10,
      name: `${target.name} (Copy)`,
    };
    const updated = [...components, dup];
    onChange({ components: updated, costRollup: recalculateRollup(updated), costPreviewRan: true });
    showToast(`Duplicated ${target.item}`);
  };

  // Remove single component
  const handleRemove = (idx: number) => {
    const removedItem = components[idx]?.item;
    const updated = components.filter((_, i) => i !== idx);
    onChange({ components: updated, costRollup: recalculateRollup(updated), costPreviewRan: updated.length > 0 });
    setSelectedRowIds(prev => prev.filter(id => id !== components[idx]?.id));
    showToast(`Removed component ${removedItem}`);
  };

  // Move row up/down
  const handleMove = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= components.length) return;
    const updated = [...components];
    const temp = updated[idx];
    updated[idx] = updated[newIdx];
    updated[newIdx] = temp;
    // Re-index sequences
    updated.forEach((l, i) => (l.sequence = (i + 1) * 10));
    onChange({ components: updated });
  };

  // Inline edit handler
  const handleInlineChange = (idx: number, field: keyof BomLine, value: any) => {
    const updated = [...components];
    const current = updated[idx];
    let newQty = field === 'qty' ? parseFloat(value) || 0 : current.qty;
    let newCost = current.cost || 32.5;

    updated[idx] = {
      ...current,
      [field]: value,
      extendedCost: field === 'qty' || field === 'cost' ? Number((newQty * newCost).toFixed(2)) : current.extendedCost,
    };
    onChange({ components: updated, costRollup: recalculateRollup(updated) });
  };

  // Bulk Selection Handlers
  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === components.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(components.map(c => c.id || c.item));
    }
  };

  const handleBulkDelete = () => {
    if (selectedRowIds.length === 0) return;
    const count = selectedRowIds.length;
    const updated = components.filter(c => !selectedRowIds.includes(c.id || c.item));
    onChange({ components: updated, costRollup: recalculateRollup(updated), costPreviewRan: updated.length > 0 });
    setSelectedRowIds([]);
    showToast(`Deleted ${count} selected components`);
  };

  const handleBulkApplyLocation = () => {
    if (selectedRowIds.length === 0 || !bulkTargetLocation) return;
    const updated = components.map(c => {
      if (selectedRowIds.includes(c.id || c.item)) {
        return { ...c, position: bulkTargetLocation };
      }
      return c;
    });
    onChange({ components: updated });
    setBulkLocationModalOpen(false);
    showToast(`Updated location to ${bulkTargetLocation} for ${selectedRowIds.length} items`);
    setSelectedRowIds([]);
  };

  // Auto-balance resin for formula mode
  const handleAutoBalanceResin = () => {
    if (components.length === 0) return;
    const resinIdx = components.findIndex(
      (c) => c.category === 'Virgin Resin' || c.name.toLowerCase().includes('pp') || c.name.toLowerCase().includes('hdpe')
    );
    if (resinIdx === -1) {
      showToast('No Virgin Resin component found to auto-balance against');
      return;
    }
    const nonResinTotal = components.reduce((acc, c, i) => (i === resinIdx ? acc : acc + c.qty), 0);
    const balancedQty = Number(Math.max(0, 100 - nonResinTotal).toFixed(2));
    const updated = [...components];
    updated[resinIdx] = {
      ...updated[resinIdx],
      qty: balancedQty,
      dosageRate: `${balancedQty}%`,
    };
    onChange({ components: updated });
    showToast(`Auto-balanced ${updated[resinIdx].item} to ${balancedQty}%`);
  };

  return (
    <div className="space-y-5 py-2">
      {/* Top action & header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E0D6] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <span>Bill of Materials Components &amp; Formulation</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono font-bold">
              {components.length} item{components.length === 1 ? '' : 's'}
            </span>
          </h3>
          <p className="text-xs text-gray-500">
            Full-width ingredient roster covering virgin resin, masterbatch dosage, regrind percentage, inserts and packaging.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAddModal('Virgin Resin')}
            className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs flex items-center gap-1 cursor-pointer"
          >
            + Add Resin
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('Masterbatch')}
            className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs flex items-center gap-1 cursor-pointer"
          >
            + Masterbatch
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('Packaging')}
            className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs flex items-center gap-1 cursor-pointer"
          >
            + Packaging
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Component
          </button>
        </div>
      </div>

      {/* Formula / Recipe Mode Unique Recipe Identification Number */}
      {isFormulaMode && (() => {
        const linkedRecipe = masterDataGovernanceService.generateLinkedRecipeCode(
          state.bomVersion,
          components.map((c) => ({
            item: c.item,
            name: c.name,
            percentage: c.dosageRate ? parseFloat(c.dosageRate) : c.qty,
            qty: c.qty,
          }))
        );

        return (
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-purple-900 via-[#1E1B4B] to-slate-900 text-white rounded-xl shadow-md border border-purple-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-mono font-bold flex items-center gap-1 uppercase tracking-wider">
                    <Fingerprint className="w-3 h-3 text-purple-300" />
                    Unique Recipe Identification Number
                  </span>
                  <span className="text-slate-400 text-xs">&bull;</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-mono font-bold flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-blue-300" />
                    BOM Version: {state.bomVersion || 'v1.0'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="font-mono text-base font-bold text-amber-300 tracking-wider">
                    {linkedRecipe.recipeUid}
                  </div>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 text-[11px] font-semibold">Bi-directionally Linked</span>
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/80 font-mono">
                  Formula: {linkedRecipe.formulaSummary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 bg-white/10 backdrop-blur-xs p-2.5 rounded-lg border border-white/15 text-xs">
                <div className="text-right">
                  <div className="text-[10px] text-slate-300 uppercase tracking-wider">Material Sum Check</div>
                  <div className="font-mono font-bold text-sm">
                    {totalFormulaPercentage}% / 100%
                  </div>
                </div>
                {totalFormulaPercentage === 100 ? (
                  <span className="flex items-center gap-1 text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-500/50 px-2 py-1 rounded text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Balanced
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-300 font-bold bg-amber-950/80 border border-amber-500/50 px-2 py-1 rounded text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    {(100 - totalFormulaPercentage).toFixed(1)}% Left
                  </span>
                )}
              </div>
            </div>

            {/* Formula Mode Balance Meter */}
            <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-purple-600" />
                  Total Recipe Material Formulation Balance: {totalFormulaPercentage}%
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoBalanceResin}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                  >
                    Auto-rebalance Virgin Resin to 100%
                  </button>
                </div>
              </div>

              <div className="w-full bg-purple-200 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${
                    totalFormulaPercentage === 100
                      ? 'bg-emerald-600'
                      : totalFormulaPercentage > 100
                      ? 'bg-rose-600'
                      : 'bg-purple-600'
                  }`}
                  style={{ width: `${Math.min(100, totalFormulaPercentage)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Add Component Bar (Autocomplete with Location Dropdown) */}
      <div className="bg-[#FAF9F5] border border-[#E4E0D6] rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#14213D]">
            <Zap className="w-3.5 h-3.5 text-[#E8622C]" />
            <span>Quick Add Component by Item Master Autocomplete</span>
          </div>
          <span className="text-[11px] text-gray-500">Live Item Master lookup with auto-filled attributes</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
          <div className="md:col-span-4">
            <ItemAutocompleteInput
              items={items}
              value={quickItemCode}
              onSelect={handleSelectQuickItem}
              placeholder="Search item number / resin name..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Quantity</label>
            <input
              type="number"
              step="0.001"
              min="0.0001"
              value={quickQty}
              onChange={(e) => setQuickQty(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono font-bold py-2 px-2.5 border rounded-lg bg-white border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">UOM</label>
            <input
              type="text"
              value={quickUom}
              onChange={(e) => setQuickUom(e.target.value)}
              className="w-full text-xs font-mono font-bold py-2 px-2 border rounded-lg bg-white border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            />
          </div>
          <div className="md:col-span-3">
            <LocationAutocompleteInput
              value={quickLocation}
              onChange={(loc) => setQuickLocation(loc)}
              placeholder="Source Location..."
              filterType="raw_materials"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={!quickItem}
              className="w-full btn btn-sm btn-primary text-xs py-2 flex items-center justify-center gap-1 shadow-sm disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Quick Add
            </button>
          </div>
        </div>
        {quickItem && (
          <div className="mt-2.5 pt-2 border-t border-[#E4E0D6] flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Selected: <strong className="text-[#14213D]">{quickItem.code}</strong> &mdash; {quickItem.name}</span>
            </div>
            <span className="text-gray-500 font-mono text-[10px]">
              Cat: <strong className="text-gray-700">{quickItem.cat}</strong> | Wh: <strong className="text-gray-700">{quickLocation || quickItem.wh || 'RM-WH-01'}</strong> | Cost: <strong className="text-[#0F8B8D]">{systemSettingsService.getCurrencySymbol()}{(quickItem.standardCost || quickItem.cost || 32.5).toFixed(2)}/{quickItem.baseUOM || 'KG'}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedRowIds.length > 0 && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <CheckSquare className="w-4 h-4 text-amber-700" />
            <span>{selectedRowIds.length} row{selectedRowIds.length > 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkLocationModalOpen(true)}
              className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-700" /> Set Location
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedRowIds.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRowIds([])}
              className="px-2 py-1 text-gray-500 hover:text-gray-800 text-xs cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Full-width Component Table (Grid with Complete CRUD Operations) */}
      {components.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-[#E4E0D6] space-y-3">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#E8622C] flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#14213D]">No components added yet</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              No materials added yet. Add raw materials, masterbatch, additives, packaging, or components.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="btn btn-sm btn-primary inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Component
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-xs overflow-visible">
          <div className="w-full">
            <table className="w-full text-left text-xs border-collapse table-auto">
              <thead>
                <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-2 w-7 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.length === components.length && components.length > 0}
                      onChange={handleSelectAll}
                      className="rounded text-[#0F8B8D] cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="py-2.5 px-1.5 w-8 text-center">Seq</th>
                  <th className="py-2.5 px-2 w-28">Component Code</th>
                  <th className="py-2.5 px-2 min-w-[130px]">Description</th>
                  <th className="py-2.5 px-1.5 w-24">Category</th>
                  <th className="py-2.5 px-1.5 text-right w-16">Qty</th>
                  <th className="py-2.5 px-1 text-center w-10">UOM</th>
                  <th className="py-2.5 px-1.5 text-right w-18">Qty/Batch</th>
                  <th className="py-2.5 px-1.5 text-right w-16">Scrap %</th>
                  <th className="py-2.5 px-1 text-right w-14">Regrind</th>
                  <th className="py-2.5 px-1.5 w-24">Issue Method</th>
                  <th className="py-2.5 px-2 w-36">Location</th>
                  <th className="py-2.5 px-1 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {components.map((line, idx) => {
                  const qtyPerBatch = (line.qty * state.batchSize).toFixed(2);
                  const lineKey = line.id || line.item || `row-${idx}`;
                  const isChecked = selectedRowIds.includes(lineKey);

                  return (
                    <tr
                      key={lineKey}
                      className={`hover:bg-amber-50/40 transition-colors group ${
                        isChecked ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(lineKey)}
                          className="rounded text-[#0F8B8D] cursor-pointer"
                        />
                      </td>

                      {/* Sequence */}
                      <td className="py-2 px-1.5 text-center font-mono text-gray-500 font-semibold text-[11px]">
                        {line.sequence || (idx + 1) * 10}
                      </td>

                      {/* Code */}
                      <td className="py-2 px-2 font-mono font-bold text-[#0F8B8D]">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(idx)}
                          className="hover:underline text-left cursor-pointer truncate max-w-[110px] block"
                          title="Click to edit component"
                        >
                          {line.item}
                        </button>
                      </td>

                      {/* Name */}
                      <td className="py-2 px-2 font-semibold text-[#14213D] max-w-[160px] truncate text-[11px]">
                        {line.name}
                        {line.substituteGroup && (
                          <span className="ml-1 text-[9px] text-blue-600 bg-blue-50 px-1 rounded font-normal">
                            Sub
                          </span>
                        )}
                      </td>

                      {/* Category (Interactive Select) */}
                      <td className="py-2 px-1.5">
                        <select
                          value={line.category || 'Virgin Resin'}
                          onChange={(e) => handleInlineChange(idx, 'category', e.target.value)}
                          className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 border-none rounded py-0.5 px-1 text-gray-700 cursor-pointer focus:ring-1 focus:ring-[#0F8B8D] w-full"
                        >
                          {COMPONENT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Qty (Inline editable) */}
                      <td className="py-2 px-1.5 text-right">
                        <input
                          type="number"
                          step="0.001"
                          value={line.qty}
                          onChange={(e) => handleInlineChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                          className="w-16 text-right font-mono font-bold text-xs py-0.5 px-1 border border-[#E4E0D6] focus:border-[#E8622C] rounded bg-white"
                        />
                      </td>

                      {/* UOM */}
                      <td className="py-2 px-1 text-center font-mono font-semibold text-gray-600 text-[11px]">
                        {line.uom}
                      </td>

                      {/* Quantity per batch */}
                      <td className="py-2 px-1.5 text-right font-mono text-gray-700 font-semibold text-[11px]">
                        {qtyPerBatch}
                      </td>

                      {/* Scrap % (Inline editable) */}
                      <td className="py-2 px-1.5 text-right">
                        <input
                          type="number"
                          step="0.1"
                          value={line.scrap}
                          onChange={(e) => handleInlineChange(idx, 'scrap', parseFloat(e.target.value) || 0)}
                          className="w-12 text-right font-mono text-xs py-0.5 px-1 border border-[#E4E0D6] focus:border-[#E8622C] rounded bg-white text-rose-700 font-bold"
                        />
                      </td>

                      {/* Regrind % */}
                      <td className="py-2 px-1 text-right font-mono text-[11px]">
                        {line.regrindPct ? (
                          <span className="text-emerald-700 font-semibold">{line.regrindPct}%</span>
                        ) : (
                          <span className="text-gray-400">&mdash;</span>
                        )}
                      </td>

                      {/* Issue Method (Inline Select) */}
                      <td className="py-2 px-1.5">
                        <select
                          value={line.issueMethod || 'Auto Backflush'}
                          onChange={(e) => handleInlineChange(idx, 'issueMethod', e.target.value)}
                          className="text-[10px] py-0.5 px-1 border border-[#E4E0D6] rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] w-full"
                        >
                          <option value="Auto Backflush">Auto Backflush</option>
                          <option value="Manual Issue">Manual Issue</option>
                          <option value="Floor Stock">Floor Stock</option>
                        </select>
                      </td>

                      {/* Location Code (Searchable Autocomplete Dropdown) */}
                      <td className="py-2 px-2 relative">
                        <LocationAutocompleteInput
                          size="sm"
                          align="right"
                          value={line.position || 'RM-WH-01'}
                          onChange={(loc) => handleInlineChange(idx, 'position', loc)}
                          placeholder="Loc..."
                          filterType="raw_materials"
                        />
                      </td>

                      {/* Row Actions */}
                      <td className="py-2 px-1 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 'down')}
                            disabled={idx === components.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(idx)}
                            className="p-1 text-gray-500 hover:text-[#0F8B8D] cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(idx)}
                            className="p-1 text-gray-500 hover:text-[#0F8B8D] cursor-pointer"
                            title="Duplicate Line"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(idx)}
                            className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                            title="Remove Line"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table bottom CRUD shortcuts */}
          <div className="p-3 bg-gray-50/80 border-t border-[#E4E0D6] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="px-3 py-1.5 bg-white border border-[#E4E0D6] hover:bg-gray-100 text-[#14213D] rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#0F8B8D]" /> Add Row
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal('Packaging')}
                className="px-3 py-1.5 bg-white border border-[#E4E0D6] hover:bg-gray-100 text-[#14213D] rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Package className="w-3.5 h-3.5 text-amber-600" /> + Packaging Material
              </button>
            </div>
            <div className="font-mono text-gray-500 text-[11px]">
              Total Ingredients: <strong className="text-[#14213D]">{components.length}</strong> | Total Batch Weight: <strong className="text-[#0F8B8D]">{components.reduce((acc, c) => acc + (c.qty * state.batchSize), 0).toFixed(2)} KG</strong>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Location Assignment Modal */}
      {bulkLocationModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E4E0D6] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2.5">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0F8B8D]" />
                Assign Source Location for {selectedRowIds.length} Items
              </h3>
              <button
                type="button"
                onClick={() => setBulkLocationModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <LocationAutocompleteInput
                label="Select Target Warehouse / Silo Location"
                value={bulkTargetLocation}
                onChange={(loc) => setBulkTargetLocation(loc)}
                placeholder="Search location..."
                filterType="raw_materials"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E0D6]">
              <button
                type="button"
                onClick={() => setBulkLocationModalOpen(false)}
                className="btn btn-sm btn-ghost text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkApplyLocation}
                className="btn btn-sm btn-primary text-xs flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Apply Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Component Modal (Image 1) with Location Autocomplete Dropdown */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E4E0D6] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#E8622C]" />
                {editingIndex !== null ? 'Edit Component Material' : 'Add Component to Bill of Materials'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step A: Search & Select Item with Autocomplete */}
            <div className="space-y-3">
              <div>
                <ItemAutocompleteInput
                  items={items}
                  value={modalItem?.code || ''}
                  label="1. Component Item Number (Autocomplete from Item Master)"
                  required
                  placeholder="Type item number (e.g. RM-PP-001, PKG-CTN...) or search by name"
                  hint="Type to search and select. Remaining fields will auto-populate based on the Item Master record."
                  onSelect={(selected) => {
                    setModalItem(selected);
                    setModalUom(selected.baseUOM || 'KG');
                    setModalCategory(selected.cat || (selected.type === 'Raw Material' ? 'Virgin Resin' : 'Packaging'));
                    setModalLocation(selected.wh || selected.defaultLocation || 'RM-WH-01');
                    setModalScrap(selected.scrapRate !== undefined ? selected.scrapRate : 1.5);
                  }}
                />
              </div>

              {/* Selected Item Master confirmation summary */}
              {modalItem && (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-mono font-bold text-emerald-900">{modalItem.code}</span>
                      <span className="text-gray-700 ml-2">{modalItem.name}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    Cat: <span className="font-semibold text-gray-700">{modalItem.cat}</span> &bull; Stock: <span className="font-semibold text-gray-700">{modalItem.stock} {modalItem.baseUOM}</span> &bull; Cost: <span className="font-semibold text-[#0F8B8D]">{systemSettingsService.getCurrencySymbol()}{(modalItem.standardCost || modalItem.cost || 32.5).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step B: Attributes Form (Image 1 Layout) with Location Autocomplete Dropdown */}
            {modalItem && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#F9F8F5] p-3.5 rounded-xl border border-[#E4E0D6]">
                <div className="field mb-0">
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">
                    Quantity ({modalUom}) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.0001"
                    value={modalQty}
                    onChange={(e) => setModalQty(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold py-1.5 px-2 border rounded bg-white border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <div className="field mb-0">
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Component Category</label>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="w-full text-xs py-1.5 px-2 border rounded bg-white border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  >
                    {COMPONENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field mb-0">
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Scrap % Allowance</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={modalScrap}
                    onChange={(e) => setModalScrap(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono py-1.5 px-2 border rounded bg-white border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <div className="field mb-0">
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Issue Method</label>
                  <select
                    value={modalIssueMethod}
                    onChange={(e) => setModalIssueMethod(e.target.value as any)}
                    className="w-full text-xs py-1.5 px-2 border rounded bg-white border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  >
                    <option value="Auto Backflush">Auto Backflush (Post-run)</option>
                    <option value="Manual Issue">Manual Issue (Warehouse Pick)</option>
                    <option value="Floor Stock">Floor Stock (Bulk consumption)</option>
                  </select>
                </div>

                {/* TASK 1: SOURCE LOCATION AUTOCOMPLETE DROPDOWN */}
                <div className="field mb-0">
                  <LocationAutocompleteInput
                    label="Source Location"
                    value={modalLocation}
                    onChange={(loc) => setModalLocation(loc)}
                    placeholder="Search source location..."
                    filterType="raw_materials"
                  />
                </div>

                <div className="field mb-0">
                  <label className="text-[11px] font-bold text-[#14213D] block mb-1">Regrind Recovery %</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={modalRegrindPct}
                    onChange={(e) => setModalRegrindPct(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono py-1.5 px-2 border rounded bg-white border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-2 border-t border-[#E4E0D6] pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-ghost text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={!modalItem}
                className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {editingIndex !== null ? 'Save Changes' : 'Add to BOM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
