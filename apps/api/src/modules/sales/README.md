# Module: SALES (API)

## Metadata
- **Owner**: sales-team
- **Scope**: Customer directory, Sales Orders, Quotations, Delivery Challans, and E-Way Bill transit
- **Database Schema Prefix**: `sal_`
- **Tables**: `customers`, `sales_orders`, `quotations`, `delivery_challans`, `e_invoices`, `e_way_bills`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `SalesOrderConfirmed`, `DispatchPosted`, `InvoiceIssued`
- **Consumes**: `ProductionCompleted`
