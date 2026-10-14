import React from 'react';
import { Database, Activity, GitFork, ShieldCheck } from 'lucide-react';

export interface ContextInjectionFlags {
  includePlantContext: boolean;
  includeTelemetrySnapshot: boolean;
  includeBomHierarchy?: boolean;
  includeComplianceGuardrails?: boolean;
}

export interface ContextInjectionTogglesProps {
  values: ContextInjectionFlags;
  onChange: (updated: ContextInjectionFlags) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Modular AI Prompt Builder: Context Injection Toggles
 * Injects deterministic ERP operational state (plant, SCADA, BOM, compliance) into the LLM system prompt.
 */
export const ContextInjectionToggles: React.FC<ContextInjectionTogglesProps> = ({
  values,
  onChange,
  disabled = false,
  className = '',
}) => {
  const toggleKey = (key: keyof ContextInjectionFlags) => {
    onChange({
      ...values,
      [key]: !values[key],
    });
  };

  const toggles = [
    {
      key: 'includePlantContext' as const,
      label: 'Plant & Shift Context',
      desc: 'Injects active site (Unit 1 Hosūr / Unit 2), production line & supervisor metadata',
      icon: Database,
      activeColor: 'border-[#E8622C] bg-[#E8622C]/5',
      iconColor: 'text-[#E8622C]',
    },
    {
      key: 'includeTelemetrySnapshot' as const,
      label: 'Live SCADA Telemetry',
      desc: 'Injects cavity mold pressure, chiller delta-T, and hydraulic motor current',
      icon: Activity,
      activeColor: 'border-[#0F8B8D] bg-[#0F8B8D]/5',
      iconColor: 'text-[#0F8B8D]',
    },
    {
      key: 'includeBomHierarchy' as const,
      label: 'BOM & Material Grade',
      desc: 'Attaches virgin-to-regrind ratio, masterbatch pigment spec, and cycle time limits',
      icon: GitFork,
      activeColor: 'border-[#7C3AED] bg-[#7C3AED]/5',
      iconColor: 'text-[#7C3AED]',
    },
    {
      key: 'includeComplianceGuardrails' as const,
      label: 'IATF 16949 Guardrails',
      desc: 'Restricts outputs to auditable CAPA containment, non-conformance rules & MSA tolerances',
      icon: ShieldCheck,
      activeColor: 'border-[#059669] bg-[#059669]/5',
      iconColor: 'text-[#059669]',
    },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-xs font-bold text-[#14213D] uppercase tracking-wider">
        4. Runtime ERP Context Injection
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {toggles.map((item) => {
          const isChecked = Boolean(values[item.key]);
          const IconComponent = item.icon;

          return (
            <label
              key={item.key}
              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                isChecked
                  ? `${item.activeColor} shadow-xs`
                  : 'bg-white border-[#E4E0D6] hover:bg-slate-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={disabled}
                onChange={() => toggleKey(item.key)}
                className="mt-0.5 rounded-xs border-[#E4E0D6] text-[#E8622C] focus:ring-[#E8622C] cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <IconComponent className={`w-3.5 h-3.5 ${item.iconColor}`} />
                  <span className="text-xs font-bold text-[#14213D]">{item.label}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {item.desc}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ContextInjectionToggles;
