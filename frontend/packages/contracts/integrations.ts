import { z } from 'zod';

export const IntegrationServiceCategoryEnum = z.enum([
  'ERP & Accounting',
  'Government Compliance',
  'Hardware & IoT',
  'Market Data',
  'Messaging & Alerts',
]);

export const IntegrationStatusEnum = z.enum([
  'Connected',
  'Disconnected',
  'Error',
  'Syncing',
]);

export const WebhookEndpointSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Webhook name is required'),
  url: z.string().url('Valid URL is required'),
  secret: z.string().min(8, 'Secret must be at least 8 characters'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  active: z.boolean().default(true),
  failureCount: z.number().int().min(0).default(0),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateWebhookEndpointInputSchema = WebhookEndpointSchema.omit({ id: true });
export const UpdateWebhookEndpointInputSchema = WebhookEndpointSchema.partial().extend({
  version: z.number().int().min(1),
});

export const ApiTokenSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Token name is required'),
  tokenPrefix: z.string().default('ak_live_'),
  scopes: z.array(z.string()).min(1, 'At least one scope is required'),
  expiresAt: z.string().optional(),
  lastUsedAt: z.string().optional(),
  revoked: z.boolean().default(false),
});

export const IntegrationLogSchema = z.object({
  id: z.string().optional(),
  service: z.string().min(1, 'Service name is required'),
  direction: z.enum(['INBOUND', 'OUTBOUND']).default('OUTBOUND'),
  status: z.enum(['SUCCESS', 'FAILED', 'RETRYING']).default('SUCCESS'),
  statusCode: z.number().int().default(200),
  latencyMs: z.number().min(0).default(50),
  payloadSize: z.number().min(0).default(0),
  errorMessage: z.string().optional(),
  timestamp: z.string().optional(),
});

export const IntegrationConnectorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Connector name is required'),
  serviceCategory: IntegrationServiceCategoryEnum.default('Government Compliance'),
  provider: z.string().default('NIC e-Way Bill'),
  status: IntegrationStatusEnum.default('Connected'),
  endpointUrl: z.string().default('https://ewaybillgst.gov.in'),
  authType: z.enum(['OAuth2', 'API Key / Token', 'mTLS / Certificate', 'Basic Auth']).default('API Key / Token'),
  syncFrequency: z.enum(['Real-time Webhook', 'Every 15 Minutes', 'Hourly Batch', 'Daily at Midnight', 'Manual']).default('Real-time Webhook'),
  version: z.number().int().min(1).optional().default(1),
});

export type WebhookEndpointContract = z.infer<typeof WebhookEndpointSchema>;
export type CreateWebhookEndpointContract = z.infer<typeof CreateWebhookEndpointInputSchema>;
export type UpdateWebhookEndpointContract = z.infer<typeof UpdateWebhookEndpointInputSchema>;
export type ApiTokenContract = z.infer<typeof ApiTokenSchema>;
export type IntegrationLogContract = z.infer<typeof IntegrationLogSchema>;
export type IntegrationConnectorContract = z.infer<typeof IntegrationConnectorSchema>;
