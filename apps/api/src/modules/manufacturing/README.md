# Module: MANUFACTURING (API)

## Metadata
- **Owner**: production-team
- **Scope**: Work orders, planning board, daily production log, shopfloor kiosk, regrind recycling, machine status
- **Database Schema Prefix**: `mfg_`
- **Tables**: `work_orders`, `daily_production_entries`, `machines`, `regrind_entries`, `scrap_records`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `ProductionCompleted`, `ScrapReported`, `MachineDowntimeLogged`
- **Consumes**: `BomVersionApproved`
