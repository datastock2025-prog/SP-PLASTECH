# Module: MASTERDATA (Web)

## Metadata
- **Owner**: engineering-team
- **Scope**: Item Master catalog, mold/tooling directory, warehouse/bin master, and catalog governance
- **Database Schema Prefix**: `mdm_`
- **Tables**: `items`, `mold_tools`, `warehouses`, `plants`

## Dependencies
- **May Import**: `core`

## Domain Events
- **Publishes**: `ItemCreated`, `ItemUpdated`, `ItemStatusChanged`
- **Consumes**: None

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
