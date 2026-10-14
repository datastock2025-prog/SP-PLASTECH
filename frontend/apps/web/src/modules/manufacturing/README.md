# Module: MANUFACTURING (Web)

## Metadata
- **Owner**: production-team
- **Scope**: Work orders, planning board, daily production log, shopfloor kiosk, regrind recycling, machine status
- **Database Schema Prefix**: `mfg_`
- **Tables**: `work_orders`, `daily_production_entries`, `machines`, `regrind_entries`, `scrap_records`

## Dependencies
- **May Import**: `core`, `engineering`, `warehouse`, `hr`

## Domain Events
- **Publishes**: `ProductionCompleted`, `ScrapReported`, `MachineDowntimeLogged`
- **Consumes**: `BomVersionApproved`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
