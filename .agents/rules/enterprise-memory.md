# SP-PLASTECH ERP — Enterprise AI Workspace Memory

## 1. Project Overview
- **Domain**: Plastic Manufacturing ERP (MRP, BOM, Production Scheduling, Procurement, Item Master).
- **Architecture**: Hybrid Monorepo. Frontend (React/Vite) -> Middleware (Next.js) -> Database (PostgreSQL/Supabase).
- **Deployment**: Frontend on Cloudflare Pages. Middleware/Backend currently local Podman, migrating to Cloud.

## 2. Tech Stack
- **Frontend**: React 18+, Vite, TypeScript, TailwindCSS.
- **State & Data Fetching**: TanStack Query (React Query) v5 (MANDATORY for all API calls).
- **Validation**: Zod (MANDATORY for all API responses and form inputs).
- **Database**: PostgreSQL via Supabase (RLS enabled, Multi-tenant).
- **Middleware**: Next.js (API routes / Server Actions).
- **Hosting**: Cloudflare Pages (Frontend), Cloudflare Workers/Pages Functions (Edge API).

## 3. STRICT ENTERPRISE RULES (AI MUST FOLLOW)
1. **NO Raw Fetches**: Never use `useEffect` + `fetch`/`axios` for data fetching. ALWAYS use `useQuery` or `useMutation` from TanStack Query.
2. **NO Unpaginated Queries**: Never fetch "all" records from the database. ALWAYS use cursor-based pagination (`LIMIT` + `cursor`) or offset pagination.
3. **Single Source of Truth**: NEVER use `localStorage` or `sessionStorage` for shared API data. The TanStack Query cache is the SSOT.
4. **Type Safety**: All API responses must be validated with Zod schemas before reaching the UI.
5. **Multi-Tenant Isolation**: Every database query must include `tenant_id` filtering. Never leak data across tenants.
6. **Cloudflare Cache Rules**: Dynamic API responses must include `Cache-Control: no-store, no-cache, must-revalidate`.
7. **Form Submissions**: All form submissions must use `useMutation` with `queryClient.invalidateQueries()` to ensure cross-browser consistency.
