import React from 'react';
import { ManufacturingBomWizardState } from './types';
import { ItemMaster } from '../../../types';
import { ItemAutocompleteInput } from './ItemAutocompleteInput';
import { Sparkles, Edit3, Calendar, Building2, User, Info, CheckCircle2, PackageSearch } from 'lucide-react';

interface Step1Props {
  state: ManufacturingBomWizardState;
  items?: ItemMaster[];
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
  errors: Record<string, string>;
}

export const Step1BasicInfo: React.FC<Step1Props> = ({ state, items = [], onChange, errors }) => {
  const { parentItem } = state;

  // When a parent item is selected or filled via autocomplete, autofill remaining fields based on Item Master
  const handleSelectParentItem = (item: ItemMaster) => {
    const cleanVer = state.bomVersion.replace(/^v/i, '') || '1.0';
    const newBomCode = state.isCustomCode ? state.bomCode : `BOM-${item.code}-V${cleanVer}`;
    const newCycleTime = item.standardCycleTime || 14.5;
    const estHours = Number(((newCycleTime * state.batchSize) / 3600).toFixed(2));
    const netWeight = (item as any).netWeightGrams || (item.weight ? item.weight * 1000 : 45.2);

    onChange({
      parentItem: item,
      bomCode: newBomCode,
      bomName: `${item.name} Molded & Assembled BOM`,
      description: `Standard manufacturing bill of materials for ${item.name}.`,
      batchUOM: item.baseUOM || 'PCS',
      standardCycleTimeSec: newCycleTime,
      itemNetWeightGrams: netWeight,
      totalShotWeightGrams: Number((netWeight + (state.runnerWeightGrams || 8.5)).toFixed(1)),
      estimatedProductionTimeHours: estHours,
      defaultFgLocation: item.wh || 'FG-WH1-B02',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Helper callout banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-[#0F8B8D] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Define basic details for the manufacturing BOM.</span> Type or select any item from your Item Master below.
          When an item number is selected, all associated attributes (name, UOM, category, standard cycle time, locations) are automatically populated.
        </div>
      </div>

      {/* Parent Item Autocomplete Selector */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2.5">
          <div className="flex items-center gap-2">
            <PackageSearch className="w-4 h-4 text-[#E8622C]" />
            <h3 className="text-sm font-bold text-[#14213D]">Parent Item Master Selection</h3>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            Autocomplete from {items.length} Item Master records
          </span>
        </div>

        <div>
          <ItemAutocompleteInput
            items={items}
            value={parentItem.code}
            onSelect={handleSelectParentItem}
            label="Parent Item Number / Code"
            required
            error={errors.parentItem}
            placeholder="Type item number (e.g. FG-001, RM-PP...) or search by name"
            hint="Start typing an item number. Suggestions appear dynamically from your Item Master catalog."
          />
        </div>

        {/* Live Parent Item Card (Autofilled from Item Master) */}
        {parentItem.code ? (
          <div className="bg-[#F9F8F5] border border-[#E4E0D6] rounded-xl p-4 mt-3">
            <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Active Parent Item Master Attributes (Auto-populated)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-[#E4E0D6]">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Parent Item Code</span>
                <span className="font-mono font-bold text-[#14213D]">{parentItem.code}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E4E0D6]">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Parent Item Name</span>
                <span className="font-semibold text-[#14213D] truncate block">{parentItem.name}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E4E0D6]">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Base UOM</span>
                <span className="font-mono font-bold text-[#0F8B8D]">{parentItem.baseUOM || 'PCS'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E4E0D6]">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Item Type / Category</span>
                <span className="font-medium text-gray-800 truncate block">{parentItem.type || parentItem.cat}</span>
              </div>
              {parentItem.stock && (
                <div className="bg-white p-2.5 rounded-lg border border-[#E4E0D6]">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Current On-Hand</span>
                  <span className="font-mono font-semibold text-gray-700">{parentItem.stock}</span>
                </div>
              )}
              {parentItem.wh && (
                <div className="bg-white p-2.5 rounded-lg border border-[#E4E0D6]">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Default Warehouse</span>
                  <span className="font-mono text-gray-700">{parentItem.wh}</span>
                </div>
              )}
                <div className="bg-white p-2.5 rounded-lg border border-[#E4E0D6]">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Item Net Weight</span>
                  <span className="font-mono text-blue-700 font-bold">{state.itemNetWeightGrams || 45.2} g</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E4E0D6]">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Std Cycle Time</span>
                  <span className="font-mono text-emerald-700 font-bold">{state.standardCycleTimeSec || 14.5}s</span>
                </div>
              {(parentItem.standardCost || parentItem.cost) && (
                <div className="bg-white p-2.5 rounded-lg border border-[#E4E0D6]">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Unit Standard Cost</span>
                  <span className="font-mono text-emerald-700 font-bold">${(parentItem.standardCost || parentItem.cost)?.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#FAF9F5] border border-dashed border-[#D4CEB8] rounded-xl p-5 text-center text-xs text-gray-500">
            <PackageSearch className="w-7 h-7 text-gray-400 mx-auto mb-1.5 opacity-70" />
            <p className="font-semibold text-gray-700">No Parent Item Selected</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Type or select an item number above from the Item Master to populate BOM parameters automatically.
            </p>
          </div>
        )}
      </div>

      {/* Primary Editable Form Grid */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-5">
        <div className="border-b border-[#E4E0D6] pb-2">
          <h3 className="text-sm font-bold text-[#14213D]">BOM Identity &amp; Numbering</h3>
          <p className="text-xs text-gray-500">Configure auto-numbering rule, version tag, and ownership.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BOM Code */}
          <div className="field mb-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14213D]">
                BOM Code <span className="text-rose-600">*</span>
              </label>
              <button
                type="button"
                onClick={() => onChange({ isCustomCode: !state.isCustomCode })}
                className="text-[11px] font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                {state.isCustomCode ? 'Use auto-number rule' : 'Manual override'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={state.bomCode}
                disabled={!state.isCustomCode}
                onChange={(e) => onChange({ bomCode: e.target.value })}
                placeholder="e.g. BOM-FG-001-V1"
                className={`w-full font-mono font-semibold text-xs py-2 px-3 border rounded-lg ${
                  !state.isCustomCode ? 'bg-gray-50 text-gray-700' : 'bg-white'
                } ${errors.bomCode ? 'border-rose-500 bg-rose-50/50' : 'border-[#E4E0D6]'}`}
              />
              {!state.isCustomCode && (
                <span className="absolute right-3 top-2 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  Auto-generated
                </span>
              )}
            </div>
            {errors.bomCode && <p className="text-[11px] text-rose-600 mt-1">{errors.bomCode}</p>}
          </div>

          {/* BOM Name */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              BOM Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={state.bomName}
              onChange={(e) => onChange({ bomName: e.target.value })}
              placeholder="e.g. 500ml Jar Injection Molded &amp; Decorated"
              className={`w-full text-xs py-2 px-3 border rounded-lg ${
                errors.bomName ? 'border-rose-500 bg-rose-50/50' : 'border-[#E4E0D6]'
              }`}
            />
            {errors.bomName && <p className="text-[11px] text-rose-600 mt-1">{errors.bomName}</p>}
          </div>

          {/* BOM Version */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              BOM Version <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={state.bomVersion}
              onChange={(e) => onChange({ bomVersion: e.target.value })}
              placeholder="e.g. 1.0 or V1"
              className={`w-full font-mono text-xs py-2 px-3 border rounded-lg ${
                errors.bomVersion ? 'border-rose-500 bg-rose-50/50' : 'border-[#E4E0D6]'
              }`}
            />
            {errors.bomVersion && <p className="text-[11px] text-rose-600 mt-1">{errors.bomVersion}</p>}
          </div>

          {/* BOM Type */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">BOM Class</label>
            <select
              value={state.bomType}
              onChange={(e) => onChange({ bomType: e.target.value as any })}
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="Manufacturing BOM">Manufacturing BOM (Standard Shop-Floor Execution)</option>
              <option value="Engineering BOM">Engineering BOM (Prototype &amp; R&amp;D Baseline)</option>
              <option value="Packaging BOM">Packaging BOM (Secondary Pack-out)</option>
              <option value="Pilot/Prototype BOM">Pilot/Prototype BOM (Pre-production Run)</option>
            </select>
          </div>

          {/* Effective From */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              Effective From Date <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={state.effectiveFrom}
                onChange={(e) => onChange({ effectiveFrom: e.target.value })}
                className={`w-full text-xs py-2 px-3 border rounded-lg ${
                  errors.effectiveFrom ? 'border-rose-500 bg-rose-50/50' : 'border-[#E4E0D6]'
                }`}
              />
            </div>
            {errors.effectiveFrom && <p className="text-[11px] text-rose-600 mt-1">{errors.effectiveFrom}</p>}
          </div>

          {/* Effective To (optional) */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              Effective To Date <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={state.effectiveTo}
              onChange={(e) => onChange({ effectiveTo: e.target.value })}
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>

          {/* Plant */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">
              Operating Plant <span className="text-rose-600">*</span>
            </label>
            <select
              value={state.plantId}
              onChange={(e) => onChange({ plantId: e.target.value })}
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white"
            >
              <option value="PLANT-01">Plant 1 — Main Injection &amp; Extrusion Center</option>
              <option value="PLANT-02">Plant 2 — High-Speed Blow Molding Facility</option>
              <option value="PLANT-03">Plant 3 — Compounding &amp; Recycling Hub</option>
            </select>
          </div>

          {/* Owner / Department */}
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Department / Owner</label>
            <input
              type="text"
              value={state.owner}
              onChange={(e) => onChange({ owner: e.target.value })}
              placeholder="e.g. Engineering &amp; Tooling"
              className="w-full text-xs py-2 px-3 border border-[#E4E0D6] rounded-lg"
            />
          </div>
        </div>

        {/* Description & Remarks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Technical Description</label>
            <textarea
              rows={2}
              value={state.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Brief manufacturing and material description..."
              className="w-full text-xs p-2.5 border border-[#E4E0D6] rounded-lg resize-none"
            />
          </div>
          <div className="field mb-0">
            <label className="text-xs font-bold text-[#14213D] block mb-1">Engineering Remarks / Notes</label>
            <textarea
              rows={2}
              value={state.remarks}
              onChange={(e) => onChange({ remarks: e.target.value })}
              placeholder="Special customer packaging instructions or mold setup notes..."
              className="w-full text-xs p-2.5 border border-[#E4E0D6] rounded-lg resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
