# Module: FINANCE (Web)

## Metadata
- **Owner**: finance-team
- **Scope**: Chart of accounts, general ledger vouchers, AR/AP aging, GST tax workbench, product costing
- **Database Schema Prefix**: `fin_`
- **Tables**: `accounts`, `journal_entries`, `ar_invoices`, `ap_vouchers`, `tax_records`, `costing_sheets`

## Dependencies
- **May Import**: `core`

## Domain Events
- **Publishes**: `JournalEntryPosted`, `PeriodClosed`
- **Consumes**: `GrnPosted`, `InvoiceIssued`, `DispatchPosted`, `ProductionCompleted`

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
