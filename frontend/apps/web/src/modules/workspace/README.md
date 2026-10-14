# Module: WORKSPACE (Web)

## Metadata
- **Owner**: platform-team
- **Scope**: Workspace home, universal task aggregator, approvals hub, notifications drawer, saved views
- **Database Schema Prefix**: `wsh_`
- **Tables**: `user_tasks`, `approvals_queue`, `user_notifications`, `saved_presets`

## Dependencies
- **May Import**: `core`, `identity`, `masterdata`, `engineering`, `procurement`, `warehouse`, `sales`, `manufacturing`, `quality`, `planning`, `finance`, `maintenance`, `hr`, `crm`, `analytics`, `integrations`

## Domain Events
- **Publishes**: `ApprovalDecided`, `TaskCompleted`
- **Consumes**: `PoApproved`, `BomVersionApproved`, `NcrRaised`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
