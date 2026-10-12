# Module: CRM (API)

## Metadata
- **Owner**: sales-team
- **Scope**: Customer leads, pricing inquiries, opportunity pipeline, and quotation costing models
- **Database Schema Prefix**: `crm_`
- **Tables**: `crm_leads`, `crm_inquiries`, `opportunity_pipeline`, `customer_feedback`

## Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

## Domain Events (`events.ts`)
- **Publishes**: `InquiryCosted`, `OpportunityWon`
- **Consumes**: None
