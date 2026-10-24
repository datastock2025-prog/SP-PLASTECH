# SP-PLASTECH ERP — AI Behavioral Rules & System Protocols

## 1. Project Overview
- **Domain**: Plastic Manufacturing ERP (MRP, BOM, Production Scheduling, Procurement, Item Master).
- **Architecture**: Hybrid Monorepo. Frontend (React/Vite) -> Backend (Node.js/Hono/Drizzle ORM in `middleware/`) -> Database (PostgreSQL/Supabase).
- **Deployment**: Frontend on Cloudflare Pages. Backend on Cloud/Podman.

## 2. Tech Stack
- **Frontend**: React 19 / Vite, TypeScript, TailwindCSS.
- **State & Data Fetching**: TanStack Query (React Query) v5 (MANDATORY for all API calls).
- **Validation**: Zod (MANDATORY for all API responses and form inputs).
- **Database**: PostgreSQL via Supabase / Podman (RLS enabled, Multi-tenant).
- **Backend Service**: Node.js / Hono / Drizzle ORM (REST API Service in `middleware/`).
- **Hosting**: Cloudflare Pages (Frontend), Cloudflare Workers/Edge & Container Backend.

## 3. STRICT ENTERPRISE RULES (AI MUST FOLLOW)
1. **NO Raw Fetches**: Never use `useEffect` + `fetch`/`axios` for data fetching. ALWAYS use `useQuery` or `useMutation` from TanStack Query.
2. **NO Unpaginated Queries**: Never fetch "all" records from the database (e.g. limit=5000 is forbidden). ALWAYS use cursor-based or offset pagination with bounded limits (default 20-50, max 100) and selective column projections (`ITEM_LEAN_SELECT_COLUMNS`).
3. **Single Source of Truth (SSOT)**: NEVER use `localStorage`, `sessionStorage`, or custom in-memory array caches (`this.cache`) for shared API data. The TanStack Query cache is the SSOT.
4. **Type Safety & Runtime Validation**: All API responses and persistence inputs must be validated with Zod schemas before reaching the UI.
5. **Multi-Tenant Isolation**: Every database query must include `tenant_id` filtering. Never leak data across tenants.
6. **Cloudflare Cache Rules**: Dynamic API responses must include `Cache-Control: no-store, no-cache, must-revalidate`.
7. **Form Submissions & Cache Invalidation**: All mutations must use `useMutation` with `queryClient.invalidateQueries()` and realtime WebSocket broadcasts.
8. **Direct Typed REST Domain Endpoints (Legacy Adapter Sunset Complete)**:
   - Frontend UI components and TanStack Query hooks communicate strictly via typed, domain-driven API clients (`apiClient`, `itemEndpoints`, `bomEndpoints`, `salesApi`, `procurementApi`, `warehouseApi`, etc.) executing standard HTTP REST verbs (`GET`, `POST`, `PATCH`, `DELETE`) with typed response envelopes (`{ data: T[], meta: { total, ... } }`).
   - The legacy database adapter (`src/shared/db`, `RestApiAdapter.ts`) has been **permanently decommissioned and deleted**. Direct REST endpoints with single-round-trip pagination (`includeTotal=true`) and server-side aggregation are the sole standard across all 16 modules. Zero secondary `/count` calls are permitted.
9. **Code-Splitting & Dynamic Module Hydration (`React.lazy`)**: Never import heavy monolithic module views synchronously into initial bundles. ALWAYS use `React.lazy()` with `<React.Suspense fallback={<ModuleLoadingFallback moduleName={currentView} />}>` in `App.tsx` and route hubs.
10. **Domain-Driven 3-Layer Standard per Module (`src/features/[module]/`)**:
    - `types.ts` — Zod schemas, inferred types, and domain DTO definitions.
    - `api.ts` — Typed data endpoints executing directly via HTTP REST client (`apiClient` / `api`) with Zod runtime validation and typed envelopes.
    - `use[Module].ts` — TanStack Query v5 queries, mutations, direct cache writes, and invalidations.
11. **Shared Generic UI Components**: Standardize and eliminate code duplication across all domain views:
    - `<EntityTable<T> />` (`src/shared/components/EntityTable.tsx`) — Generic paginated, searchable, sortable data table with multi-select and action slots.
    - `<EntityDrawer<T> />` (`src/shared/components/EntityDrawer.tsx`) — Standardized edit/view slideover drawer with tab navigation, dirty-state detection, and action buttons.
    - `<AuditHistoryDrawer />` (`src/shared/components/AuditHistoryDrawer.tsx`) — Shared audit log and change governance viewer with visual timeline stream and field diff tracking.
12. **Pure Two-Layer Reference Model (Zero DTO Mappers)**: Database schema types flow directly to frontend via typed REST response envelopes. TanStack Query hooks consume typed JSON directly; zero legacy hand-written DTO mapper functions.

---

## 4. ENTERPRISE BACKEND ARCHITECTURE & PROTOCOLS

### 4.1 Database Design Standards (PostgreSQL + Drizzle ORM)
- **Naming Conventions**:
  - Tables: Lowercase, plural, snake_case (`items`, `bill_of_materials`, `audit_logs`).
  - Columns: Lowercase, snake_case (`part_weight_grams`, `cycle_time_seconds`, `created_at`, `deleted_at`).
  - Enums: PascalCase for type name, `UPPER_SNAKE_CASE` for values.
  - Primary Keys: Named `id`, UUID v4 generated at database level via `gen_random_uuid()`.
  - Foreign Keys: `<singular_referenced_table>_id` with explicit ON DELETE and ON UPDATE behavior (default `RESTRICT`).
  - Bridge Tables: Alphabetical order separated by underscore in singular form (e.g. `bom_item`).
  - Timestamps: Mandatory `created_at`, `updated_at`, and nullable `deleted_at` on all primary entities.
- **Normalization (3NF)**: Baseline 3NF; denormalization permitted only with documented justification.
- **Indexing Strategy**:
  - Every foreign key indexed.
  - Composite indexes on `(tenant_id, <frequently_queried_column>)` with selective column first.
  - Partial indexes for non-deleted records (`WHERE deleted_at IS NULL`).
  - GIN indexes for JSONB columns and full-text search fields.
  - BRIN indexes for append-heavy timestamp columns.
- **Constraints & Integrity**:
  - `NOT NULL` by default unless nullability explicitly required.
  - CHECK constraints for domain validation (`stock >= 0`, `cost >= 0`, `cavity_count >= 1`).
  - UNIQUE constraints on natural keys scoped by tenant (`UNIQUE(tenant_id, code) WHERE deleted_at IS NULL`).

### 4.2 Soft Deletes & Auditability
- Primary entity queries filter `deleted_at IS NULL` by default.
- Maintain immutable `audit_logs` table recording `entity_type`, `entity_id`, `action` (`CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`), `changed_fields`, `old_values`, `new_values`, `performed_by`, `performed_at`.
- Audit logging must be triggered inside the same transaction as the mutation.

### 4.3 REST API Design & Input Conventions
- **Route Structure**: Resource-based `/api/v1/<resource>`, `/api/v1/<resource>/[id]`.
- **HTTP Verbs**:
  - `GET` -> Read (idempotent, cacheable with `Cache-Control: no-store, no-cache, must-revalidate`).
  - `POST` -> Create (201 Created with created resource).
  - `PUT` -> Full replacement with OCC version check.
  - `PATCH` -> Partial update with OCC version check.
  - `DELETE` -> Soft delete (204 No Content).
- **Strict Zod Input Validation**: Trim all string inputs, reject unexpected fields, validate UUID formats.
- **Standard Pagination Inputs**: `page` (1-indexed default 1), `limit` (default 20, max 100), `sortBy` (allowlist only), `sortOrder` (`asc` | `desc`).
- **Response Envelopes**:
  - List: `{ data: T[], meta: { page, limit, total, totalPages } }`
  - Single: `{ data: T }`
  - Error: `{ error: { code: string, message: string, details?: any } }` with proper HTTP status codes (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`).

### 4.4 ACID Transactions & Optimistic Concurrency Control (OCC)
- All multi-table writes wrapped in interactive transactions.
- Entities have a `version` integer column. On every update: `WHERE id = $1 AND version = $2`. If 0 rows affected, return `409 Conflict` (`CONCURRENCY_CONFLICT`).
- Increment `version` atomically within the update.

### 4.5 Layered Error Handling & Resilience
- **Validation Layer**: Catches input errors before business logic runs (400/422 with field details).
- **Business Logic Layer**: Throws typed domain errors (`NotFoundError`, `ConflictError`, `ForbiddenError`).
- **Data Access Layer**: Translates DB constraint violations into human-meaningful messages.
- **Frontend Error Surfacing**: All API errors must trigger user-facing error toasts/banners.

### 4.6 Client-Server Synchronization, Debouncing & Race-Condition Prevention
- **Prefer: return=representation**: All `upsert`/`insert`/`update` database operations MUST include `.select('*')` (`Prefer: return=representation`). The mutation promise returns the authoritative database record.
- **Immediate Direct Cache Hydration**: On mutation success, mutate TanStack Query cache directly (`queryClient.setQueriesData`) using the returned representation before invalidating background queries. This eliminates race conditions where immediate `GET` calls return stale data before replication commits.
- **Debounced Search & Filtering**: All user-driven search inputs must be debounced (200-300ms) to prevent high-frequency connection thrashing and premature request cancellations (`net::ERR_ABORTED`).
- **Graceful Lifecycle Abort Handling**: Database adapters must safely catch and ignore `AbortError` / unmounted query cancellations during `HEAD` / `206 Partial Content` count requests without throwing unhandled exceptions to the UI.

---

## 5. CHAT SESSION LIFECYCLE PROTOCOLS (`/pause` & `/resume`)

### 5.1 `/pause` Command
When the user sends `/pause` in chat:
1. **Immediate Execution Freeze**: The agent MUST immediately cease all automated refactors, file writes, migrations, and iterative commands.
2. **State Checkpoint Persistence**: Snapshot the current working state to `.agents/session_state.json`, including active goal, completed steps, pending tasks, modified files, and exact resume instructions.
3. **Structured Acknowledgement**: Display a clear "⏸️ Session Paused" summary card showing what is preserved and reminding the user that typing `/resume` will continue from this point.
4. **Halt Turn**: Stop all tool calls immediately and conclude the turn.

### 5.2 `/resume` Command
When the user sends `/resume` in chat:
1. **State Rehydration**: Read `.agents/session_state.json` to load the paused execution state and pending tasks.
2. **Workspace Verification**: Verify files, git status, and environment readiness (e.g., local dev servers).
3. **Seamless Continuation**: Acknowledge with "▶️ Session Resumed", update state to `ACTIVE`, and immediately execute the pending tasks without requiring additional prompts.

