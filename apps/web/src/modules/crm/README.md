# Module: CRM (Web)

## Metadata
- **Owner**: sales-team
- **Scope**: Customer leads, pricing inquiries, opportunity pipeline, and quotation costing models
- **Database Schema Prefix**: `crm_`
- **Tables**: `crm_leads`, `crm_inquiries`, `opportunity_pipeline`, `customer_feedback`

## Dependencies
- **May Import**: `core`, `sales`, `manufacturing`

## Domain Events
- **Publishes**: `InquiryCosted`, `OpportunityWon`
- **Consumes**: None

## Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.
