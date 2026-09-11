import React from 'react';
import { UserCheck, Sparkles } from 'lucide-react';

export interface PersonaPreset {
  id: string;
  name: string;
  domain: string;
  description: string;
}

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: 'polymer_eng',
    name: 'Principal Polymer Manufacturing & SPC Specialist',
    domain: 'Manufacturing',
    description: 'Expertise in rheology, resin melt flow index (MFI), screw shear and cycle optimization.',
  },
  {
    id: 'quality_auditor',
    name: 'IATF 16949 Lead Quality Auditor & Six Sigma Black Belt',
    domain: 'Quality',
    description: 'Specializes in Cpk calculation, 8D containment, gauge R&R and PPAP submissions.',
  },
  {
    id: 'scada_eng',
    name: 'Chief Facilities & Cleanroom MEP Controls Engineer',
    domain: 'MEP / Facilities',
    description: 'Monitors 11kV substation load, chiller delta-T, compressor dewpoint and ISO 7 delta-P.',
  },
  {
    id: 'wms_lead',
    name: 'Silo & FIFO Polymer Materials Coordinator',
    domain: 'Warehouse',
    description: 'Manages virgin-to-regrind blending ratios, moisture desiccant levels and lot traceability.',
  },
  {
    id: 'cost_accountant',
    name: 'Standard Costing & BOM Rollup Financial Analyst',
    domain: 'Costing',
    description: 'Audits runner scrap loss, machine hour absorption and labor variance against standard.',
  },
];

export interface SystemPersonaSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
}

/**
 * Modular AI Prompt Builder: System Persona Selector
 * Configures the system role, authority frame, and expertise domain.
 */
export const SystemPersonaSelector: React.FC<SystemPersonaSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  error,
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-[#E8622C]" />
          3. System Persona / Expert Authority <span className="text-red-500">*</span>
        </label>
        <span className="text-[10px] text-slate-500">Injects authoritative role guidelines</span>
      </div>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g. Senior Plastic Extrusion Engineer & Rheology Specialist"
          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E4E0D6] bg-[#F6F4EF] focus:bg-white focus:border-[#E8622C] focus:outline-hidden font-medium text-[#14213D] placeholder-slate-400 disabled:opacity-50 transition-colors"
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      {/* Preset Chips */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-slate-500 font-medium">
          <Sparkles className="w-3 h-3 text-[#0F8B8D]" />
          <span>Quick Expert Roles:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERSONA_PRESETS.map((preset) => {
            const isMatch = value === preset.name;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(preset.name)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer truncate max-w-xs ${
                  isMatch
                    ? 'bg-[#14213D] text-white border-[#14213D] font-bold shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-[#E4E0D6]'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SystemPersonaSelector;
