import React from 'react';
import { Plus, Tag } from 'lucide-react';

export interface PromptToken {
  id: string;
  label: string;
  token: string;
  domain: 'mes' | 'quality' | 'mep' | 'materials';
}

export const DEFAULT_PROMPT_TOKENS: PromptToken[] = [
  { id: 'cavity_p', label: 'Cavity Pressure Delta', token: '[Parameter: Cavity Pressure Delta-P > 15 bar]', domain: 'mes' },
  { id: 'mfi_lot', label: 'Resin MFI Lot', token: '[Lot: Raw Material Melt Flow Index 12.4 g/10min]', domain: 'materials' },
  { id: 'five_why', label: '5-Why RCA Method', token: '[Framework: 5-Why Ishikawa Root Cause Analysis]', domain: 'quality' },
  { id: 'chiller_t', label: 'Chiller Delta-T', token: '[SCADA: Mold Loop Cooling Return > 14.5°C]', domain: 'mep' },
  { id: 'oee_stops', label: 'OEE Micro-Stops', token: '[Metric: OEE Availability Loss with Scrap Pareto]', domain: 'mes' },
  { id: 'screw_rpm', label: 'Screw RPM & Backpressure', token: '[Extruder: Zone 3 Shear & Hydraulic Backpressure]', domain: 'mes' },
  { id: 'iatf_ncr', label: 'IATF 16949 Containment', token: '[Quality: 8D Containment Action Plan]', domain: 'quality' },
  { id: 'regrind_blend', label: 'Regrind Ratio', token: '[BOM: Virgin 85% : Regrind 15% Ratio Check]', domain: 'materials' },
];

export interface PromptVariableChipsProps {
  onInsertToken: (token: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Modular AI Prompt Builder: Variable Chips
 * Rapidly injects standardized manufacturing parameter tokens into user prompts.
 */
export const PromptVariableChips: React.FC<PromptVariableChipsProps> = ({
  onInsertToken,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-[#E8622C]" />
          <span>Quick Industrial Variable Tokens (Click to append):</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400">Tokens inject parametric tags</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {DEFAULT_PROMPT_TOKENS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onInsertToken(item.token)}
            className="text-[11px] font-mono inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F6F4EF] hover:bg-slate-200 text-slate-700 border border-[#E4E0D6] hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50"
            title={`Insert: ${item.token}`}
          >
            <Plus className="w-3 h-3 text-[#0F8B8D]" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptVariableChips;
