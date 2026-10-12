# Module: PLANNING (API)

## Metadata
- **Owner**: planning-team
- **Scope**: MRP requirements planning, JIT production scheduling, capacity load calculations
- **Database Schema Prefix**: `scm_`
- **Tables**: `mrp_runs`, `planned_orders`, `jit_schedules`, `capacity_plans`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `MrpPlannedOrdersGenerated`, `JitSchedulePublished`
- **Consumes**: `SalesOrderConfirmed`, `ItemCreated`
