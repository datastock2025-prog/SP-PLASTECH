// ============================================================================
// INTEGRATIONS MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/integrations/index.ts
// ============================================================================

export { IntegrationsViews } from './screens/IntegrationsViews';

export {
  useIntegrations,
  useSaveIntegration,
} from './api/useIntegrations';

export { integrationsApi } from './api/integrationsApi';
export { integrationsRoutes } from './routes';

export {
  WebhookEndpointSchema,
  CreateWebhookEndpointInputSchema,
  UpdateWebhookEndpointInputSchema,
  ApiTokenSchema,
  IntegrationLogSchema,
  IntegrationConnectorSchema,
  IntegrationServiceCategoryEnum,
  IntegrationStatusEnum,
  webhookFormSchema,
} from './model/integrationsSchemas';

export type {
  WebhookEndpointContract,
  CreateWebhookEndpointContract,
  UpdateWebhookEndpointContract,
  ApiTokenContract,
  IntegrationLogContract,
  IntegrationConnectorContract,
  WebhookFormValues,
  IntegrationConnector,
} from './model/integrationsSchemas';

// Integration Sub-components
export { AdminIntegrationsView, IntegrationsView } from './components/AdminIntegrationsView';
export { AdminIntegrationManagementView, IntegrationManagementView } from './components/AdminIntegrationManagementView';
