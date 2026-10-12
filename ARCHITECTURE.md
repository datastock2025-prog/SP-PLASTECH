# SP-PLASTECH ERP — Workspace Architecture

## 1. Development Topology

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

## 2. Local Podman Stack Commands

```powershell
# Start the full 4-service stack (db, migrate, api, web)
podman compose up --build

# Or via npm script
npm run dev:podman

# Tear down the stack
podman compose down

# Tear down with volume removal (clean slate)
podman compose down -v
```

Health check endpoints:
- Web: `http://localhost:3000`
- API Health & Auth: `http://localhost:4000/api/auth/ok`
