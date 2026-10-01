# SP-PLASTECH ERP — Permanent Workspace Memory & System Protocols
> **Document Purpose**: Canonical, permanent reference of enterprise architecture protocols, security rules, coding standards, and operational guidelines that MUST be strictly followed across all tasks in this workspace.

---

## 1. Core Architecture Protocols

### 1.1 Strict Database-First Single Source of Truth
* **Zero Dummy / Mock / Seed Fallback in Production Code**: The database (PostgreSQL / Supabase via backend API) is the single source of truth. Under no circumstances should the application silently default or fall back to mock/seed data.
* **No Direct DB Access from Frontend UI**: Frontend components (`src/components/*`, `src/views/*`, `src/pages/*`) must NEVER invoke `supabase.from(...)` directly for reads or writes.
* **Strict API-First Ingestion**: All data operations (queries, mutations, transactions) must route exclusively through backend endpoints via `apiClient` (`/api/v1/*`).

### 1.2 TanStack React Query (v5) + UniversalSyncManager
* **Query Key Factories**: All query keys must follow centralized, typed key factories defined in `src/shared/queryKeys.ts`.
* **Real-Time Invalidation Bridge**: Real-time cross-tab (`BroadcastChannel`) and cross-device CDC events must be handled by `UniversalSyncManager` and piped into `UniversalSyncBridge.ts` to invalidate `QueryClient` cache silently without UI flicker.
* **Cache Lifetime Standards**:
  * Default `staleTime`: 5 minutes (`gcTime`: 30 minutes).
  * High-frequency telemetry/OEE/Control Tower: 15–30 seconds.
  * Master data/configurations: 10 minutes.

### 1.3 16 Enterprise Domain Modules
All domain features must reside within their respective module boundaries:
1. **Auth & Session** (`/api/v1/auth`)
2. **Executive Dashboard & KPIs** (`/api/v1/dashboard`)
3. **Sales & Customer Management** (`/api/v1/sales`)
4. **Engineering & BOM Management** (`/api/v1/engineering`)
5. **Planning & MRP** (`/api/v1/planning`)
6. **Manufacturing (MES)** (`/api/v1/manufacturing`)
7. **Quality & SPC** (`/api/v1/quality`)
8. **Procurement & Suppliers** (`/api/v1/procurement`)
9. **Warehouse & Inventory** (`/api/v1/warehouse`)
10. **SCM & Logistics** (`/api/v1/scm`)
11. **MEP & Toolroom Maintenance** (`/api/v1/mep`)
12. **Finance & General Ledger** (`/api/v1/finance`)
13. **Human Resources (HR)** (`/api/v1/hr`)
14. **Master Data Governance** (`/api/v1/master-data`)
15. **Analytics & Live OEE** (`/api/v1/analytics`)
16. **Administration & Security RBAC** (`/api/v1/admin`)

---

## 2. Security & Compliance Protocols

### 2.1 Zero Secret Leakage Policy
* **Never commit or log sensitive secrets**: API keys, database passwords, Cloudflare API tokens, Supabase service role keys, or private JWT secrets must never appear in source code, logs, commits, or artifacts.
* **Environment Configuration**: Always use environment variables (`.env`, Cloudflare Secrets, GitHub Secrets) and refer to `.env.example` for templated variable names.

### 2.2 Multi-Tenant Isolation & RBAC
* Every API request must carry tenant context (`X-Tenant-ID`) and correlation IDs (`X-Correlation-ID`).
* Frontend views must enforce permission gates via `TenantContext` and `useWorkspaceRbac`.

---

## 3. Engineering & Code Quality Protocols

### 3.1 Strict TypeScript & Build Integrity
* All code must compile with **0 TypeScript errors** (`tsc --noEmit`).
* Any modified or created hook, service, or component must be strictly typed (no loose `any` bypasses without justification).
* Production builds (`npm run build`) must succeed with clean bundle generation before any release.

### 3.2 Phase-Wise Implementation Standard
* Plan complex features across explicit phases.
* Validate each phase completely (types, tests, real-time sync) before advancing.
* Maintain clean Git history with descriptive conventional commit messages (`feat(...)`, `fix(...)`, `refactor(...)`).

---

## 4. Daily Logging Protocol
* Every development session or modification must be recorded in `DAILY_ACTIVITY_LOG.md`.
* The activity log is strictly **append-only** (never delete or overwrite past history).
