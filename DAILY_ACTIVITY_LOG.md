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

### 16. Modular Monolith: Workspace Module Migration (Home, Tasks, Approvals & Saved Views)
- **Workspace Module Extraction**: Migrated Workspace Home Command Center, Universal Task Aggregator, Multi-Domain Approvals Queue, System & Plant Notifications, Saved View Presets, and Recent Records Navigation into `apps/web/src/modules/workspace/`.
- **Contracts**: Established strict Zod schemas in `packages/contracts/workspace.ts` (`TaskSchema`, `CreateTaskInputSchema`, `UpdateTaskInputSchema`, `ApprovalSchema`, `CreateApprovalInputSchema`, `UpdateApprovalInputSchema`, `NotificationSchema`, `SavedPresetSchema`).
- **Backend API Modular Slice**: Created `apps/api/src/modules/workspace/` (`events.ts`, `ports.ts`, `schema.ts`, `repo.ts`, `service.ts`, `router.ts`, `index.ts`).
- **Verification**:
  - `vitest run apps/web/src/modules/workspace/__tests__/workspace.spec.ts` — 6/6 tests passed (100% green).
  - All module tests (88/88 tests across all 16 modules) passed.
  - `npm run test:unit` (`vitest run tests/characterization`) — 5/5 passed.
  - `npm run check:boundaries` (`depcruise src --config .dependency-cruiser.cjs`) — 0 violations found (1083 modules cruised).
  - `npm run check:circular` (`madge --circular src`) — 0 circular dependencies found (1013 files cruised).
  - Clean commit: `refactor(workspace): move into modules/workspace`.

---

### 17. Plop Module Generator (`gen:module` & `gen:resource`) & Shared Resource Primitives
- **Core Primitives Promoted**:
  - `src/shared/api/http.ts`: Unified HTTP client and typed `ApiError` (`{ status, code, message, details, requestId }`) with `credentials: 'include'` and `Cache-Control: no-store`.
  - `src/shared/api/resource.ts`: Declarative resource factory pair `createResourceApi` and `createResourceHooks` (TanStack Query v5 queries/mutations with direct cache hydration).
  - `apps/api/src/core/crud.ts`: Standard resource controller `createResourceRouter` implementing list (paginated, sorted, tenant-scoped, search-escaped), get, create (withTx + audit_logs), patch (OCC version check `WHERE version = $n`), delete (soft-delete), and history endpoints.
  - `apps/api/src/core/ability.ts` & `auth-server/src/ability.ts`: Extensible CASL Subject type registration.
- **Plop Generator Suite**:
  - `plopfile.mjs` and complete template tree under `generators/templates/`.
  - `npm run gen:module -- <name> <Subject>`: Produces contract schemas, DDL migration with RLS & app role grant, backend slice (`router.ts`, `service.ts`, `repo.ts`, `ports.ts`, `events.ts`), domain invariants + golden tests, web module slice (`ListView`, `Form`, `routes`, `api`, `types`, `__tests__`), E2E test suite, docs, and auto-registration in `docs/module-map.json`.
  - `npm run gen:resource -- <module> <name>`: Adds child table DDL and router to an existing module.
- **Verification & Acceptance Milestones**:
  - Generated throwaway module `"demo"`: 100% green tests (6/6 passed), verified schema invariants, then cleanly deleted.
  - Generated Module 02's first child resource (`engineering` / `bom_item`): 70 lines generated across DDL (`20261013114124_engineering_bom_item.sql`) and API router (`bom_itemRouter.ts`).
  - Unit tests: 17 test suites, 92/92 passed.
  - Characterization tests: 5/5 passed.
  - Vite local development server: running live on `http://localhost:3000/`.

---

### 18. Empty Screen Fix, Server Orchestration, Monorepo Dependencies & License CI Verification
- **Empty Screen Diagnosis & Resolution**:
  - Root Cause: Vite dev server (`:3000`) was running while backend `auth-server` (`:4000`) was offline. Unhandled network rejections in `useMe()` during app bootstrapping caused React rendering to fail silently.
  - Resolution: Updated `useMe()` in `src/features/identity/useIdentity.ts` and `apps/web/src/modules/identity/api/useIdentity.ts` with error-swallowing fallback returning `null` user. When unauthenticated or during initial boot, guest users seamlessly transition to `LoginScreen`.
  - Orchestration: Started `auth-server` on port 4000 alongside Vite on port 3000. Verified proxy health at `/api/auth/ok` (200 OK) and `/api/v1/me` (401 Unauthorized -> Login View).
- **Workspace Dependencies (Install Commands #0 to #4)**:
  - Phase #0 (Workspaces): Configured `"workspaces": ["apps/*"]` in root `package.json`. Initialized `@apps/api` and `@apps/web` manifests.
  - Phase #1 (API): Installed `@hono/zod-openapi`, `@hono/zod-validator`, `kysely`, `pg-boss`, `decimal.js`, `date-fns`, `jose`, `aws4fetch`, `fast-xml-parser`, `p-retry`, `croner`, and devDependency `kysely-codegen` in `apps/api`.
  - Phase #2 (Web): Installed `@tanstack/react-table`, `nuqs`, `sonner`, `cmdk`, `react-day-picker`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@xyflow/react`, `dagre`, `i18next`, `react-i18next`, `date-fns`, `decimal.js`, `react-dropzone`, `papaparse`, `react-to-print`, `pdfmake`, `@react-pdf/renderer`, `react-pdf`, `jsbarcode`, `qrcode`, `@zxing/browser`, `react-datasheet-grid`, `react-signature-canvas`, `react-big-calendar`, `frappe-gantt`, `xstate`, `@casl/react`, `openapi-fetch`, `idb-keyval`, `microdiff`, `react-organizational-chart`, `to-words`, and devDependency `openapi-typescript` in `apps/web`.
  - Phase #3 (Tooling): Installed root devDependencies (`vitest`, `@testing-library/*`, `msw`, `@faker-js/faker`, `testcontainers`, `autocannon`, `@axe-core/playwright`, `eslint`, `prettier`, `husky`, `lint-staged`, `knip`, `madge`, `depcheck`, `dependency-cruiser`, `eslint-plugin-boundaries`, `ts-morph`, `size-limit`, `plop`, `license-checker-rseidelsohn`, `dbmate`).
  - Phase #4 (Pruning): Verified `axios`, `express`, `dotenv`, `@types/express` are not imported by `apps/web`.
  - Missing Dependency Fix: Installed `react-is` required by `recharts`.
- **License Check Verification in CI**:
  - Production Allow-List (`npm run check:licenses`): Verified all production dependencies against MIT, ISC, BSD, Apache, 0BSD, BlueOak, OFL-1.1 (Geist font), CC-BY-4.0 (caniuse-lite), and MPL-2.0 (lightningcss). Passed with exit code 0.
  - Dev Allow-List (`npm run check:licenses:dev`): Verified all development dependencies against allow-list including CC-BY-3.0 and Zlib. Passed with exit code 0.
- **Production Build & Verification**:
  - Production build (`vite build`): Succeeded cleanly in 1m 29s.
  - Unit & Characterization Tests: 5/5 characterization test suites passed, 16/16 module test suites passed (88/88 tests).

---

## [2026-10-14] - Complete Removal of Legacy Backend & Middleware & Unified Gateway Alignment

### 1. Scope of Work
- **Execution of Removal Step 3**: Following read-only impact assessment (`docs/removal-report.md`) and salvage cataloging (`docs/removed-code.md`) anchored to git archive tag `archive/backend-middleware-2026-10`, permanently removed legacy NestJS `backend/` and `middleware/` directories.
- **CI/CD Pipeline Decoupling**:
  - Removed `backend-build` job and detached build dependency from `sync-database` in `.github/workflows/ci-cd.yml`.
  - Removed `backend-check` job from `infrastructure/github/workflows/ci.yml`.
- **Infrastructure & Container Repointing**:
  - Pointed Kong reverse proxy upstream to `http://auth-server:4000/` in `containers/kong.yml`.
  - Pruned unused `redis` and `backend` services and `redis_data` volume from `infra/optional/docker-compose.yml`.
  - Repointed AI sidecar network and `API_GATEWAY_URL` in `infra/optional/docker-compose.ai.yml` to `http://auth-server:4000/api/v1/ai-gateway`.
  - Pointed NGINX reverse proxy upstream to `127.0.0.1:4000` in `infrastructure/nginx/sp-plastech.conf`.
  - Updated Cloudflare Functions proxy (`functions/api/[[path]].ts`), Cloudflare worker (`infrastructure/cloudflare/worker.js`), and n8n webhook workflow (`infrastructure/n8n/error_trigger_workflow.json`) to target port 4000.
- **Frontend & Environment Alignment**:
  - Updated Vite proxy in `vite.config.ts` with direct fallback to port 4000 and offline message.
  - Cleaned `.env` to point `BACKEND_URL=http://localhost:4000` and purged `MIDDLEWARE_URL`.
  - Updated codebase comments across database adapters (`src/shared/db/`), security services (`MfaService.ts`, `GdprService.ts`), and AI API (`aiApi.ts`).
  - Modernized documentation in `README.md`, `MIGRATION_PLAN_16_MODULES.md`, and `docs/ARCHITECTURE_RUNBOOK.md`.

### 2. Modules & Files Touched
- Deleted: `backend/` (all files), `middleware/` (all files).
- Modified:
  - `containers/kong.yml`
  - `infra/optional/docker-compose.yml`
  - `infra/optional/docker-compose.ai.yml`
  - `.github/workflows/ci-cd.yml`
  - `infrastructure/github/workflows/ci.yml`
  - `vite.config.ts`
  - `.env`
  - `functions/api/[[path]].ts`
  - `infrastructure/cloudflare/worker.js`
  - `infrastructure/nginx/sp-plastech.conf`
  - `infrastructure/openwebui/secure_erp_functions.py`
  - `infrastructure/n8n/error_trigger_workflow.json`
  - `src/shared/db/index.ts` & `src/shared/db/types.ts`
  - `src/security/auth/MfaService.ts` & `src/security/compliance/GdprService.ts`
  - `src/features/ai/api/aiApi.ts`
  - `MIGRATION_PLAN_16_MODULES.md`
  - `README.md`
  - `docs/ARCHITECTURE_RUNBOOK.md`
  - `docs/removal-report.md`
  - `DAILY_ACTIVITY_LOG.md`

### 3. Verification & Results
- Characterization Tests: 5/5 test suites passed (100% green).
- Monorepo Module Tests: 16/16 test suites passed (88/88 tests).
- Clean Git staging on branch `chore/remove-backend-middleware`.

---

## 20. 2026-10-14 — REPOSITORY REORGANIZATION: FRONTEND MIGRATION & MIDDLEWARE UNIFICATION

### 1. Architectural Reorganization
- **Frontend Consolidation (`frontend/`)**:
  - Migrated all frontend-related code into a unified `frontend/` directory:
    - `src/` (Core application shell, layout, router, services, data fixtures, security).
    - `apps/web/` (All 16 domain feature modules in their full modular monolithic structure).
    - `packages/` (Domain contracts and logic).
    - `components/` & `lib/` (UI design system primitives and utility libraries).
    - `tests/` (Vitest characterization tests and golden regression snapshots).
    - `index.html`, `vite.config.ts`, `components.json`, `tsconfig.json`, `package.json`.
  - Preserved internal modular monolithic folder structure without altering domain business calculations or logic.
- **Middleware Unification (`middleware/`)**:
  - Renamed `auth-server/` to `middleware/`, establishing it as the single, authoritative API gateway and auth middleware service on port 4000.
  - Updated `middleware/package.json` (`sp-plastech-middleware`) and server logging.
  - Updated infrastructure orchestration in `compose.yaml` (contexts and volumes) and `playwright.config.ts`.
- **Root Workspace & Script Delegation**:
  - Root `package.json` updated with workspaces `["frontend", "middleware", "frontend/apps/*"]`.
  - Configured top-level delegation scripts:
    - `"dev"`: Runs Vite dev server in `frontend` on port 3000.
    - `"dev:frontend"`: Starts frontend Vite server (`:3000`).
    - `"dev:middleware"`: Starts middleware Hono server (`:4000`).
    - `"build"`: Compiles production frontend bundle.
    - `"lint"`: Typechecks frontend TypeScript codebase.
    - `"test:unit"`: Executes 21 test suites across characterization and modules.

### 2. Verification & Validation Gates
- **Type Safety**: `npm run lint` (`tsc --noEmit`) verified 0 errors across all modules.
- **Unit & Characterization Tests**: `npm run test:unit` verified all 21 test suites passed (93/93 tests green).
- **Production Bundle**: `npm run build` compiled cleanly into `frontend/dist/` in 1m 1s.
- **Active Runtime Services**:
  - Middleware daemon running on `http://localhost:4000/` (`/api/auth/ok` -> 200 OK `{"ok":true}`).
  - Frontend dev server running on `http://localhost:3000/` (serving React 19 app with reverse-proxy `/api` to `:4000`).
- **Git Commit**: `refactor(repo): migrate frontend code into frontend/ and auth-server to middleware/`.



