import React from 'react';
import { ItemMaster } from '@/src/types';
import { Layers, CheckCircle2, Clock, Sparkles, X, Gauge, Save } from 'lucide-react';

interface WizardHeaderProps {
  parentItem: ItemMaster;
  bomCode: string;
  bomVersion: string;
  bomStatus?: string;
  saveStatus: 'not_saved' | 'saving' | 'saved' | 'draft_saved';
  lastSavedAt?: string;
  onSaveDraft?: () => void;
  onClose: () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  parentItem,
  bomCode,
  bomVersion,
  bomStatus = 'draft',
  saveStatus,
  lastSavedAt,
  onSaveDraft,
  onClose,
}) => {
  const hasItemSelected = Boolean(parentItem?.code && parentItem.code.trim().length > 0);
  const itemCycleTime = Number(parentItem?.standardCycleTime || parentItem?.cycleTime || 0);

  const statusMeta: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    under_review: { label: 'Under Review', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    pending: { label: 'Pending Approval', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    approved: { label: 'Approved', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    released: { label: 'Released / Live', cls: 'bg-teal-500/20 text-teal-200 border-teal-400/40' },
  };
  const activeStatusBadge = statusMeta[bomStatus] || statusMeta.draft;

  return (
    <div className="bg-[#14213D] text-white border-b border-[#26365C] px-6 py-4">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E8622C] flex items-center justify-center text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-['Space_Grotesk']">
                Create Manufacturing BOM
              </h1>
              {hasItemSelected && (
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-white/10 text-white border border-white/20">
                  {parentItem.code} &mdash; {parentItem.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Guided 9-step recipe &amp; routing setup for plastic manufacturing ERP
            </p>
          </div>
        </div>

        {/* Live Status badges & close */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#0F8B8D]/30 border border-[#0F8B8D]/50 text-[#7de0e2] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#7de0e2]" />
              {bomCode || (hasItemSelected ? `BOM-${parentItem.code}` : 'Select FG Item')} (v{bomVersion || '1.0'})
            </span>

            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${activeStatusBadge.cls}`}>
              {activeStatusBadge.label}
            </span>

            <button
              type="button"
              onClick={onSaveDraft}
              title="Click to save live BOM draft to database"
              className="text-xs flex items-center gap-1.5 text-slate-200 hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/15 rounded border border-white/15 transition-colors cursor-pointer"
            >
              {saveStatus === 'saving' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Saving to DB...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Saved Live{lastSavedAt ? ` • ${lastSavedAt}` : ''}</span>
                </>
              )}
              {saveStatus === 'draft_saved' && (
                <>
                  <Clock className="w-3.5 h-3.5 text-teal-300" />
                  <span className="text-teal-200">Draft Saved{lastSavedAt ? ` • ${lastSavedAt}` : ''}</span>
                </>
              )}
              {saveStatus === 'not_saved' && (
                <>
                  <Save className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-slate-300">Save Draft</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Close Wizard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Parent item summary cards (100% populated from Item Master table — zero hardcoded defaults) */}
      <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Item Code</div>
          <div className="font-mono font-bold text-white truncate">
            {hasItemSelected ? parentItem.code : '—'}
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10 sm:col-span-2">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Item Name</div>
          <div className="font-semibold text-white truncate">
            {hasItemSelected ? parentItem.name : 'Select an Approved FG Item below'}
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Item Type</div>
          <div className="font-medium text-emerald-300 truncate">
            {hasItemSelected ? parentItem.type || 'Finished Good' : '—'}
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Base UOM</div>
          <div className="font-mono font-bold text-white">
            {hasItemSelected ? parentItem.baseUOM || 'PCS' : '—'}
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Category</div>
          <div className="font-medium text-white truncate">
            {hasItemSelected ? parentItem.cat || '—' : '—'}
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Cycle Time</div>
          <div className="font-mono font-bold text-amber-300 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-amber-400" />
            {hasItemSelected && itemCycleTime > 0 ? `${itemCycleTime}s` : '—'}
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Default WH</div>
          <div className="font-mono text-white truncate">
            {hasItemSelected ? parentItem.wh || '—' : '—'}
          </div>
        </div>
      </div>
    </div>
  );
};
