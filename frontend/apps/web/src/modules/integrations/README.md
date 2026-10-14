# Module: INTEGRATIONS (Web)

## Metadata
- **Owner**: platform-team
- **Scope**: Government NIC e-way bill & e-invoice gateway, WhatsApp/email alerts, webhook dispatchers
- **Database Schema Prefix**: `int_`
- **Tables**: `integration_logs`, `webhook_endpoints`, `api_tokens`

## Dependencies
- **May Import**: `core`

## Domain Events
- **Publishes**: `EwbDispatched`, `WebhookDelivered`
- **Consumes**: `InvoiceIssued`, `DispatchPosted`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
