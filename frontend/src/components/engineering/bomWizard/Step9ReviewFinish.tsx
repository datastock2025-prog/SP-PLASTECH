import React, { useState } from 'react';
import { ManufacturingBomWizardState, WizardStepId } from './types';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Edit2,
  ChevronDown,
  ChevronUp,
  Layers,
  Wrench,
  Factory,
  DollarSign,
  ShieldCheck,
  FileText,
  Boxes,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface Step9Props {
  state: ManufacturingBomWizardState;
  onJumpToStep: (step: WizardStepId) => void;
  errors: Record<string, string>;
  warnings: string[];
  suggestions: string[];
}

export const Step9ReviewFinish: React.FC<Step9Props> = ({
  state,
  onJumpToStep,
  errors,
  warnings,
  suggestions,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    type: false,
    batch: true,
    materials: true,
    secondary: false,
    routing: true,
    cost: true,
    quality: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const errorKeys = Object.keys(errors);
  const hasErrors = errorKeys.length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="border-b border-[#E4E0D6] pb-2">
        <h3 className="text-sm font-bold text-[#14213D]">BOM Final Review &amp; Release Readiness</h3>
        <p className="text-xs text-gray-500">
          Inspect all formulation inputs, quality checkpoints, and routing steps before committing to the engineering master.
        </p>
      </div>

      {/* Validation Status Banner */}
      <div className="space-y-3">
        {hasErrors && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Blocking Issues Detected ({errorKeys.length}) &mdash; Must be resolved before creation:</span>
            </div>
            <ul className="list-disc list-inside text-xs text-rose-700 space-y-1 pl-1">
              {errorKeys.map((k) => (
                <li key={k}>{errors[k]}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Advisory Warnings ({warnings.length}):</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5 text-xs text-blue-900">
            <div className="flex items-center gap-2 font-bold">
              <Lightbulb className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Senior Engineering Suggestions ({suggestions.length}):</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-blue-800 space-y-0.5 pl-1">
              {suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {!hasErrors && warnings.length === 0 && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ready for Release: All required identity, material, and routing validations passed.</span>
          </div>
        )}
      </div>

      {/* Accordion Review Sections */}
      <div className="space-y-3">
        {/* 1. Basic Information */}
        <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
          <div
            onClick={() => toggleSection('basic')}
            className="p-3.5 bg-[#F9F8F5] flex items-center justify-between cursor-pointer border-b border-[#E4E0D6]"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#14213D] text-white text-[10px] font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="text-xs font-bold text-[#14213D]">Basic Information &amp; Plant Ownership</h4>
              <span className="font-mono text-xs text-[#0F8B8D] font-semibold ml-2">
                {state.bomCode} ({state.bomVersion})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToStep(1);
                }}
                className="text-xs text-[#0F8B8D] font-bold hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              {openSections.basic ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          {openSections.basic && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">BOM Name</span>
                <span className="font-semibold text-gray-800">{state.bomName}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">BOM Class</span>
                <span className="font-semibold text-blue-700">{state.bomType}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Effective Window</span>
                <span className="font-mono text-gray-700">
                  {state.effectiveFrom} &rarr; {state.effectiveTo || 'Indefinite'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Operating Plant</span>
                <span className="font-semibold text-gray-800">{state.plantId}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Manufacturing Architecture */}
        <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
          <div
            onClick={() => toggleSection('type')}
            className="p-3.5 bg-[#F9F8F5] flex items-center justify-between cursor-pointer border-b border-[#E4E0D6]"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#14213D] text-white text-[10px] font-bold flex items-center justify-center">
                2
              </span>
              <h4 className="text-xs font-bold text-[#14213D]">Manufacturing Architecture &amp; Execution Toggles</h4>
              <span className="text-xs text-[#E8622C] font-semibold ml-2">{state.mfgCategory}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToStep(2);
                }}
                className="text-xs text-[#0F8B8D] font-bold hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              {openSections.type ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          {openSections.type && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle2 className={`w-3.5 h-3.5 ${state.allowRegrind ? 'text-emerald-600' : 'text-gray-300'}`} />
                <span>Regrind Usage Allowed</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle2 className={`w-3.5 h-3.5 ${state.allowSubstitutes ? 'text-emerald-600' : 'text-gray-300'}`} />
                <span>Substitute Materials Allowed</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle2 className={`w-3.5 h-3.5 ${state.requireQualityInspection ? 'text-emerald-600' : 'text-gray-300'}`} />
                <span>Quality Inspection Gate</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Batch, Output & Locations */}
        <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
          <div
            onClick={() => toggleSection('batch')}
            className="p-3.5 bg-[#F9F8F5] flex items-center justify-between cursor-pointer border-b border-[#E4E0D6]"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#14213D] text-white text-[10px] font-bold flex items-center justify-center">
                3
              </span>
              <h4 className="text-xs font-bold text-[#14213D]">Batch Size, Yield &amp; Staging</h4>
              <span className="font-mono text-xs text-gray-600 font-semibold ml-2">
                {state.batchSize.toLocaleString()} {state.batchUOM} &bull; Yield {state.yieldPct}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToStep(3);
                }}
                className="text-xs text-[#0F8B8D] font-bold hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              {openSections.batch ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          {openSections.batch && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Expected FG Qty</span>
                <span className="font-mono font-bold text-emerald-700">
                  {state.expectedFinishedQty.toLocaleString()} {state.batchUOM}
                </span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Cycle Time</span>
                <span className="font-mono font-bold text-amber-700">{state.standardCycleTimeSec}s</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Part Net Weight</span>
                <span className="font-mono font-bold text-blue-700">{state.itemNetWeightGrams || 45.2}g</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Total Shot Wt</span>
                <span className="font-mono font-bold text-purple-700">{state.totalShotWeightGrams || 53.7}g</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Run Time / Batch</span>
                <span className="font-mono font-bold text-gray-800">{state.estimatedProductionTimeHours} hrs</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">RM / FG Locations</span>
                <span className="font-mono text-gray-700 text-[11px]">
                  {state.defaultInputLocation} &rarr; {state.defaultFgLocation}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Materials & Components */}
        <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
          <div
            onClick={() => toggleSection('materials')}
            className="p-3.5 bg-[#F9F8F5] flex items-center justify-between cursor-pointer border-b border-[#E4E0D6]"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#14213D] text-white text-[10px] font-bold flex items-center justify-center">
                4
              </span>
              <h4 className="text-xs font-bold text-[#14213D]">Materials &amp; Formulation</h4>
              <span className="font-mono text-xs text-[#0F8B8D] font-semibold ml-2">
                {state.components.length} component{state.components.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToStep(4);
                }}
                className="text-xs text-[#0F8B8D] font-bold hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              {openSections.materials ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          {openSections.materials && (
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {state.components.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[#0F8B8D] block">{c.item}</span>
                      <span className="text-gray-700 truncate block max-w-[180px]">{c.name}</span>
                    </div>
                    <div className="text-right font-mono font-bold text-gray-800">
                      {c.qty} {c.uom}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Routing & Machines */}
        <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
          <div
            onClick={() => toggleSection('routing')}
            className="p-3.5 bg-[#F9F8F5] flex items-center justify-between cursor-pointer border-b border-[#E4E0D6]"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#14213D] text-white text-[10px] font-bold flex items-center justify-center">
                6
              </span>
              <h4 className="text-xs font-bold text-[#14213D]">Routing Operations &amp; Tooling</h4>
              <span className="font-mono text-xs text-gray-600 font-semibold ml-2">
                {state.routingResources.length} step{state.routingResources.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToStep(6);
                }}
                className="text-xs text-[#0F8B8D] font-bold hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              {openSections.routing ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          {openSections.routing && (
            <div className="p-4 space-y-2">
              {state.routingResources.map((r) => (
                <div key={r.id} className="p-2 rounded-lg bg-gray-50 border text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-500">Op {r.operationNo}</span>
                    <span className="font-bold text-[#14213D]">{r.operationName}</span>
                    <span className="text-gray-500 text-[11px]">({r.machineId} &bull; {r.moldId})</span>
                  </div>
                  <span className="font-mono font-bold text-amber-700">{r.cycleTimeSec}s</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Scrap & Cost Rollup */}
        <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
          <div
            onClick={() => toggleSection('cost')}
            className="p-3.5 bg-[#F9F8F5] flex items-center justify-between cursor-pointer border-b border-[#E4E0D6]"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#14213D] text-white text-[10px] font-bold flex items-center justify-center">
                7
              </span>
              <h4 className="text-xs font-bold text-[#14213D]">Scrap &amp; Live Cost Summary</h4>
              <span className="font-mono text-xs font-bold text-emerald-700 ml-2">
                ${state.costRollup.costPerUnit.toFixed(2)} / unit
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToStep(7);
                }}
                className="text-xs text-[#0F8B8D] font-bold hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              {openSections.cost ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          {openSections.cost && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Total Batch Cost</span>
                <span className="font-mono font-bold text-amber-800 text-sm">
                  ${state.costRollup.costPerBatch.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Raw Resin Portion</span>
                <span className="font-mono font-bold text-gray-800">${state.costRollup.materialCost}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Machine Overhead</span>
                <span className="font-mono font-bold text-gray-800">${state.costRollup.machineCost}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Regrind Net Credit</span>
                <span className="font-mono font-bold text-emerald-700">
                  {state.costRollup.regrindCredit < 0 ? `-$${Math.abs(state.costRollup.regrindCredit).toFixed(2)}` : '$0.00'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
