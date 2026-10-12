# Module: MASTERDATA (API)

## Metadata
- **Owner**: engineering-team
- **Scope**: Item Master catalog, mold/tooling directory, warehouse/bin master, and catalog governance
- **Database Schema Prefix**: `mdm_`
- **Tables**: `items`, `mold_tools`, `warehouses`, `plants`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `ItemCreated`, `ItemUpdated`, `ItemStatusChanged`
- **Consumes**: None
