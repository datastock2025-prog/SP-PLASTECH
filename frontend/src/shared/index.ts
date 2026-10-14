// ============================================================================
// SHARED MODULE — Cross-Cutting Infrastructure, Primitives & Shared Components
// Strict Domain-Driven Architecture — Reboot ERP
// ============================================================================

// Centralized API Client & TanStack Query Provider
export { apiClient } from './api/client';
export { supabase, checkSupabaseConnection } from './supabaseClient';
export { QueryProvider, queryClient } from './providers/QueryProvider';

// Ephemeral UI State (Zustand)
export { useUiStore } from './stores/uiStore';
export type { DrawerState, ConfirmModalState } from './stores/uiStore';

// Security & AI Readiness Primitives
export { RequireAuth } from './components/RequireAuth';
export { SanitizedHtml } from './components/SanitizedHtml';
export { StreamingText } from './components/StreamingText';
export type { StreamingTextProps } from './components/StreamingText';
export { PromptBuilder, promptBuilderSchema } from './components/PromptBuilder';
export type { PromptBuilderFormValues, PromptBuilderProps } from './components/PromptBuilder';
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
} from './components/prompt-builder';
export type {
  DomainContextType,
  PromptToneType,
  ContextInjectionFlags,
  PromptToken,
} from './components/prompt-builder';

// Centralized Layout Wrappers
export { AuthLayout } from './layouts/AuthLayout';

export * from '../types';
