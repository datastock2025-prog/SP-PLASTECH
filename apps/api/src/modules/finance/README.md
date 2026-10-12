# Module: FINANCE (API)

## Metadata
- **Owner**: finance-team
- **Scope**: Chart of accounts, general ledger vouchers, AR/AP aging, GST tax workbench, product costing
- **Database Schema Prefix**: `fin_`
- **Tables**: `accounts`, `journal_entries`, `ar_invoices`, `ap_vouchers`, `tax_records`, `costing_sheets`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `JournalEntryPosted`, `PeriodClosed`
- **Consumes**: `GrnPosted`, `InvoiceIssued`, `DispatchPosted`, `ProductionCompleted`
