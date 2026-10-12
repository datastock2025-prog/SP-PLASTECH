# Module: SALES (Web)

## Metadata
- **Owner**: sales-team
- **Scope**: Customer directory, Sales Orders, Quotations, Delivery Challans, and E-Way Bill transit
- **Database Schema Prefix**: `sal_`
- **Tables**: `customers`, `sales_orders`, `quotations`, `delivery_challans`, `e_invoices`, `e_way_bills`

## Dependencies
- **May Import**: `core`, `masterdata`, `warehouse`, `integrations`

## Domain Events
- **Publishes**: `SalesOrderConfirmed`, `DispatchPosted`, `InvoiceIssued`
- **Consumes**: `ProductionCompleted`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
