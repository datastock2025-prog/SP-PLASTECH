# SP-PLASTECH ERP — Daily Activity & Evolution Log
> **Rules for this log**:
> 1. This file is **strictly append-only**. Never delete, truncate, or overwrite previous days' entries.
> 2. For each day of work, append a new section titled `## [YYYY-MM-DD] - <Summary Title>` at the end of the file.
> 3. Document all key changes, modules touched, security checks, and verification milestones.

---

## [2026-10-01] - Cloudflare CI/CD Pipeline & Zero-Mock Database-First Enforcement

### 1. Scope of Work
- Setup automated GitHub Actions CI/CD pipeline connecting Supabase PostgreSQL database migrations, Vite production builds, Playwright E2E suites, and Cloudflare Pages deployment.
- Enforced strict Database-First Single Source of Truth architecture across all 16 ERP modules, eliminating mock and seed data fallbacks from production execution paths.
- Addressed cross-browser multi-tab synchronization discrepancies across Brave, Chrome, and other browsers by deploying `UniversalSyncManager` utilizing `BroadcastChannel` and Supabase Realtime CDC.

### 2. Modules & Files Touched
- `.github/workflows/deploy.yml` — Multi-stage CI/CD pipeline.
- `src/services/liveDataStore.ts` & `src/services/adminService.ts` — Synchronous database-first event bus and live state hydration.
- `src/services/realtime/UniversalSyncManager.ts` — Cross-browser multi-tab sync coordinator.
- `src/components/common/Header.tsx` & `src/components/LoginScreen.tsx` — Dynamic live database auth and header indicators.

### 3. Verification & Results
- All unit & type checks passing (`tsc --noEmit`).
- E2E Playwright verification succeeded.
- Clean Git commit and push to `origin/main`.

---

## [2026-10-02] - TanStack React Query (v5) 16-Domain Implementation & UniversalSyncBridge

### 1. Scope of Work
- Architected and implemented complete, native **TanStack React Query (v5)** hook ecosystem across all 16 ERP modules.
- Implemented **Strict API-First Architecture**: Eliminated direct database invocations (`supabase.from`) from UI components; all queries and mutations flow through backend endpoints (`/api/v1/*` via `apiClient`).
- Built and activated **`UniversalSyncBridge`**: Connects `UniversalSyncManager` real-time events to automatic TanStack Query cache invalidations (`queryClient.invalidateQueries`) across all 16 domains.

### 2. Modules & Files Touched
- `src/shared/queryKeys.ts` — Typed query key factories covering 16 domains (`auth`, `dashboard`, `sales`, `engineering`, `planning`, `manufacturing`, `quality`, `procurement`, `warehouse`, `scm`, `mep`, `finance`, `hr`, `masterData`, `analytics`, `admin`).
- `src/services/realtime/UniversalSyncBridge.ts` — Real-time event-to-cache invalidation bridge.
- `src/hooks/` — Complete domain hook suite:
  - `useMasterData.ts`
  - `useSales.ts`
  - `useManufacturing.ts`
  - `useQuality.ts`
  - `useProcurement.ts`
  - `useFinance.ts`
  - `useWarehouse.ts`
  - `usePlanning.ts`
  - `useEngineering.ts`
  - `useScm.ts`
  - `useMep.ts`
  - `useHr.ts`
  - `useDashboard.ts`
  - `useAdmin.ts`
  - `useAnalytics.ts`
  - `index.ts`
- `src/App.tsx` — UniversalSyncBridge lifecycle integration on application mount/unmount.
- `WORKSPACE_MEMORY.md` — Permanent workspace architecture and security protocols.
- `DAILY_ACTIVITY_LOG.md` — Append-only day-wise change tracker.

### 4. Realtime CDC WebSocket & Item Master TanStack Query CRUD Migration
- **Supabase Realtime CDC WebSocket Mesh**: Replaced `UniversalSyncManager` and `UniversalSyncBridge` (BroadcastChannel) with [`src/services/realtime/supabaseRealtime.ts`](file:///c:/Users/charu/Reboot-v1/src/services/realtime/supabaseRealtime.ts) subscribing to `postgres_changes` across all ERP tables.
- **TanStack Query (React Query v5)**: Wired `useSaveItem`, `useDeleteItem`, `useApproveItem`, `useRejectItem`, `useBulkImportItems` across Item Master Catalog and Details view.
- **Zod Validation**: Added runtime schema parsing in `api-client.ts` (`ItemMasterSchema`).
- **Eliminated Static Values & Fallbacks**: Removed hardcoded strings across Item Master tabs to display true database values and clean empty states (`"—"`).
- **Verification**: `tsc --noEmit` 0 errors, `vite build` succeeded, GitHub Actions CI/CD completed with success.

---

## [2026-10-12] - Safe Repository Cleanup, Characterization Testing & Podman Unification

### 1. Scope of Work
- **Phase 0 Safety Net**: Established baseline checks (`docs/cleanup-baseline.md`). Created unmocked connected smoke test spec (`e2e/smoke/connected.spec.ts`).
- **Characterization Testing & Golden Snapshots**: Audited domain calculation files (`docs/business-rules-inventory.md`). Built Vitest suites covering BOM explosion, JIT scheduling, regrind recycling, master data governance, SPC metrics, OEE, inquiry costing, and NIC E-Way Bill valuation (`tests/characterization/*.spec.ts`). Freezed deterministic baseline outputs into `tests/golden/*.json`.
- **Phase 1 FIND Audit**: Executed `madge` (identified 3 circular paths), `depcheck` (identified unused dependencies), `npm audit` (triaged vulnerabilities), DDL indexing checks (identified and corrected missing `plant` column index), and storage registries (`docs/cleanup-report.md`).
- **Phase 2 Batch Deletions**: Safely removed deprecated, unreferenced `dashboardSummaryService.ts` and non-existent `idx_items_plant` index. Verified `tsc --noEmit` (0 errors) and all characterization tests pass (5/5).
- **Phase 3 CONNECT & Podman Unification**: Unified compose topology into `compose.yaml` (PostgreSQL 16, dbmate migrations, Hono API, Vite web). Added `db/migrations/20261012000000_baseline_erp_schema.sql`. Cleaned `.env.example` with zero secret literals. Moved legacy compose files to `infra/optional/`.
- **Phase 6 Documentation**: Updated `ARCHITECTURE.md` topology diagram and appended evolution history.

### 2. Modules & Files Touched
- `tests/characterization/` & `tests/golden/` — Golden test suites and snapshots.
- `e2e/smoke/connected.spec.ts` — Connected smoke lifecycle test.
- `docs/cleanup-baseline.md`, `docs/business-rules-inventory.md`, `docs/cleanup-report.md` — Governance reports.
- `compose.yaml`, `infra/optional/`, `auth-server/Dockerfile.dev`, `db/migrations/` — Podman stack.
- `ARCHITECTURE.md`, `DAILY_ACTIVITY_LOG.md` — Architectural documentation.

### 3. Verification & Results
- `npx tsc --noEmit` — 0 errors (PASS).
- `npm run test:unit` (`vitest run tests/characterization`) — 5 test files, 5 passed (100% green).
- Clean commits per phase: `cleanup/phase-0`, `cleanup/phase-1`, `cleanup/phase-2`, `cleanup/phase-3`, `cleanup/phase-6`.

---

## [2026-10-13] - Modular Monolith: Engineering Module Migration & Agent Tooling

### 1. Scope of Work
- **Engineering Module Extraction**: Migrated multi-level BOMs, BOM Wizard steps (1-9), ECO/ECR views, and process routing operations into isolated vertical slice `apps/web/src/modules/engineering/`.
- **Contracts & Boundaries**: Established strict Zod schemas and contract DTOs in `packages/contracts/engineering.ts` (`BomSchema`, `BomLineSchema`, `CreateBomInputSchema`, `UpdateBomInputSchema`, `EcrSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/engineering/` with domain ports, events, repo, service, and router.
- **Dependency Hygiene**: Replaced broken relative imports with unified `@/src/` path aliases across all engineering components and wizard steps.
- **Backwards Compatibility**: Updated `src/modules/engineering/index.ts` re-export shims so existing callers operate without disruptions.
- **Agent Governance Setup**: Installed Ponytail YAGNI decision ladder ruleset (`.agents/rules/ponytail.md`) and skills (`.agents/skills/`).

### 2. Modules & Files Touched
- `packages/contracts/engineering.ts` — Zod contract definitions and DTOs.
- `apps/api/src/modules/engineering/` — Backend events, ports, repo, schema, service, router.
- `apps/web/src/modules/engineering/` — Complete web module with `api/`, `components/`, `model/`, `routes.tsx`, `screens/`, and `__tests__/`.
- `src/modules/engineering/index.ts` — Root re-export barrel.
- `.agents/rules/ponytail.md` & `.agents/skills/` — Workspace agent rules & skills.

### 3. Verification & Results
- `vitest run apps/web/src/modules/engineering/__tests__/engineering.spec.ts` — 5/5 tests passed (100% green).
- `vitest run apps/web/src/modules/masterdata/__tests__/masterdata.spec.ts` — 3/3 tests passed.
- `npm run test:unit` (`vitest run tests/characterization`) — 5 test suites passed.
- `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found.
- `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found.
- Clean commits: `refactor(engineering): move into modules/engineering` and `chore(agents): add ponytail ruleset and skills`.

### 4. Modular Monolith: Procurement Module Migration
- **Procurement Module Extraction**: Migrated Procurement dashboard, Supplier Master, RFQs, POs, PRs, Returns, Contracts, Price Lists, and all GRN tabs into `apps/web/src/modules/procurement/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/procurement.ts` (`PurchaseOrderSchema`, `PurchaseOrderLineSchema`, `CreatePurchaseOrderInputSchema`, `UpdatePurchaseOrderInputSchema`, `PurchaseRequisitionSchema`, `SupplierMasterSchema`, `GoodsReceiptNoteSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/procurement/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/procurement/__tests__/procurement.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (17/17 tests across engineering, identity, procurement, masterdata) passed.
  - `npm run check:boundaries` — 0 dependency violations (772 modules cruised).
  - `npm run check:circular` — 0 circular dependencies (720 files cruised).
  - Clean commit: `refactor(procurement): move into modules/procurement`.

### 5. Modular Monolith: Warehouse Module Migration
- **Warehouse Module Extraction**: Migrated Warehouse Inventory Dashboard, Stock Ledger, 2D Bin Map, Putaway Management, Pick/Pack Dispatch, Cycle Count Audit, Quarantine Hold, Regrind Scrap Closed Loop, Subcontracting Management, Barcode Scanner, Label Printing, and Stock Transfer Manager into `apps/web/src/modules/warehouse/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/warehouse.ts` (`StockTransferSchema`, `CreateStockTransferInputSchema`, `UpdateStockTransferInputSchema`, `WarehouseLocationSchema`, `InventoryStockItemSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/warehouse/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/warehouse/__tests__/warehouse.spec.ts` — 5/5 tests passed (100% green).
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found.
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found.
  - Clean commit: `refactor(warehouse): move into modules/warehouse`.

### 6. Modular Monolith: Sales Module Migration (incl. Dispatch & Compliance)
- **Sales Module Extraction**: Migrated Sales Orders, Quotations, Customer Master, Pricing Matrix, Delivery Schedules, Credit Control, Billing Status, RMAs, Redesigned Sales Order Dashboard/Wizard/List, Delivery Challans, Gate Pass Verification, E-Way Bill Management, E-Invoice Management, and Compliance Exceptions into `apps/web/src/modules/sales/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/sales.ts` (`SalesOrderSchema`, `SalesOrderLineSchema`, `CreateSalesOrderInputSchema`, `UpdateSalesOrderInputSchema`, `CustomerSchema`, `SalesQuotationSchema`, `DeliveryChallanSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/sales/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Leaks Register**: Created `docs/module-leaks.md` tracking cross-module data import in `SalesOrderWizard.tsx` (`INITIAL_MOLDS` from `data/manufacturingData`) to be retired during manufacturing prompt.
- **Verification**:
  - `vitest run apps/web/src/modules/sales/__tests__/sales.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (28/28 tests across identity, masterdata, engineering, procurement, warehouse, sales) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (848 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (790 files cruised).
  - Clean commit: `refactor(sales): move into modules/sales`.

### 7. Modular Monolith: Manufacturing Module Migration (incl. Shop Floor)
- **Manufacturing Module Extraction**: Migrated Work Orders, Manufacturing Planning Board, Command Center, Daily Production Grid, Material Issuing Workbench, Shop Floor Kiosk, Shop Floor Production Entry, Machine Monitoring Telemetry, Scrap Waste Dashboard, Downtime Tracking, Electronic Batch Records, Batch Genealogy Graph, Mold Tooling Manager, Changeover SMED, OEE Analytics, Quality Gate Inspection, Production Reports, and Regrind Material Entry into `apps/web/src/modules/manufacturing/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/manufacturing.ts` (`WorkOrderSchema`, `CreateWorkOrderInputSchema`, `UpdateWorkOrderInputSchema`, `WorkOrderLogSchema`, `MachineMasterSchema`, `DailyProductionEntrySchema`, `RegrindEntrySchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/manufacturing/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/manufacturing/__tests__/manufacturing.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (34/34 tests across identity, masterdata, engineering, procurement, warehouse, sales, manufacturing) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (899 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (840 files cruised).
  - Clean commit: `refactor(manufacturing): move into modules/manufacturing`.

### 8. Modular Monolith: Quality Module Migration
- **Quality Module Extraction**: Migrated Quality Dashboard, Inspection Plans, Incoming Inspection, Final Inspection, SPC Monitor, NCR Management, CAPA 8D Resolution, Certificate of Analysis (COA), Calibration Equipment, Document Control, and WIP Store QC Inspection into `apps/web/src/modules/quality/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/quality.ts` (`NcrSchema`, `CreateNcrInputSchema`, `UpdateNcrInputSchema`, `CapaSchema`, `CertificateOfAnalysisSchema`, `InspectionPlanSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/quality/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/quality/__tests__/quality.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (40/40 tests across identity, masterdata, engineering, procurement, warehouse, sales, manufacturing, quality) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (917 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (857 files cruised).
  - Clean commit: `refactor(quality): move into modules/quality`.

### 9. Modular Monolith: Planning Module Migration (SCM & Advanced Planning)
- **Planning Module Extraction**: Migrated SCM Control Tower, Demand Planning, Sales Forecast, S&OP Scenarios, Inventory Planning, MRP Runs, Replenishment, Supplier Collaboration, Inbound/Outbound Logistics, Freight & Transport, Track & Trace, Supplier Risk, Inventory Aging, Order Timelines, Exceptions, Sustainability, Reports, and RBAC into `apps/web/src/modules/planning/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/planning.ts` (`PlannedOrderSchema`, `CreatePlannedOrderInputSchema`, `UpdatePlannedOrderInputSchema`, `MrpRunSchema`, `JitScheduleSchema`, `ShipmentTrackingSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/planning/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/planning/__tests__/planning.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (46/46 tests across identity, masterdata, engineering, procurement, warehouse, sales, manufacturing, quality, planning) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (945 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (884 files cruised).
  - Clean commit: `refactor(planning): move into modules/planning`.

### 10. Modular Monolith: Finance Module Migration (incl. Ledger)
- **Finance Module Extraction**: Migrated Chart of Accounts, General Ledger, Unified Ledger Workspace, Journal Entries, Accounts Payable, Accounts Receivable, Cost Center Accounting, Fixed Assets, Bank Reconciliation, and Financial Reports into `apps/web/src/modules/finance/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/finance.ts` (`AccountSchema`, `CreateAccountInputSchema`, `UpdateAccountInputSchema`, `JournalEntrySchema`, `CreateJournalEntryInputSchema`, `CostCenterSchema`, `FixedAssetSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/finance/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/finance/__tests__/finance.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (52/52 tests across 10 modules) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (981 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (919 files cruised).
  - Clean commit: `refactor(finance): move into modules/finance`.

### 11. Modular Monolith: Maintenance Module Migration (mep & Facilities)
- **Maintenance Module Extraction**: Migrated MEP Operations Dashboard, Mechanical Utilities (Chillers, Compressors, Cooling Towers), Electrical Systems (HT/LT panels, Transformers, DG sets, Busduct), Plumbing & Water (Water Treatment, RO, ETP, STP), HVAC & Cleanroom Zones (ISO Class 7/8 AHUs), and Maintenance Work Orders (MWOs) into `apps/web/src/modules/maintenance/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/maintenance.ts` (`MaintenanceWorkOrderSchema`, `CreateMaintenanceWorkOrderInputSchema`, `UpdateMaintenanceWorkOrderInputSchema`, `EquipmentAssetSchema`, `MeterReadingSchema`, `MepAlarmSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/maintenance/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/maintenance/__tests__/maintenance.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (58/58 tests across 11 modules) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (995 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (932 files cruised).
  - Clean commit: `refactor(maintenance): move into modules/maintenance`.

### 12. Modular Monolith: HR Module Migration
- **HR Module Extraction**: Migrated HR Command Center, Org Structure, Employee Directory & Profiles, Employee Onboarding/Offboarding, Attendance Logging, Shift Rostering & Rotation, Leave & Overtime Requests, Skills Matrix & Training Programs, Safety Incidents & PPE Inventory, Payroll Input Sheets, Compliance & Contract Agencies, and HR Analytics into `apps/web/src/modules/hr/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/hr.ts` (`EmployeeSchema`, `CreateEmployeeInputSchema`, `UpdateEmployeeInputSchema`, `AttendanceRecordSchema`, `ShiftRosterSchema`, `PayrollRunSchema`, `SkillCertificationSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/hr/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/hr/__tests__/hr.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (64/64 tests across 12 modules) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (1015 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (951 files cruised).
  - Clean commit: `refactor(hr): move into modules/hr`.

### 13. Modular Monolith: CRM Module Migration
- **CRM Module Extraction**: Migrated CRM Command Center, Lead Lifecycle & Detail Views, Opportunity Pipeline (Kanban & Table), Account List & Customer 360, Contact Directory, Activity Management, RFQ Inquiry Costing & Pricing Models, Quotation Management, Sample Requests & Testing Approvals, Customer Complaints (CAPA/NCR linkage), Document Center, Customer RFM Segmentation, and Pipeline Analytics into `apps/web/src/modules/crm/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/crm.ts` (`LeadSchema`, `CreateLeadInputSchema`, `UpdateLeadInputSchema`, `OpportunitySchema`, `CreateOpportunityInputSchema`, `UpdateOpportunityInputSchema`, `CustomerInquirySchema`, `ComplaintSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/crm/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/crm/__tests__/crm.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (70/70 tests across 13 modules) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (1038 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (973 files cruised).
  - Clean commit: `refactor(crm): move into modules/crm`.

### 14. Modular Monolith: Analytics Module Migration (incl. AI & Document Intelligence)
- **Analytics Module Extraction**: Migrated Executive KPI Dashboards, Plant OEE & Loss Pareto Analysis, Quality & Defect PPM Metrics, Inventory Aging & SLOB Analytics, SCM OTIF Performance, ESG Carbon & Sustainability Metrics, Maintenance MTBF & MTTR Dashboards, Custom Document Builder, AI Query Assistant Modal & Renderer, Fixed Bottom Chat Assistant, and Domain RBAC Controls into `apps/web/src/modules/analytics/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/analytics.ts` (`ExecutiveKpiSchema`, `CreateExecutiveKpiInputSchema`, `UpdateExecutiveKpiInputSchema`, `OeeRecordSchema`, `SavedReportSchema`, `ChatMessageSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/analytics/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/analytics/__tests__/analytics.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (76/76 tests across 14 modules) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (1062 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (995 files cruised).
  - Clean commit: `refactor(analytics): move into modules/analytics`.

### 15. Modular Monolith: Integrations Module Migration (Webhooks, API Tokens & External Services)
- **Integrations Module Extraction**: Migrated Government NIC E-Way Bill & E-Invoice connectors, Real-time Webhook Dispatchers, API Token Management, Integration Event Audit Logs, and External Connector Configuration into `apps/web/src/modules/integrations/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/integrations.ts` (`WebhookEndpointSchema`, `CreateWebhookEndpointInputSchema`, `UpdateWebhookEndpointInputSchema`, `ApiTokenSchema`, `IntegrationLogSchema`, `IntegrationConnectorSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/integrations/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/integrations/__tests__/integrations.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (82/82 tests across 15 modules) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (1072 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (1004 files cruised).
  - Clean commit: `refactor(integrations): move into modules/integrations`.

