# Module: QUALITY (API)

## Metadata
- **Owner**: quality-team
- **Scope**: QC inspections, NCR non-conformance, CAPA 8D resolution, COA certificates, and SPC telemetry
- **Database Schema Prefix**: `qua_`
- **Tables**: `inspection_lots`, `ncrs`, `capas`, `coas`, `spc_subgroups`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `LotReleased`, `LotRejected`, `NcrRaised`, `CapaClosed`
- **Consumes**: `GrnPosted`, `ProductionCompleted`
