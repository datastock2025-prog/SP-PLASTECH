# Module: PROCUREMENT (Web)

## Metadata
- **Owner**: procurement-team
- **Scope**: Suppliers, Purchase Requisitions, POs, Vendor Pricing, 3-Way Match, and Goods Receipt (GRN)
- **Database Schema Prefix**: `prc_`
- **Tables**: `suppliers`, `purchase_orders`, `purchase_requisitions`, `goods_receipt_notes`, `rfqs`

## Dependencies
- **May Import**: `core`, `masterdata`, `warehouse`

## Domain Events
- **Publishes**: `GrnPosted`, `PoApproved`, `PoClosed`
- **Consumes**: `StockShortageDetected`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
