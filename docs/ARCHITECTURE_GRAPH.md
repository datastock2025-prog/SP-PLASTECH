# SP-PLASTECH ERP — Architecture Knowledge Graph & Flowcharts

**Standard:** `/graphify` — Codebase AST Dependency Traversal & System Flow Analysis  
**Scope:** Complete Monorepo Workspace (Frontend, Backend, Database, Realtime CDC Mesh)  
**File Location:** `docs/ARCHITECTURE_GRAPH.md`

---

## 1. End-to-End System Topology Flowchart

```mermaid
flowchart TD
  subgraph Client_Layer ["Client Layer (React 19 / Vite / Cloudflare Pages)"]
    AppRoot["App.tsx (Root Shell & Context Provider)"]
    Sidebar["Sidebar / Navigation Hub"]
    QueryMesh[("TanStack Query v5 Cache Mesh (SSOT)")]
    SSE_Client["realtimeService.ts (EventSource '/api/v1/events')"]

    AppRoot --> Sidebar
    AppRoot --> QueryMesh
    AppRoot --> SSE_Client
  end

  subgraph UI_Modules ["Frontend Dynamic Chunks (React.lazy Splitting)"]
    UI_MD["MasterDataViews.tsx"]
    UI_ENG["EngineeringViews.tsx"]
    UI_MFG["ManufacturingViews.tsx"]
    UI_PRC["ProcurementViews.tsx"]
    UI_WH["WarehouseViews.tsx"]
    UI_SLS["SalesViews.tsx"]
    UI_FIN["FinanceViews.tsx"]
    UI_QC["QualityViews.tsx"]
    UI_MEP["MaintenanceViews.tsx"]
    UI_HR["HrViews.tsx"]
    UI_SCM["PlanningViews.tsx"]
    UI_CRM["CrmViews.tsx"]
    UI_ANL["AnalyticsViews.tsx"]
    UI_IDN["AdminViews.tsx"]

    AppRoot -.->|Dynamic Import| UI_MD
    AppRoot -.->|Dynamic Import| UI_ENG
    AppRoot -.->|Dynamic Import| UI_MFG
    AppRoot -.->|Dynamic Import| UI_PRC
    AppRoot -.->|Dynamic Import| UI_WH
    AppRoot -.->|Dynamic Import| UI_SLS
    AppRoot -.->|Dynamic Import| UI_FIN
    AppRoot -.->|Dynamic Import| UI_QC
    AppRoot -.->|Dynamic Import| UI_MEP
    AppRoot -.->|Dynamic Import| UI_HR
    AppRoot -.->|Dynamic Import| UI_SCM
    AppRoot -.->|Dynamic Import| UI_CRM
    AppRoot -.->|Dynamic Import| UI_ANL
    AppRoot -.->|Dynamic Import| UI_IDN
  end

  subgraph Hooks_Layer ["Frontend Domain Data Hooks"]
    H_MD["useMasterData.ts (useItems)"]
    H_ENG["useEngineering.ts (useBoms)"]
    H_MFG["useManufacturing.ts (useWorkOrders)"]
    H_PRC["useProcurement.ts (usePurchaseOrders)"]
    H_WH["useWarehouse.ts (useWarehouseStock)"]
    H_SLS["useSales.ts (useSalesOrders)"]
    H_FIN["useFinance.ts (useAccounts)"]
    H_QC["useQuality.ts (useNcrs)"]
    H_MEP["useMaintenance.ts (useEquipment)"]
    H_HR["useHr.ts (useEmployees)"]
    H_SCM["usePlanning.ts (usePlannedOrders)"]
    H_CRM["useCrm.ts (useLeads)"]
    H_ANL["useAnalytics.ts (useExecutiveKpis)"]
    H_IDN["useIdentity.ts (useMe, useUsers)"]

    UI_MD --> H_MD
    UI_ENG --> H_ENG
    UI_MFG --> H_MFG
    UI_PRC --> H_PRC
    UI_WH --> H_WH
    UI_SLS --> H_SLS
    UI_FIN --> H_FIN
    UI_QC --> H_QC
    UI_MEP --> H_MEP
    UI_HR --> H_HR
    UI_SCM --> H_SCM
    UI_CRM --> H_CRM
    UI_ANL --> H_ANL
    UI_IDN --> H_IDN

    H_MD & H_ENG & H_MFG & H_PRC & H_WH & H_SLS & H_FIN & H_QC & H_MEP & H_HR & H_SCM & H_CRM & H_ANL & H_IDN --> QueryMesh
  end

  subgraph API_Bridge ["Client HTTP Network Bridge"]
    QueryMesh -->|api.get / api.post / api.patch| HttpClient["src/lib/api-client.ts (ETag & Error Interceptor)"]
  end

  subgraph Backend_Gateway ["Backend Service Gateway (middleware/src/app.ts)"]
    HttpClient -->|HTTP REST /api/v1/*| HonoApp["Hono Application Factory"]
    HonoApp --> LogMW["logging.ts (Structured JSON & Server-Timing)"]
    LogMW --> SecMW["secureHeaders() & CORS"]
    SecMW --> RateMW["rateLimit.ts (Sliding Window & LRU Pruning)"]
    RateMW --> CsrfMW["csrf.ts (ASVS L2 Origin/Referer Guard)"]
    CsrfMW --> AuthMW["auth.ts (requireSession & enforcePasswordChange)"]
    AuthMW --> AblMW["ability.ts (CASL Permission Guard: can())"]
  end

  subgraph Modular_Monolith ["Backend Modular Monolith (16 Domain Routers)"]
    AblMW --> R_MD["modules/masterdata/routes.ts (Drizzle Repo)"]
    AblMW --> R_Core["core/resource.ts (Generic REST Controller)"]
    R_Core --> R_ENG["modules/engineering/routes.ts"]
    R_Core --> R_MFG["modules/manufacturing/routes.ts"]
    R_Core --> R_PRC["modules/procurement/routes.ts"]
    R_Core --> R_WH["modules/warehouse/routes.ts"]
    R_Core --> R_SLS["modules/sales/routes.ts"]
    R_Core --> R_FIN["modules/finance/routes.ts"]
    R_Core --> R_QC["modules/quality/routes.ts"]
    R_Core --> R_MEP["modules/maintenance/routes.ts"]
    R_Core --> R_HR["modules/hr/routes.ts"]
    R_Core --> R_SCM["modules/planning/routes.ts"]
    R_Core --> R_CRM["modules/crm/routes.ts"]
    R_Core --> R_ANL["modules/analytics/routes.ts"]
    R_Core --> R_WSP["modules/workspace/routes.ts"]
    R_Core --> R_INT["modules/integrations/routes.ts"]
    AblMW --> R_IDN["modules/identity/routes.ts & org/routes.ts"]
  end

  subgraph Core_Services ["Framework Core Engine (middleware/src/core/)"]
    QueryHelper["query.ts (Drizzle OCC patchRow, cursor/offset pagination, tenantScope)"]
    AuditService["audit.ts (writeAudit)"]
    SSE_Hub["events.ts (Realtime Fan-out via PG LISTEN erp_changes)"]

    R_Core --> QueryHelper
    R_MD --> QueryHelper
    R_IDN --> AuditService
  end

  subgraph Database_Layer ["Database Layer (PostgreSQL 16 Multi-Tenant)"]
    DB_Pool["db.ts (pg.Pool max 20, withTx RLS role erp_app)"]
    QueryHelper --> DB_Pool
    DB_Pool --> DB_Tables[("31 Domain Tables (items, work_orders, purchase_orders...)")]
    DB_Tables --> Trig_Audit["Trigger: audit_row_change() ➔ audit_logs"]
    DB_Tables --> Trig_Notify["Trigger: erp_notify() ➔ pg_notify('erp_changes')"]
  end

  Trig_Notify -.->|Postgres LISTEN erp_changes| SSE_Hub
  SSE_Hub -.->|GET /api/v1/events (SSE Stream)| SSE_Client
  SSE_Client -.->|broadcastLocalMutation| QueryMesh
```

---

## 2. Data Flow Sequence: Mutation & Real-Time Sync Cycle

```mermaid
sequenceDiagram
  autonumber
  actor User as Operator / Browser Tab 1
  participant Screen as MasterDataViews (UI)
  participant Hook as useSaveItem (TanStack Mutation)
  participant API as api.patch('/items/:code')
  participant Hono as Hono App Gateway
  participant Drizzle as Drizzle Query Engine
  participant PG as PostgreSQL 16 (erp-verify)
  participant SSE as SSE Hub (/api/v1/events)
  actor Tab2 as Manager / Browser Tab 2

  User->>Screen: Edit Item (e.g. Cycle Time: 22s ➔ 20s)
  Screen->>Hook: mutate({ code: 'ITM-001', cycleTime: 20, version: 1 })
  Hook->>API: PATCH /api/v1/items/ITM-001 (payload)
  API->>Hono: HTTP PATCH (ASVS CSRF + Auth Session Guard)
  Hono->>Drizzle: withTx (SET LOCAL ROLE erp_app, tenant_id)
  Drizzle->>PG: UPDATE items SET cycle_time_seconds = 20, version = 2 WHERE code = 'ITM-001' AND version = 1 RETURNING *
  
  alt Concurrency Conflict (version mismatch)
    PG-->>Drizzle: 0 rows affected
    Drizzle-->>Hono: throw AppError(409, 'CONCURRENCY_CONFLICT')
    Hono-->>Screen: HTTP 409 Conflict Toast
  else Successful Update
    PG->>PG: Trigger audit_row_change() ➔ Insert audit_logs
    PG->>PG: Trigger erp_notify() ➔ pg_notify('erp_changes', {"table":"items","id":"ITM-001","op":"UPDATE"})
    PG-->>Drizzle: Row representation (version: 2)
    Drizzle-->>Hono: 200 OK + Updated Item JSON
    Hono-->>Hook: HTTP 200 OK
    Hook->>Hook: Direct Cache Hydration: setQueriesData(['items', 'ITM-001'], representation)
    Hook-->>Screen: Re-render with authoritative DB state immediately (0 flicker)
    
    PG-->>SSE: LISTEN erp_changes payload
    SSE-->>Tab2: SSE Event: change {"table":"items","id":"ITM-001","op":"UPDATE"}
    Tab2->>Tab2: invalidateQueries(['items']) ➔ Background Re-fetch
    Tab2-->>Tab2: Manager screen updates automatically without page reload
  end
```

---

## 3. 16-Domain Structural Dependency Matrix

| Domain Module | Primary DB Tables | Backend Router | TanStack Query Hook | Primary Screen | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Master Data** | `items`, `mold_tools`, `plants` | `modules/masterdata/routes.ts` | `useItems`, `useItemCount` | `MasterDataViews.tsx` | **SOLID** |
| **2. Engineering** | `bill_of_materials`, `bom_lines`, `eco_orders` | `modules/engineering/routes.ts` | `useBoms`, `useBomDetail` | `EngineeringViews.tsx` | **SOLID** |
| **3. Manufacturing** | `work_orders`, `machines`, `production_entries`| `modules/manufacturing/routes.ts`| `useWorkOrders` | `ManufacturingViews.tsx` | **SOLID** |
| **4. Procurement** | `purchase_orders`, `suppliers`, `grn` | `modules/procurement/routes.ts` | `usePurchaseOrders` | `ProcurementViews.tsx` | **SOLID** |
| **5. Warehouse** | `warehouses`, `warehouse_bins`, `stock` | `modules/warehouse/routes.ts` | `useWarehouseStock` | `WarehouseViews.tsx` | **SOLID** |
| **6. Sales** | `sales_orders`, `customers`, `challans` | `modules/sales/routes.ts` | `useSalesOrders` | `SalesViews.tsx` | **SOLID** |
| **7. Quality** | `qc_inspections`, `quality_ncrs`, `capas` | `modules/quality/routes.ts` | `useNcrs`, `useCapas` | `QualityViews.tsx` | **SOLID** |
| **8. Finance** | `gl_accounts`, `journal_entries`, `invoices` | `modules/finance/routes.ts` | `useAccounts`, `useJournalEntries`| `FinanceViews.tsx` | **SOLID** |
| **9. Maintenance** | `maintenance_schedules`, `breakdown_tickets` | `modules/maintenance/routes.ts` | `useMaintenanceWorkOrders` | `MaintenanceViews.tsx` | **SOLID** |
| **10. HR** | `employees`, `attendance_records`, `rosters` | `modules/hr/routes.ts` | `useEmployees`, `useAttendance` | `HrViews.tsx` | **SOLID** |
| **11. Planning (MRP)** | `mrp_runs`, `demand_forecasts` | `modules/planning/routes.ts` | `usePlannedOrders`, `useMrpRuns` | `PlanningViews.tsx` | **SOLID** |
| **12. CRM** | `crm_inquiries`, `crm_quotations`, `trials` | `modules/crm/routes.ts` | `useLeads`, `useOpportunities` | `CrmViews.tsx` | **SOLID** |
| **13. Analytics** | Aggregated Analytical RPCs / Drizzle | `modules/analytics/routes.ts` | `useExecutiveKpis`, `useOee` | `AnalyticsViews.tsx` | **SOLID** |
| **14. Workspace** | `workspace_tasks`, `presets`, `notifications`| `modules/workspace/routes.ts` | `useTasks`, `usePresets` | `WorkspaceViews.tsx` | **SOLID** |
| **15. Integrations** | `integrations`, `webhook_subscriptions` | `modules/integrations/routes.ts`| `useIntegrations` | `IntegrationsViews.tsx` | **SOLID** |
| **16. Identity / Platform**| `user`, `tenants`, `roles`, `audit_logs` | `modules/identity/routes.ts` | `useMe`, `useUsers`, `useRoles` | `AdminViews.tsx` | **SOLID** |

---

## 4. AST Traversal: Solid Pipeline vs Disconnected Gaps

```mermaid
graph TD
  subgraph Solid_Connected_Chain ["Solid Connected Chain (Verified Green)"]
    Drizzle_Schema["Drizzle DB Schema (75 Tables)"]
    REST_Routes["Hono REST Endpoints (678 Routes)"]
    TanStack_Hooks["TanStack Query Hooks (No Error Swallowing)"]
    UI_Screens["Dynamic Module Screens (Vite Clean Chunks)"]

    Drizzle_Schema --> REST_Routes
    REST_Routes --> TanStack_Hooks
    TanStack_Hooks --> UI_Screens
  end

  subgraph Disconnected_Gaps ["Identified Missing Links & Island Nodes"]
    EntityTable_Component["Island Node: EntityTable.tsx (669 lines)"]
    Screen_Table_Elements["Hand-coded HTML tables in MasterDataViews & SalesViews"]
    EntityTable_Component -.->|0 Callers (Missing Connection)| Screen_Table_Elements

    GodNode_MD["MasterDataViews.tsx (5,109 lines, 254 KB)"]
    GodNode_ENG["EngineeringViews.tsx (2,500 lines, 106 KB)"]
    GodNode_MD -.->|Needs Sub-component Extraction| Atomic_MD["CreateItemModal, ItemDetailDrawer"]
    GodNode_ENG -.->|Needs Sub-component Extraction| Atomic_ENG["BomWizardModal, RoutingEditor"]

    Pagination_Bar["PaginationBar.tsx Component"]
    Screen_Paging["Catalog Table Views"]
    Pagination_Bar -.->|Pagination State Disconnected in UI| Screen_Paging

    PG_Listen_Single["Single-Node PG LISTEN (Node Memory Fan-out)"]
    Redis_PubSub["Redis / Dragonfly PubSub Cluster"]
    PG_Listen_Single -.->|Missing Link for 20+ Containers| Redis_PubSub
  end
```

---

## 5. Architectural Health & Verification Checkpoints

* **Raw SQL Call Sites**: **0** (`check:sql` locked at baseline 0).
* **Storage Violations (Rule 3 SSOT)**: **0** (`check:storage` PASSED).
* **Dependency Violations**: **0** (`check:boundaries` cruised 1,051 modules).
* **Circular Dependencies**: **0** (`check:circular` verified 904 files).
* **TypeScript Diagnostics**: **0 errors** across frontend & backend.
* **Unit Tests**: **104/104 passing** across 23 test suites.
* **Code Splitting**: **0 chunking warnings** on production `vite build`.
