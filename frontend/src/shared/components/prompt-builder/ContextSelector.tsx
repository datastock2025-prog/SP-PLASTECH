import React from 'react';
import {
  Factory,
  ShieldCheck,
  Zap,
  Boxes,
  Calculator,
  Truck,
  Check
} from 'lucide-react';

export type DomainContextType =
  | 'manufacturing'
  | 'quality'
  | 'mep_facilities'
  | 'inventory_wms'
  | 'financials_costing'
  | 'supply_chain';

export interface DomainContextOption {
  id: DomainContextType;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const DOMAIN_CONTEXT_OPTIONS: DomainContextOption[] = [
  {
    id: 'manufacturing',
    title: 'Manufacturing Execution (MES)',
    subtitle: 'Machine cycles, OEE, cavity balance, hourly scrap rates & SMED changeovers',
    badge: 'Shop Floor',
    icon: Factory,
    color: '#E8622C',
  },
  {
    id: 'quality',
    title: 'Quality & IATF 16949 Compliance',
    subtitle: 'SPC Cp/Cpk, NCR quarantine holds, 5-Why root-cause & digital CoAs',
    badge: 'ISO / SPC',
    icon: ShieldCheck,
    color: '#0F8B8D',
  },
  {
    id: 'mep_facilities',
    title: 'MEP SCADA & Cleanroom BMS',
    subtitle: 'Chiller delta-T, hydraulic pressure, 11kV substation & ISO 7 HVAC delta-P',
    badge: 'Telemetry',
    icon: Zap,
    color: '#D97706',
  },
  {
    id: 'inventory_wms',
    title: 'Warehouse & Silo Inventory (WMS)',
    subtitle: 'Virgin polymer lots, masterbatch ratios, regrind tracking & bin racks',
    badge: 'Logistics',
    icon: Boxes,
    color: '#2563EB',
  },
  {
    id: 'financials_costing',
    title: 'Costing & BOM Financials',
    subtitle: 'Multi-level BOM variance, machine amortization & standard labor rates',
    badge: 'Financials',
    icon: Calculator,
    color: '#059669',
  },
  {
    id: 'supply_chain',
    title: 'Supply Chain & MRP Planning',
    subtitle: 'Safety stock buffers, vendor lead-time drift, purchase orders & ASNs',
    badge: 'Supply Chain',
    icon: Truck,
    color: '#7C3AED',
  },
];

export interface ContextSelectorProps {
  value: DomainContextType;
  onChange: (value: DomainContextType) => void;
  variant?: 'cards' | 'select';
  className?: string;
  disabled?: boolean;
}

/**
 * Modular AI Prompt Builder: Context Selector
 * Enables precise multi-domain targeting across plastic manufacturing execution.
 */
export const ContextSelector: React.FC<ContextSelectorProps> = ({
  value,
  onChange,
  variant = 'cards',
  className = '',
  disabled = false,
}) => {
  if (variant === 'select') {
    return (
      <div className={`space-y-1 ${className}`}>
        <label className="block text-xs font-bold text-[#14213D]">
          Domain Context <span className="text-red-500">*</span>
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as DomainContextType)}
          disabled={disabled}
          className="w-full text-xs px-3 py-2 rounded-lg border border-[#E4E0D6] bg-[#F6F4EF] focus:bg-white focus:border-[#E8622C] focus:outline-hidden font-medium text-slate-800 disabled:opacity-50"
        >
          {DOMAIN_CONTEXT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.title} ({opt.badge})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#14213D] uppercase tracking-wider">
          1. Domain Context Target <span className="text-red-500">*</span>
        </label>
        <span className="text-[11px] font-mono text-slate-500">
          Selected: <strong className="text-[#E8622C]">{value}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {DOMAIN_CONTEXT_OPTIONS.map((option) => {
          const isSelected = value === option.id;
          const IconComponent = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'bg-white border-[#E8622C] shadow-sm ring-1 ring-[#E8622C]'
                  : 'bg-[#F6F4EF]/70 hover:bg-white border-[#E4E0D6] hover:border-slate-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isSelected ? `${option.color}18` : '#E2E8F0',
                    color: isSelected ? option.color : '#475569',
                  }}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                    {option.badge}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[#E8622C] text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs font-bold text-[#14213D] leading-tight mb-1">
                {option.title}
              </div>
              <div className="text-[11px] text-[#6B7280] leading-snug line-clamp-2">
                {option.subtitle}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContextSelector;
