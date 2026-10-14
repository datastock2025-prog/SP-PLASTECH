# Module: MAINTENANCE (Web)

## Metadata
- **Owner**: engineering-team
- **Scope**: Machine health telemetry, mold tooling preventive maintenance, utility MEP work orders
- **Database Schema Prefix**: `mep_`
- **Tables**: `maintenance_work_orders`, `equipment_assets`, `meter_readings`, `spare_inventory`

## Dependencies
- **May Import**: `core`, `manufacturing`, `warehouse`

## Domain Events
- **Publishes**: `MachineMaintenanceScheduled`, `BreakdownResolved`
- **Consumes**: `MachineDowntimeLogged`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
