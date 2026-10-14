# Module: PLANNING (Web)

## Metadata
- **Owner**: planning-team
- **Scope**: MRP requirements planning, JIT production scheduling, capacity load calculations
- **Database Schema Prefix**: `scm_`
- **Tables**: `mrp_runs`, `planned_orders`, `jit_schedules`, `capacity_plans`

## Dependencies
- **May Import**: `core`, `engineering`, `sales`, `procurement`, `warehouse`, `manufacturing`

## Domain Events
- **Publishes**: `MrpPlannedOrdersGenerated`, `JitSchedulePublished`
- **Consumes**: `SalesOrderConfirmed`, `ItemCreated`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
