import { z } from 'zod';

export const CreateChatSessionDtoSchema = z.object({
  sessionType: z.enum(['DOCUMENT_EXPORT', 'ANALYTICS_QUERY', 'GENERAL']).default('ANALYTICS_QUERY'),
  title: z.string().optional(),
  context: z.any().optional(),
});

export type CreateChatSessionDto = z.infer<typeof CreateChatSessionDtoSchema>;

export const SendMessageDtoSchema = z.object({
  content: z.string().min(1),
  metadata: z.any().optional(),
});

export type SendMessageDto = z.infer<typeof SendMessageDtoSchema>;

export const ExportChatDtoSchema = z.object({
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).default('PDF'),
  documentTitle: z.string().optional(),
  includeDataAnalysis: z.boolean().default(true),
  includeExecutiveSummary: z.boolean().default(true),
  includeRecommendations: z.boolean().default(true),
});

export type ExportChatDto = z.infer<typeof ExportChatDtoSchema>;
