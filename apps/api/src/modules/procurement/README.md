# Module: PROCUREMENT (API)

## Metadata
- **Owner**: procurement-team
- **Scope**: Suppliers, Purchase Requisitions, POs, Vendor Pricing, 3-Way Match, and Goods Receipt (GRN)
- **Database Schema Prefix**: `prc_`
- **Tables**: `suppliers`, `purchase_orders`, `purchase_requisitions`, `goods_receipt_notes`, `rfqs`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `GrnPosted`, `PoApproved`, `PoClosed`
- **Consumes**: `StockShortageDetected`
