import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import { Sparkles, Cpu, Send, RefreshCw } from 'lucide-react';
import { StreamingText } from './StreamingText';

// Modular UI components
import {
  ContextSelector,
  DomainContextType,
  ToneSlider,
  PromptToneType,
  SystemPersonaSelector,
  ContextInjectionToggles,
  ContextInjectionFlags,
  PromptVariableChips,
  CompiledPromptViewer,
} from './prompt-builder';

// Re-export modular components for flexible sub-component consumption
export * from './prompt-builder';

// Zod Schema for AI Prompt Configuration
export const promptBuilderSchema = z.object({
  domainContext: z.enum([
    'manufacturing',
    'quality',
    'mep_facilities',
    'inventory_wms',
    'financials_costing',
    'supply_chain',
  ] as const),
  systemPersona: z.string().min(3, 'System persona must be at least 3 characters'),
  temperature: z.number().min(0).max(1),
  tone: z.enum(['concise', 'technical', 'executive', 'root_cause'] as const),
  userPrompt: z.string().min(5, 'User prompt must be at least 5 characters'),
  includePlantContext: z.boolean(),
  includeTelemetrySnapshot: z.boolean(),
  includeBomHierarchy: z.boolean().optional(),
  includeComplianceGuardrails: z.boolean().optional(),
});

export type PromptBuilderFormValues = z.infer<typeof promptBuilderSchema>;

export interface PromptBuilderProps {
  initialPrompt?: string;
  initialContext?: PromptBuilderFormValues['domainContext'];
  onSubmitPrompt?: (values: PromptBuilderFormValues, compiledPrompt: string) => void;
  className?: string;
  showLiveStreamPreview?: boolean;
}

/**
 * Enterprise AI Prompt Builder Container
 * Assembles modular context selectors, tone sliders, system personas, and ERP context injection toggles
 * before submitting to AI gateways with real-time token-by-token streaming previews.
 */
export const PromptBuilder: React.FC<PromptBuilderProps> = ({
  initialPrompt = '',
  initialContext = 'manufacturing',
  onSubmitPrompt,
  className = '',
  showLiveStreamPreview = true,
}) => {
  const [testStreamingText, setTestStreamingText] = useState<string | null>(null);
  const [streamIteration, setStreamIteration] = useState<number>(0);

  // Form Field State
  const [domainContext, setDomainContext] = useState<DomainContextType>(initialContext);
  const [systemPersona, setSystemPersona] = useState<string>(
    'Principal Polymer Manufacturing & SPC Quality Specialist'
  );
  const [temperature, setTemperature] = useState<number>(0.2);
  const [tone, setTone] = useState<PromptToneType>('technical');
  const [userPrompt, setUserPrompt] = useState<string>(
    initialPrompt ||
      'Analyze potential variance causes in mold cavity 4 pressure and recommend containment steps...'
  );
  const [injectionFlags, setInjectionFlags] = useState<ContextInjectionFlags>({
    includePlantContext: true,
    includeTelemetrySnapshot: false,
    includeBomHierarchy: true,
    includeComplianceGuardrails: true,
  });

  const [errors, setErrors] = useState<{ systemPersona?: string; userPrompt?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const compilePrompt = (values: PromptBuilderFormValues): string => {
    const lines = [
      `[SYSTEM INSTRUCTION]`,
      `Role: ${values.systemPersona}`,
      `Domain Context: ${values.domainContext.toUpperCase()}`,
      `Tone Mode: ${values.tone}`,
      `Model Temperature: ${values.temperature}`,
      `Active Plant Context: ${values.includePlantContext ? 'ENABLED (Unit 1 Hosūr Polymer Extrusion, Shift A)' : 'DISABLED'}`,
      `SCADA Telemetry Snapshot: ${values.includeTelemetrySnapshot ? 'ENABLED (Cavity Pressure: 142 bar, Mold Delta-T: 3.2°C, Hydraulic Motor: 42A)' : 'DISABLED'}`,
      `BOM & Material Hierarchy: ${values.includeBomHierarchy ? 'ATTACHED (Virgin PP 85% : Regrind 15%, Masterbatch Blue 2.0%)' : 'DISABLED'}`,
      `Compliance Guardrails: ${values.includeComplianceGuardrails ? 'IATF 16949 / ISO 9001 Auditable RCA Enforced' : 'STANDARD'}`,
      ``,
      `[USER QUERY]`,
      `${values.userPrompt}`,
    ];

    return lines.join('\n');
  };

  const currentFormValues: PromptBuilderFormValues = useMemo(
    () => ({
      domainContext,
      systemPersona,
      temperature,
      tone,
      userPrompt,
      includePlantContext: injectionFlags.includePlantContext,
      includeTelemetrySnapshot: injectionFlags.includeTelemetrySnapshot,
      includeBomHierarchy: injectionFlags.includeBomHierarchy,
      includeComplianceGuardrails: injectionFlags.includeComplianceGuardrails,
    }),
    [domainContext, systemPersona, temperature, tone, userPrompt, injectionFlags]
  );

  const compiledPrompt = useMemo(() => compilePrompt(currentFormValues), [currentFormValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { systemPersona?: string; userPrompt?: string } = {};
    if (!systemPersona || systemPersona.trim().length < 3) {
      newErrors.systemPersona = 'System persona must be at least 3 characters';
    }
    if (!userPrompt || userPrompt.trim().length < 5) {
      newErrors.userPrompt = 'User prompt must be at least 5 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    const compiled = compilePrompt(currentFormValues);
    onSubmitPrompt?.(currentFormValues, compiled);

    if (showLiveStreamPreview) {
      setStreamIteration((prev) => prev + 1);
      setTestStreamingText(
        `[AI GATEWAY STREAMING DISPATCH]\n` +
          `Context Target: ${domainContext.toUpperCase()} | Persona: ${systemPersona}\n` +
          `Tone: ${tone} (Temperature: ${temperature.toFixed(2)})\n\n` +
          `EMPIRICAL FINDINGS & CONTAINMENT:\n` +
          `1. Parameter Correlation: Sensor telemetry and screw RPM indicate intermittent shear heating in barrel zone 3.\n` +
          `2. Melt Flow Index: Current resin batch (MFI 12.4 g/10min) shows +8% viscosity variance compared to standard master spec.\n` +
          `3. Quality Containment: Quarantine last 240 units from Shift A in Bin QA-HOLD-02 for dimension Cpk inspection.\n` +
          `4. Actionable Directive: Decrease zone 3 heating by 3.5°C, calibrate mold cooling delta-T to <2.5°C, and log inspection report in IATF NCR portal.`
      );
    }
    setIsSubmitting(false);
  };

  const handleInsertVariableToken = (token: string) => {
    const separator = userPrompt.endsWith(' ') || userPrompt.length === 0 ? '' : ' ';
    setUserPrompt((prev) => `${prev}${separator}${token}`);
    if (errors.userPrompt) {
      setErrors((prev) => ({ ...prev, userPrompt: undefined }));
    }
  };

  return (
    <div className={`p-4 sm:p-6 bg-white rounded-2xl border border-[#E4E0D6] shadow-xs space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E0D6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8622C]/10 text-[#E8622C] flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#14213D] tracking-tight">
              Enterprise AI Prompt Builder
            </h2>
            <p className="text-xs text-[#6B7280]">
              Modular UI stack for context targeting, persona steering, and temperature tuning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            SSE &bull; WebSockets Ready
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Modular Component 1: Context Selector */}
        <ContextSelector
          value={domainContext}
          onChange={(val) => setDomainContext(val)}
        />

        {/* Modular Component 2: Tone & Temperature Sliders */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <ToneSlider
              tone={tone}
              onToneChange={(newTone) => setTone(newTone)}
              temperature={temperature}
              onTemperatureChange={(newTemp) => setTemperature(newTemp)}
            />
          </div>
        </div>

        {/* Modular Component 3: System Persona Selector */}
        <SystemPersonaSelector
          value={systemPersona}
          onChange={(val) => {
            setSystemPersona(val);
            if (errors.systemPersona) setErrors((prev) => ({ ...prev, systemPersona: undefined }));
          }}
          error={errors.systemPersona}
        />

        {/* Modular Component 4: Context Injection Toggles */}
        <ContextInjectionToggles
          values={injectionFlags}
          onChange={(updated) => setInjectionFlags(updated)}
        />

        {/* User Prompt Text Area */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#14213D] uppercase tracking-wider">
            5. User Instructions / Diagnostic Inquiry <span className="text-red-500">*</span>
          </label>
          <textarea
            value={userPrompt}
            onChange={(e) => {
              setUserPrompt(e.target.value);
              if (errors.userPrompt) setErrors((prev) => ({ ...prev, userPrompt: undefined }));
            }}
            rows={3}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E4E0D6] bg-[#F6F4EF] focus:bg-white focus:border-[#E8622C] focus:outline-hidden font-mono text-slate-800 transition-colors"
            placeholder="Describe the operational issue, SPC out-of-control point, or optimization inquiry..."
          />
          {errors.userPrompt && (
            <p className="text-xs text-red-500">{errors.userPrompt}</p>
          )}

          {/* Modular Component 5: Variable Chips */}
          <PromptVariableChips onInsertToken={handleInsertVariableToken} />
        </div>

        {/* Modular Component 6: Compiled Prompt Viewer */}
        <CompiledPromptViewer compiledPrompt={compiledPrompt} />

        {/* Submit & Test Trigger */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#E8622C] hover:bg-[#D45320] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Prompt &amp; Run Streaming Test</span>
          </button>
        </div>
      </form>

      {/* Streaming Text Output Test Showcase */}
      {testStreamingText && (
        <div className="mt-6 p-4 rounded-xl bg-[#14213D] text-slate-200 border border-[#0F8B8D]/40 space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono text-[#0F8B8D]">
            <span className="flex items-center gap-1.5 font-bold">
              <Cpu className="w-4 h-4 text-[#E8622C] animate-pulse" />
              AI Gateway Token Stream (<code className="text-emerald-400">&lt;StreamingText /&gt;</code>)
            </span>
            <button
              type="button"
              onClick={() => setStreamIteration((prev) => prev + 1)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Replay Stream</span>
            </button>
          </div>

          <div className="p-3 bg-black/30 rounded-lg border border-white/5 font-mono text-xs leading-relaxed text-emerald-300">
            <StreamingText
              key={streamIteration}
              text={testStreamingText}
              speedMs={14}
              chunkSize={2}
              className="text-xs leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptBuilder;
