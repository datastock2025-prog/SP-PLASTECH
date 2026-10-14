# SP-PLASTECH ERP: Hybrid Monorepo Production Runbook & Architecture Specification

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + TypeScript + Zustand)"]
        Browser["Desktop & Mobile Web Browser"]
        Zustand["Auth Store (In-Memory JWT Access Token)"]
        Axios["Axios Interceptor Layer (X-Tenant-ID, CSRF, Correlation)"]
    end

    subgraph Edge ["Edge Layer (Cloudflare Workers & R2 Storage)"]
        CF_Worker["Cloudflare Edge Worker Gateway"]
        CF_KV["Cloudflare KV Rate Limiting & Auth Cache"]
        CF_R2["Cloudflare R2 Object Storage (Presigned Reports)"]
    end

    subgraph VPS ["Production VPS (Ubuntu 24.04 LTS / < ₹10,000/mo)"]
        NGINX["NGINX Reverse Proxy (SSL, Rate Limits, Upstream Proxy)"]
        
        subgraph Docker ["Podman / Docker Monorepo Network"]
            HonoAPI["Hono API Server (Node 22 / Cloudflare Compatible)"]
            BetterAuth["Better Auth (PostgreSQL Session Store)"]
            Dbmate["dbmate SQL Migrations Engine"]
            LocalPG["PostgreSQL 16 (Local High-Performance DB)"]
        end
    end

    subgraph CloudDB ["Cloud Database Layer"]
        Supabase["Supabase Cloud PostgreSQL (Realtime CDC & Managed Postgres)"]
    end

    Browser -->|HTTPS / WSS| CF_Worker
    CF_Worker -->|Verified Session & Tenant| NGINX
    CF_Worker -.->|Static Cached Responses| CF_KV
    NGINX -->|Reverse Proxy :4000| HonoAPI
    HonoAPI --> BetterAuth
    BetterAuth --> LocalPG
    HonoAPI -->|Primary Queries| LocalPG
    LocalPG -.->|CDC Sync| Supabase
```

---

## 2. Multi-Tenancy & Financial Precision Rules

1. **Decimal Precision**: All currency, material weights (kg, g), cycle times (s), and scrap rates are computed using `Decimal.js` (or SQL `numeric(18,4)`), never IEEE-754 floating point numbers.
2. **Tenant Isolation**: Every database table contains a mandatory `tenant_id` column with composite index `[tenant_id, id]`. Queries enforce tenant filters at three distinct layers:
   - Cloudflare Worker Gateway (`X-Tenant-ID` header validation)
   - Hono `tenantContext` middleware via `AsyncLocalStorage`
   - SQL query builders with strict tenant parameter binding
3. **Audit Snapshotting**: All mutations (`CREATE`, `UPDATE`, `DELETE`) automatically write JSON delta diffs to `audit_logs` and increment integer `version` (OCC).

---

## 3. AI & Safe SQL Execution Engine

1. **AST Blocklist**: Any SQL query emitted by the AI chain is parsed against an AST syntax validator:
   - Prohibits: `DROP`, `DELETE`, `TRUNCATE`, `ALTER`, `INSERT`, `UPDATE`, `GRANT`, `REVOKE`, `EXEC`.
   - Prohibits accessing internal tables: `schema_migrations`, `users`, `roles`, `tenants`.
2. **Enforced Tenant Scope**: The SQL parser automatically injects or verifies `WHERE tenant_id = :activeTenantId` on all table targets.
3. **Reporting Pipeline**: If the query requests tabular analytics, `DocumentGeneratorService` streams PDFKit (PDF), ExcelJS (XLSX), or DOCX to Cloudflare R2 and returns a presigned download URL.

---

## 4. Production Deployment & Operations (< ₹10,000 / month VPS)

### Hardware Requirements
- **VPS Specs**: 4 vCPU, 8 GB RAM, 100 GB NVMe SSD (e.g. Hetzner CPX31 / DigitalOcean Droplet / Hostinger KVM 4).
- **OS**: Ubuntu 22.04 / 24.04 LTS.

### Quick Start Deployment

1. **Clone Repository & Set Environment Variables**:
   ```bash
   git clone https://github.com/datastock2025-prog/SP-PLASTECH.git /opt/sp-plastech
   cd /opt/sp-plastech
   cp .env.example .env
   # Edit .env with your secrets (DATABASE_URL, BETTER_AUTH_SECRET, R2 credentials)
   ```

2. **Launch Podman / Docker Compose**:
   ```bash
   podman compose up -d --build
   ```

3. **Database Migrations (dbmate)**:
   ```bash
   # Executed automatically on container boot via migrate service in compose.yaml
   # Or run manually:
   npx dbmate --migrations-dir ./db/migrations up
   ```

4. **Configure NGINX & SSL**:
   ```bash
   sudo cp infrastructure/nginx/sp-plastech.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/sp-plastech.conf /etc/nginx/sites-enabled/
   sudo certbot --nginx -d erp.sp-plastech.com
   sudo systemctl reload nginx
   ```

5. **Deploy Cloudflare Edge Worker**:
   ```bash
   cd infrastructure/cloudflare
   npx wrangler deploy
   ```

---

## 5. Observability & Health Checking

- **Health Check Endpoint**: `GET http://localhost:4000/api/auth/ok` (Reports auth-server and database readiness).
- **Audit Logs View**: Accessible in Admin Panel or querying `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;`.
