# SP-PLASTECH ERP — Enterprise Architecture, Security & Performance Audit Report

**Date:** 2026-10-24  
**Audit Standard:** Ponytail Senior Quality Audit (Correctness, Security, Scale, Testing, Speed, Lean)  
**Assumed Production Load:** Multi-tenant manufacturing ERP with 1 to 5 production plants, 50 to 500 concurrent active shopfloor operators, quality inspectors, sales reps, and accountants; up to ~5,000 HTTP requests per minute at peak shift changes; database hosting 100k+ inventory ledger rows and 10k+ catalog items.

---

## Executive Summary

The SP-PLASTECH ERP codebase has recently undergone significant structural modernization:
1. **Backend Modular Monolith**: Migrated 100% of the 16 domain modules to typed Drizzle ORM queries, achieving a clean **0 raw SQL call sites** baseline with strict CI enforcement.
2. **Two-Layer Reference Model**: Completely eliminated legacy DTO mappers (`dtoMappers.ts`) and removed all `localStorage` state violations, establishing TanStack Query v5 as the pure Single Source of Truth (SSOT).
3. **Database-Driven Change Data Capture (CDC)**: Implemented Postgres-level `erp_notify()` and `audit_row_change()` triggers on 31 tables, fanned out over Server-Sent Events (SSE) `/api/v1/events` directly into frontend TanStack Query invalidations.

However, several critical enterprise gaps remain in frontend error handling, unpaginated grid loading, screen code bloat, and in-memory rate limiting.

---

## 1. Security Posture Analysis

### What Is Working Well
* **OWASP ASVS L2 CSRF Protection** (`middleware/src/middleware/csrf.ts`): State-changing HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) strictly validate `Origin`, `Referer`, or `X-Requested-With` against configured trusted origins.
* **Row-Level Security (RLS) Isolation**: Queries executed via `withTx` drop superuser privileges to `SET LOCAL ROLE erp_app` and inject tenant/user session variables (`app.current_tenant_id`, `app.current_user_id`), enforcing database-level multi-tenant boundaries.
* **Zero SQL Injection Risk**: All queries use Drizzle ORM expressions with parameterized placeholders; no raw SQL string concatenation exists in the entire repository.
* **Timing-Safe Auth Comparisons**: Timing attacks on setup tokens and auth keys are mitigated with `safeEqual` byte-xor loops.
* **Security Headers**: Hono `secureHeaders()` automatically sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict referrer policies.

### Vulnerabilities & Architectural Risks
* **In-Memory Rate Limiter Reset On Traffic Spikes** (`middleware/src/middleware/rateLimit.ts:L9`):
  When the in-memory IP tracker exceeds 5,000 entries, it executes `hits.clear()`, immediately resetting rate-limit counters for all IPs and allowing brute-force or DDoS bypass during high traffic.
* **Cross-Process Rate Limiter Isolation**:
  Rate limits are stored in Node.js process memory (`Map`). In multi-container deployments behind a load balancer, each replica tracks its own count, multiplying the allowable request threshold by $N$ instances.

---

## 2. Database & Data Fetching Optimization

### What Is Working Well
* **Optimistic Concurrency Control (OCC)**: Update operations on primary resources require `version` validation (`WHERE id = $1 AND version = $2`), preventing silent overwrites and returning HTTP 409 `CONCURRENCY_CONFLICT`.
* **Statement Timeouts & Slow Query Telemetry**: `withTx` binds a 15-second statement timeout and automatically logs structured warnings for any query taking longer than 500ms.
* **Single Round-Trip Pagination Envelopes**: Backend queries support `includeTotal=true`, calculating total records and page slices in a single database transaction.

### Bottlenecks & Gaps
* **Error Swallowing in Frontend Domain Hooks** (`useSales.ts`, `useProcurement.ts`, `useManufacturing.ts`):
  Queries wrap API calls in `try...catch` and return `[]` on error. TanStack Query treats the request as successful with zero rows, leaving the user with an empty catalog rather than an actionable error toast or retry button.
* **Hardcoded Limits Without UI Pagination Wiring**:
  Domain hooks hardcode `{ limit: 50 }` or `{ limit: 100 }` without accepting `page` or `cursor` parameters from UI screens. In databases with >100 records, older records are completely unreachable in the UI.
* **Read-Only Transaction Overhead**:
  Read endpoints routing through `withTx` issue `BEGIN`, `SET LOCAL ROLE`, `SET LOCAL app.current_tenant_id`, and `COMMIT` (4 round trips) even for simple read queries.

---

## 3. Grid Table & Component Architecture

### What Is Working Well
* **Generic Virtualized Component Built** (`frontend/src/shared/components/EntityTable.tsx`):
  Provides `@tanstack/react-virtual` virtualization, multi-select, sortable headers, sticky headers, and skeleton loaders.

### Bottlenecks & Gaps
* **Zero Adoption of `<EntityTable>` (669 Dead Lines)**:
  Despite being required by `GEMINI.md` Rule 11, `<EntityTable>` is not imported by any module screen.
* **Monolithic Screen File Bloat**:
  * `MasterDataViews.tsx`: **5,109 lines (254 KB)**.
  * `EngineeringViews.tsx`: **~2,500 lines (106 KB)**.
  * `SalesViews.tsx`: **~1,300 lines (55 KB)**.
  These files inline thousands of lines of unvirtualized HTML `<table>` markup, causing high DOM node counts (~2,500 nodes per grid) and noticeable scroll lag on low-power client devices.
* **Triplicated Screen File**:
  `frontend/apps/web/src/modules/planning/components/ScmViews.tsx`, `planning/screens/ScmViews.tsx`, and `planning/screens/PlanningViews.tsx` have identical SHA256 hashes (`579DCD03DD4489F8...`). Two of these files are completely redundant.

---

## 4. Frontend-to-Backend Connection & Code Splitting

### What Is Working Well
* **REST API Standardization**: Direct REST routes on `/api/v1/*` returning uniform envelopes `{ data: T[], meta: { page, limit, total } }`.
* **Reactive Cache Invalidation**: PostgreSQL CDC notifications via `LISTEN erp_changes` stream events over SSE (`/api/v1/events`), automatically invalidating TanStack Query keys across all browser tabs without manual polling.

### Bottlenecks & Gaps
* **Barrel Exports Breaking Dynamic `React.lazy` Code Splitting**:
  Vite reports 12 chunking warnings because module `index.ts` files statically re-export `[Module]Views.tsx` while `routes.tsx` dynamically imports them. This causes Vite to pull module views into common chunks, inflating initial bundle transfer size.

---

## 5. Scalability Limits & Failure Resilience

### Scalability Ceiling
* **1 to 5 Nodes (Immediate Scale)**: Current architecture handles 500–1,500 req/sec with Postgres connection pooling (max 20 per node). Realtime SSE broadcasts work natively across up to ~10 nodes via PostgreSQL `pg_notify`.
* **20+ Nodes (Bottlenecks)**:
  1. Each node maintains a dedicated `LISTEN` connection outside the pool, consuming database connection slots.
  2. In-memory rate limiting becomes ineffective without a shared distributed cache.
  3. Scaling requires adding a Redis Pub/Sub bridge for SSE and Redis for rate-limiting.

### Failure Recovery & Resilience
* **PostgreSQL Error Mapping**: `middleware/src/core/errors.ts` maps DB constraint codes (23505, 23503, 23514, 40001, 57014, 55P03, 42501) into clean enterprise HTTP statuses (`409`, `422`, `503`, `504`, `403`) with request tracing IDs.
* **Graceful Process Shutdown**: `server.ts` safely unbinds HTTP listeners, closes SSE channels, halts PgBoss queue workers, and drains the connection pool on `SIGINT`/`SIGTERM`.
