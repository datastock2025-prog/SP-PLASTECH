import { z } from 'zod';
import { promptBuilderSchema, PromptBuilderFormValues } from '../../../shared/components/PromptBuilder';

export { promptBuilderSchema };
export type { PromptBuilderFormValues };

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  streaming?: boolean;
}

export interface AiModelConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topK: number;
  topP: number;
}
