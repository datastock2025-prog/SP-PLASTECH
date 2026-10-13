import { z } from 'zod';
import { IntegrationConnector } from '@/src/types/admin';

export {
  WebhookEndpointSchema,
  CreateWebhookEndpointInputSchema,
  UpdateWebhookEndpointInputSchema,
  ApiTokenSchema,
  IntegrationLogSchema,
  IntegrationConnectorSchema,
  IntegrationServiceCategoryEnum,
  IntegrationStatusEnum,
} from '@/packages/contracts/integrations';

export type {
  WebhookEndpointContract,
  CreateWebhookEndpointContract,
  UpdateWebhookEndpointContract,
  ApiTokenContract,
  IntegrationLogContract,
  IntegrationConnectorContract,
} from '@/packages/contracts/integrations';

export const webhookFormSchema = z.object({
  name: z.string().min(1, 'Webhook name is required'),
  url: z.string().url('Must be a valid HTTPS webhook URL'),
  secret: z.string().min(8, 'Secret key must be at least 8 characters'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
  active: z.boolean().default(true),
});

export type WebhookFormValues = z.infer<typeof webhookFormSchema>;
export type { IntegrationConnector };
