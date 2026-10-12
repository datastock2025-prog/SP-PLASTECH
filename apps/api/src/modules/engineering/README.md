# Module: ENGINEERING (API)

## Metadata
- **Owner**: engineering-team
- **Scope**: Multi-level Bill of Materials (BOM), recipe scaling, ECO/ECR orders, and routing operations
- **Database Schema Prefix**: `eng_`
- **Tables**: `bill_of_materials`, `bom_items`, `engineering_change_requests`, `engineering_change_orders`, `process_routings`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `BomVersionApproved`, `EcoCompleted`
- **Consumes**: `ItemUpdated`
