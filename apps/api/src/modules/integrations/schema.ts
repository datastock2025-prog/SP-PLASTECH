import { z } from 'zod';

export const CreateWebhookEndpointInputSchema = z.object({
  name: z.string().trim().min(1),
  url: z.string().url(),
  secret: z.string().min(8),
  events: z.array(z.string()).min(1),
  active: z.boolean().default(true),
});

export const UpdateWebhookEndpointInputSchema = CreateWebhookEndpointInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CreateApiTokenInputSchema = z.object({
  name: z.string().trim().min(1),
  scopes: z.array(z.string()).min(1),
  expiresAt: z.string().optional(),
});
