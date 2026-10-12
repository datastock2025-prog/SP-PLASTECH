# Module: WAREHOUSE (API)

## Metadata
- **Owner**: supply-chain-team
- **Scope**: Inventory stock ledger, 2D bin maps, putaway, pick/pack fulfillment, stock transfers, and batch tracking
- **Database Schema Prefix**: `whs_`
- **Tables**: `stock_ledger`, `stock_transfers`, `bin_locations`, `inventory_batches`, `cycle_counts`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `StockTransferred`, `LotHeld`, `LotReleased`, `StockShortageDetected`
- **Consumes**: `GrnPosted`, `ProductionCompleted`, `DispatchPosted`
