# Module: MAINTENANCE (API)

## Metadata
- **Owner**: engineering-team
- **Scope**: Machine health telemetry, mold tooling preventive maintenance, utility MEP work orders
- **Database Schema Prefix**: `mep_`
- **Tables**: `maintenance_work_orders`, `equipment_assets`, `meter_readings`, `spare_inventory`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `MachineMaintenanceScheduled`, `BreakdownResolved`
- **Consumes**: `MachineDowntimeLogged`
