# Module: WORKSPACE (API)

## Metadata
- **Owner**: platform-team
- **Scope**: Workspace home, universal task aggregator, approvals hub, notifications drawer, saved views
- **Database Schema Prefix**: `wsh_`
- **Tables**: `user_tasks`, `approvals_queue`, `user_notifications`, `saved_presets`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `ApprovalDecided`, `TaskCompleted`
- **Consumes**: `PoApproved`, `BomVersionApproved`, `NcrRaised`
