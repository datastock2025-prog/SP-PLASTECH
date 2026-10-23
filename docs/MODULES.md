# Module Map (single source)

One section per ERP module. Replaces the per-folder READMEs under `frontend/apps/web/src/modules/*`, `frontend/packages/domain/*`, `apps/api/src/modules/*`.

## Overview

### Modular Monolithic Frontend Architecture

#### Architectural Overview

This workspace is structured as a **Modular Monolith** for enterprise manufacturing ERP applications. It combines the deployment simplicity and single-bundle developer experience of a monolithic repository with the strict domain isolation, high cohesion, and loose coupling of microservices/modular architectures.

```
src/
├── core/                                # Singleton infrastructure, app shell & navigation
│   ├── index.ts                         # Topbar, Sidebar, Drawer, ConfirmModal, Nav Registry
│   └── ...
├── shared/                              # Cross-cutting UI primitives, tables & base models
│   ├── index.ts                         # AdvancedDataTable, PaginationBar, Modals, Shared Types
│   └── ...
├── modules/                             # Domain Feature Modules (Bounded Contexts)
│   ├── auth/                            # Identity, Terminal session lock, role & plant context
│   ├── home/                            # Workspace Home command center & tool hubs
│   ├── masterdata/                      # Items, Machine catalog, BOM core master
│   ├── engineering/                     # BOM designer, Multi-level trees, Process routings
│   ├── manufacturing/                   # Shop floor execution, JIT planner, OEE, SMED, Kiosks
│   ├── procurement/                     # RFQs, PO management, GRN receipts, Supplier ledger
│   ├── warehouse/                       # Inventory ledger, Bins, Putaway, Picking, Regrind
│   ├── sales/                           # Sales orders, RMAs, Customer credit, Price lists
│   ├── finance/                         # Chart of Accounts, Journal vouchers, AP/AR, Costing
│   ├── quality/                         # NCRs, CAPAs, COA generator, Calibration, SPC
│   ├── hr/                              # Shift rosters, Biometrics, IATF skills, PPE, Payroll
│   ├── mep/                             # Mechanical, Electrical, Cleanroom HVAC, Chiller PM
│   ├── scm/                             # S&OP, Demand planning, MRP, Inbound/Outbound track
│   ├── crm/                             # Deals, Pipelines, Leads, Competitor intelligence
│   ├── admin/                           # RBAC matrix, Audit vault, Security policies, Backups
│   ├── architecture/                    # React 19+ enterprise modular architecture technical specs
│   └── index.ts                         # Central master domain registry & facades
├── App.tsx                              # Application root bootstrapping & state coordinator
└── main.tsx                             # React 18 DOM mount point
```

#### Domain Isolation Principles

1. **Self-Contained Modules**: Each feature domain inside `src/modules/<domain>/` encapsulates its components, local data state, and domain-specific types.
2. **Explicit Public Interface (`index.ts`)**: Modules expose a curated public surface via their barrel `index.ts`. Private helpers or sub-components stay internal.
3. **No Direct Deep Coupling**: Outer components interact with feature domains through their module facades or barrel exports.
4. **Preserved Business Logic**: All ERP workflows (JIT calculation, SMED changeover, OEE tracking, Biometric rosters, Financial posting rules) remain authentic and operational.

---

## analytics

**Frontend module** (`frontend/apps/web/src/modules/analytics`)

##### Module: ANALYTICS (Web)

###### Metadata
- **Owner**: analytics-team
- **Scope**: Executive KPI dashboards, plant OEE gauges, query assistant telemetry, and report builders
- **Database Schema Prefix**: `int_`
- **Tables**: `analytics_dashboards`, `saved_reports`, `query_logs`

###### Dependencies
- **May Import**: `core`

###### Domain Events
- **Publishes**: None
- **Consumes**: None

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/analytics`)

##### Domain: analytics

Pure business rules for analytics. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/analytics`)

##### Module: ANALYTICS (API)

###### Metadata
- **Owner**: analytics-team
- **Scope**: Executive KPI dashboards, plant OEE gauges, query assistant telemetry, and report builders
- **Database Schema Prefix**: `int_`
- **Tables**: `analytics_dashboards`, `saved_reports`, `query_logs`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: None
- **Consumes**: None

---

## core

**Frontend module** (`frontend/apps/web/src/modules/core`)

##### Module: CORE (Web)

###### Metadata
- **Owner**: platform-team
- **Scope**: Cross-cutting identity services: numbering engine, audit logging, system notifications, settings
- **Database Schema Prefix**: `cor_`
- **Tables**: `audit_logs`, `system_settings`, `document_sequences`

###### Dependencies
- **May Import**: None (Core only)

###### Domain Events
- **Publishes**: `SystemNotificationEmitted`
- **Consumes**: None

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/core`)

##### Domain: core

Pure business rules for core. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/core`)

##### Module: CORE (API)

###### Metadata
- **Owner**: platform-team
- **Scope**: Cross-cutting identity services: numbering engine, audit logging, system notifications, settings
- **Database Schema Prefix**: `cor_`
- **Tables**: `audit_logs`, `system_settings`, `document_sequences`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `SystemNotificationEmitted`
- **Consumes**: None

---

## crm

**Frontend module** (`frontend/apps/web/src/modules/crm`)

##### Module: CRM (Web)

###### Metadata
- **Owner**: sales-team
- **Scope**: Customer leads, pricing inquiries, opportunity pipeline, and quotation costing models
- **Database Schema Prefix**: `crm_`
- **Tables**: `crm_leads`, `crm_inquiries`, `opportunity_pipeline`, `customer_feedback`

###### Dependencies
- **May Import**: `core`, `sales`, `manufacturing`

###### Domain Events
- **Publishes**: `InquiryCosted`, `OpportunityWon`
- **Consumes**: None

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/crm`)

##### Domain: crm

Pure business rules for crm. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/crm`)

##### Module: CRM (API)

###### Metadata
- **Owner**: sales-team
- **Scope**: Customer leads, pricing inquiries, opportunity pipeline, and quotation costing models
- **Database Schema Prefix**: `crm_`
- **Tables**: `crm_leads`, `crm_inquiries`, `opportunity_pipeline`, `customer_feedback`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `InquiryCosted`, `OpportunityWon`
- **Consumes**: None

---

## engineering

**Frontend module** (`frontend/apps/web/src/modules/engineering`)

##### Module: ENGINEERING (Web)

###### Metadata
- **Owner**: engineering-team
- **Scope**: Multi-level Bill of Materials (BOM), recipe scaling, ECO/ECR orders, and routing operations
- **Database Schema Prefix**: `eng_`
- **Tables**: `bill_of_materials`, `bom_items`, `engineering_change_requests`, `engineering_change_orders`, `process_routings`

###### Dependencies
- **May Import**: `core`, `masterdata`

###### Domain Events
- **Publishes**: `BomVersionApproved`, `EcoCompleted`
- **Consumes**: `ItemUpdated`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/engineering`)

##### Domain: engineering

Pure business rules for engineering. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/engineering`)

##### Module: ENGINEERING (API)

###### Metadata
- **Owner**: engineering-team
- **Scope**: Multi-level Bill of Materials (BOM), recipe scaling, ECO/ECR orders, and routing operations
- **Database Schema Prefix**: `eng_`
- **Tables**: `bill_of_materials`, `bom_items`, `engineering_change_requests`, `engineering_change_orders`, `process_routings`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `BomVersionApproved`, `EcoCompleted`
- **Consumes**: `ItemUpdated`

---

## finance

**Frontend module** (`frontend/apps/web/src/modules/finance`)

##### Module: FINANCE (Web)

###### Metadata
- **Owner**: finance-team
- **Scope**: Chart of accounts, general ledger vouchers, AR/AP aging, GST tax workbench, product costing
- **Database Schema Prefix**: `fin_`
- **Tables**: `accounts`, `journal_entries`, `ar_invoices`, `ap_vouchers`, `tax_records`, `costing_sheets`

###### Dependencies
- **May Import**: `core`

###### Domain Events
- **Publishes**: `JournalEntryPosted`, `PeriodClosed`
- **Consumes**: `GrnPosted`, `InvoiceIssued`, `DispatchPosted`, `ProductionCompleted`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/finance`)

##### Domain: finance

Pure business rules for finance. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/finance`)

##### Module: FINANCE (API)

###### Metadata
- **Owner**: finance-team
- **Scope**: Chart of accounts, general ledger vouchers, AR/AP aging, GST tax workbench, product costing
- **Database Schema Prefix**: `fin_`
- **Tables**: `accounts`, `journal_entries`, `ar_invoices`, `ap_vouchers`, `tax_records`, `costing_sheets`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `JournalEntryPosted`, `PeriodClosed`
- **Consumes**: `GrnPosted`, `InvoiceIssued`, `DispatchPosted`, `ProductionCompleted`

---

## hr

**Frontend module** (`frontend/apps/web/src/modules/hr`)

##### Module: HR (Web)

###### Metadata
- **Owner**: hr-team
- **Scope**: Employee directory, shift rosters, skill matrices, attendance, and payroll slips
- **Database Schema Prefix**: `hrm_`
- **Tables**: `employees`, `shift_rosters`, `skill_certifications`, `payroll_runs`, `attendance_records`

###### Dependencies
- **May Import**: `core`

###### Domain Events
- **Publishes**: `OperatorShiftAssigned`, `PayrollProcessed`
- **Consumes**: None

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/hr`)

##### Domain: hr

Pure business rules for hr. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/hr`)

##### Module: HR (API)

###### Metadata
- **Owner**: hr-team
- **Scope**: Employee directory, shift rosters, skill matrices, attendance, and payroll slips
- **Database Schema Prefix**: `hrm_`
- **Tables**: `employees`, `shift_rosters`, `skill_certifications`, `payroll_runs`, `attendance_records`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `OperatorShiftAssigned`, `PayrollProcessed`
- **Consumes**: None

---

## identity

**Frontend module** (`frontend/apps/web/src/modules/identity`)

##### Module: IDENTITY (Web)

###### Metadata
- **Owner**: security-team
- **Scope**: User authentication, profile management, RBAC authorization, and tenant isolation
- **Database Schema Prefix**: `idn_`
- **Tables**: `user`, `session`, `account`, `verification`, `tenants`, `plants`, `roles`, `user_profiles`, `plant_user`, `user_preferences`

###### Dependencies
- **May Import**: `core`

###### Domain Events
- **Publishes**: `UserCreated`, `UserRoleChanged`, `SessionTerminated`
- **Consumes**: None

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/identity`)

##### Domain: identity

Pure business rules for identity. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/identity`)

##### Module: IDENTITY (API)

###### Metadata
- **Owner**: security-team
- **Scope**: User authentication, profile management, RBAC authorization, and tenant isolation
- **Database Schema Prefix**: `idn_`
- **Tables**: `user`, `session`, `account`, `verification`, `tenants`, `plants`, `roles`, `user_profiles`, `plant_user`, `user_preferences`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `UserCreated`, `UserRoleChanged`, `SessionTerminated`
- **Consumes**: None

---

## integrations

**Frontend module** (`frontend/apps/web/src/modules/integrations`)

##### Module: INTEGRATIONS (Web)

###### Metadata
- **Owner**: platform-team
- **Scope**: Government NIC e-way bill & e-invoice gateway, WhatsApp/email alerts, webhook dispatchers
- **Database Schema Prefix**: `int_`
- **Tables**: `integration_logs`, `webhook_endpoints`, `api_tokens`

###### Dependencies
- **May Import**: `core`

###### Domain Events
- **Publishes**: `EwbDispatched`, `WebhookDelivered`
- **Consumes**: `InvoiceIssued`, `DispatchPosted`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/integrations`)

##### Domain: integrations

Pure business rules for integrations. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/integrations`)

##### Module: INTEGRATIONS (API)

###### Metadata
- **Owner**: platform-team
- **Scope**: Government NIC e-way bill & e-invoice gateway, WhatsApp/email alerts, webhook dispatchers
- **Database Schema Prefix**: `int_`
- **Tables**: `integration_logs`, `webhook_endpoints`, `api_tokens`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `EwbDispatched`, `WebhookDelivered`
- **Consumes**: `InvoiceIssued`, `DispatchPosted`

---

## maintenance

**Frontend module** (`frontend/apps/web/src/modules/maintenance`)

##### Module: MAINTENANCE (Web)

###### Metadata
- **Owner**: engineering-team
- **Scope**: Machine health telemetry, mold tooling preventive maintenance, utility MEP work orders
- **Database Schema Prefix**: `mep_`
- **Tables**: `maintenance_work_orders`, `equipment_assets`, `meter_readings`, `spare_inventory`

###### Dependencies
- **May Import**: `core`, `manufacturing`, `warehouse`

###### Domain Events
- **Publishes**: `MachineMaintenanceScheduled`, `BreakdownResolved`
- **Consumes**: `MachineDowntimeLogged`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/maintenance`)

##### Domain: maintenance

Pure business rules for maintenance. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/maintenance`)

##### Module: MAINTENANCE (API)

###### Metadata
- **Owner**: engineering-team
- **Scope**: Machine health telemetry, mold tooling preventive maintenance, utility MEP work orders
- **Database Schema Prefix**: `mep_`
- **Tables**: `maintenance_work_orders`, `equipment_assets`, `meter_readings`, `spare_inventory`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `MachineMaintenanceScheduled`, `BreakdownResolved`
- **Consumes**: `MachineDowntimeLogged`

---

## manufacturing

**Frontend module** (`frontend/apps/web/src/modules/manufacturing`)

##### Module: MANUFACTURING (Web)

###### Metadata
- **Owner**: production-team
- **Scope**: Work orders, planning board, daily production log, shopfloor kiosk, regrind recycling, machine status
- **Database Schema Prefix**: `mfg_`
- **Tables**: `work_orders`, `daily_production_entries`, `machines`, `regrind_entries`, `scrap_records`

###### Dependencies
- **May Import**: `core`, `engineering`, `warehouse`, `hr`

###### Domain Events
- **Publishes**: `ProductionCompleted`, `ScrapReported`, `MachineDowntimeLogged`
- **Consumes**: `BomVersionApproved`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/manufacturing`)

##### Domain: manufacturing

Pure business rules for manufacturing. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/manufacturing`)

##### Module: MANUFACTURING (API)

###### Metadata
- **Owner**: production-team
- **Scope**: Work orders, planning board, daily production log, shopfloor kiosk, regrind recycling, machine status
- **Database Schema Prefix**: `mfg_`
- **Tables**: `work_orders`, `daily_production_entries`, `machines`, `regrind_entries`, `scrap_records`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `ProductionCompleted`, `ScrapReported`, `MachineDowntimeLogged`
- **Consumes**: `BomVersionApproved`

---

## masterdata

**Frontend module** (`frontend/apps/web/src/modules/masterdata`)

##### Module: MASTERDATA (Web)

###### Metadata
- **Owner**: engineering-team
- **Scope**: Item Master catalog, mold/tooling directory, warehouse/bin master, and catalog governance
- **Database Schema Prefix**: `mdm_`
- **Tables**: `items`, `mold_tools`, `warehouses`, `plants`

###### Dependencies
- **May Import**: `core`

###### Domain Events
- **Publishes**: `ItemCreated`, `ItemUpdated`, `ItemStatusChanged`
- **Consumes**: None

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/masterdata`)

##### Domain: masterdata

Pure business rules for masterdata. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/masterdata`)

##### Module: MASTERDATA (API)

###### Metadata
- **Owner**: engineering-team
- **Scope**: Item Master catalog, mold/tooling directory, warehouse/bin master, and catalog governance
- **Database Schema Prefix**: `mdm_`
- **Tables**: `items`, `mold_tools`, `warehouses`, `plants`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `ItemCreated`, `ItemUpdated`, `ItemStatusChanged`
- **Consumes**: None

---

## planning

**Frontend module** (`frontend/apps/web/src/modules/planning`)

##### Module: PLANNING (Web)

###### Metadata
- **Owner**: planning-team
- **Scope**: MRP requirements planning, JIT production scheduling, capacity load calculations
- **Database Schema Prefix**: `scm_`
- **Tables**: `mrp_runs`, `planned_orders`, `jit_schedules`, `capacity_plans`

###### Dependencies
- **May Import**: `core`, `engineering`, `sales`, `procurement`, `warehouse`, `manufacturing`

###### Domain Events
- **Publishes**: `MrpPlannedOrdersGenerated`, `JitSchedulePublished`
- **Consumes**: `SalesOrderConfirmed`, `ItemCreated`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/planning`)

##### Domain: planning

Pure business rules for planning. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/planning`)

##### Module: PLANNING (API)

###### Metadata
- **Owner**: planning-team
- **Scope**: MRP requirements planning, JIT production scheduling, capacity load calculations
- **Database Schema Prefix**: `scm_`
- **Tables**: `mrp_runs`, `planned_orders`, `jit_schedules`, `capacity_plans`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `MrpPlannedOrdersGenerated`, `JitSchedulePublished`
- **Consumes**: `SalesOrderConfirmed`, `ItemCreated`

---

## procurement

**Frontend module** (`frontend/apps/web/src/modules/procurement`)

##### Module: PROCUREMENT (Web)

###### Metadata
- **Owner**: procurement-team
- **Scope**: Suppliers, Purchase Requisitions, POs, Vendor Pricing, 3-Way Match, and Goods Receipt (GRN)
- **Database Schema Prefix**: `prc_`
- **Tables**: `suppliers`, `purchase_orders`, `purchase_requisitions`, `goods_receipt_notes`, `rfqs`

###### Dependencies
- **May Import**: `core`, `masterdata`, `warehouse`

###### Domain Events
- **Publishes**: `GrnPosted`, `PoApproved`, `PoClosed`
- **Consumes**: `StockShortageDetected`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/procurement`)

##### Domain: procurement

Pure business rules for procurement. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/procurement`)

##### Module: PROCUREMENT (API)

###### Metadata
- **Owner**: procurement-team
- **Scope**: Suppliers, Purchase Requisitions, POs, Vendor Pricing, 3-Way Match, and Goods Receipt (GRN)
- **Database Schema Prefix**: `prc_`
- **Tables**: `suppliers`, `purchase_orders`, `purchase_requisitions`, `goods_receipt_notes`, `rfqs`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `GrnPosted`, `PoApproved`, `PoClosed`
- **Consumes**: `StockShortageDetected`

---

## quality

**Frontend module** (`frontend/apps/web/src/modules/quality`)

##### Module: QUALITY (Web)

###### Metadata
- **Owner**: quality-team
- **Scope**: QC inspections, NCR non-conformance, CAPA 8D resolution, COA certificates, and SPC telemetry
- **Database Schema Prefix**: `qua_`
- **Tables**: `inspection_lots`, `ncrs`, `capas`, `coas`, `spc_subgroups`

###### Dependencies
- **May Import**: `core`, `warehouse`

###### Domain Events
- **Publishes**: `LotReleased`, `LotRejected`, `NcrRaised`, `CapaClosed`
- **Consumes**: `GrnPosted`, `ProductionCompleted`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/quality`)

##### Domain: quality

Pure business rules for quality. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/quality`)

##### Module: QUALITY (API)

###### Metadata
- **Owner**: quality-team
- **Scope**: QC inspections, NCR non-conformance, CAPA 8D resolution, COA certificates, and SPC telemetry
- **Database Schema Prefix**: `qua_`
- **Tables**: `inspection_lots`, `ncrs`, `capas`, `coas`, `spc_subgroups`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `LotReleased`, `LotRejected`, `NcrRaised`, `CapaClosed`
- **Consumes**: `GrnPosted`, `ProductionCompleted`

---

## sales

**Frontend module** (`frontend/apps/web/src/modules/sales`)

##### Module: SALES (Web)

###### Metadata
- **Owner**: sales-team
- **Scope**: Customer directory, Sales Orders, Quotations, Delivery Challans, and E-Way Bill transit
- **Database Schema Prefix**: `sal_`
- **Tables**: `customers`, `sales_orders`, `quotations`, `delivery_challans`, `e_invoices`, `e_way_bills`

###### Dependencies
- **May Import**: `core`, `masterdata`, `warehouse`, `integrations`

###### Domain Events
- **Publishes**: `SalesOrderConfirmed`, `DispatchPosted`, `InvoiceIssued`
- **Consumes**: `ProductionCompleted`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/sales`)

##### Domain: sales

Pure business rules for sales. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/sales`)

##### Module: SALES (API)

###### Metadata
- **Owner**: sales-team
- **Scope**: Customer directory, Sales Orders, Quotations, Delivery Challans, and E-Way Bill transit
- **Database Schema Prefix**: `sal_`
- **Tables**: `customers`, `sales_orders`, `quotations`, `delivery_challans`, `e_invoices`, `e_way_bills`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `SalesOrderConfirmed`, `DispatchPosted`, `InvoiceIssued`
- **Consumes**: `ProductionCompleted`

---

## warehouse

**Frontend module** (`frontend/apps/web/src/modules/warehouse`)

##### Module: WAREHOUSE (Web)

###### Metadata
- **Owner**: supply-chain-team
- **Scope**: Inventory stock ledger, 2D bin maps, putaway, pick/pack fulfillment, stock transfers, and batch tracking
- **Database Schema Prefix**: `whs_`
- **Tables**: `stock_ledger`, `stock_transfers`, `bin_locations`, `inventory_batches`, `cycle_counts`

###### Dependencies
- **May Import**: `core`, `masterdata`

###### Domain Events
- **Publishes**: `StockTransferred`, `LotHeld`, `LotReleased`, `StockShortageDetected`
- **Consumes**: `GrnPosted`, `ProductionCompleted`, `DispatchPosted`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/warehouse`)

##### Domain: warehouse

Pure business rules for warehouse. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/warehouse`)

##### Module: WAREHOUSE (API)

###### Metadata
- **Owner**: supply-chain-team
- **Scope**: Inventory stock ledger, 2D bin maps, putaway, pick/pack fulfillment, stock transfers, and batch tracking
- **Database Schema Prefix**: `whs_`
- **Tables**: `stock_ledger`, `stock_transfers`, `bin_locations`, `inventory_batches`, `cycle_counts`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `StockTransferred`, `LotHeld`, `LotReleased`, `StockShortageDetected`
- **Consumes**: `GrnPosted`, `ProductionCompleted`, `DispatchPosted`

---

## workspace

**Frontend module** (`frontend/apps/web/src/modules/workspace`)

##### Module: WORKSPACE (Web)

###### Metadata
- **Owner**: platform-team
- **Scope**: Workspace home, universal task aggregator, approvals hub, notifications drawer, saved views
- **Database Schema Prefix**: `wsh_`
- **Tables**: `user_tasks`, `approvals_queue`, `user_notifications`, `saved_presets`

###### Dependencies
- **May Import**: `core`, `identity`, `masterdata`, `engineering`, `procurement`, `warehouse`, `sales`, `manufacturing`, `quality`, `planning`, `finance`, `maintenance`, `hr`, `crm`, `analytics`, `integrations`

###### Domain Events
- **Publishes**: `ApprovalDecided`, `TaskCompleted`
- **Consumes**: `PoApproved`, `BomVersionApproved`, `NcrRaised`

###### Public API Checklist (`index.ts`)
Only exports required by other allowed modules or the composition root (`app/`) are exposed here.

**Domain package** (`frontend/packages/domain/workspace`)

##### Domain: workspace

Pure business rules for workspace. Golden tests in __tests__/.

**API module** (`apps/api/src/modules/workspace`)

##### Module: WORKSPACE (API)

###### Metadata
- **Owner**: platform-team
- **Scope**: Workspace home, universal task aggregator, approvals hub, notifications drawer, saved views
- **Database Schema Prefix**: `wsh_`
- **Tables**: `user_tasks`, `approvals_queue`, `user_notifications`, `saved_presets`

###### Interfaces & Ports (`ports.ts`)
- Ports required by this module from other domains.
- Exposed services implemented by this module.

###### Domain Events (`events.ts`)
- **Publishes**: `ApprovalDecided`, `TaskCompleted`
- **Consumes**: `PoApproved`, `BomVersionApproved`, `NcrRaised`
