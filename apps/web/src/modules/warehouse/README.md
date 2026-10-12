# Module: WAREHOUSE (Web)

## Metadata
- **Owner**: supply-chain-team
- **Scope**: Inventory stock ledger, 2D bin maps, putaway, pick/pack fulfillment, stock transfers, and batch tracking
- **Database Schema Prefix**: `whs_`
- **Tables**: `stock_ledger`, `stock_transfers`, `bin_locations`, `inventory_batches`, `cycle_counts`

## Dependencies
- **May Import**: `core`, `masterdata`

## Domain Events
- **Publishes**: `StockTransferred`, `LotHeld`, `LotReleased`, `StockShortageDetected`
- **Consumes**: `GrnPosted`, `ProductionCompleted`, `DispatchPosted`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
