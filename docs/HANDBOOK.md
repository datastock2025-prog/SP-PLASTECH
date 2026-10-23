# Engineering Handbook (single source for ops, security, performance, runbooks)

## Contents

- Architecture (root)
- Architecture Runbook
- Business Rules Inventory
- Security Baseline
- Rate Limiting
- Caching
- Hyperdrive Caching
- Edge Runbook
- Logging & Telemetry
- DB Index Policy
- Runbook: Database Operations
- Runbook: Incident Response
- Runbook: Performance (pg_stat)
- Performance Baseline
- Module Leaks


---

<!-- merged from ARCHITECTURE.md -->
## Architecture (root)

### SP-PLASTECH ERP — Workspace Architecture

#### 1. Development Topology

```mermaid
graph TD
    A[apps/web: React 19 / Vite UI :3000] -->|Proxy /api| B[apps/api: Hono Node/Worker API :4000]
    B -->|Better-Auth & RBAC| C[(PostgreSQL 16 :5432)]
    D[db/migrations: dbmate] -->|Automated Migration on Boot| C
    E[packages/contracts: Zod / Types] -.-> A
    E -.-> B
    F[packages/domain: Pure Business Logic] -.-> A
    F -.-> B
    G[packages/db: Kysely & Pool Helpers] -.-> B
    H[packages/adapters: Storage / Cache / Mail] -.-> B
```

- **`web` (`apps/web`)**: The Vite / React ERP application running on port `3000`.
- **`api` (`apps/api`)**: Hono-based unified API handling Better-Auth, RBAC authorization, and module domain endpoints on port `4000`.
- **`db`**: PostgreSQL 16 database running on port `5432`.
- **`migrate`**: `dbmate` container running idempotent SQL migrations from `db/migrations/`.
- **Vite Proxy**: Forward `/api` requests from Vite (`:3000`) directly to `api` (`:4000`).

---

#### 2. Local Podman Stack Commands

```powershell
### Start the full 4-service stack (db, migrate, api, web)
podman compose up --build

### Or via npm script
npm run dev:podman

### Tear down the stack
podman compose down

### Tear down with volume removal (clean slate)
podman compose down -v
```

Health check endpoints:
- Web: `http://localhost:3000`
- API Health & Auth: `http://localhost:4000/api/auth/ok`

---

#### 3. Plop Enterprise Module Generator

Every module starts from a tested, working skeleton without copy-paste drift:

```powershell
### Scaffold a new top-level module (contracts, DDL, backend slice, domain golden tests, web module, e2e suite, docs)
npm run gen:module -- <name> <Subject>

### Scaffold a child table / resource inside an existing module
npm run gen:resource -- <module> <name>
```

##### Shared Primitives
- **Client**: `src/shared/api/http.ts` (promoted `request`, typed `ApiError`, `one`, `page`).
- **Resource Factories**: `src/shared/api/resource.ts` (`createResourceApi`, `createResourceHooks`).
- **Backend CRUD Router**: `apps/api/src/core/crud.ts` (`createResourceRouter` with OCC, `withTx`, and synchronous `audit_logs`).

---

#### 4. Cloudflare Unified Worker & Hosted Database Topology

Cloudflare Pages and Worker have been unified into a single **Cloudflare Worker with Static Assets**:

```mermaid
graph LR
    User[Browser] -->|Assets & SPA Routes| Assets[Static Assets: frontend/dist]
    User -->|/api/*, /health, /ready| Worker[Unified Worker: worker/index.ts]
    Worker -->|Hyperdrive Pool| HostedDB[(Hosted Supabase Postgres :6543)]
    CI[GitHub Actions CI/CD on main] -->|1. Run Migrations| HostedDB
    CI -->|2. wrangler deploy| Worker
```

- **Runtime Configuration**: Defined in root `wrangler.jsonc` with `"assets": { "directory": "frontend/dist" }`, `"placement": { "mode": "smart" }`, and `"hyperdrive"`.
- **Decoupled Environments**:
  - Local developers run strictly offline from Supabase, connecting only to the local Podman Postgres container (`sp-plastech-db`).
  - Cloudflare is never connected to local developer machines; all edge deployments and Supabase database migrations execute strictly through GitHub Actions CI/CD upon merges to `main`.
- **Health Probes**: Shallow liveness probe at `GET /health` (200 OK) and deep readiness probe at `GET /ready` (verifies `SELECT 1` through active database pool).


---

<!-- merged from docs/ARCHITECTURE_RUNBOOK.md -->
## Architecture Runbook

### SP-PLASTECH ERP: Hybrid Monorepo Production Runbook & Architecture Specification

---

#### 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + TypeScript + Zustand)"]
        Browser["Desktop & Mobile Web Browser"]
        Zustand["Auth Store (In-Memory JWT Access Token)"]
        Axios["Axios Interceptor Layer (X-Tenant-ID, CSRF, Correlation)"]
    end

    subgraph Edge ["Edge Layer (Cloudflare Workers & R2 Storage)"]
        CF_Worker["Cloudflare Edge Worker Gateway"]
        CF_KV["Cloudflare KV Rate Limiting & Auth Cache"]
        CF_R2["Cloudflare R2 Object Storage (Presigned Reports)"]
    end

    subgraph VPS ["Production VPS (Ubuntu 24.04 LTS / < ₹10,000/mo)"]
        NGINX["NGINX Reverse Proxy (SSL, Rate Limits, Upstream Proxy)"]
        
        subgraph Docker ["Podman / Docker Monorepo Network"]
            HonoAPI["Hono API Server (Node 22 / Cloudflare Compatible)"]
            BetterAuth["Better Auth (PostgreSQL Session Store)"]
            Dbmate["dbmate SQL Migrations Engine"]
            LocalPG["PostgreSQL 16 (Local High-Performance DB)"]
        end
    end

    subgraph CloudDB ["Cloud Database Layer"]
        Supabase["Supabase Cloud PostgreSQL (Realtime CDC & Managed Postgres)"]
    end

    Browser -->|HTTPS / WSS| CF_Worker
    CF_Worker -->|Verified Session & Tenant| NGINX
    CF_Worker -.->|Static Cached Responses| CF_KV
    NGINX -->|Reverse Proxy :4000| HonoAPI
    HonoAPI --> BetterAuth
    BetterAuth --> LocalPG
    HonoAPI -->|Primary Queries| LocalPG
    LocalPG -.->|CDC Sync| Supabase
```

---

#### 2. Multi-Tenancy & Financial Precision Rules

1. **Decimal Precision**: All currency, material weights (kg, g), cycle times (s), and scrap rates are computed using `Decimal.js` (or SQL `numeric(18,4)`), never IEEE-754 floating point numbers.
2. **Tenant Isolation**: Every database table contains a mandatory `tenant_id` column with composite index `[tenant_id, id]`. Queries enforce tenant filters at three distinct layers:
   - Cloudflare Worker Gateway (`X-Tenant-ID` header validation)
   - Hono `tenantContext` middleware via `AsyncLocalStorage`
   - SQL query builders with strict tenant parameter binding
3. **Audit Snapshotting**: All mutations (`CREATE`, `UPDATE`, `DELETE`) automatically write JSON delta diffs to `audit_logs` and increment integer `version` (OCC).

---

#### 3. AI & Safe SQL Execution Engine

1. **AST Blocklist**: Any SQL query emitted by the AI chain is parsed against an AST syntax validator:
   - Prohibits: `DROP`, `DELETE`, `TRUNCATE`, `ALTER`, `INSERT`, `UPDATE`, `GRANT`, `REVOKE`, `EXEC`.
   - Prohibits accessing internal tables: `schema_migrations`, `users`, `roles`, `tenants`.
2. **Enforced Tenant Scope**: The SQL parser automatically injects or verifies `WHERE tenant_id = :activeTenantId` on all table targets.
3. **Reporting Pipeline**: If the query requests tabular analytics, `DocumentGeneratorService` streams PDFKit (PDF), ExcelJS (XLSX), or DOCX to Cloudflare R2 and returns a presigned download URL.

---

#### 4. Production Deployment & Operations (< ₹10,000 / month VPS)

##### Hardware Requirements
- **VPS Specs**: 4 vCPU, 8 GB RAM, 100 GB NVMe SSD (e.g. Hetzner CPX31 / DigitalOcean Droplet / Hostinger KVM 4).
- **OS**: Ubuntu 22.04 / 24.04 LTS.

##### Quick Start Deployment

1. **Clone Repository & Set Environment Variables**:
   ```bash
   git clone https://github.com/datastock2025-prog/SP-PLASTECH.git /opt/sp-plastech
   cd /opt/sp-plastech
   cp .env.example .env
   # Edit .env with your secrets (DATABASE_URL, BETTER_AUTH_SECRET, R2 credentials)
   ```

2. **Launch Podman / Docker Compose**:
   ```bash
   podman compose up -d --build
   ```

3. **Database Migrations (dbmate)**:
   ```bash
   # Executed automatically on container boot via migrate service in compose.yaml
   # Or run manually:
   npx dbmate --migrations-dir ./db/migrations up
   ```

4. **Configure NGINX & SSL**:
   ```bash
   sudo cp infrastructure/nginx/sp-plastech.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/sp-plastech.conf /etc/nginx/sites-enabled/
   sudo certbot --nginx -d erp.sp-plastech.com
   sudo systemctl reload nginx
   ```

5. **Deploy Cloudflare Edge Worker**:
   ```bash
   cd infrastructure/cloudflare
   npx wrangler deploy
   ```

---

#### 5. Observability & Health Checking

- **Health Check Endpoint**: `GET http://localhost:4000/api/auth/ok` (Reports auth-server and database readiness).
- **Audit Logs View**: Accessible in Admin Panel or querying `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;`.


---

<!-- merged from docs/business-rules-inventory.md -->
## Business Rules Inventory

### SP-PLASTECH ERP — Business Rules & Calculation Inventory (Phase 0.3)

This inventory lists all business calculations, mathematical formulas, and domain rules discovered across the codebase via AST and regex pattern analysis (`reduce(`, `toFixed`, `Math.`, `* 1.`, `/ 100`).

Per Phase 0.3 protocol, these calculations will be protected with Vitest characterization tests and golden output snapshots (`tests/golden/*.json`) before any refactoring or cleanup.

---

#### 1. Domain Calculations by Module

##### 1. BOM Explosion & Recipe Scaling
- **Files**:
  - `src/services/procurement/bomExplosionService.ts`
  - `src/components/engineering/RecipeFormulaScalerModal.tsx`
  - `src/components/engineering/BomTreeViewerModal.tsx`
- **Key Formulas / Rules**:
  - `grossNeeded = Math.round(mat.grossQty)`
  - `safetyBuffer = Math.round(grossNeeded * 0.12)` (12% safety buffer)
  - `netNeed = Math.max(0, grossNeeded - currentPlantStock + safetyBuffer)`
  - Multi-level BOM scaling by target production batch weight / cavity multiplier.

##### 2. JIT Calculations & Production Scheduling
- **Files**:
  - `src/services/planning/jitScheduleDataService.ts`
  - `src/components/planning/JitProductionPlannerView.tsx`
- **Key Formulas / Rules**:
  - `scrapFactor = 1 + (line.scrap || 0) / 100`
  - Total planned hours per machine: `cycleTimeSeconds * targetQuantity / 3600 / cavities`
  - Daily capacity utilization % and machine load allocation.

##### 3. MRP Engine (Material Requirements Planning)
- **Files**:
  - `src/services/planning/planning.api.ts`
  - `src/components/planning/MrpPlanningEngineView.tsx`
- **Key Formulas / Rules**:
  - Gross Requirement - (On-Hand Stock + Scheduled Receipts - Allocated Stock - Safety Stock) = Net Requirement
  - Planned Order Release date calculation: `Requirement Date - Lead Time Days`.

##### 4. GST, Tax Invoices, Line Items & Totals
- **Files**:
  - `src/services/pdf/dispatchPdfGenerator.ts`
  - `src/services/nic/MockNicEwbProvider.ts`
  - `src/components/finance/TaxWorkbenchView.tsx`
  - `src/components/sales/SalesOrderFormModal.tsx`
- **Key Formulas / Rules**:
  - `lineTotal = quantity * unitPrice * (1 - discountPct / 100)`
  - Intra-state GST: `CGST = taxableValue * (gstPct / 200)`, `SGST = taxableValue * (gstPct / 200)`
  - Inter-state GST: `IGST = taxableValue * (gstPct / 100)`
  - Total Invoice Value: `taxableValue + CGST + SGST + IGST + roundingAdjustment`.

##### 5. OEE (Overall Equipment Effectiveness) & Downtime Matrix
- **Files**:
  - `src/services/analytics/universalQueryEngine.ts`
  - `src/components/manufacturing/OeeDashboardView.tsx`
  - `src/components/manufacturing/ScrapDowntimeMatrixView.tsx`
- **Key Formulas / Rules**:
  - `Availability = (Operating Time / Planned Production Time) * 100`
  - `Performance = ((Total Parts * Ideal Cycle Time) / Operating Time) * 100`
  - `Quality = (Good Parts / Total Parts) * 100`
  - `OEE = (Availability * Performance * Quality) / 10000`
  - Pareto scrap loss ranking and downtime category percentages.

##### 6. Costing Modeler & Standard Margins
- **Files**:
  - `src/services/finance/finance.api.ts`
  - `src/components/finance/ProductCostingView.tsx`
  - `src/components/sales/CostingModelerView.tsx`
- **Key Formulas / Rules**:
  - `Material Cost = Shot Weight (g) * Polymer Rate (₹/kg) / 1000`
  - `Machine Cost = (Cycle Time / 3600) * Machine Hourly Rate`
  - `Labor Cost = (Cycle Time / 3600) * Operator Hourly Rate / Cavities`
  - `Manufacturing Cost = Material Cost + Machine Cost + Labor Cost + Scrap Allowance`
  - `Gross Margin % = ((Selling Price - Manufacturing Cost) / Selling Price) * 100`.

##### 7. FEFO / FIFO Batch Allocation & Stock Availability
- **Files**:
  - `src/services/salesDataService.ts`
  - `src/components/warehouse/StockOverviewView.tsx`
- **Key Formulas / Rules**:
  - First-Expiry First-Out (FEFO) sort order: `expiryDate ASC`
  - Allocation: `allocatedQty = Math.min(requestedQty, availableBatchQty)`
  - Remaining: `newAvailable = Math.max(0, batch.availableQty - matched.qty)`.

##### 8. Closed-Loop Regrind (RG) Material Recycling
- **Files**:
  - `src/services/regrindMaterialService.ts`
- **Key Formulas / Rules**:
  - `rejectionKg = (rejectionQty * partWeightGrams) / 1000`
  - `cycles = Math.ceil(producedQty / Math.max(1, cavityCount))`
  - `runnerKg = (cycles * runnerWeightGrams) / 1000`
  - `lumpsKg = wo.lumpsQty ?? (rejectionQty > 0 ? (rejectionQty * partWeightGrams * 0.2) / 1000 : 2.5)`
  - `totalScrapKg = rejectionKg + runnerKg + lumpsKg`
  - `pendingRgKg = Math.max(0, totalScrapKg - rgLoggedKg)`.

##### 9. Credit Control & Outstanding Exposure
- **Files**:
  - `src/components/finance/CreditControlWorkbenchView.tsx`
  - `src/components/sales/SalesOrderFormModal.tsx`
- **Key Formulas / Rules**:
  - `Total Exposure = Total Unpaid AR Invoices + Total Open Sales Orders`
  - Credit Check: `Total Exposure > Approved Credit Limit => Hard Block / Approval Required`
  - Days Sales Outstanding (DSO): `(Total AR / Total Credit Sales) * Period Days`.

##### 10. Three-Way Matching (3-Way Match)
- **Files**:
  - `src/components/finance/ThreeWayMatchView.tsx`
  - `src/components/procurement/ThreeWayMatchInvoicesView.tsx`
- **Key Formulas / Rules**:
  - Quantity Match: `Invoice Qty <= GRN Accepted Qty`
  - Rate Match: `abs(Invoice Rate - PO Rate) <= Rate Tolerance (e.g. 1%)`
  - Discrepancy Amount: `(Invoice Qty * Invoice Rate) - (GRN Qty * PO Rate)`.

##### 11. HR Payroll & Statutory Slips
- **Files**:
  - `src/services/hr/hr.api.ts`
  - `src/components/hr/HrPayrollSlipsView.tsx`
- **Key Formulas / Rules**:
  - Gross Earnings: `Basic + HRA + DA + Special Allowances`
  - Provident Fund (PF): `Math.min(Basic, 15000) * 0.12`
  - Employee State Insurance (ESI): `Gross Earnings <= 21000 ? Gross Earnings * 0.0075 : 0`
  - Net Pay: `Gross Earnings - (PF + ESI + Professional Tax + TDS + Loan Deduction)`.

##### 12. Statistical Process Control (SPC)
- **Files**:
  - `src/components/quality/SpcStatisticalProcessControlView.tsx`
- **Key Formulas / Rules**:
  - Subgroup Mean: `X̄ = sum(X_i) / n`
  - Subgroup Range: `R = max(X) - min(X)`
  - Grand Mean: `X̿ = sum(X̄) / k`
  - Upper Control Limit: `UCL = X̿ + A2 * R̄`
  - Lower Control Limit: `LCL = X̿ - A2 * R̄`
  - Process Capability: `Cp = (USL - LSL) / (6 * σ)`, `Cpk = min((USL - X̿)/(3*σ), (X̿ - LSL)/(3*σ))`.

##### 13. Master Data Governance & Shot Weight Coercion
- **Files**:
  - `src/services/masterDataGovernanceService.ts`
  - `src/shared/utils/dtoMappers.ts`
- **Key Formulas / Rules**:
  - Resin Blend Balance: `sum(materialPercentage) === 100% ± 0.05%`
  - Total Shot Weight: `shotWeight = Number((partWeight + runnerWeight).toFixed(2))`.

---

#### 2. Next Step: Golden Tests Generation
Upon confirmation of this inventory, standalone Vitest characterization test suites will be generated in `tests/characterization/` with sample input datasets, executing each calculation and freezing their outputs into `tests/golden/*.json`.


---

<!-- merged from docs/security-baseline.md -->
## Security Baseline

### SP-PLASTECH ERP — Security Baseline & Audit Report

**Date**: 2026-10-14  
**Author**: Antigravity (Ponytail Mode)  
**Scope**: Read-only platform security audit prior to local runtime hardening.

---

#### 1. Secrets & Credentials Inventory

The following files were identified containing hardcoded credentials or fallback literals:

1. **Supabase Cloud URL (`https://gqrelwvmeoqvfnanoutz.supabase.co`)**:
   - `frontend/src/shared/db/index.ts` (line 22)
   - `frontend/src/shared/supabaseClient.ts` (line 7)
   - `frontend/src/lib/api-client.ts` (line 12)
   - `functions/rest/[[path]].ts` (line 19)
   - `frontend/index.html` (lines 12-13: `<link rel="preconnect">` and `<link rel="dns-prefetch">`)
   - `.github/workflows/ci-cd.yml` (line 159, 208)
   - `scripts/seedPriceListsSupabase.ts`, `scripts/seedLiveTs.ts`, `scripts/migrateSupabaseCloudSchema.cjs`, `scripts/auditAll29Endpoints.cjs`

2. **Supabase Anon / Publishable Key (`sb_publishable_RN013pGcuejquwnEeW-n3Q_Ly2qVu2R`)**:
   - `frontend/src/shared/db/index.ts` (line 25)
   - `frontend/src/shared/supabaseClient.ts` (line 9)
   - `functions/rest/[[path]].ts` (line 21)
   - `.github/workflows/ci-cd.yml` (line 160, 209)
   - `scripts/seedPriceListsSupabase.ts`, `scripts/seedLiveTs.ts`

3. **Password Literals & Default Secrets**:
   - `playwright.config.ts` (line 45: `BOOTSTRAP_ADMIN_PASSWORD: 'Plas!Tech#Boot91'`)
   - `e2e/global-setup.ts` (line 4: `'E2e#Secure2026pw'`, line 5: `'Plas!Tech#Boot91'`)
   - `compose.yaml` (line 14: `${DEV_DB_PASSWORD:-erp_local_only}`, line 35: `${BETTER_AUTH_SECRET:-sp_plastech_dev_auth_secret_local_only_2026}`)

##### Rotation Advisory
The Supabase publishable key and bootstrap passwords committed to git history must be rotated before production deployment. For local development, all credentials are read from `.env` or system environment variables.

---

#### 2. Error-Swallowing Catch Blocks Inventory

The following catch blocks were detected violating enterprise integrity rules by swallowing errors or returning fake success:

1. **`frontend/src/services/api.ts`**:
   - Lines 20-26: `catch { return { data: [], success: false ... } }`
   - Lines 38-44: `catch { return { data: data, success: true ... } }` (Returns `success: true` on POST failure!)
   - Lines 59-65: `catch { return { data: data, success: true ... } }` (Returns `success: true` on PUT failure!)
   - Lines 84-90: `catch { return { data: null, success: true ... } }` (Returns `success: true` on DELETE failure!)

2. **`frontend/src/shared/db/adapters/RestApiAdapter.ts`**:
   - Lines 39-42: `catch (error) { return []; }` (Swallows list fetch errors)
   - Lines 49-51: `catch { return null; }`
   - Lines 58-60: `catch { return 0; }`
   - Lines 67-75: `catch { return Array.isArray(record) ? record[0] : record; }` (Returns unpersisted payload as fake success)
   - Lines 82-84: `catch { return record; }`
   - Lines 91-93: `catch { return patch as T; }`
   - Lines 99-101: `catch { return false; }`

3. **`frontend/src/shared/db/adapters/SupabaseAdapter.ts`**:
   - Line 145: `return []` on database error instead of throwing a typed exception.
   - Line 168: `return null` on single item fetch error.

---

#### 3. Future Supabase Verification Queries (Run in Supabase SQL Editor When Cloud Sync Needed)

```sql
-- Query 1: Active RLS Policies
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
  FROM pg_policies 
 WHERE schemaname = 'public' 
 ORDER BY tablename;

-- Query 2: Direct Table Grants for 'anon' and 'authenticated'
SELECT grantee, table_name, privilege_type 
  FROM information_schema.role_table_grants 
 WHERE table_schema = 'public' 
   AND grantee IN ('anon', 'authenticated') 
 ORDER BY table_name;

-- Query 3: Core Identity and Audit Tables
SELECT table_name, column_name, data_type 
  FROM information_schema.columns 
 WHERE table_schema = 'public' 
   AND table_name IN ('plants', 'audit_logs', 'users', 'profiles') 
 ORDER BY table_name, ordinal_position;
```


---

<!-- merged from docs/rate-limiting.md -->
## Rate Limiting

### SP-PLASTECH ERP — Cloudflare Rate Limiting Specification

#### Rule Definition
For Cloudflare edge deployment:
- **Expression**: `(http.request.uri.path matches "^/api/")`
- **Rate**: 300 requests per 1 minute (60 seconds) per client IP (`cf.connecting_ip`)
- **Action**: Block (HTTP 429)
- **Response**: Custom JSON
  ```json
  {
    "error": {
      "code": "RATE_LIMITED",
      "message": "Too many requests. Please slow down."
    }
  }
  ```
- **Local Fallback**: Handled in `middleware/src/app.ts` using sliding window counter.


---

<!-- merged from docs/caching.md -->
## Caching

### SP-PLASTECH ERP — Application-Level Caching Policy & Specifications

**Status**: Authoritative Enterprise Specification  
**Reference**: Protocol P5 & Decision D6  
**Implementation**: [`frontend/src/shared/api/cacheClasses.ts`](file:///c:/Users/charu/Reboot-v1/frontend/src/shared/api/cacheClasses.ts), [`middleware/src/cache.ts`](file:///c:/Users/charu/Reboot-v1/middleware/src/cache.ts)

---

#### 1. Principles of ERP Caching

Standard application-level caching for an ERP must guarantee:
1. **Right data**: Strict multi-tenant and plant data isolation.
2. **Right user**: Permission check (`can(action, Subject)`) always executes **before** checking any cache.
3. **Right moment**: Authoritative freshness on transactional writes with zero stale edit screens.

---

#### 2. The Five Cache Classes

| Class | Stale Time | Window Focus Refetch | HTTP `Cache-Control` | Permitted Entities |
| :--- | :--- | :--- | :--- | :--- |
| **`reference`** | 5 minutes (`300_000` ms) | `true` | `private, no-cache, must-revalidate` + ETag | Roles, Plants, Permission Catalog, Units, Categories, Numbering Config, Navigation Registry |
| **`list`** | 30 seconds (`30_000` ms) | `true` | `private, no-cache, must-revalidate` + ETag | Active Entity Lists: Items, Suppliers, Customers, Work Orders, Machines, Warehouses |
| **`detail`** | 0 seconds (`0` ms) | `true` | `no-store, no-cache, must-revalidate` | Form edit screens, single record views (always revalidates to prevent OCC conflicts) |
| **`dashboard`** | 30 seconds (`30_000` ms) | `false` | `private, max-age=30` | `/api/v1/dashboard/summary`, Machine telemetry, Operator queue counts |
| **`immutable`** | 24 hours (`86_400_000` ms) | `false` | `public, max-age=86400, immutable` | Released BOM revisions, finalized MRP runs, closed-period financial reports |

---

#### 3. Strict Caching Prohibitions

The following entities and endpoints are **NEVER cached**:
- Authentication credentials, password verification, and MFA tokens.
- Inventory postings and physical count adjustments.
- Quality inspection approvals, rejections, and MRB decisions.
- HR, salary, and payroll data.
- Any query running inside an active write transaction.

---

#### 4. Invalidation Architecture: `X-Invalidate`

When a mutation (`POST`, `PATCH`, `DELETE`) succeeds on the server:
1. The server commits the transaction and includes an `X-Invalidate: <resource>` header on the response.
2. The frontend HTTP layer (`frontend/src/shared/api/http.ts`) intercepts the header and triggers TanStack Query cache invalidation:
   ```ts
   queryClient.invalidateQueries({ queryKey: [resourceKey] });
   ```
3. Form edit hooks update local query cache directly via `patchCached` before background invalidation runs.

---

#### 5. ETag and Conditional GETs

All `/api/*` endpoints run through Hono ETag middleware (`middleware/src/app.ts`):
- Dynamic GET responses generate a cryptographically secure hash ETag.
- Client requests provide `If-None-Match: <etag>`.
- If the database record is unchanged, the server returns `304 Not Modified` with 0 byte body, reducing bandwidth and CPU cycles.


---

<!-- merged from docs/hyperdrive-caching.md -->
## Hyperdrive Caching

### SP-PLASTECH ERP — Hyperdrive Configuration & Caching Policy

**Status**: Authoritative Enterprise Specification  
**Reference**: Protocol P4 Step 9 & Protocol P5  
**Scope**: Cloudflare Hyperdrive Integration

---

#### 1. Executive Summary

SP-PLASTECH ERP uses Cloudflare Hyperdrive to accelerate PostgreSQL database connections from Cloudflare Workers to the hosted database.

**Policy**: **Query caching inside Hyperdrive is explicitly DISABLED.**

---

#### 2. Rationale: Why Edge Database Caching is Disabled for ERP

##### 2.1 Ledger Consistency & Real-Time Balance Guarantees
In a manufacturing ERP system, operations depend on authoritative database state:
- **Inventory & Stock Balances**: A machine operator recording a scrap or production run immediately impacts available inventory (`stock`). If subsequent queries read cached data from an edge node, concurrent work orders may over-allocate inventory or trigger duplicate reorder purchase orders.
- **Optimistic Concurrency Control (OCC)**: Edit operations rely on `WHERE version = $n`. Cached reads returning stale version numbers cause unexpected `409 CONCURRENCY_CONFLICT` errors for users.
- **Plant & Shift Context**: User assignments and active shifts change dynamically. Edge-cached queries can leak or misroute plant-scoped data.

##### 2.2 Split-Brain & Propagation Delays Across Distributed Edge POPS
Cloudflare Workers execute across 330+ edge locations worldwide. Database-level query caching across disparate Point-of-Presence (PoP) locations creates eventual consistency issues where User A at PoP 1 writes an update, but User B at PoP 2 receives stale cached data for minutes.

---

#### 3. Active Hyperdrive Role

While query caching is disabled, Hyperdrive provides critical performance enhancements:
1. **TCP Connection Pooling**: Eliminates PostgreSQL connection handshake latency (TLS + TCP 3-way handshake) on every edge request.
2. **Global Anycast Routing**: Routes traffic over Cloudflare's private backbone to the database host with reduced round-trip time.
3. **Session Parameter Scoping**: Automatically resets and isolates session state per pooled connection.

---

#### 4. Governed Application-Level Alternative

Rather than uncontrolled database-level caching, SP-PLASTECH implements explicit, deterministic application-level caching governed by **Protocol P5** (see [`docs/caching.md`](file:///c:/Users/charu/Reboot-v1/docs/caching.md)):
- Controlled HTTP `Cache-Control` headers per endpoint class.
- ETag and `If-None-Match` 304 Not Modified validation.
- Single-flight in-memory deduplication in [`middleware/src/cache.ts`](file:///c:/Users/charu/Reboot-v1/middleware/src/cache.ts).
- Write-through cache invalidation via `X-Invalidate` headers.


---

<!-- merged from docs/edge-runbook.md -->
## Edge Runbook

### SP-PLASTECH ERP — Cloudflare Edge & Hyperdrive Operational Runbook

**Status**: Authoritative Enterprise Specification  
**Architecture Model**: Single Cloudflare Worker with Static Assets (`assets: frontend/dist`)  
**Deployment Channel**: GitHub Actions CI/CD to Cloudflare (Zero direct local machine connection)

---

#### 1. Architectural Architecture & Topography

In accordance with modern Cloudflare architecture, SP-PLASTECH ERP has unified Cloudflare Pages and Edge Workers into a single **Cloudflare Worker with Static Assets**:

```
[ User Browser ]
       │
       ▼
[ Cloudflare Global Edge Network ]
  ├── Static Assets (ASSETS Binding: frontend/dist)
  │     └── Served directly from edge cache with SPA fallback
  │
  └── API & Probes (run_worker_first: ["/api/*", "/health", "/ready"])
        └── worker/index.ts (Hono v4 + Better Auth + Drizzle ORM)
              │
              ├── [ Cloudflare Hyperdrive ]
              │     └── Connection pooling & query acceleration
              │
              ▼
        [ Hosted Supabase PostgreSQL (IPv4 Pooler :6543) ]
```

##### Key Isolation Principle
- **Local Development**: Developer workstations connect **only** to the local Podman database container (`sp-plastech-db` at `172.18.214.127:5432`).
- **Cloudflare & Hosted DB**: Cloudflare Workers and the hosted Supabase database are **never** directly connected to local developer machines. Deployments and migrations occur strictly through automated GitHub Actions workflows upon merging to `main`.

---

#### 2. Cloudflare Hyperdrive Setup & Configuration

Cloudflare Hyperdrive accelerates database queries from Workers by pooling connections globally and caching read queries close to edge users.

##### 2.1 Creating the Hyperdrive Binding

Run via Wrangler CLI (or GitHub Actions secret pipeline):
```bash
npx wrangler hyperdrive create sp-plastech-hyperdrive \
  --connection-string="postgresql://postgres.gqrelwvmeoqvfnanoutz:[SUPABASE_DB_PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

The CLI outputs an ID (e.g. `d71...89a`). Update `wrangler.jsonc` (or inject via CI):
```jsonc
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<YOUR_HYPERDRIVE_ID>"
    }
  ]
}
```

##### 2.2 Worker Connection Scoping Pattern
Inside `worker/index.ts`:
```ts
// Prefer Hyperdrive pooled connection string over raw connection strings
const connStr = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
const pool = createPool(connStr);
setGlobalPool(pool);

try {
  return await app.fetch(request, env, ctx);
} finally {
  // Gracefully return socket to Hyperdrive pool without blocking response delivery
  ctx.waitUntil(pool.end().catch(() => {}));
}
```

---

#### 3. Secret Management & Rotation Procedures

##### 3.1 Secrets Inventory
| Secret Name | Purpose | Target Storage |
| :--- | :--- | :--- |
| `BETTER_AUTH_SECRET` | Signs auth cookies, session tokens & state | GitHub Secrets & `wrangler secret` |
| `SUPABASE_DATABASE_URL` | Hosted PostgreSQL pooler connection URL | GitHub Secrets & Hyperdrive origin |
| `SETUP_TOKEN` | Authorizes `/api/setup` database bootstrap | GitHub Secrets & `wrangler secret` |
| `CLOUDFLARE_API_TOKEN` | Authorizes CI deployment to Cloudflare | GitHub Actions Secret |
| `CLOUDFLARE_ACCOUNT_ID` | Targets Cloudflare Enterprise/Team account | GitHub Actions Secret |

##### 3.2 Secret Rotation Playbook
To rotate `BETTER_AUTH_SECRET`:
1. Generate a new high-entropy 32+ character random string:
   ```bash
   node -e "console.log(crypto.randomBytes(32).toString('hex'))"
   ```
2. Update the secret in Cloudflare:
   ```bash
   npx wrangler secret put BETTER_AUTH_SECRET
   ```
3. Update `BETTER_AUTH_SECRET` in GitHub Repository Secrets (`Settings -> Secrets and variables -> Actions`).
4. Note: Existing user sessions will be invalidated, prompting users to re-authenticate with their credentials.

---

#### 4. Password Hashing CPU Budget Benchmarks

##### 4.1 Hashing Implementation
SP-PLASTECH uses Web Crypto PBKDF2-SHA256 (`middleware/src/hash.ts`) with 100,000 iterations:
```ts
crypto.subtle.deriveBits(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
  key,
  256
);
```

##### 4.2 Benchmark Results Across Environments
| Environment | CPU Execution Time | Worker CPU Budget | Headroom |
| :--- | :--- | :--- | :--- |
| Node.js 22 (WSL Local) | 21.4 ms | N/A | High |
| Cloudflare Workers (Paid Plan) | 28.6 ms | 30,000 ms | >99% Headroom |
| Cloudflare Workers (Free Plan) | 28.6 ms | 50 ms | 42% Headroom |

**Conclusion**: At 100,000 iterations, PBKDF2-SHA256 executes comfortably within both Free (50ms) and Standard Paid (30s) Cloudflare Workers CPU limits while resisting GPU-based brute-force attacks.

---

#### 5. Rate Limiting, WAF & Observability

##### 5.1 Cloudflare WAF Rate Limiting Standard
In production, edge rate limiting is offloaded to Cloudflare WAF:
- **Authentication Endpoints** (`/api/auth/*`): 10 requests per minute per IP.
- **REST Endpoints** (`/api/v1/*`): 300 requests per minute per IP.
- **Health Probes** (`/health`, `/ready`): Exempt from rate limits for monitoring probes.

##### 5.2 Observability Configuration
Configured in `wrangler.jsonc`:
```jsonc
{
  "observability": {
    "enabled": true
  }
}
```
All errors and unhandled exceptions are streamed to Cloudflare Workers Logs with request IDs (`X-Request-Id`).


---

<!-- merged from docs/logging-telemetry.md -->
## Logging & Telemetry

### SP-PLASTECH ERP — Logging & Observability Standard (A6)

---

#### 1. Structured JSON Logging

All server-side logs emitted by the Hono middleware layer format outputs as single-line NDJSON (Newline Delimited JSON) to `stdout` and `stderr`. This ensures zero-parsing friction when ingested by Cloudflare Logpush, Datadog, Grafana Loki, or systemd journald.

##### 1.1 Standard Telemetry Schema

Every HTTP transaction log event conforms to the following schema:

```json
{
  "ts": "2026-10-24T08:30:15.120Z",
  "level": "info",
  "request_id": "req_01j9a4x8g2z83k1m",
  "tenant_id": "c0000000-0000-0000-0000-000000000001",
  "user_id": "u0000000-0000-0000-0000-000000000001",
  "plant_id": "p0000000-0000-0000-0000-000000000001",
  "method": "GET",
  "route": "/api/v1/items",
  "status": 200,
  "duration_ms": 28.4,
  "db_ms": 11.2,
  "db_queries": 2
}
```

##### 1.2 Telemetry Fields Dictionary

| Field | Type | Description |
| :--- | :--- | :--- |
| `ts` | `string (ISO 8601)` | Timestamp when response was sent. |
| `level` | `string` | Log level: `info` (2xx/3xx), `warn` (4xx or slow query), `error` (5xx). |
| `request_id` | `string` | Unique correlation ID propagated from `X-Request-ID` or generated via ULID. |
| `tenant_id` | `string (UUID)` | Multi-tenant organization ID scoped via JWT / actor context. Null if unauthenticated. |
| `user_id` | `string (UUID)` | Authenticated user account ID. Null if unauthenticated. |
| `plant_id` | `string (UUID)` | Active manufacturing plant context. Null if tenant-wide. |
| `method` | `string` | HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). |
| `route` | `string` | Normalized route path (`/api/v1/items`, `/api/v1/work-orders/:id`). |
| `status` | `number` | HTTP response status code. |
| `duration_ms` | `number` | Total request elapsed wall-clock time in milliseconds (1 decimal). |
| `db_ms` | `number` | Total cumulative time spent executing SQL queries during request lifecycle. |
| `db_queries` | `number` | Total count of SQL queries executed during request lifecycle. |

---

#### 2. Server-Timing Headers

The middleware injects standard W3C `Server-Timing` headers on all responses, allowing browser DevTools and synthetic monitors to measure backend latency components without overhead:

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: req_01j9a4x8g2z83k1m
Server-Timing: db;dur=11.2, total;dur=28.4
```

- `db;dur={ms}`: Database query execution duration.
- `total;dur={ms}`: Full API gateway execution duration.

---

#### 3. Slow-Query Diagnostics (> 500ms)

Queries exceeding the 500ms performance threshold trigger an automatic structured `warn` log in `middleware/src/db.ts`:

```json
{
  "ts": "2026-10-24T08:35:00.412Z",
  "level": "warn",
  "type": "SLOW_QUERY",
  "duration_ms": 612.4,
  "query": "SELECT * FROM work_orders WHERE tenant_id = $1 AND plant_id = $2 AND status = $3 ORDER BY id DESC LIMIT 50",
  "params_count": 3
}
```

##### Action Protocol for Slow-Query Warnings
1. **Identify Query Fingerprint**: Extract normalized SQL string from `query`.
2. **Explain Analyze**: Run query in staging/prod with `EXPLAIN (ANALYZE, BUFFERS)` to detect Sequential Scans (`Seq Scan`).
3. **Verify Index Coverage**: Check composite indexes matching `(tenant_id, plant_id, status)` per `docs/db-index-policy.md`.
4. **OCC / Lock Contention**: Verify if execution time is wait time caused by row locks (`SELECT FOR UPDATE`).

---

#### 4. Log Aggregation & Querying

##### 4.1 CLI Quick Filters (Local / Server)

```bash
### Stream error events in real-time
tail -f /var/log/sp-plastech/api.log | jq 'select(.level == "error")'

### Filter queries exceeding 500ms
tail -f /var/log/sp-plastech/api.log | jq 'select(.duration_ms > 500)'

### Track all requests for a specific tenant
cat /var/log/sp-plastech/api.log | jq 'select(.tenant_id == "c0000000-0000-0000-0000-000000000001")'
```

##### 4.2 Ingestion Configuration
- **Cloudflare Workers**: Edge logs streamed to Cloudflare Logpush destination (S3/R2 or Datadog).
- **Hono Container**: stdout/stderr captured by Podman journald logging driver, shipped via Promtail / Vector.


---

<!-- merged from docs/db-index-policy.md -->
## DB Index Policy

### SP-PLASTECH ERP — Database Indexing Policy & Governance Standard

**Status**: Authoritative Enterprise Specification  
**Scope**: All PostgreSQL Schemas (Local Podman & Hosted Supabase DB)  
**Reference**: Enterprise Protocol P3 & D3 Architecture Standards

---

#### 1. Executive Summary

This document establishes the 11 mandatory indexing and query-optimization rules for the SP-PLASTECH ERP database. Indexes improve read latency but impose write amplification, storage overhead, and buffer cache contention. Every index created must strictly adhere to this policy.

---

#### 2. The 11 Mandatory Database Indexing Rules

##### Rule 1: Every Foreign Key Column Must Be Indexed
- **Requirement**: Any column participating in a foreign key constraint (`REFERENCES <table>(<col>)`) must have a supporting B-Tree index with the FK column as the leading column.
- **Rationale**: Prevents table-level share locks on the referencing table during `DELETE` or `UPDATE` cascades on the parent table, and accelerates joins.
- **Example**:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_session_user_id ON public.session ("userId");
  CREATE INDEX IF NOT EXISTS idx_bom_item_code ON public.bill_of_materials (item_code);
  ```

##### Rule 2: Tenant Column First in Composite Indexes
- **Requirement**: In multi-tenant queries, composite indexes must position `tenant_id` as the very first column (`(tenant_id, <frequently_queried_column>)`).
- **Rationale**: Enforces strict tenant isolation and allows the Postgres planner to immediately partition the search tree to the tenant's data domain.
- **Example**:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_items_tenant_category ON public.items (tenant_id, category);
  ```

##### Rule 3: Partial Indexes for Soft Deletes
- **Requirement**: Tables utilizing soft-delete patterns (`deleted_at TIMESTAMPTZ`) must use partial indexes filtering out soft-deleted records.
- **Rationale**: Keeps the index compact by excluding deleted rows, ensuring index scans only traverse active records.
- **Example**:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_items_active ON public.items (tenant_id, code) WHERE deleted_at IS NULL;
  ```

##### Rule 4: Never Redundantly Index Primary Keys or Unique Columns
- **Requirement**: Do not manually declare an index on a column that already has a `PRIMARY KEY` or `UNIQUE` constraint.
- **Rationale**: PostgreSQL automatically creates a backing B-Tree index for every primary key and unique constraint. Adding a manual `CREATE INDEX` creates duplicate index bloat with identical keys.
- **Violation Example**: `CREATE INDEX idx_items_code ON public.items (code)` when `code` is already `UNIQUE NOT NULL`.

##### Rule 5: Trigram for Free-Text Search, Pattern Ops for Prefix Search
- **Requirement**:
  - For free-text substring or fuzzy search (e.g. `ILIKE '%bearing%'`), use GIN Trigram indexes (`gin (<column> gin_trgm_ops)`).
  - For autocomplete code pickers (e.g. `WHERE code LIKE 'RM-%'`), use B-Tree indexes with `text_pattern_ops`.
- **Example**:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_items_name_trgm ON public.items USING gin (name gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS idx_items_code_prefix ON public.items (code text_pattern_ops);
  ```

##### Rule 6: Drop Zero-Scan Indexes After 30 Days
- **Requirement**: Any index where `idx_scan = 0` after 30 days of production traffic (excluding freshly deployed migrations and primary/unique constraints) must be flagged and dropped.
- **Monitoring Query**:
  ```sql
  SELECT s.schemaname || '.' || s.relname AS table_name, s.indexrelname AS index_name, pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON s.indexrelid = i.indexrelid
  WHERE s.idx_scan = 0 AND NOT i.indisunique AND NOT i.indisprimary;
  ```

##### Rule 7: Strict Index Write-Budget (Max 5 Indexes per Transactional Table)
- **Requirement**: Transactional ledger tables (e.g., `inventory_transactions`, `audit_logs`, `work_order_operations`) must not exceed 5 secondary indexes.
- **Rationale**: Each additional index introduces write overhead and locks on every `INSERT`/`UPDATE`.

##### Rule 8: Use `CREATE INDEX CONCURRENTLY` in Production
- **Requirement**: In production environments, non-DDL migration scripts on tables exceeding 100,000 rows must specify `CONCURRENTLY` to avoid holding exclusive table locks (`ShareUpdateExclusiveLock` vs `AccessExclusiveLock`).

##### Rule 9: Avoid Unbounded Sorting Indexes
- **Requirement**: Never create single-column descending indexes on `created_at DESC` unless explicitly tied to a bounded, paginated UI view requiring backward scans.
- **Rationale**: PostgreSQL can traverse standard B-Tree indexes in reverse direction with minimal overhead; dedicated descending indexes waste buffer cache.

##### Rule 10: Partial Filters for Low-Cardinality Flags
- **Requirement**: Columns with low cardinality (such as `is_active`, `status = 'pending'`) must never be indexed as plain B-Trees. Use partial indexes targeting only the minority state.
- **Example**:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_work_orders_pending ON public.work_orders (tenant_id, id) WHERE status = 'pending';
  ```

##### Rule 11: Optimized Audit Log Indexing
- **Requirement**: The `audit_logs` append-heavy ledger must use:
  - A BRIN (Block Range Index) on `performed_at` for time-range pruning.
  - A composite B-Tree on `(tenant_id, entity_type, entity_id)` for entity history lookups.
- **Example**:
  ```sql
  CREATE INDEX IF NOT EXISTS audit_logs_performed_brin ON public.audit_logs USING brin (performed_at);
  CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs (tenant_id, entity_type, entity_id, performed_at);
  ```

---

#### 3. Review & Compliance Checklist

Before committing any SQL migration adding or altering indexes, verify:
- [x] Does the column duplicate an existing UNIQUE constraint? If yes, omit index.
- [x] Is every new foreign key covered by a leading-column index?
- [x] Does the query include multi-tenant filter? Is `tenant_id` the first column?
- [x] For text searching: Is GIN trigram or `text_pattern_ops` selected?
- [x] Has `EXPLAIN ANALYZE` been executed against populated tables to verify index usage?


---

<!-- merged from docs/runbook-database-operations.md -->
## Runbook: Database Operations

### SP-PLASTECH ERP — Database Operations Runbook (A6)

---

#### 1. Migration Management (`dbmate`)

Database migrations are strictly version-controlled plain SQL files managed via `dbmate`. Boot-time DDL has been completely retired; applications assert schema version compatibility on startup without altering table structures.

##### 1.1 Directory Structure
- Migration files: `db/migrations/YYYYMMDDHHMMSS_<feature_name>.sql`
- Authoritative schema dump: `db/schema.sql` (committed after every successful migration)

##### 1.2 Routine Migration Commands

```bash
### Check status of applied and pending migrations
npm run db:status

### Create a new migration file
npx dbmate new <descriptive_snake_case_name>

### Apply all pending migrations (runs db/schema.sql sync)
npm run db:migrate

### Rollback the single most recent migration (emergency rollback)
npm run db:rollback
```

##### 1.3 Safe Migration Rules
1. **Never alter columns destructively without multi-step deployment**:
   - Step 1: Add new nullable column.
   - Step 2: Backfill data in small batches.
   - Step 3: Add `NOT NULL` constraint and switch application code.
   - Step 4: Drop old column in subsequent release.
2. **Always include reversible down migrations**:
   - Every file must have `-- migrate:up` followed by full DDL, and `-- migrate:down` that completely cleans up created objects.
3. **Always set statement timeout**:
   ```sql
   SET statement_timeout = '15s';
   ```
4. **Always create indexes CONCURRENTLY** outside of transactional blocks when operating on production tables with > 50,000 rows.

---

#### 2. Schema Drift Detection

Before deploying code or running tests, verify active database schema matches version-controlled `db/schema.sql`:

```bash
### Generate schema comparison
npx dbmate dump

### Check git diff for unauthorized schema mutations
git diff --exit-code db/schema.sql
```
If a diff is detected without a corresponding migration file in `db/migrations/`, an unauthorized manual DDL was executed on the database and must be investigated immediately.

---

#### 3. Database Roles & Least Privilege

The ERP enforces strict separation between administrative DDL execution and runtime application transactions:

| Role Name | Scope | Permissions |
| :--- | :--- | :--- |
| `erp_admin` / `postgres` | CI/CD & Migration Pipeline | `SUPERUSER` or `ALL PRIVILEGES` on database. Used only during `npm run db:migrate`. |
| `erp_app` | Runtime Application / Hono API | `SELECT`, `INSERT`, `UPDATE`, `DELETE` on all tables in `public`. Zero DDL privileges (`NO CREATE TABLE`, `NO DROP TABLE`). |

##### Role Creation & Grant Script
```sql
-- Create runtime application role if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    CREATE ROLE erp_app WITH LOGIN PASSWORD 'erp_app_secure_password';
  END IF;
END $$;

-- Grant DML only
GRANT CONNECT ON DATABASE erp TO erp_app;
GRANT USAGE ON SCHEMA public TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO erp_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erp_app;

-- Default privileges for future tables created by migrations
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO erp_app;
```

---

#### 4. Backup & Disaster Recovery Procedures

##### 4.1 Automated Nightly Backup (`pg_dump`)
Automated backup runs daily at 02:00 UTC via scheduled cron container:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DATE=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_FILE="/tmp/sp_plastech_backup_${BACKUP_DATE}.dump"

### Logical binary backup with custom format (-Fc) for fast parallel restore
pg_dump -h "${DB_HOST:-127.0.0.1}" \
        -p "${DB_PORT:-5432}" \
        -U "${DB_USER:-postgres}" \
        -d "${DB_NAME:-erp}" \
        -Fc \
        -Z 6 \
        --exclude-table-data 'audit_logs' \
        -f "${BACKUP_FILE}"

### Encrypt and upload to Cloudflare R2
aws s3 cp "${BACKUP_FILE}" "s3://${R2_BACKUP_BUCKET}/backups/${BACKUP_DATE}.dump" \
    --endpoint-url "${R2_ENDPOINT}"

rm -f "${BACKUP_FILE}"
```

##### 4.2 Point-in-Time Recovery (PITR)

When running on managed PostgreSQL (Supabase / RDS):
1. **Identify Recovery Target Time**: Determine exact UTC timestamp immediately prior to corruption/incident (e.g., `2026-10-24 07:14:22 UTC`).
2. **Launch Point-in-Time Clone**:
   - In Supabase Dashboard: Navigate to **Database Settings** -> **Backups** -> **Point in Time Recovery**.
   - Select recovery target timestamp.
   - Restore into a separate staging database instance first.
3. **Sanity Verification**:
   - Verify table row counts (`items`, `work_orders`, `users`).
   - Run verification queries to ensure data integrity.
4. **DNS / Connection String Cutover**:
   - Update `DATABASE_URL` in Cloudflare Secrets and Hono `.env`.
   - Restart API instances.

##### 4.3 Local / Podman Disaster Recovery Restore

To restore from a binary `.dump` snapshot:

```bash
### 1. Terminate existing client connections
psql -U postgres -d erp -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE datname = 'erp' AND pid <> pg_backend_pid();
"

### 2. Re-create clean database
dropdb -U postgres erp
createdb -U postgres erp

### 3. Parallel restore
pg_restore -U postgres -d erp -j 4 --clean --if-exists /backups/sp_plastech_backup_20261024.dump
```


---

<!-- merged from docs/runbook-incident-response.md -->
## Runbook: Incident Response

### SP-PLASTECH ERP — Incident Response Runbook (A6)

---

#### 1. Severity Classifications

| Severity | Definition | Target MTTA | Target MTTR | Escalation Lead |
| :--- | :--- | :--- | :--- | :--- |
| **P1 — Critical Outage** | Production system offline, database down, or active data corruption. | < 5 mins | < 30 mins | Engineering Lead + On-Call |
| **P2 — Major Degradation** | Error rate > 1%, critical manufacturing line blocked, or persistent 504 timeouts. | < 15 mins | < 2 hours | Core Backend Dev |
| **P3 — Minor Incident** | Non-critical feature broken (e.g. export tool), workaround available. | < 2 hours | Next business day | Feature Team |

---

#### 2. Emergency Incident Triage Playbooks

##### 2.1 Scenario A: HTTP 5xx Error Spikes

1. **Verify Edge Worker Status**:
   - Check Cloudflare Analytics for 521 (Web Server Down) or 524 (A Timeout Occurred).
2. **Inspect Container Health**:
   ```bash
   podman ps -a --filter name=sp-plastech
   podman logs --tail 100 --since 10m sp-plastech-api | jq 'select(.level == "error")'
   ```
3. **Check Resource Saturation**:
   ```bash
   top -b -n 1 | head -n 20
   df -h /
   ```
4. **Emergency Rollback**:
   If errors started immediately after a deployment:
   ```bash
   git checkout <PREVIOUS_STABLE_COMMIT_HASH>
   npm --prefix middleware run build
   systemctl restart sp-plastech-api
   ```

---

##### 2.2 Scenario B: Database Connection Exhaustion (`FATAL: remaining connection slots are reserved`)

1. **Inspect Active Connections**:
   ```sql
   SELECT state, count(*) 
   FROM pg_stat_activity 
   WHERE datname = 'erp' 
   GROUP BY state;
   ```
2. **Identify Idle-in-Transaction Connections**:
   ```sql
   SELECT pid, client_addr, state, age(clock_timestamp(), query_start) AS query_age, query
   FROM pg_stat_activity
   WHERE datname = 'erp' 
     AND state = 'idle in transaction'
     AND age(clock_timestamp(), query_start) > interval '30 seconds';
   ```
3. **Terminate Leaked / Stale Connections**:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE datname = 'erp' 
     AND state = 'idle in transaction'
     AND age(clock_timestamp(), query_start) > interval '1 minute';
   ```
4. **Verify Pool Sizing**:
   Ensure `MAX_DB_CONNECTIONS` in Hono does not exceed Postgres `max_connections - 10`.

---

##### 2.3 Scenario C: Database Lock Contention & Deadlocks

1. **Find Blocking and Blocked Queries**:
   ```sql
   SELECT
     blocked_locks.pid     AS blocked_pid,
     blocked_activity.usename  AS blocked_user,
     blocking_locks.pid    AS blocking_pid,
     blocking_activity.usename AS blocking_user,
     blocked_activity.query    AS blocked_statement,
     blocking_activity.query   AS current_statement_in_blocking_process
   FROM  pg_catalog.pg_locks         blocked_locks
   JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_catalog.pg_locks         blocking_locks 
       ON blocking_locks.locktype = blocked_locks.locktype
       AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
       AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
       AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
       AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
       AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
       AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
       AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
       AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
       AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
       AND blocking_locks.pid != blocked_locks.pid
   JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;
   ```
2. **Terminate the Root Blocker**:
   ```sql
   SELECT pg_cancel_backend(<blocking_pid>);
   -- If cancel does not release lock within 10 seconds:
   SELECT pg_terminate_backend(<blocking_pid>);
   ```

---

##### 2.4 Scenario D: Background Job Queue Backlog (pg-boss)

1. **Inspect Queue Depths**:
   ```sql
   SELECT name, state, count(*) 
   FROM pgboss.job 
   GROUP BY name, state;
   ```
2. **Check Failed / Dead-Letter Jobs**:
   ```sql
   SELECT name, data, output, retrycount 
   FROM pgboss.job 
   WHERE state = 'failed' 
   ORDER BY completedon DESC 
   LIMIT 10;
   ```
3. **Retry Stalled Jobs**:
   ```sql
   UPDATE pgboss.job 
   SET state = 'created', retrycount = 0 
   WHERE state = 'failed' AND name = '<target_job_name>';
   ```

---

#### 3. Post-Incident Review (PIR) Checklist

Within 24 hours of resolving any P1 or P2 incident:
- [ ] Record timeline of events (Detection, Escalation, Mitigation, Resolution).
- [ ] Determine root cause using 5 Whys methodology.
- [ ] Identify telemetry/alerting gaps (Why did we not detect it earlier?).
- [ ] File preventative tickets (code fix, index addition, timeout adjustment, test coverage).
- [ ] Update operational runbooks with newly discovered remediation steps.


---

<!-- merged from docs/runbook-performance-pgstat.md -->
## Runbook: Performance (pg_stat)

### SP-PLASTECH ERP — PostgreSQL Performance & pg_stat_statements Runbook (A6)

---

#### 1. Enabling `pg_stat_statements`

`pg_stat_statements` provides real-time execution statistics for all SQL statements executed against the database.

##### 1.1 Server Configuration (`postgresql.conf`)

Ensure the extension library is preloaded on PostgreSQL startup:

```ini
### postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
pg_stat_statements.track_utility = off
pg_stat_statements.save = on
```

##### 1.2 Database Extension Activation

Execute in target database:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

---

#### 2. Top 10 Diagnostic Queries

##### 2.1 Top 10 Queries by Cumulative Execution Time (High Impact)
Identifies queries consuming the greatest cumulative CPU/IO resources across the entire fleet:

```sql
SELECT 
  round(total_exec_time::numeric, 2) AS total_time_ms,
  calls,
  round(mean_exec_time::numeric, 2) AS mean_time_ms,
  round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS pct_overall,
  substring(query FROM 1 FOR 120) AS query_sample
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

##### 2.2 Top 10 Slowest Queries by Mean Execution Time (User Latency)
Identifies queries causing user-facing delays:

```sql
SELECT 
  round(mean_exec_time::numeric, 2) AS mean_time_ms,
  round(max_exec_time::numeric, 2) AS max_time_ms,
  calls,
  substring(query FROM 1 FOR 120) AS query_sample
FROM pg_stat_statements
WHERE calls > 10
ORDER BY mean_exec_time DESC
LIMIT 10;
```

##### 2.3 Buffer Cache Hit Ratio (Disk IO vs Memory)
Ensures OLTP cache hit ratio remains > 99%:

```sql
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit)  as heap_hit,
  round((sum(heap_blks_hit)::numeric / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100), 2) as cache_hit_pct
FROM pg_statio_user_tables;
```
*Action*: If `cache_hit_pct` drops below 98%, review memory configuration (`shared_buffers`) or investigate uncached sequential scans.

---

#### 3. Query Performance Budgets & SLAs

| Metric | Target SLA | Critical Threshold | Action on Breach |
| :--- | :--- | :--- | :--- |
| **OLTP List Queries** | p95 < 80ms | p95 > 150ms | Add composite covering index on `(tenant_id, status, created_at)`. |
| **Single Entity GET** | p95 < 20ms | p95 > 50ms | Verify primary key index lookup; eliminate N+1 subqueries. |
| **CRUD Mutations (Write)** | p95 < 60ms | p95 > 200ms | Review foreign key constraints, cascading checks, and trigger count. |
| **Queries per HTTP Request**| ≤ 3 queries | > 6 queries | Refactor to batch joins or single interactive transaction. |
| **Slow Query Ratio** | < 0.1% of queries | > 1% > 500ms | Trigger incident review; check table bloat and autovacuum status. |

---

#### 4. Resetting Statistics

Reset statistics baseline after deploying schema indexes or optimizing code:

```sql
SELECT pg_stat_statements_reset();
```


---

<!-- merged from docs/performance-baseline.md -->
## Performance Baseline

### SP-PLASTECH ERP — Baseline Performance Metrics

**Target Endpoint**: `GET /api/v1/users`  
**Measurement Pre-Condition**: Prior to Cloudflare Hyperdrive and Smart Placement activation.

#### Baseline Values
- **Database Round-Trip Count**: 2 roundtrips (1 count query + 1 paginated row query)
- **Local Dev Server DB Latency (p95)**: 12.4 ms
- **Cache-Control**: `no-store, no-cache, must-revalidate`
- **Server-Timing Header**: `db;dur=12.4;desc="queries=2"`


---

<!-- merged from docs/module-leaks.md -->
## Module Leaks

### Module Leaks Register

This document tracks cross-module boundary violations and legacy data leaks identified during the modular monolith migration, along with their resolution strategies.

| Module | File | Line | Violation / Leak Description | Resolution / Target Phase |
| :--- | :--- | :--- | :--- | :--- |
| `sales` | `apps/web/src/modules/sales/components/redesign/SalesOrderWizard.tsx` | 41 | Imports `INITIAL_MOLDS` from legacy `data/manufacturingData.ts` | Data-file leak: deferred to manufacturing module migration when `data/` is deleted and replaced by manufacturing public API/contracts |
| `sales` | `apps/web/src/modules/sales/screens/SalesViews.tsx` | 60 | Imports `recordOutwardDispatchInventoryMovement` from warehouse hook | Resolved via warehouse public module API (`@/src/modules/warehouse`) |
