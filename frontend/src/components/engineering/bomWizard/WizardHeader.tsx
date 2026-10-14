import React from 'react';
import { ItemMaster } from '../../../types';
import { Layers, CheckCircle2, Clock, Sparkles, X, Factory, Shield, Tag, Gauge } from 'lucide-react';

interface WizardHeaderProps {
  parentItem: ItemMaster;
  bomCode: string;
  bomVersion: string;
  saveStatus: 'not_saved' | 'saving' | 'saved' | 'draft_saved';
  onClose: () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  parentItem,
  bomCode,
  bomVersion,
  saveStatus,
  onClose,
}) => {
  return (
    <div className="bg-[#14213D] text-white border-b border-[#26365C] px-6 py-4">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E8622C] flex items-center justify-center text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-['Space_Grotesk']">
                Create Manufacturing BOM
              </h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                {parentItem.code} &mdash; {parentItem.name}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Guided 9-step recipe &amp; routing setup for plastic manufacturing ERP
            </p>
          </div>
        </div>

        {/* Status badges & close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#0F8B8D]/30 border border-[#0F8B8D]/50 text-[#7de0e2] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#7de0e2]" />
              {bomCode || 'BOM-AUTO'} ({bomVersion})
            </span>

            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Draft
            </span>

            <span className="text-xs flex items-center gap-1.5 text-slate-300 px-2 py-1 bg-white/5 rounded border border-white/10">
              {saveStatus === 'saving' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Saved successfully</span>
                </>
              )}
              {saveStatus === 'draft_saved' && (
                <>
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Draft saved</span>
                </>
              )}
              {saveStatus === 'not_saved' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-slate-400">Not saved yet</span>
                </>
              )}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close Wizard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Parent item summary card */}
      <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Item Code</div>
          <div className="font-mono font-bold text-white truncate">{parentItem.code}</div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10 sm:col-span-2">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Item Name</div>
          <div className="font-semibold text-white truncate">{parentItem.name}</div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Item Type</div>
          <div className="font-medium text-emerald-300">{parentItem.type}</div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Base UOM</div>
          <div className="font-mono font-bold text-white">{parentItem.baseUOM || 'PCS'}</div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Category</div>
          <div className="font-medium text-white truncate">{parentItem.cat}</div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Cycle Time</div>
          <div className="font-mono font-bold text-amber-300 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-amber-400" />
            {parentItem.standardCycleTime ? `${parentItem.standardCycleTime}s` : '14.5s'}
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Default WH</div>
          <div className="font-mono text-white truncate">{parentItem.wh || 'WH-FG-01'}</div>
        </div>
      </div>
    </div>
  );
};
