# Cloudflare Workers & Podman Systems Architecture
## SP-PLASTECH ERP — Full-Stack Modular Monolith

### 1. Architectural Vision
This document outlines the reference architecture for SP-PLASTECH ERP as a full-stack modular monolith featuring:
- **Frontend**: React 19 / Vite SPA
- **Backend API**: Hono TypeScript Framework
- **ORM & Schema**: Drizzle ORM
- **Database**: PostgreSQL 16 (Local Podman) / Hyperdrive & Neon Serverless (Cloudflare Production)
- **Runtimes**:
  - **Local Development**: Podman containers (`frontend`, `backend`, `postgres`) orchestrated via `compose.yaml` over a shared internal network with zero SSH tunneling.
  - **Production Deployment**: Cloudflare Workers (API + Assets via `@cloudflare/workers` & Hyperdrive connection pooler).

---

### 2. Core Constraints & Guarantees
1. **REST Protocol Uniformity**: React communicates with Hono strictly via standard HTTP REST APIs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) with typed JSON response envelopes (`{ data: T[], meta: { ... } }`).
2. **Zero Native TCP Leaks in Worker Scope**: The Cloudflare edge runtime cannot execute Node.js-native binary or TCP libraries (e.g. `ssh2`, raw native `pg` without edge support).
3. **Production Connection Pooling**: Production traffic routes through Cloudflare Hyperdrive or Neon serverless connection poolers to prevent connection starvation and latency overhead.
4. **Local Network Topology**: Local Podman containers communicate directly through internal container DNS (`db:5432`, `api:4000`, `web:3000`) without external proxy hops or SSH tunnels.
5. **SELinux Volume Compliance**: All host volume mounts in `compose.yaml` use the `:Z` shared label flag for seamless Linux/Podman security context handling.

---

### 3. Gap Analysis: Current Workspace vs. Reference Specification

| Area | Current Implementation | Target Specification | Status |
| :--- | :--- | :--- | :--- |
| **Client-Server Comm** | React Query v5 + `apiClient` / typed domain endpoints | Typed REST with Zod validation | ✅ Complete |
| **Database Schema** | Drizzle ORM + Dbmate migrations in PostgreSQL 16 | Drizzle ORM + PostgreSQL | ✅ Complete |
| **Driver Layer** | Native `pg.Pool` (`drizzle-orm/node-postgres`) in `middleware/src/db.ts` | Dual-mode edge driver: `@neondatabase/serverless` / Hyperdrive + Node fallback | 🔄 In Progress |
| **Cloudflare Config** | `middleware/wrangler.jsonc` with static assets | `wrangler.jsonc` with `hyperdrive` binding | 🔄 In Progress |
| **Podman Compose** | `compose.yaml` with 4 services (`db`, `migrate`, `api`, `web`) | Minimized `compose.yaml` with `:Z` volume mounts | 🔄 In Progress |
| **Internal Networking** | Container names `db:5432`, `api:4000` | Shared Podman network without SSH dependencies | 🔄 In Progress |

---

### 4. Implementation Details

#### 4.1 Database Driver Setup (`middleware/src/db.ts`)
The database connection dynamically resolves based on the execution context:
1. **Cloudflare Worker Mode**: Consumes `env.HYPERDRIVE.connectionString` or WebSocket proxy with `@neondatabase/serverless`.
2. **Local Node / Podman Mode**: Connects directly to the PostgreSQL container at `postgres://erp:password@db:5432/erp`.

```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema/index.js';

export function createDatabaseClient(env: { DATABASE_URL?: string; HYPERDRIVE?: { connectionString: string } }) {
  const isCloudflare = typeof WebSocket !== 'undefined' && Boolean(env.HYPERDRIVE);

  if (!isCloudflare) {
    // Local Podman TCP WebSocket shim or direct connection
    neonConfig.wsProxy = (host) => `${host}:5432/v1`;
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineTLS = false;
  }

  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or HYPERDRIVE connection string is required');
  }

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}
```

#### 4.2 Minimized Podman `compose.yaml`
```yaml
name: sp-plastech-dev

services:
  db:
    image: docker.io/library/postgres:16-alpine
    container_name: sp-plastech-dev-db-1
    environment:
      POSTGRES_USER: erp
      POSTGRES_PASSWORD: ${DEV_DB_PASSWORD:-erp_local_only}
      POSTGRES_DB: erp
    ports: [ "5432:5432" ]
    volumes: [ pgdata:/var/lib/postgresql/data:Z ]
    healthcheck: { test: [ "CMD-SHELL", "pg_isready -U erp" ], interval: 5s, retries: 10 }

  api:
    image: sp-plastech-dev-api:latest
    build: { context: ./middleware, dockerfile: Dockerfile.dev }
    command: npm run dev
    environment:
      DATABASE_URL: postgres://erp:${DEV_DB_PASSWORD:-erp_local_only}@db:5432/erp
      PORT: "4000"
    ports: [ "4000:4000" ]
    volumes:
      - "./middleware:/app:Z"
      - "/app/node_modules"
    depends_on: { db: { condition: service_healthy } }

  web:
    image: sp-plastech-dev-web:latest
    build: { context: ., dockerfile: containers/frontend.Dockerfile }
    command: npm run dev
    environment:
      BACKEND_URL: http://api:4000
      VITE_API_URL: http://localhost:3000
    ports: [ "3000:3000" ]
    volumes:
      - ".:/workspace:Z"
      - "/workspace/node_modules"
      - "/workspace/frontend/node_modules"
    depends_on: { api: { condition: service_started } }

volumes:
  pgdata:
    name: sp-plastech-dev_pgdata
```

#### 4.3 Cloudflare Hyperdrive Configuration (`middleware/wrangler.jsonc`)
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "sp-plastech-erp",
  "main": "src/index.ts",
  "compatibility_date": "2026-10-14",
  "compatibility_flags": ["nodejs_compat"],
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "sp_plastech_hyperdrive_prod"
    }
  ],
  "assets": {
    "directory": "../frontend/dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api", "/api/*"]
  }
}
```
