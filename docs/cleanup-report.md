# SP-PLASTECH ERP — Repository Cleanup Report (Phase 1: FIND)

**Execution Date**: 2026-10-12  
**Branch**: `cleanup/phase-1`  
**Mode**: Read-Only Audit & Classification  

---

## 1. Executive Summary

This report provides the complete, empirical findings of the repository-wide audit conducted per Phase 1 instructions. Every item is classified into:
- **`DELETE`**: Proven completely unused (0 imports, 0 callers, verified by AST and text search).
- **`MIGRATE`**: Live in runtime, but relies on mock data, direct storage, or provider bindings; preserved for module-specific prompts.
- **`KEEP`**: Actively required in current production architecture.
- **`ASK`**: Ambiguous or design-decision items requiring user confirmation before modification.

---

## 2. Tool Audit Results

### 2.1 Circular Dependencies (`madge --circular --extensions ts,tsx src`)
Processed 594 files. Found **3 circular dependencies**:

| # | Cycle Path | Impact | Classification |
|---|---|---|---|
| 1 | `types.ts` > `types/procurement.ts` | Type cycle in root declarations | **MIGRATE** (Resolve in `packages/contracts`) |
| 2 | `shared/db/index.ts` > `shared/db/adapters/RestApiAdapter.ts` > `shared/api/client.ts` > `services/api.ts` | Adapter/client cycle | **MIGRATE** (Resolve in Phase 3 CONNECT) |
| 3 | `services/adminService.ts` > `services/masterDataGovernanceService.ts` | Bi-directional service event bus | **MIGRATE** (Decouple in admin module prompt) |

---

### 2.2 Unused Dependencies (`depcheck`)

| Package | Category | Finding | Classification |
|---|---|---|---|
| `@fontsource-variable/geist` | dependencies | Font variable not referenced in styles | **ASK** |
| `@google/genai` | dependencies | Not imported in frontend UI | **KEEP** (For AI sidecars / worker) |
| `@hookform/resolvers` | dependencies | 0 importers | **DELETE** |
| `express` | dependencies | Frontend bundle does not use Express | **DELETE** |
| `motion` | dependencies | 0 importers in frontend components | **DELETE** |
| `react-hook-form` | dependencies | 0 importers (custom state forms used) | **DELETE** |
| `shadcn` | dependencies | CLI tooling only, triggers high-risk CVEs | **DELETE** |
| `tw-animate-css` | dependencies | 0 importers | **DELETE** |
| `@types/express` | devDependencies | 0 importers | **DELETE** |
| `@types/pg` | devDependencies | Frontend does not invoke pg directly | **DELETE** |
| `autoprefixer` | devDependencies | Managed by Tailwind v4 Vite plugin | **DELETE** |
| `esbuild` | devDependencies | Bundled with Vite internally | **DELETE** |
| `tailwindcss` | devDependencies | `@tailwindcss/vite` is used | **KEEP** (required by Vite plugin) |

---

### 2.3 Security Vulnerabilities (`npm audit`)
- **10 vulnerabilities** (1 low, 9 high):
  1. **`xlsx`** (*High*): Prototype pollution & ReDoS in SheetJS. No upstream patch available. **Classified for replacement with modern streaming parser in Phase 5**.
  2. **`shadcn` / `fast-glob` / `braces`** (*High*): Deeply nested stack exhaustion ReDoS. **Eliminated automatically when unused `shadcn` dependency is removed**.
  3. **`dompurify`** (*High*): DOM XSS in `dompurify <= 3.4.15`. **Resolvable via `npm audit fix`**.

---

### 2.4 SQL DDL Schema Integrity Analysis
Examined:
- `supabase_cloud_migration_21_tables.sql`
- `containers/init-supabase-db.sql`
- `supabase/migrations/*.sql`

**Critical DDL Defects Discovered**:
1. `supabase/migrations/20261006_optimize_items_indexing.sql:11`:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_items_plant ON public.items (plant);
   ```
   **Defect**: Column `plant` **does not exist** on `public.items` table in any schema definition (`items` has `wh` / `warehouse`, but not `plant`). Running on clean Postgres will fail.
   **Classification**: **DELETE / FIX** in unified db migrations.
2. `supabase/migrations/20261006_optimize_items_indexing.sql:12`:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_items_tenant_id ON public.items (tenant_id) WHERE tenant_id IS NOT NULL;
   ```
   **Defect**: Column `tenant_id` missing from base `public.items` in initial 21-table migration (added only in later soft-delete migrations).
   **Classification**: **MIGRATE** to baseline dbmate migration.

---

### 2.5 Secret Literals in Workspace Tree
Discovered plain-text secrets and test credentials across:
- `compose.yaml` (`VITE_SUPABASE_ANON_KEY`, `JWT_SECRET`, `PGRST_JWT_SECRET`, `GOTRUE_JWT_SECRET`, `SUPABASE_SERVICE_KEY`)
- `docker-compose.yml` (`DB_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`)
- `auth-server/.dev-secret` (raw random secret)
- `.env` (`VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- `playwright.config.ts` (`BOOTSTRAP_ADMIN_PASSWORD: 'Plas!Tech#Boot91'`)
- `e2e/global-setup.ts` (`E2E_ADMIN_PASSWORD = 'E2e#Secure2026pw'`)

**Classification**: **MIGRATE** in Phase 3 to single `.env.example` template with zero secret literals committed in git tree.

---

### 2.6 Services with Zero Importers

| Service File | Importers | Classification | Reason |
|---|---|---|---|
| `src/services/dashboardSummaryService.ts` | 0 | **DELETE** | Completely unreferenced |
| `src/services/administration/administration.api.ts` | 0 | **MIGRATE** | Feature module API client |
| `src/services/finance/finance.api.ts` | 0 | **MIGRATE** | Feature module API client |
| `src/services/front-office/front-office.api.ts` | 0 | **MIGRATE** | Feature module API client |
| `src/services/home-tools/api/home-tools.api.ts` | 0 | **MIGRATE** | Feature module API client |
| `src/services/hr/hr.api.ts` | 0 | **MIGRATE** | Feature module API client |
| `src/services/operations/operations.api.ts` | 0 | **MIGRATE** | Feature module API client |
| `src/services/planning/planning.api.ts` | 0 | **MIGRATE** | Feature module API client |
| `src/services/procurement/procurement.api.ts` | 0 | **MIGRATE** | Feature module API client |

---

### 2.7 Duplicate, "Legacy", and "Redesign" Files

| File | Status / Usage | Classification |
|---|---|---|
| `src/components/engineering/LegacyBomBuilderView.tsx` | Imported only in `EngineeringViews.tsx` as old fallback | **ASK** (Can be safely removed if new BOM Builder is confirmed) |
| `src/components/sales/redesign/SalesOrderDashboard.tsx` | Actively rendered by `SalesViews.tsx` | **KEEP** |
| `src/components/sales/redesign/SalesOrderList.tsx` | Actively rendered by `SalesViews.tsx` | **KEEP** |
| `src/components/sales/redesign/SalesOrderWizard.tsx` | Actively rendered by `SalesViews.tsx` | **KEEP** |
| `src/components/sales/redesign/SalesOrderDetail.tsx` | Actively rendered by `SalesViews.tsx` | **KEEP** |
| `src/components/sales/redesign/MonthlyPlanOrdersView.tsx` | Actively rendered by `SalesViews.tsx` | **KEEP** |
| `src/components/sales/redesign/DailyOrderQuickEntry.tsx` | Actively rendered by `SalesViews.tsx` | **KEEP** |
| `src/components/sales/redesign/MonthlyDailyReconciliation.tsx` | Actively rendered by `SalesViews.tsx` | **KEEP** |
| `src/components/sales/redesign/FgStockModal.tsx` | Actively rendered by `SalesViews.tsx` | **KEEP** |

---

### 2.8 LocalStorage & SessionStorage Key Registry

The following 28 keys are currently accessed in `src/`:
- **UI State**: `reboot_active_view`, `reboot_tenant_id`, `activeTenantId`, `tenant_id`
- **Master Data Caches**:
  - `reboot_erp_master_bins`
  - `reboot_erp_bom_versions`
  - `reboot_erp_master_plants`
  - `reboot_erp_master_owners`
  - `reboot_erp_master_operations`
  - `reboot_erp_master_workcenters`
  - `reboot_erp_master_machines`
  - `reboot_erp_master_molds`
  - `reboot_erp_runner_scrap_categories`
  - `reboot_erp_purge_lumps_categories`
  - `reboot_erp_master_reason_codes`
  - `reboot_erp_master_governance_permissions`
  - `reboot_erp_master_data_change_requests`
  - `reboot_erp_master_data_audit_records`
  - `reboot_operator_master`
- **Domain Entities**:
  - `reboot_erp_regrind_material_entries`
  - `reboot_sales_orders`
  - `reboot_monthly_plans`
  - `reboot_so_relationships`
  - `reboot_deliveries`
  - `reboot_e_invoices`
  - `reboot_e_way_bills`
  - `reboot_gate_passes`
  - `reboot_fg_batches`
- **Session Telemetry**: `SESSION_HEALTH_KEY`, `SESSION_HEALTH_TS_KEY`

**Classification**: **MIGRATE** (preserved for discrete module prompts to move to TanStack Query and Hono endpoints).

---

### 2.9 Code Hygiene Telemetry
- **Commented-Out Blocks**: 1 block > 30 lines identified:
  - `src/components/admin/AdminSecurityView.tsx`: 92 lines of legacy commented authentication form JSX. (**DELETE**)
- **`console.log` statements**: 2 occurrences. (**DELETE**)
- **`TODO` markers**: 3 occurrences. (**KEEP**)
- **Direct `supabase.` calls**: Exactly 2 isolated calls (`supabaseRealtime.ts` unsubscribe, `supabaseClient.ts` health check). All other operations route cleanly through `db` adapter. (**KEEP**)

---

## 3. Candidate Deletion Table (Phase 2 Preparation)

| Target | Reason | Verification | Action in Phase 2 |
|---|---|---|---|
| `src/services/dashboardSummaryService.ts` | 0 importers | Verified via AST walk | **DELETE** |
| `src/components/admin/AdminSecurityView.tsx: lines 135-227` | 92 lines commented-out dead JSX | Dead code | **DELETE** |
| `package.json` unused deps: `express`, `@types/express`, `@hookform/resolvers`, `motion`, `react-hook-form`, `shadcn`, `tw-animate-css`, `autoprefixer`, `esbuild` | Unused dependencies causing audit bloat & vulnerabilities | Verified by `depcheck` & `tsc` | **DELETE** |
| `supabase/migrations/20261006_optimize_items_indexing.sql:11` | Non-existent column index (`plant`) | Schema verification | **DELETE** |
