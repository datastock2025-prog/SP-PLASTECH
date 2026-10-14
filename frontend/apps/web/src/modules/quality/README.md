# Module: QUALITY (Web)

## Metadata
- **Owner**: quality-team
- **Scope**: QC inspections, NCR non-conformance, CAPA 8D resolution, COA certificates, and SPC telemetry
- **Database Schema Prefix**: `qua_`
- **Tables**: `inspection_lots`, `ncrs`, `capas`, `coas`, `spc_subgroups`

## Dependencies
- **May Import**: `core`, `warehouse`

## Domain Events
- **Publishes**: `LotReleased`, `LotRejected`, `NcrRaised`, `CapaClosed`
- **Consumes**: `GrnPosted`, `ProductionCompleted`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
