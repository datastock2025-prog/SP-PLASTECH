# SP-PLASTECH ERP — Removed Code & Salvage Ledger (Step 2)

> **Git Archive Tag**: `archive/backend-middleware-2026-10`  
> **Recovery Command**: `git checkout archive/backend-middleware-2026-10 -- <path>`  
> **Rule**: Do not duplicate dead code in the repository. All historical code remains 100% recoverable via the git tag above.

---

## 1. Prisma Schema Salvage Analysis

The table below catalogs every model and enum defined in `backend/prisma/schema.prisma` and maps it to the authoritative PostgreSQL database migrations (`supabase/migrations/`, `auth-server/sql/`, and `db/migrations/`).

| Prisma Model / Enum | Target SQL Migration | Migration Status | Notes |
| :--- | :--- | :--- | :--- |
| `model Tenant` | `auth-server/sql/001_identity.sql`, `db/migrations/20261012000000_baseline_erp_schema.sql` | **Migrated** | Multi-tenant tenant table with RLS |
| `model User` | `auth-server/sql/001_identity.sql`, `db/migrations/20261012000000_baseline_erp_schema.sql` | **Migrated** | User table with Better Auth credentials |
| `model UserSession` | `auth-server/sql/001_identity.sql` (`session`) | **Migrated** | HttpOnly cookie sessions |
| `model ApiKey` | N/A | **Unused** | Legacy NestJS token table; superseded by Better Auth session |
| `model Role` | `auth-server/sql/001_identity.sql` (`roles`) | **Migrated** | CASL RBAC role table |
| `model RolePermission` | `auth-server/sql/001_identity.sql` (`roles.permissions`) | **Migrated** | Permission list stored in role metadata |
| `model AuditLog` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`audit_logs`) | **Migrated** | Immutable enterprise audit log |
| `model EntityVersion` | N/A | **Unused** | OCC versioning is now implemented per-table as integer `version` column (Decision D4) |
| `enum ItemCategory` | `db/migrations/20261012000000_baseline_erp_schema.sql` | **Migrated** | Handled as domain validation check on `items.category` |
| `enum ItemEntityType` | `db/migrations/20261012000000_baseline_erp_schema.sql` | **Migrated** | Handled as domain validation check on `items.entity_type` |
| `enum ItemStatus` | `db/migrations/20261012000000_baseline_erp_schema.sql` | **Migrated** | Handled as domain validation check on `items.status` |
| `enum ApprovalStatus` | `db/migrations/20261012000000_baseline_erp_schema.sql` | **Migrated** | Handled as domain validation check on `items.approval_status` |
| `enum ValuationMethod` | `db/migrations/20261012000000_baseline_erp_schema.sql` | **Migrated** | Handled as domain validation check on `items.valuation_method` |
| `model Item` | `supabase/migrations/20261007_enterprise_item_master_schema.sql`, `db/migrations/...` | **Migrated** | Complete Item Master with lean projections |
| `model BillOfMaterial` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`bill_of_materials`) | **Migrated** | BOM header table |
| `model BomComponent` | `db/migrations/20261013114124_engineering_bom_item.sql` (`bom_items`) | **Migrated** | BOM recipe child table with FK to BOM and Item |
| `model Machine` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`machines`) | **Migrated** | Injection molding machine master |
| `model Mold` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`molds`) | **Migrated** | Mold & tooling master |
| `model MoldShotLog` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`mold_shot_logs`) | **Migrated** | Cumulative shots telemetry log |
| `model WorkOrder` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`work_orders`) | **Migrated** | Production work order records |
| `model SpcInspection` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`spc_inspections`) | **Migrated** | Statistical process control inspection lots |
| `model EprCreditLog` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`epr_credit_logs`) | **Migrated** | Regrind & plastic recycling ledger |
| `model EnergyLog` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`energy_logs`) | **Migrated** | Machine energy telemetry log |
| `model WorkflowDefinition` | N/A | **Unused** | Defined in legacy schema; not used in active runtime |
| `model WorkflowInstance` | N/A | **Unused** | Defined in legacy schema; not used in active runtime |
| `model DmsDocument` | N/A | **Unused** | Legacy NestJS document metadata; replaced by Cloudflare R2 / S3 |
| `model Supplier` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`suppliers`) | **Migrated** | Procurement supplier master |
| `model Customer` | `db/migrations/20261012000000_baseline_erp_schema.sql` (`customers`) | **Migrated** | Commercial customer master |

---

## 2. Salvaged Code Directory (For Future Module Reference)

The following services and modules contain business logic worth referencing when implementing later modules in `apps/api/` or `auth-server/`.

### 2.1 Multi-Factor Authentication (MFA / TOTP)
- `backend/src/modules/auth/mfa.service.ts` — TOTP secret generation, QR code formatting, backup codes encryption, and verification logic.
- `backend/src/modules/auth/guards/mfa.guard.ts` — Route guard requiring active MFA verification session.
- `middleware/src/modules/mfa/mfa.service.ts` — Client-facing challenge creation and verification endpoint handlers.

### 2.2 GST & E-Invoice Compliance
- `backend/src/integrations/gst/einvoice.service.ts` — NIC GST portal payload serialization, IRN (Invoice Reference Number) generation, signed QR code parsing, and cancel e-invoice payload.
- `middleware/src/modules/compliance/compliance.service.ts` — Inter-plant tax validation and GSTIN checksum verification.

### 2.3 Tally Accounting Integration
- `backend/src/integrations/tally/tally-sync.service.ts` — XML envelope builder for TallyPrime ledger export, voucher pushing (Sales, Purchase, Journal), and XML response parsing.

### 2.4 Razorpay Payments & Banking
- `backend/src/integrations/payments/razorpay.service.ts` — Order creation, HMAC-SHA256 webhook signature verification, payment capture, and refund management.
- `backend/src/integrations/payments/bank-reconciliation.service.ts` — MT940 / CSV bank statement line parsing and auto-reconciliation rules against open customer invoices.

### 2.5 Approval Workflow Engine & SLA Escalation
- `backend/src/modules/workflow/workflow-engine.service.ts` — Multi-tier approval routing state machine, condition evaluating (value thresholds), and step delegation.
- `middleware/src/modules/approval-workflow/sla-escalation.service.ts` — Background polling for pending approvals exceeding timeout, auto-escalating to department heads.

### 2.6 Multi-Channel Notification Dispatcher
- `backend/src/modules/notifications/notification-dispatcher.service.ts` — Unified event bus routing alerts to Email, SMS, WhatsApp, and In-App notification tables.
- `backend/src/modules/notifications/channels/email.channel.ts` — SMTP / SES transaction mailer with MJML templates.
- `backend/src/modules/notifications/channels/sms.channel.ts` — DLT-compliant SMS gateway adapter.
- `backend/src/modules/notifications/channels/whatsapp.channel.ts` — WhatsApp Business API template messaging adapter.

### 2.7 Statistical Process Control (SPC) & Quality
- `backend/src/modules/quality/spc/spc.service.ts` — X-bar and R chart calculations, Nelson rules detection (Rule 1-8 runs test), Cp/Cpk process capability calculations.
- `middleware/src/modules/mfg-quality/mfg-quality.service.ts` — Out-of-control action plan (OCAP) triggers and quarantine hold automation.

### 2.8 AI Gateway, LangChain, MCP & Document Generation
- `backend/src/modules/ai-gateway/ai-gateway.service.ts` — Streaming LLM proxy, rate limiting, token usage quota tracker, and prompt redaction.
- `backend/src/modules/ai-chat/langchain/chat-chain.service.ts` — RAG retrieval chain using vector similarity over ERP documents.
- `backend/src/modules/ai-chat/mcp/mcp-server.service.ts` — Model Context Protocol tool provider exposing ERP queries (stock check, machine status) to AI assistants.
- `backend/src/modules/ai-chat/document/document-generator.service.ts` — Markdown-to-PDF invoice and PO generation.

### 2.9 WebSocket Industrial Telemetry Gateway
- `middleware/src/modules/websocket/telemetry.gateway.ts` — Real-time machine IoT telemetry broadcast (temperature, pressure, cycle time, shot count) to browser dashboard clients.

### 2.10 Sustainability & Regrind Closed-Loop Accounting
- `backend/src/modules/sustainability/sustainability.service.ts` — Virgin vs. regrind blend ratio compliance tracker, EPR credit ledger, and carbon offset reporting.

---

## 3. How to Restore Any File From the Archive

If you ever need to inspect or retrieve a file from the archived backend/middleware:
```bash
# View file contents without checking out
git show archive/backend-middleware-2026-10:backend/src/integrations/gst/einvoice.service.ts

# Restore a specific file or directory into current workspace
git checkout archive/backend-middleware-2026-10 -- backend/src/integrations/gst/einvoice.service.ts
```
