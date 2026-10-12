# Module: INTEGRATIONS (API)

## Metadata
- **Owner**: platform-team
- **Scope**: Government NIC e-way bill & e-invoice gateway, WhatsApp/email alerts, webhook dispatchers
- **Database Schema Prefix**: `int_`
- **Tables**: `integration_logs`, `webhook_endpoints`, `api_tokens`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `EwbDispatched`, `WebhookDelivered`
- **Consumes**: `InvoiceIssued`, `DispatchPosted`
