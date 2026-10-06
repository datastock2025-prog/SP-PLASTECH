# SP-PLASTECH ERP - AI Workspace Memory

## 1. Project Overview
- **Domain**: Plastic Manufacturing ERP (MRP, BOM, Production Scheduling, Procurement, Item Master).
- **Architecture**: Hybrid Monorepo. Frontend (React/Vite) -> Backend (Node.js/Prisma) -> Database (PostgreSQL/Supabase).
- **Deployment**: Frontend on Cloudflare Pages. Backend on Cloud/Podman.

## 2. Tech Stack
- **Frontend**: React 19 / Vite, TypeScript, TailwindCSS.
- **State & Data Fetching**: TanStack Query (React Query) v5 (MANDATORY for all API calls).
- **Validation**: Zod (MANDATORY for all API responses and form inputs).
- **Database**: PostgreSQL via Supabase (RLS enabled, Multi-tenant).
- **Backend Service**: Node.js / Prisma (REST API Service in `backend/`).
- **Hosting**: Cloudflare Pages (Frontend), Cloudflare Workers/Edge & Container Backend.

## 3. STRICT ENTERPRISE RULES (AI MUST FOLLOW)
1. **NO Raw Fetches**: Never use `useEffect` + `fetch`/`axios` for data fetching. ALWAYS use `useQuery` or `useMutation` from TanStack Query.
2. **NO Unpaginated Queries**: Never fetch "all" records from the database. ALWAYS use cursor-based pagination (`LIMIT` + `cursor`) or offset pagination.
3. **Single Source of Truth (SSOT)**: NEVER use `localStorage`, `sessionStorage`, or custom in-memory array caches (`this.cache`) for shared API data. The TanStack Query cache is the SSOT.
4. **Type Safety & Runtime Validation**: All API responses and persistence inputs must be validated with Zod schemas before reaching the UI.
5. **Multi-Tenant Isolation**: Every database query must include `tenant_id` filtering. Never leak data across tenants.
6. **Cloudflare Cache Rules**: Dynamic API responses must include `Cache-Control: no-store, no-cache, must-revalidate`.
7. **Form Submissions & Cache Invalidation**: All mutations must use `useMutation` with `queryClient.invalidateQueries()` and realtime WebSocket broadcasts.
8. **Universal Database Adapter (`db`)**: Never call raw `supabase.from(...)` in components, hooks, or service layers. ALWAYS use the vendor-agnostic Database Adapter singleton `db` (`db.findMany`, `db.findOne`, `db.upsert`, `db.count`, `db.delete`, `db.subscribe`) from `src/shared/db`. This guarantees seamless provider portability (Supabase Cloud, PostgreSQL/Prisma, Local Podman, REST API BFF) without breaking UI contracts.
9. **Code-Splitting & Dynamic Module Hydration (`React.lazy`)**: Never import heavy monolithic module views synchronously into initial bundles. ALWAYS use `React.lazy()` with `<React.Suspense fallback={<ModuleLoadingFallback moduleName={currentView} />}>` in `App.tsx` and route hubs.
10. **Domain-Driven 3-Layer Standard per Module (`src/features/[module]/`)**:
    - `types.ts` — Zod schemas, inferred types, and domain DTO definitions.
    - `api.ts` — Typed data endpoints executing directly via the `db` adapter.
    - `use[Module].ts` — TanStack Query v5 queries, mutations, and cache management.
11. **Shared Generic UI Components**: Standardize and eliminate code duplication across all domain views:
    - `<EntityTable<T> />` (`src/shared/components/EntityTable.tsx`) — Generic paginated, searchable, sortable data table with multi-select and action slots.
    - `<EntityDrawer<T> />` (`src/shared/components/EntityDrawer.tsx`) — Standardized edit/view slideover drawer with tab navigation, dirty-state detection, and action buttons.
    - `<AuditHistoryDrawer />` (`src/shared/components/AuditHistoryDrawer.tsx`) — Shared audit log and change governance viewer with visual timeline stream and field diff tracking.
12. **Centralized DTO Mappers**: ALWAYS use centralized transformers in `src/shared/utils/dtoMappers.ts` (`mapDbRowToItemMaster`, `mapDbRowToBom`, `mapDbRowToWorkOrder`, `mapDbRowToSalesOrder`, `mapDbRowToPurchaseOrder`, `mapDbRowToMachine`, `mapDbRowToCustomer`) to enforce strict type coercion across database rows.

---

## 4. API & DATA LAYER PROTOCOLS
- **Rule 1: Enforce TanStack Query (React Query v5) for ALL Data Fetching**:
  Replace all `useEffect` + `fetch`/`axios` calls with `useQuery` or `useMutation`.
  Configure `staleTime: 1000 * 60 * 5` (5 minutes) and `refetchOnWindowFocus: true` to ensure cross-browser consistency without spamming the server.
  Use `queryClient.invalidateQueries()` after any mutation to keep all browser sessions synchronized.
- **Rule 2: Implement Strict Cursor/Offset Pagination & Bounded Selects**:
  NEVER fetch "all" records into the UI. Implement bounded queries with `limit` (max 50-100) and selective column projections (`ITEM_LEAN_SELECT_COLUMNS`).
- **Rule 3: Centralized, Type-Safe Data Endpoints with Zod**:
  Route all requests through `api-client.ts` and domain endpoints using the `db` adapter.
  Use Zod schemas with type-coercing preprocessors to validate and sanitize data, preventing silent UI failures.
- **Rule 4: Cloudflare Cache Bypass for Dynamic Data**:
  Ensure dynamic API calls include `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`.
- **Rule 5: Single Source of Truth (SSOT)**:
  Remove any reliance on `localStorage` or ad-hoc state stores (`liveDataStore`) for shared backend data. The TanStack Query cache is the SSOT.
- **Rule 6: Universal Database Adapter Gateway (`src/shared/db`)**:
  All persistence operations must route through `db` adapter methods (`db.upsert`, `db.findMany`, `db.findOne`, `db.delete`). Direct client instantiation is strictly prohibited outside `src/shared/db/adapters/`.
