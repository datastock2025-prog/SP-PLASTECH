# Module: CORE (API)

## Metadata
- **Owner**: platform-team
- **Scope**: Cross-cutting identity services: numbering engine, audit logging, system notifications, settings
- **Database Schema Prefix**: `cor_`
- **Tables**: `audit_logs`, `system_settings`, `document_sequences`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `SystemNotificationEmitted`
- **Consumes**: None
