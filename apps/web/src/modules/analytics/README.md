# Module: ANALYTICS (Web)

## Metadata
- **Owner**: analytics-team
- **Scope**: Executive KPI dashboards, plant OEE gauges, query assistant telemetry, and report builders
- **Database Schema Prefix**: `int_`
- **Tables**: `analytics_dashboards`, `saved_reports`, `query_logs`

## Dependencies
- **May Import**: `core`

## Domain Events
- **Publishes**: None
- **Consumes**: None

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
