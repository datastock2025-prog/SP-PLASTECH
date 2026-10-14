# SP-PLASTECH ERP — Backend & Middleware Removal Report (Step 3: Completed)

> **Branch**: `chore/remove-backend-middleware`  
> **Status**: Completed  
> **Rule**: All planned deletions and re-pointings executed successfully. Archive tag `archive/backend-middleware-2026-10` preserved.

---

## 1. Executive Summary

In accordance with architectural decisions **D1** (Single Unified API at `auth-server/` on port 4000) and **D2** (Client routes through unified API gateway), the legacy `backend/` (NestJS + Prisma) and `middleware/` (NestJS microservices) folders are scheduled for removal.

All active endpoints have been successfully migrated to `auth-server/` (Hono + Better Auth + embedded-postgres/pg) and domain contracts under `apps/api/` and `packages/contracts/`.

This report documents every connection, environment variable, container configuration, CI pipeline job, and documentation reference to `backend`, `middleware`, `NestJS`, `Prisma`, and `Redis` across the codebase.

---

## 2. Comprehensive Connection Matrix

### 2.1 Compose & Container Orchestration

| File | Line(s) | Match | Planned Action | Reason / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `compose.yaml` | 45 | `BACKEND_URL: http://api:4000` | **edit** | Update to `http://auth-server:4000` or keep as API service reference |
| `compose.yaml` | 36, 43, 46, 47 | `3000` | **keep with reason** | Port 3000 is Vite frontend dev server |
| `containers/frontend.Dockerfile` | 7 | `EXPOSE 3000` | **keep with reason** | Vite frontend container port |
| `containers/kong.yml` | 7 | `url: http://rest:3000/` | **edit** | Update target upstream to `http://auth-server:4000/` |
| `containers/kong.yml` | 17, 18, 50, 51 | `http://localhost:3000` | **keep with reason** | Allowed CORS origins for frontend |
| `infra/optional/docker-compose.yml` | 37-53, 95, 103 | `redis:` service | **delete** | Standalone Redis session store no longer used; sessions handled by `auth-server` / Postgres |
| `infra/optional/docker-compose.yml` | 60-86 | `backend:` service | **delete** | Legacy NestJS backend container definition |
| `infra/optional/docker-compose.ai.yml` | 11, 50, 53 | `NESTJS_GATEWAY_URL`, `backend:3000` | **edit** | Repoint AI sidecars to `auth-server:4000` or remove optional dev compose |

---

### 2.2 CI/CD Pipelines (`.github/workflows/`)

| File | Line(s) | Match | Planned Action | Reason / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `.github/workflows/ci-cd.yml` | 69-92 | `backend-build:` job | **delete** | Removes NestJS build & Prisma generate steps from GitHub Actions CI |
| `.github/workflows/ci-cd.yml` | 140 | `needs: [frontend-build, backend-build]` | **edit** | Change to `needs: [frontend-build]` so deploy pipeline succeeds without legacy backend |
| `.github/workflows/ci-cd.yml` | 194 | `VITE_API_URL: ${{ secrets.VITE_API_URL }}` | **keep with reason** | Frontend API URL secret for Cloudflare Pages build |
| `infrastructure/github/workflows/ci.yml` | 30-58 | `backend-check:` job | **delete** | Legacy backend lint/prisma/jest quality gate |

---

### 2.3 Package Manifests & Workspaces

| File | Line(s) | Match | Planned Action | Reason / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `package.json` | 6-8 | `"workspaces": ["apps/*"]` | **keep with reason** | Standard monorepo workspace for `@apps/api` and `@apps/web` |
| `package.json` | 10 | `"dev": "vite --port=3000 --host=0.0.0.0"` | **keep with reason** | Vite frontend dev port |
| `package.json` | Dependencies | `axios`, `express`, `dotenv`, `@types/express` | **delete / prune** | Run `npm prune` to remove unused legacy packages |
| `package-lock.json` | Transitive | `backend`, `middleware` references | **edit** | Auto-updated by `npm prune` / workspace refresh |

---

### 2.4 Build, Tooling & Environment Configuration

| File | Line(s) | Match | Planned Action | Reason / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `vite.config.ts` | 22 | `port: 3000` | **keep with reason** | Vite frontend dev server port |
| `vite.config.ts` | 26 | `target: process.env.BACKEND_URL ... 'http://localhost:4000'` | **edit** | Point proxy fallback cleanly to `http://localhost:4000` (`auth-server`) |
| `vite.config.ts` | 32 | `Backend gateway offline...` | **edit** | Update error message to `API server offline` |
| `playwright.config.ts` | 15, 33 | `baseURL: 'http://127.0.0.1:3000'` | **keep with reason** | Web server URL for Playwright tests |
| `.env.example` | 15, 26, 28 | `PORT=3000`, `VITE_API_URL=...` | **keep with reason** | Frontend environment variables |
| `.env.example` | 27 | `BACKEND_URL=http://localhost:4000` | **keep with reason** | API server URL for reverse proxy |
| `.env` | 23 | `VITE_API_URL=http://localhost:3000` | **keep with reason** | Frontend origin |
| `.env` | 24 | `BACKEND_URL=http://localhost:3000` | **edit** | Change to `http://localhost:4000` (port of `auth-server`) |
| `.env` | 25 | `MIDDLEWARE_URL=http://localhost:3001` | **delete** | Remove legacy NestJS middleware URL |
| `.gitignore` | N/A | References to `.env`, `dist`, `node_modules` | **keep with reason** | Standard git ignore rules |

---

### 2.5 Cloudflare Functions & Edge Proxies

| File | Line(s) | Match | Planned Action | Reason / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `functions/api/[[path]].ts` | 3, 20-34 | `backendBase = env.BACKEND_URL ... 'http://localhost:3000'` | **edit** | Update default target to `http://localhost:4000` (local) or production API origin |
| `functions/api/[[path]].ts` | 10 | `MIDDLEWARE_URL?: string;` | **delete** | Remove dead middleware variable |
| `functions/rest/[[path]].ts` | 11 | `BACKEND_URL?: string;` | **edit** | Keep unified API target |
| `infrastructure/cloudflare/worker.js` | 136-138 | `backendUrl = env.BACKEND_ORIGIN_URL` | **edit** | Rename variable to `apiOriginUrl` |
| `infrastructure/cloudflare/wrangler.toml` | 7 | `BACKEND_ORIGIN_URL = ...` | **edit** | Update or keep as Cloudflare origin target |

---

### 2.6 Infrastructure & Upstreams

| File | Line(s) | Match | Planned Action | Reason / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `infrastructure/nginx/sp-plastech.conf` | 16-18, 69, 98, 117 | `upstream sp_plastech_backend { server 127.0.0.1:3000; }` | **edit** | Point upstream to `auth-server` at `127.0.0.1:4000` |
| `infrastructure/n8n/error_trigger_workflow.json` | 47 | `http://backend:3000/api/ai-gateway/...` | **edit** | Repoint to `http://auth-server:4000/api/v1/ai-gateway` |
| `infrastructure/openwebui/secure_erp_functions.py` | 30 | `http://backend:3000/api/ai-gateway` | **edit** | Repoint to `http://auth-server:4000/api/v1/ai-gateway` |

---

### 2.7 Frontend Application & Adapters (`src/`)

| File | Line(s) | Match | Planned Action | Reason / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `src/shared/db/index.ts` | 17 | `* - 'rest_api': NestJS BFF / Local REST API Gateway` | **edit** | Update comment to refer to `Unified Hono API Gateway` |
| `src/shared/db/types.ts` | 3-4 | `(Supabase, NestJS REST API, PostgreSQL/Prisma...)` | **edit** | Clean up comment to `(PostgreSQL, Supabase, Hono REST API)` |
| `src/security/auth/MfaService.ts` | 49 | `(production sends to NestJS backend /auth/mfa/verify)` | **edit** | Update comment to `(production sends to auth-server /api/auth/mfa)` |
| `src/security/compliance/GdprService.ts` | 52 | `// In production, dispatch to backend API...` | **edit** | Update comment |
| `src/shared/config.ts` | 4, 26 | `http://localhost:3000` | **keep with reason** | Refers to Vite frontend dev port |
| `src/lib/api-client.ts` | 11 | `import.meta.env?.VITE_API_BASE_URL` | **keep with reason** | Base API path resolution |
| `src/features/ai/api/aiApi.ts` | 11 | `// Post prompt to AI Backend / BFF Gateway` | **edit** | Update comment to `AI Gateway` |
| `src/features/identity/useIdentity.ts` | 23 | `// shortcut: network error or backend offline...` | **keep with reason** | Error fallback comment |
| `src/data/*`, `src/services/*` | Various | Numeric `3000`, `3002`, `NEST` (e.g. `nested`, `Nestle India`) | **keep with reason** | Domain business data (batch sizes, RAL color 3002, customer Nestle, nested BOM tree) |

---

### 2.8 Documentation & Memory Files

| File | Line(s) | Match | Planned Action | Reason / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `README.md` | 19, 28, 210, 285-429 | Sequence diagrams with `NestJS`, `Redis`, `Middleware` | **edit** | Modernize diagrams to show `React 19 -> Auth Server (Hono) -> PostgreSQL` |
| `ARCHITECTURE.md` | 7, 18, 22, 43 | `apps/web :3000` -> `apps/api :4000` | **keep with reason** | Accurate architecture diagram |
| `WORKSPACE_MEMORY.md` | 5, 13, 24, 40, 111 | Mentions of `backend/`, `middleware/`, `Prisma` | **edit** | Mark `backend/` and `middleware/` completely removed; document `auth-server` as sole API |
| `MIGRATION_PLAN_16_MODULES.md` | 5, 18 | `Node.js / Prisma & Next.js BFF` | **edit** | Update architecture summary to Hono + PostgreSQL |
| `DAILY_ACTIVITY_LOG.md` | Historic entries | Historic log records of past phases | **keep with reason** | Strictly append-only log rule; add Section 19 documenting removal |

---

## 3. Summary of Planned Actions

- **Files to Delete Entirely**:
  - `backend/` (All files and directories)
  - `middleware/` (All files and directories)
- **CI Jobs to Delete**:
  - `backend-build` in `.github/workflows/ci-cd.yml`
  - `backend-check` in `infrastructure/github/workflows/ci.yml`
- **Compose Services to Delete**:
  - `backend` service in `infra/optional/docker-compose.yml`
  - `redis` service in `infra/optional/docker-compose.yml`
- **Configs to Edit**:
  - `.github/workflows/ci-cd.yml` (remove `backend-build` dependency from `deploy` job)
  - `vite.config.ts` (fallback target set to port 4000)
  - `.env` and `.env.example` (clean up `BACKEND_URL=http://localhost:4000`, remove `MIDDLEWARE_URL`)
  - `functions/api/[[path]].ts` (clean up dead middleware variables)
  - `infrastructure/nginx/sp-plastech.conf` (point upstream to port 4000)
  - `README.md`, `ARCHITECTURE.md`, `WORKSPACE_MEMORY.md`, `MIGRATION_PLAN_16_MODULES.md`
