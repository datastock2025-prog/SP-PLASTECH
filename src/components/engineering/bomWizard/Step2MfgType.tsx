import React from 'react';
import { ManufacturingBomWizardState } from './types';
import {
  Layers,
  FlaskConical,
  Boxes,
  Package,
  Wrench,
  Check,
  Star,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  GitBranch,
} from 'lucide-react';

interface Step2Props {
  state: ManufacturingBomWizardState;
  onChange: (patch: Partial<ManufacturingBomWizardState>) => void;
}

export const Step2MfgType: React.FC<Step2Props> = ({ state, onChange }) => {
  const { parentItem, mfgCategory } = state;

  // Determine recommendation based on parent item
  const getRecommendedType = (): string => {
    const cat = (parentItem.cat || '').toLowerCase();
    const type = (parentItem.type || '').toLowerCase();
    if (cat.includes('resin') || cat.includes('compound') || cat.includes('blend')) return 'Formula / Recipe BOM';
    if (cat.includes('assembly') || cat.includes('set')) return 'Assembly BOM';
    if (cat.includes('pack') || cat.includes('carton')) return 'Packaging BOM';
    if (parentItem.name.toLowerCase().includes('trimmed') || parentItem.name.toLowerCase().includes('labeled')) return 'Secondary Operation BOM';
    return 'Discrete Manufacturing BOM';
  };

  const recommended = getRecommendedType();

  const cards = [
    {
      type: 'Discrete Manufacturing BOM' as const,
      icon: Layers,
      title: 'Discrete Manufacturing BOM',
      subtitle: 'Individual parts and assembled products',
      example: 'Molded part + label + insert + carton',
      badge: 'Most Popular for Molding',
      color: 'border-blue-500 bg-blue-50/20',
      iconColor: 'text-blue-600 bg-blue-100',
    },
    {
      type: 'Formula / Recipe BOM' as const,
      icon: FlaskConical,
      title: 'Formula / Recipe BOM',
      subtitle: 'Percentage-based compounding & dosing formulations',
      example: 'Resin (88%) + masterbatch (4%) + additive (1%) + regrind (7%)',
      badge: 'Compounding & Masterbatch',
      color: 'border-purple-500 bg-purple-50/20',
      iconColor: 'text-purple-600 bg-purple-100',
    },
    {
      type: 'Assembly BOM' as const,
      icon: Boxes,
      title: 'Assembly BOM',
      subtitle: 'Multiple molded & purchased parts joined together',
      example: 'Container body + snap cap + sealing liner + sticker',
      badge: 'Multi-part Assemblies',
      color: 'border-emerald-500 bg-emerald-50/20',
      iconColor: 'text-emerald-600 bg-emerald-100',
    },
    {
      type: 'Packaging BOM' as const,
      icon: Package,
      title: 'Packaging BOM',
      subtitle: 'Finished items packed with protective secondary shippers',
      example: 'Finished goods + carton box + partition + stretch wrap',
      badge: 'Logistics & Shippers',
      color: 'border-amber-500 bg-amber-50/20',
      iconColor: 'text-amber-600 bg-amber-100',
    },
    {
      type: 'Secondary Operation BOM' as const,
      icon: Wrench,
      title: 'Secondary Operation BOM',
      subtitle: 'Post-molding trimming, pad printing, degating & heat staking',
      example: 'Raw molded housing + laser gate trimming + logo pad print',
      badge: 'Post-Molding Work',
      color: 'border-orange-500 bg-orange-50/20',
      iconColor: 'text-[#E8622C] bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <h3 className="text-sm font-bold text-[#14213D] mb-1">Select Manufacturing Architecture</h3>
        <p className="text-xs text-gray-500">
          Choose how the Bill of Materials behaves during execution, ingredient dosing, and shop-floor scheduling.
        </p>
      </div>

      {/* 5 Selectable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const isSelected = mfgCategory === card.type;
          const isRec = recommended === card.type;
          const Icon = card.icon;

          return (
            <div
              key={card.type}
              onClick={() => onChange({ mfgCategory: card.type })}
              className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between ${
                isSelected
                  ? 'border-[#E8622C] bg-[#FFF9F6] shadow-md ring-2 ring-[#E8622C]/20'
                  : 'border-[#E4E0D6] bg-white hover:border-gray-400 hover:shadow-xs'
              }`}
            >
              <div>
                {/* Header with Icon and selection indicator */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isRec && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                        Recommended
                      </span>
                    )}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected ? 'bg-[#E8622C] border-[#E8622C] text-white' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[#14213D] mb-1">{card.title}</h4>
                <p className="text-[11px] text-gray-600 leading-relaxed mb-3">{card.subtitle}</p>
              </div>

              {/* Example box */}
              <div className="mt-2 pt-2.5 border-t border-gray-100 bg-[#F9F8F5] p-2 rounded-lg text-[10.5px]">
                <span className="font-semibold text-gray-700 block mb-0.5">Process Example:</span>
                <span className="text-gray-500 font-mono italic">{card.example}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Manufacturing Toggles */}
      <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-4">
        <div className="border-b border-[#E4E0D6] pb-2">
          <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">
            Manufacturing Execution &amp; Control Toggles
          </h4>
          <p className="text-xs text-gray-500">
            Configure permissions for multi-tier explosion, regrind usage limits, and quality hold behaviors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Multi-Level BOM */}
          <div
            onClick={() => onChange({ multiLevelEnabled: !state.multiLevelEnabled })}
            className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
              state.multiLevelEnabled ? 'bg-blue-50/50 border-blue-300' : 'bg-[#F9F8F5] border-[#E4E0D6]'
            }`}
          >
            <GitBranch className={`w-4 h-4 mt-0.5 ${state.multiLevelEnabled ? 'text-[#0F8B8D]' : 'text-gray-400'}`} />
            <div className="flex-1">
              <div className="font-bold text-[#14213D] flex items-center justify-between">
                <span>Multi-Level BOM Enabled</span>
                <input
                  type="checkbox"
                  checked={state.multiLevelEnabled}
                  onChange={() => {}}
                  className="rounded text-[#0F8B8D]"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Allows subassembly nesting with independent traveler routing.</p>
            </div>
          </div>

          {/* Allow Substitutes */}
          <div
            onClick={() => onChange({ allowSubstitutes: !state.allowSubstitutes })}
            className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
              state.allowSubstitutes ? 'bg-blue-50/50 border-blue-300' : 'bg-[#F9F8F5] border-[#E4E0D6]'
            }`}
          >
            <Layers className={`w-4 h-4 mt-0.5 ${state.allowSubstitutes ? 'text-[#0F8B8D]' : 'text-gray-400'}`} />
            <div className="flex-1">
              <div className="font-bold text-[#14213D] flex items-center justify-between">
                <span>Allow Substitute Materials</span>
                <input
                  type="checkbox"
                  checked={state.allowSubstitutes}
                  onChange={() => {}}
                  className="rounded text-[#0F8B8D]"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Permits alternate resins/masterbatch during stock shortages.</p>
            </div>
          </div>

          {/* Allow Regrind */}
          <div
            onClick={() => onChange({ allowRegrind: !state.allowRegrind })}
            className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
              state.allowRegrind ? 'bg-emerald-50/50 border-emerald-300' : 'bg-[#F9F8F5] border-[#E4E0D6]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mt-0.5 ${state.allowRegrind ? 'text-emerald-600' : 'text-gray-400'}`} />
            <div className="flex-1">
              <div className="font-bold text-[#14213D] flex items-center justify-between">
                <span>Allow Regrind Usage</span>
                <input
                  type="checkbox"
                  checked={state.allowRegrind}
                  onChange={() => {}}
                  className="rounded text-emerald-600"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Permits closed-loop internal runner &amp; purge recovery.</p>
            </div>
          </div>

          {/* Quality Inspection */}
          <div
            onClick={() => onChange({ requireQualityInspection: !state.requireQualityInspection })}
            className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
              state.requireQualityInspection ? 'bg-amber-50/50 border-amber-300' : 'bg-[#F9F8F5] border-[#E4E0D6]'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 mt-0.5 ${state.requireQualityInspection ? 'text-amber-600' : 'text-gray-400'}`} />
            <div className="flex-1">
              <div className="font-bold text-[#14213D] flex items-center justify-between">
                <span>Require Quality Inspection</span>
                <input
                  type="checkbox"
                  checked={state.requireQualityInspection}
                  onChange={() => {}}
                  className="rounded text-amber-600"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Holds production output for FAI &amp; dimensional sign-off.</p>
            </div>
          </div>

          {/* Customer Approval */}
          <div
            onClick={() => onChange({ requireCustomerApproval: !state.requireCustomerApproval })}
            className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
              state.requireCustomerApproval ? 'bg-purple-50/50 border-purple-300' : 'bg-[#F9F8F5] border-[#E4E0D6]'
            }`}
          >
            <FileCheck2 className={`w-4 h-4 mt-0.5 ${state.requireCustomerApproval ? 'text-purple-600' : 'text-gray-400'}`} />
            <div className="flex-1">
              <div className="font-bold text-[#14213D] flex items-center justify-between">
                <span>Require Customer Approval</span>
                <input
                  type="checkbox"
                  checked={state.requireCustomerApproval}
                  onChange={() => {}}
                  className="rounded text-purple-600"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Locks BOM release until OEM PPAP/sample is signed off.</p>
            </div>
          </div>

          {/* Auto-create Secondary WO */}
          <div
            onClick={() => onChange({ autoCreateSecondaryWO: !state.autoCreateSecondaryWO })}
            className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
              state.autoCreateSecondaryWO ? 'bg-orange-50/50 border-orange-300' : 'bg-[#F9F8F5] border-[#E4E0D6]'
            }`}
          >
            <Wrench className={`w-4 h-4 mt-0.5 ${state.autoCreateSecondaryWO ? 'text-[#E8622C]' : 'text-gray-400'}`} />
            <div className="flex-1">
              <div className="font-bold text-[#14213D] flex items-center justify-between">
                <span>Auto-Create Secondary WO</span>
                <input
                  type="checkbox"
                  checked={state.autoCreateSecondaryWO}
                  onChange={() => {}}
                  className="rounded text-[#E8622C]"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Triggers downstream trimming/packing work order on molding completion.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
