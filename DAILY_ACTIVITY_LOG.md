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


