// ============================================================================
// DOMAIN FEATURE: AI STACK & STREAMING WORKLOADS
// Feature-Based Domain Driven Architecture
// ============================================================================

export * from './types/aiTypes';
export * from './api/aiApi';
export * from './hooks/useAi';
export { PromptBuilder, promptBuilderSchema } from '../../shared/components/PromptBuilder';
export type { PromptBuilderFormValues, PromptBuilderProps } from '../../shared/components/PromptBuilder';
export { StreamingText } from '../../shared/components/StreamingText';
export type { StreamingTextProps } from '../../shared/components/StreamingText';
export {
  ContextSelector,
  DOMAIN_CONTEXT_OPTIONS,
  ToneSlider,
  TONE_OPTIONS,
  SystemPersonaSelector,
  PERSONA_PRESETS,
  ContextInjectionToggles,
  PromptVariableChips,
  DEFAULT_PROMPT_TOKENS,
  CompiledPromptViewer,
} from '../../shared/components/prompt-builder';
export type {
  DomainContextType,
  PromptToneType,
  ContextInjectionFlags,
  PromptToken,
} from '../../shared/components/prompt-builder';
