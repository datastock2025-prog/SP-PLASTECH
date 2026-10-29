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

---

## 4. CONTAINER ARCHITECTURE & PODMAN LIFECYCLE CHEAT SHEET

### 4.1 Quick Command Cheat Sheet
- **Instant daily dev start (< 2s, zero-rebuild)**: `npm run dev:podman` (`podman compose up -d`)
- **Rebuild with new dependencies**: `npm run dev:podman:build` (`podman compose up --build -d`)
- **Stop local containers**: `npm run dev:podman:down` (`podman compose down`)
- **Stream service logs**: `npm run dev:podman:logs` (`podman compose logs -f`)
- **Restart backend only (~1s)**: `podman restart sp-plastech-dev-api-1`
- **Build sealed production image**: `podman compose -f compose.prod.yaml build`

### 4.2 Dev vs Prod Rules
1. **Dev Bind Mounts**: `./middleware:/app:Z` + anonymous `/app/node_modules` for sub-second hot reload with `tsx watch`.
2. **Prod Isolation**: `compose.prod.yaml` contains zero host bind mounts and builds sealed non-root images.
3. **Zero-Cache Live Development Delivery**: Native Vite Dev Server (`npm run dev`) on `:3000` proxies `/api` directly to `:4000` with sub-millisecond Hot Module Replacement (HMR) directly from source code.
4. **WSL2 Resource Guard**: `C:\Users\<user>\.wslconfig` allocates `memory=4GB`, `processors=3`, `swap=2GB`, `pageReporting=true` to prevent 8GB host paging.
