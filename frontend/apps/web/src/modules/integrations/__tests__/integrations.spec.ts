import { describe, it, expect } from 'vitest';
import {
  WebhookEndpointSchema,
  CreateWebhookEndpointInputSchema,
  UpdateWebhookEndpointInputSchema,
  ApiTokenSchema,
  IntegrationLogSchema,
  IntegrationConnectorSchema,
} from '@/packages/contracts/integrations';

describe('Integrations Module Contracts & Validation', () => {
  it('validates a valid WebhookEndpointSchema payload', () => {
    const rawWebhook = {
      id: 'wh-uuid-001',
      name: 'NIC E-Way Bill Auto Dispatch',
      url: 'https://api.gateway.gov.in/v1/webhook',
      secret: 'whsec_verysecuresecret123',
      events: ['DispatchPosted', 'EwbDispatched'],
      active: true,
      failureCount: 0,
      version: 1,
    };

    const parsed = WebhookEndpointSchema.safeParse(rawWebhook);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('NIC E-Way Bill Auto Dispatch');
      expect(parsed.data.url).toBe('https://api.gateway.gov.in/v1/webhook');
      expect(parsed.data.events).toHaveLength(2);
    }
  });

  it('rejects an invalid webhook URL or short secret', () => {
    const invalid = {
      name: 'Bad Webhook',
      url: 'not-a-valid-url',
      secret: 'short',
      events: [],
    };

    const parsed = WebhookEndpointSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateWebhookEndpointInputSchema with OCC version check', () => {
    const update = {
      active: false,
      failureCount: 3,
      version: 2,
    };

    const parsed = UpdateWebhookEndpointInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(2);
      expect(parsed.data.active).toBe(false);
      expect(parsed.data.failureCount).toBe(3);
    }
  });

  it('validates an ApiTokenSchema payload', () => {
    const rawToken = {
      id: 'tok-uuid-001',
      name: 'Production Line Scada Telemetry Key',
      tokenPrefix: 'ak_live_scada_',
      scopes: ['iot:telemetry:write', 'mfg:status:read'],
      revoked: false,
    };

    const parsed = ApiTokenSchema.safeParse(rawToken);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('Production Line Scada Telemetry Key');
      expect(parsed.data.scopes).toContain('iot:telemetry:write');
      expect(parsed.data.revoked).toBe(false);
    }
  });

  it('validates an IntegrationLogSchema payload', () => {
    const rawLog = {
      id: 'log-uuid-001',
      service: 'NIC E-Invoice Portal',
      direction: 'OUTBOUND' as const,
      status: 'SUCCESS' as const,
      statusCode: 200,
      latencyMs: 142,
      payloadSize: 2048,
      timestamp: '2026-10-13T08:30:00Z',
    };

    const parsed = IntegrationLogSchema.safeParse(rawLog);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.service).toBe('NIC E-Invoice Portal');
      expect(parsed.data.statusCode).toBe(200);
      expect(parsed.data.status).toBe('SUCCESS');
    }
  });

  it('validates an IntegrationConnectorSchema payload', () => {
    const rawConnector = {
      id: 'conn-uuid-001',
      name: 'NIC E-Way Bill Gateway',
      serviceCategory: 'Government Compliance' as const,
      provider: 'NIC e-Way Bill',
      status: 'Connected' as const,
      endpointUrl: 'https://ewaybillgst.gov.in',
      authType: 'API Key / Token' as const,
      syncFrequency: 'Real-time Webhook' as const,
      version: 1,
    };

    const parsed = IntegrationConnectorSchema.safeParse(rawConnector);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('NIC E-Way Bill Gateway');
      expect(parsed.data.serviceCategory).toBe('Government Compliance');
      expect(parsed.data.status).toBe('Connected');
    }
  });
});
