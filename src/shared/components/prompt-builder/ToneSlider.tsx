import React from 'react';
import { Sliders, Cpu, Activity, Compass, Terminal, ShieldAlert } from 'lucide-react';

export type PromptToneType = 'technical' | 'root_cause' | 'executive' | 'concise';

export interface ToneOption {
  id: PromptToneType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  suggestedTemp: number;
}

export const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'technical',
    label: 'Technical & Parametric',
    desc: 'Empirical calculations, tolerances, melt temperatures & ASTM/ISO test standards',
    icon: Terminal,
    suggestedTemp: 0.15,
  },
  {
    id: 'root_cause',
    label: '5-Why / RCA Diagnostic',
    desc: 'Structured Ishikawa fishbone analysis, failure modes, containment & CAPA',
    icon: ShieldAlert,
    suggestedTemp: 0.25,
  },
  {
    id: 'executive',
    label: 'Executive Briefing',
    desc: 'Financial impact, cost variance, OEE benchmarks & C-suite strategic summary',
    icon: Compass,
    suggestedTemp: 0.35,
  },
  {
    id: 'concise',
    label: 'Concise Floor Directives',
    desc: 'Direct bulleted steps for press operators, tool room techs & shift supervisors',
    icon: Activity,
    suggestedTemp: 0.1,
  },
];

export interface ToneSliderProps {
  tone: PromptToneType;
  onToneChange: (tone: PromptToneType) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  showAdvanced?: boolean;
  topP?: number;
  onTopPChange?: (topP: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Modular AI Prompt Builder: Tone & Hyperparameter Slider
 * Controls temperature, decoding randomness, and output voice framing.
 */
export const ToneSlider: React.FC<ToneSliderProps> = ({
  tone,
  onToneChange,
  temperature,
  onTemperatureChange,
  showAdvanced = false,
  topP = 0.95,
  onTopPChange,
  disabled = false,
  className = '',
}) => {
  const getTempDescription = (temp: number) => {
    if (temp <= 0.15) return 'Deterministic (Zero Variance / Auditable Calculations)';
    if (temp <= 0.4) return 'Empirical & Controlled (Standard Industrial Inference)';
    if (temp <= 0.7) return 'Balanced Synthesis (Comparative Engineering Options)';
    return 'Exploratory (Creative Troubleshooting & Brainstorming)';
  };

  const getTempColor = (temp: number) => {
    if (temp <= 0.2) return '#0F8B8D';
    if (temp <= 0.6) return '#E8622C';
    return '#8B5CF6';
  };

  const handleToneSelect = (selectedTone: ToneOption) => {
    onToneChange(selectedTone.id);
    onTemperatureChange(selectedTone.suggestedTemp);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tone Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-[#14213D] uppercase tracking-wider">
            2. AI Tone & Reasoning Mode <span className="text-red-500">*</span>
          </label>
          <span className="text-[11px] font-mono text-slate-500">
            Active: <strong className="text-[#0F8B8D]">{tone}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TONE_OPTIONS.map((item) => {
            const isSelected = tone === item.id;
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => handleToneSelect(item)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-white border-[#0F8B8D] ring-1 ring-[#0F8B8D] shadow-xs'
                    : 'bg-[#F6F4EF]/60 hover:bg-white border-[#E4E0D6] hover:border-slate-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#0F8B8D] text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14213D] truncate">{item.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">T: {item.suggestedTemp}</span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-snug line-clamp-2 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Temperature Slider */}
      <div className="p-3.5 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#14213D]" />
            <label className="text-xs font-bold text-[#14213D]">
              Model Temperature (Entropy / Creativity):
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-[#E4E0D6]"
              style={{ color: getTempColor(temperature) }}
            >
              {temperature.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={temperature}
          disabled={disabled}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F8B8D] disabled:opacity-50"
        />

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
          <button
            type="button"
            onClick={() => onTemperatureChange(0.0)}
            className="hover:text-slate-800 underline cursor-pointer"
          >
            0.0 (Strict)
          </button>
          <button
            type="button"
            onClick={() => onTemperatureChange(0.2)}
            className="hover:text-slate-800 underline cursor-pointer"
          >
            0.2 (Engineering)
          </button>
          <button
            type="button"
            onClick={() => onTemperatureChange(0.5)}
            className="hover:text-slate-800 underline cursor-pointer"
          >
            0.5 (Balanced)
          </button>
          <button
            type="button"
            onClick={() => onTemperatureChange(0.85)}
            className="hover:text-slate-800 underline cursor-pointer"
          >
            0.85+ (Creative)
          </button>
        </div>

        <p className="text-[11px] text-slate-600 font-medium mt-1.5 italic">
          &rarr; {getTempDescription(temperature)}
        </p>

        {/* Optional Top-P parameter */}
        {showAdvanced && onTopPChange && (
          <div className="mt-3 pt-3 border-t border-[#E4E0D6]">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14213D] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                Nucleus Sampling (Top-P):
              </label>
              <span className="text-xs font-mono text-slate-600">{topP.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={topP}
              onChange={(e) => onTopPChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#E8622C]"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ToneSlider;
