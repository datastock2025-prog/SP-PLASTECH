# Module: CORE (Web)

## Metadata
- **Owner**: platform-team
- **Scope**: Cross-cutting identity services: numbering engine, audit logging, system notifications, settings
- **Database Schema Prefix**: `cor_`
- **Tables**: `audit_logs`, `system_settings`, `document_sequences`

## Dependencies
- **May Import**: None (Core only)

## Domain Events
- **Publishes**: `SystemNotificationEmitted`
- **Consumes**: None

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
