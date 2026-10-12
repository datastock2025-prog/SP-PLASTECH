# Module: ENGINEERING (Web)

## Metadata
- **Owner**: engineering-team
- **Scope**: Multi-level Bill of Materials (BOM), recipe scaling, ECO/ECR orders, and routing operations
- **Database Schema Prefix**: `eng_`
- **Tables**: `bill_of_materials`, `bom_items`, `engineering_change_requests`, `engineering_change_orders`, `process_routings`

## Dependencies
- **May Import**: `core`, `masterdata`

## Domain Events
- **Publishes**: `BomVersionApproved`, `EcoCompleted`
- **Consumes**: `ItemUpdated`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
