# SP-PLASTECH ERP - AI Workspace Memory

## 1. Project Overview
- **Domain**: Plastic Manufacturing ERP (MRP, BOM, Production Scheduling, Procurement, Item Master).
- **Architecture**: Hybrid Monorepo. Frontend (React/Vite) -> Backend (Node.js/Prisma) -> Database (PostgreSQL/Supabase).
- **Deployment**: Frontend on Cloudflare Pages. Backend on Cloud/Podman.

## 2. Tech Stack
- **Frontend**: React 18+, Vite, TypeScript, TailwindCSS.
- **State & Data Fetching**: TanStack Query (React Query) v5 (MANDATORY for all API calls).
- **Validation**: Zod (MANDATORY for all API responses and form inputs).
- **Database**: PostgreSQL via Supabase (RLS enabled, Multi-tenant).
- **Backend Service**: Node.js / Prisma (REST API Service in `backend/`).
- **Hosting**: Cloudflare Pages (Frontend), Cloudflare Workers/Edge & Container Backend.

## 3. STRICT ENTERPRISE RULES (AI MUST FOLLOW)
1. **NO Raw Fetches**: Never use `useEffect` + `fetch`/`axios` for data fetching. ALWAYS use `useQuery` or `useMutation` from TanStack Query.
2. **NO Unpaginated Queries**: Never fetch "all" records from the database. ALWAYS use cursor-based pagination (`LIMIT` + `cursor`) or offset pagination.
3. **Single Source of Truth**: NEVER use `localStorage` or `sessionStorage` for shared API data. The TanStack Query cache is the SSOT.
4. **Type Safety**: All API responses must be validated with Zod schemas before reaching the UI.
5. **Multi-Tenant Isolation**: Every database query must include `tenant_id` filtering. Never leak data across tenants.
6. **Cloudflare Cache Rules**: Dynamic API responses must include `Cache-Control: no-store, no-cache, must-revalidate`.
7. **Form Submissions**: All form submissions must use `useMutation` with `queryClient.invalidateQueries()` to ensure cross-browser consistency.

**API CALL**
Rule 1: Enforce TanStack Query (React Query) for ALL Data Fetching
Replace all useEffect + fetch/axios calls with useQuery or useMutation.
Configure staleTime: 1000 * 60 * 5 (5 minutes) and refetchOnWindowFocus: true to ensure cross-browser consistency without spamming the server.
Use queryClient.invalidateQueries() after any mutation to keep all browsers synchronized.
Rule 2: Implement Strict Cursor-Based Pagination
NEVER fetch "all" records. Implement a useInfiniteQuery or paginated useQuery with limit and cursor (or offset) parameters.
Ensure the Supabase/PostgreSQL query uses .range(start, end) or WHERE id > cursor LIMIT 50.
Rule 3: Centralized, Type-Safe API Client
Route all requests through a single api-client.ts file that reads the base URL from import.meta.env.VITE_API_BASE_URL.
Use Zod to validate the API response schema before it reaches the UI, preventing silent failures.
Rule 4: Cloudflare Cache Bypass for Dynamic Data
Ensure any API route or Cloudflare Function returning dynamic user/tenant data includes these headers:
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Pragma: no-cache
Expires: 0
Rule 5: Single Source of Truth (SSOT)
Remove any reliance on localStorage or component-level state for shared API data. The TanStack Query cache is the SSOT.
