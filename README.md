# Reboot ERP — Frontend Architecture & Backend Integration Guide

Welcome to the **Reboot ERP** frontend workspace reference. This document provides a complete, step-by-step breakdown of the newly added frontend features, security architectures, and instructions on how the backend services must be implemented to support them.

---

## Table of Contents

1. [Changelog — Today's Updates & Completed Enhancements](#1-changelog--todays-updates--completed-enhancements)
2. [Frontend Workspace Architecture Overview](#2-frontend-workspace-architecture-overview)
3. [Summary of Added Features & Capabilities](#3-summary-of-added-features--capabilities)
   - [Feature 1: Dual-Matrix Workspace & Sidebar RBAC Engine](#feature-1-dual-matrix-workspace--sidebar-rbac-engine)
   - [Feature 2: Autonomous Screen Discovery & Auto-Sync](#feature-2-autonomous-screen-discovery--auto-sync)
   - [Feature 3: Zero-Trust Screen Quarantine & Clearance Flow](#feature-3-zero-trust-screen-quarantine--clearance-flow)
   - [Feature 4: Industrial HR Command Center & Workforce Suite](#feature-4-industrial-hr-command-center--workforce-suite)
   - [Feature 5: Multi-Plant Stock Transfer & Transit Logistics](#feature-5-multi-plant-stock-transfer--transit-logistics)
   - [Feature 6: Dispatch Execution, E-Way Bill & Gate Pass](#feature-6-dispatch-execution-e-way-bill--gate-pass)
   - [Feature 7: Quality Assurance & IATF 16949 / SPC Portal](#feature-7-quality-assurance--iatf-16949--spc-portal)
   - [Feature 8: Streaming UI (`<StreamingText />`)](#feature-8-streaming-ui-streamingtext-)
   - [Feature 9: Modular Prompt Builder (`<PromptBuilder />`)](#feature-9-modular-prompt-builder-promptbuilder-)
   - [Feature 10: Token Management & BFF Pattern](#feature-10-token-management--bff-pattern)
   - [Feature 11: XSS Prevention (`<SanitizedHtml />`)](#feature-11-xss-prevention-sanitizedhtml-)
   - [Feature 12: Role-Based UI Guard (`<RequireAuth />`)](#feature-12-role-based-ui-guard-requireauth-)
   - [Feature 13: Strict Content Security Policy (CSP) Awareness](#feature-13-strict-content-security-policy-csp-awareness)
4. [Step-by-Step Backend Implementation Guide](#4-step-by-step-backend-implementation-guide)
   - [Step 1: Session & Authentication Service (BFF + HttpOnly Cookies)](#step-1-session--authentication-service-bff--httponly-cookies)
   - [Step 2: Server-Sent Events (SSE) AI Token Streaming Endpoint](#step-2-server-sent-events-sse-ai-token-streaming-endpoint)
   - [Step 3: WebSocket Streaming Alternative](#step-3-websocket-streaming-alternative)
   - [Step 4: Prompt Analysis & AI Gateway Endpoints](#step-4-prompt-analysis--ai-gateway-endpoints)
   - [Step 5: Backend Role-Based Access Control (RBAC)](#step-5-backend-role-based-access-control-rbac)
   - [Step 6: Strict CSP HTTP Headers Configuration](#step-6-strict-csp-http-headers-configuration)
5. [API Contract & Schema Reference](#5-api-contract--schema-reference)
6. [Frontend File Structure](#6-frontend-file-structure)

---

## 1. Changelog — Today's Updates & Completed Enhancements

### 🎯 Key Accomplishments Completed Today

| Domain / Module | Key Enhancements Completed Today | Impact & Status |
| :--- | :--- | :--- |
| **Workspace & Sidebar RBAC Governance** | Built dual-matrix visibility engine allowing independent toggling of modules for **Home Workspace** (tile cards) and **Sidebar Navigation Menu** per role. | ✅ Fully Operational |
| **Screen Auto-Discovery & Live Sync** | Implemented autonomous route discovery engine that indexes screens across navigation groups and synchronizes with admin console. | ✅ Live & Audited |
| **Zero-Trust Quarantine & Restriction** | New screens/routes are held in quarantine until an admin reviews and assigns independent Home/Sidebar role access. | ✅ Zero-Trust Active |
| **Industrial HR Command Center** | Complete industrial workforce management suite featuring 12 operational sub-views (Roster, Attendance, Payroll, PPE, Skills). | ✅ Production Ready |
| **Multi-Plant Stock Transfer Logistics** | Transfer wizard, Inbound Goods Receipt (GRN), Returnable DC, and asset/mold transfer tracking with audit drawers. | ✅ Production Ready |
| **Dispatch & Gate Pass Execution** | Dispatch management, vehicle load optimization, direct E-Way Bill & E-Invoice generation, and security gate pass checks. | ✅ Production Ready |
| **Quality & Compliance Suite** | Non-conformance reporting (8D NCR), CAPA management, SPC X-bar/R control charts, and Certificate of Analysis (COA). | ✅ Production Ready |
| **Enterprise Administration Hub** | Multi-plant settings, warehouse locations, custom approval workflow engine, machine telemetry mappings, and audit logs. | ✅ Production Ready |
| **Enterprise Finance Subsystem (GL & Journal)** | Redesigned Journal Entries & Ledger Command Center with multi-tab COA inspector, real-time debit/credit auto-balancing, SOX-compliant audit drawer, and one-click reversal. | ✅ Production Ready |
| **Procure-to-Pay (3-Way Matching AP)** | Redesigned Accounts Payable subsystem with automated 3-way matching (PO + GRN + Invoice), OCR intake simulation, tolerance rules, and line-level manual variance check workspace. | ✅ Production Ready |
| **Order-to-Cash (AR & Advance Check)** | Redesigned Accounts Receivable & Priority Collections Workbench featuring real-time Advance Check, credit limit monitoring, and interactive advance application. | ✅ Production Ready |
| **JIT Production Planner (Consolidated Schedule & Work Orders)** | Added 3rd tab adjacent to Consolidated Recipe with schedule-number and date-wise matrix, single-click row expansion, complete work order drilldown, and individual Release WO actions. | ✅ Production Ready |
| **Item Master Wizard (Inventory Settings Routing)** | Added Step 5 checkboxes for DOL (Direct to FG-STORE), ASSEMPLY (Assembly Store), and DEFLASH (Deflash Store) with visual flow indicator and review persistence. | ✅ Production Ready |
| **Daily Production Entry (Automated Store Routing)** | Automatic inventory routing engine mapping daily production output to FG-STORE, ASSEMBLY-STORE, or DEFLASH-STORE based on item flags, with grid badges and balance sync. | ✅ Production Ready |

---

### Detailed Breakdown of Today's Changes:

#### 1. Dual-Matrix Workspace & Sidebar Access Control Engine
- **Independent Dual-Scope Matrix**:
  - Administrators can now control access to any module separately for the **Home Workspace** (interactive dashboard cards) and the **Sidebar Navigation Menu** (tree navigation) across all enterprise roles (`admin`, `plant_manager`, `quality_manager`, `operator`, `maintenance_lead`, `inventory_clerk`, `finance_controller`, `hr_manager`, `compliance_auditor`, `supply_chain_lead`).
  - Added dedicated status badges for each screen: **Both Visible**, **Home Only**, **Sidebar Only**, or **Hidden**.
- **Unified Administration Console (`/src/components/admin/WorkspaceModuleRbacView.tsx`)**:
  - **Cards View**: Grouped by operational domain (Operations, Front Office, Quality, etc.) with dual-category toggle actions (`Show All`, `Hide All` for Home and Sidebar independently).
  - **Table Matrix View**: High-density spreadsheet grid displaying checkbox controls for Home Workspace and Sidebar Navigation, domain categorization, and route slugs.
  - **Role Mirroring Utilities**: Fast synchronization buttons including **Sidebar → Home**, **Home → Sidebar**, **Unhide Both**, **Hide Both**, and **Clone Role Configuration**.
- **Application Shell Synchronization**:
  - Updated `Sidebar.tsx` to read `isSidebarVisible(role, view)` so that users only see authorized screens in their navigation menu, with automatic grouping for dynamic approved screens.
  - Updated `HomeView.tsx` to read `isWorkspaceVisible(role, view)` so that unassigned modules are completely excluded from the dashboard cards, count tallies, and search filters.

#### 2. Autonomous Screen Discovery & Synchronization Engine (`workspaceRbacService.ts`)
- **Live Route Auto-Discovery**:
  - Automatically scans navigation manifests and registers every module, including dynamic routes.
  - Generates comprehensive sync reports detailing total governed screens, domain counts, and last sync timestamp.
- **On-Demand Auto-Sync**:
  - Added an interactive **Auto-Sync Screens** trigger in the admin workspace to re-index all routes and confirm zero-trust coverage.

#### 3. Zero-Trust Screen Quarantine & Dual Approval Workflow
- **Restriction Holding Area**:
  - Any new screen or route created or registered is intercepted and quarantined until explicit administrative clearance.
- **Granular Approval Modal**:
  - Administrators can review the screen metadata (route ID, security level, domain) and assign allowed roles for the **Home Workspace** and the **Sidebar Menu** separately (or link both with a single click).
- **Governance Audit Trail**:
  - Immutable audit logging for visibility toggles, quarantine clearances, role clonings, and sync events with operator stamps and timestamps.

#### 4. Complete Industrial HR Workforce Suite (`/src/components/hr/*`, `/src/features/hr/*`)
- Implemented the complete 12-subview Industrial HR Suite:
  - **HR Command Center (`HrCommandCenter.tsx`)**: Real-time workforce metrics, shift summaries, and compliance alerts.
  - **Employee Management (`HrEmployeeListView.tsx`, `HrEmployeeDetailView.tsx`)**: Profile management, statutory IDs, emergency contacts, and skill tags.
  - **Organization Hierarchy (`HrOrgStructureView.tsx`)**: Interactive tree view of reporting lines and departments.
  - **Shift Roster & Scheduling (`HrShiftRosterView.tsx`)**: Plant shift rotation planner and roster generation.
  - **Attendance Tracking (`HrAttendanceView.tsx`)**: Biometric clock timestamps, geofencing, and shift deviations.
  - **Leave & Overtime (`HrLeaveOvertimeView.tsx`)**: Leave approvals, balance ledgers, and overtime authorizations.
  - **Payroll & Wage Slips (`HrPayrollView.tsx`)**: Factory payroll engine with PF/ESI calculations and payslip downloads.
  - **Safety & PPE Management (`HrSafetyPpeView.tsx`)**: Safety gear issuance logs, inspection audits, and incident reports.
  - **Skills & IATF Training (`HrSkillsTrainingView.tsx`)**: Competency matrices and certification records for audit readiness.
  - **Contract & Compliance (`HrComplianceContractView.tsx`)**: Labor law compliance, apprentice records, and contractor renewals.
  - **Onboarding / Offboarding (`HrOnboardingOffboardingView.tsx`)**: New hire onboarding checklists and asset return clearance.
  - **Reports & Analytics (`HrReportsAnalyticsView.tsx`)**: Attrition, overtime trends, and workforce efficiency analytics.

#### 5. Multi-Plant Stock Transfer & Transit Logistics (`/src/components/stockTransfer/*`)
- Multi-step Transfer Wizard with item selection, barcode validation, and carrier routing.
- Inbound Goods Receipt (GRN) verification with discrepancy reporting.
- Returnable Delivery Challan (RDC) tracking with aging alerts and return reconciliation.
- Asset & Mold/Tooling Logistics with temperature and vibration transit logs.
- Inter-plant GST & E-Way Bill compliance checking.
- Real-time transit audit drawer with step-by-step milestone progression.

#### 6. Dispatch Execution, E-Way Bill & Gate Pass Portal (`/src/components/dispatch/*`)
- Dispatch Dashboard with vehicle allocation, dock status, and delivery schedules.
- Delivery Challan Management with packing list validation and dispatch authorizations.
- Direct E-Way Bill & E-Invoice generation compliant with national logistics standards.
- Digital Gate Pass Verification with security post clearance workflows.

#### 7. Quality Assurance & Compliance Suite (`/src/components/quality/*`)
- Non-Conformance Reporting (8D NCR) with root cause investigation and containment actions.
- Corrective & Preventive Action (CAPA) tracking with verification milestones.
- Statistical Process Control (SPC) with real-time X-bar and R-charts.
- Certificate of Analysis (COA) generation with digital sign-off and batch testing records.
- Document Control & Audit Readiness portal for IATF 16949 / ISO 9001 certifications.

#### 8. Enterprise Journal Entries & General Ledger Subsystem (`/src/components/finance/JournalEntriesView.tsx`)
- **Multi-Tab Enterprise Navigation**:
  - **JE Dashboard & KPIs**: Total Posted, Pending Approvals, Discrepancies, and Segregation of Duties metrics.
  - **Journal Entries Registry**: Complete listing with multi-status tabs (All, Draft, Pending Approval, Posted, Reversed), filter controls, and CSV export.
  - **Create / Edit Entry Workspace**: Real-time debit/credit auto-balancing indicators, one-click Auto-Balance Line button, recurring entry configurations, and attachment dropzones.
  - **Ledger Inquiry Workspace**: Real-time running balances, debit/credit totals, and drill-down into original source journals.
  - **Chart of Accounts (COA) Inspector**: Tree hierarchy with account types, active indicators, and balance summaries.
- **Enterprise Controls & Compliance**:
  - Segregation of Duties: Strict validation enforcing that creator != approver != poster.
  - One-click Journal Reversal with auto-generated reversing reference and audit record.
  - SOX-compliant immutable audit drawer (`FinanceAuditDrawer.tsx`) with actor timestamps and CSV export.

#### 9. Accounts Payable & 3-Way Matching Subsystem (`/src/components/finance/AccountsPayableDashView.tsx`)
- **AP Dashboard & Executive KPIs**:
  - 10 core metrics: Total Open AP, Overdue AP, Invoices Pending Match, Early Payment Discounts, DPO, and tolerance exception alerts.
  - Interactive AP Aging buckets (Current, 1-30, 31-60 days) and 3-way match funnel analysis.
- **Automated 3-Way Matching Intake Engine**:
  - Simulated drag-and-drop intake for supplier invoice documents (PDF/EDI/XML) with AI OCR confidence scoring.
  - Tolerance rule enforcement: Price variance tolerance (±1.0% or max ₹500), Quantity variance tolerance (0% for discrete parts), and GSTIN verification.
- **3-Way Match Workspace & Manual Review**:
  - Three-panel side-by-side comparison: Purchase Order (PO) vs Goods Receipt Note (GRN) vs Supplier Invoice.
  - Line-level variance inspection highlighting price and quantity deviations with authorization code overrides.
- **AP Exception Resolution Center**:
  - Structured categorization across 12 exception types (Missing PO, Missing GRN, Price Variance, Tax Mismatch, Duplicate Invoices) with severity indicators and buyer routing.

#### 10. Accounts Receivable, Advance Check & Priority Collections (`/src/components/finance/AccountsReceivableDashView.tsx`)
- **Real-Time Advance Check Option**:
  - 11-field analytical panel inspecting total advances received, allocated balances, available balance, and order-specific vs general advance categorizations.
  - Distinct status badges: *Advance Available*, *Partially Used*, *Fully Used*, *Advance Exceeded*, and *No Advance*.
  - Overdue invoice prioritization warnings to prevent unearned credit release.
- **Interactive Apply Advance Modal**:
  - Allows finance operators to apply unallocated customer advances directly against outstanding invoices with live balance deduction.
- **Collection Workbench & Surveillance**:
  - Split-screen priority queue displaying customer credit limit utilization, overdue balances, and broken payment promise alerts.
  - Communication history timeline for call logs, reminder dispatches, and Statement of Account delivery.
- **Customer Advance History Ledger**:
  - Dedicated receipts journal tracking unallocated amounts, proforma settlements, and refund logs.

#### 11. JIT Production Planner — Consolidated Schedule Number & Date-Wise Work Order Matrix (`/src/components/manufacturing/JitProductionPlanner.tsx`)
- **New Dedicated Tab Near Consolidated Recipe by Machine**:
  - Added a 3rd tab: **"Consolidated Schedule & Work Orders"** positioned adjacent to "Consolidated Recipe by Machine".
  - Consolidates work orders by unique `Schedule Number` and `Plan Date`, providing production planners with an aggregated view of shop-floor commitments.
- **Aggregated Directory Grid**:
  - High-density columns: Schedule Number, Schedule Date, Total Work Orders, Total Planned Qty (PCS), Completed Qty, Scrap Qty, Machine Bays assigned, Shift allocations, Operating Teams, and Overall Release Status.
  - KPI summary metric cards displaying Total Active Schedules, Scheduled Dates, Planned Production Volume, and Work Order counts.
- **Single-Click Row Drilldown**:
  - Clicking any row smoothly expands an inline detailed drawer/table displaying every Work Order belonging to that specific schedule number and date.
  - Each work order row displays: Work Order ID, Item Code, Item Description, Machine Bay, Shift, Planned Quantity, Completed Units, Scrap Count, Mold ID, Priority Level, Traveler Status, and an action button to **Release WO** directly.
- **Search, Date Filtering & Export**:
  - Real-time search across Schedule Number, Work Order ID, Item Name, or Machine Bay.
  - Specific plan date filter picker to inspect schedules for any given production day.
  - One-click CSV export of consolidated schedules.

#### 12. Item Master Creation Wizard — Post-Molding Routing Destination Checkboxes (`/src/components/masterdata/CreateItemWizardModal.tsx`)
- **Interactive Routing Checkboxes in Step 5 (Inventory Settings)**:
  - Added three specialized post-molding routing checkboxes:
    1. **DOL (Direct On Line)**: Automatically sets post-molding destination to **FG-STORE** (Finished Goods Store). Finished parts immediately move to FG stock without intermediate WIP staging.
    2. **ASSEMPLY**: Automatically sets post-molding destination to **ASSEMBLY-STORE** (Assembly Inventory Store) for secondary hardware insertion, fittings, and multi-component assembly.
    3. **DEFLASH**: Automatically sets post-molding destination to **DEFLASH-STORE** (Deflash Inventory Store) for runner gate cutting, deburring, and flame polishing.
- **Interactive Routing Feedback & State Management**:
  - Built single-selection toggle handlers (`handleToggleDol`, `handleToggleAssembly`, `handleToggleDeflash`) that switch the active destination while ensuring unambiguous routing.
  - Visual direct flow path indicator showing: `Molding Production → Daily Production Entry → [Target Store]`.
  - Step 10 (Review & Approval Workflow) displays the chosen post-production routing destination in the Inventory & Quality review card.
  - Persisted `routingDestination`, `isDol`, `isAssembly`, and `isDeflash` across draft saves and final approvals in `ItemMaster`.

#### 13. Daily Production Entry — Automated Inventory Store Routing Engine (`/src/components/manufacturing/DailyProductionGrid.tsx`, `ManufacturingViews.tsx`)
- **Automated Routing Execution on Entry Save**:
  - When shop floor operators log daily production (via single row save or batch save all), the system inspects the molded item's master data routing flags.
  - Automatically calculates and deposits good quantities, scrap, runner kg, and lumps kg into the designated target store:
    - `DOL` &rarr; `FG-STORE` (Direct to Finished Goods Handover Store)
    - `ASSEMPLY` &rarr; `ASSEMBLY-STORE` (Assembly Floor Store)
    - `DEFLASH` &rarr; `DEFLASH-STORE` (Deflash Floor Store)
- **Live Inventory Ledger & Balance Synchronization**:
  - Automatically updates `PlantStoreInventoryItem` on-hand and available balances for the recipient store.
  - Generates an immutable WIP lot lifecycle record (`WipInventoryRecord`) with full audit history recording the exact routing destination and timestamp.
  - Updates the work order traveler output location (`locOutput`) to mirror the routed store.
- **Floor Visual Clarity & Notification Toasts**:
  - Added color-coded routing badges directly under the Product Item column in `DailyProductionGrid.tsx` (`DOL → FG-Store`, `ASSEMPLY → Assembly Store`, `DEFLASH → Deflash Store`).
  - Enhanced toast notifications on row save and batch save confirming the exact destination store and quantity routed.
- **Catalog & Inventory Visibility**:
  - Updated the Item Master catalog list table to display post-molding routing tags on item rows.
  - Added a dedicated Default Post-Molding Store Routing indicator banner in the Item Detail view (Inventory tab).

---

## 2. Frontend Workspace Architecture Overview

Reboot ERP is built as a **Domain-Driven Modular Monolith** using modern React 19, TypeScript, and Tailwind CSS. The system decouples business domains (MES, WMS, Quality, MEP, Procurement, Finance) while centralizing shared infrastructure in `/src/shared/`.

### Core Engineering Tenets
- **Modular Monolith**: Features are partitioned into domain folders (`/src/features/*`) with distinct API layers, schemas, and components.
- **Client-Side BFF Routing**: All frontend API communications route exclusively through the centralized API client in `/src/shared/api/client.ts` pointing to the `/api` prefix.
- **Zero Token Leakage**: Tokens and JWTs are **never stored** in browser `localStorage` or `sessionStorage`. All state is held in-memory and authenticated via secure cookies.
- **DOM Isolation**: Restricted UI controls and views are completely removed from the DOM via `<RequireAuth />` rather than visually hidden with CSS.

---

## 3. Summary of Added Features & Capabilities

### Feature 1: Streaming UI (`<StreamingText />`)
**Location:** `/src/shared/components/StreamingText.tsx`

A high-performance streaming text renderer designed to consume real-time AI responses and display them token-by-token with a smooth typewriter effect.

#### Capabilities:
1. **Multi-Protocol Support**:
   - **Server-Sent Events (SSE)**: Automatically establishes an `EventSource` connection to `/api/ai/stream`.
   - **WebSockets**: Connects to `ws://` or `wss://` streams and parses incoming frame packets.
   - **Fetch ReadableStream**: Consumes standard browser `ReadableStream` chunks (NDJSON or raw text).
   - **Static Text Mode**: Typewriter simulation from pre-loaded strings.
2. **Buffer Queue & Pacing Engine**:
   - Batches incoming tokens into a high-speed internal queue (`tokenQueueRef`).
   - Smooth typewriter rendering (default 18ms per token) prevents UI stuttering and layout jumps.
3. **Integrated XSS Protection**:
   - Every rendered token passes through DOMPurify via `<SanitizedHtml />` before injection into the DOM.
4. **Interactive Controls**:
   - Pause, resume, restart, and fast-forward controls.
   - Custom blinking terminal cursor (`animate-pulse`).

---

### Feature 2: Modular Prompt Builder (`<PromptBuilder />`)
**Location:** `/src/shared/components/PromptBuilder.tsx` and `/src/shared/components/prompt-builder/`

An industrial-grade prompt engineering workbench for manufacturing domain experts. It allows operators, engineers, and plant managers to construct structured AI prompts with contextual parameters before sending them to the backend AI gateway.

#### Sub-Component Architecture:
- **`ContextSelector`**: Selects target domain context (Injection Molding MES, IATF 16949 Quality, MEP Chiller SCADA, WMS Inventory, Financial Costing, Supply Chain).
- **`ToneSlider`**: Adjusts model response tone (Technical Precision, Executive Summary, Root Cause Analysis, SOP Operator, Concise Audit).
- **`SystemPersonaSelector`**: Selects or customizes system instructions from industrial role presets.
- **`ContextInjectionToggles`**: Granular toggles to inject live telemetry, open work orders, IATF containment specs, or active BOM recipes.
- **`PromptVariableChips`**: One-click insertion of standardized parameter tokens (e.g., `[Parameter: Cavity Pressure Delta-P > 15 bar]`).
- **`CompiledPromptViewer`**: Real-time compiled prompt inspector displaying approximate token count and formatted Markdown preview.

---

### Feature 3: Token Management & BFF Pattern
**Location:** `/src/shared/api/client.ts` and `/src/features/auth/`

#### Security Directives Enforced:
1. **Zero Client Storage**:
   - **NEVER** store JWTs, refresh tokens, API keys, or credentials in `localStorage` or `sessionStorage`.
   - Session state is held in-memory via React state and validated on page load via `GET /api/auth/me`.
2. **Backend-For-Frontend (BFF)**:
   - Frontend communicates exclusively with the BFF gateway (`baseURL: '/api'`).
   - Axios is configured with `withCredentials: true` so the browser transmits `HttpOnly, Secure, SameSite=Strict` cookies on every request.
3. **Automated CSRF Protection**:
   - Centralized Axios interceptors read the `XSRF-TOKEN` cookie and attach it as the `X-XSRF-TOKEN` header on mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).

---

### Feature 4: XSS Prevention (`<SanitizedHtml />`)
**Location:** `/src/shared/components/SanitizedHtml.tsx`

Ensures that all dynamic, user-generated, or AI-generated Markdown/HTML is sterilized against cross-site scripting attacks prior to DOM insertion.

#### Sanitization Rules:
- Powered by `DOMPurify`.
- **Allowed Tags**: `b`, `i`, `em`, `strong`, `a`, `p`, `span`, `br`, `ul`, `ol`, `li`, `h1`-`h6`, `blockquote`, `code`, `pre`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `hr`, `mark`, `kbd`.
- **Allowed Attributes**: `href`, `target`, `rel`, `class`, `id`, `title`.
- **Forbidden Tags**: `script`, `style`, `iframe`, `object`, `embed`, `form`, `input`.
- **Forbidden Attributes**: `onerror`, `onload`, `onclick`, `onmouseover`, `action`, `data`, and any URI beginning with `javascript:`.

---

### Feature 5: Role-Based UI Guard (`<RequireAuth />`)
**Location:** `/src/shared/components/RequireAuth.tsx`

Provides zero-DOM-leakage authorization gating across views, action buttons, and sensitive configuration panels.

#### How It Works:
```tsx
import { RequireAuth } from './shared/components/RequireAuth';

// Gating an action button to administrators and managers
<RequireAuth
  roles={['admin', 'manager']}
  fallback={<span className="text-xs text-slate-400">Clearance Required</span>}
>
  <button onClick={handleApprove}>One-Click Approve</button>
</RequireAuth>
```

#### Authorization Logic:
1. Reads `currentUser` from the top-level `AuthContext`.
2. Evaluates requested roles against `currentUser.role` (case-insensitive).
3. Super-user escalation: Users with `admin`, `director`, or `superadmin` automatically pass role checks.
4. General `user` role matches all authenticated operators.
5. If authorization fails, the component returns the optional `fallback` (or `null`). **Nothing is rendered to the client DOM tree.**

---

### Feature 6: Strict Content Security Policy (CSP) Awareness
The frontend workspace has been audited and hardened for strict CSP environments:
- **Zero Inline Script Execution**: No inline `<script>` tags in `index.html` or components.
- **Zero Dynamic Evaluation**: No usage of `eval()`, `new Function()`, or `setTimeout(string)`.
- **Zero Inline Event Handlers**: All event handling uses React synthetic events (`onClick`, `onChange`).
- **Asset Integrity**: CSS and fonts are served via bundled packages or trusted origin CDNs.

---

## 4. Step-by-Step Backend Implementation Guide

Follow these steps to implement the corresponding backend services (Node.js/Express, Python/FastAPI, or Go) to interact with the Reboot ERP frontend.

---

### Step 1: Session & Authentication Service (BFF + HttpOnly Cookies)

The frontend expects session cookies rather than raw bearer tokens. The backend must set `HttpOnly` cookies upon login and clear them on logout.

#### Endpoints Required:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

#### Node.js / Express Example:
```typescript
import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());

// 1. LOGIN: Set HttpOnly, Secure, SameSite=Strict cookie
app.post('/api/auth/login', async (req, res) => {
  const { email, password, pin } = req.body;
  const user = await validateCredentials(email, password, pin);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Generate session token (opaque session ID or signed JWT)
  const sessionToken = generateSignedSessionToken(user.id);

  // Set secure HttpOnly session cookie
  res.cookie('reboot_session', sessionToken, {
    httpOnly: true,                                // Inaccessible to client JS
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    sameSite: 'strict',                            // Mitigate CSRF
    maxAge: 8 * 60 * 60 * 1000,                   // 8 hours
    path: '/',
  });

  // Set readable anti-CSRF token cookie
  const csrfToken = generateRandomCsrfToken();
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false,                               // Accessible to client to mirror into header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,                             // e.g. "Plant Operations Director", "admin", "quality"
      plantId: user.plantId,
      badgeId: user.badgeId,
    },
  });
});

// 2. VERIFY SESSION: Returns authenticated user
app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies.reboot_session;
  if (!token) {
    return res.status(401).json({ user: null });
  }

  const user = await verifySession(token);
  if (!user) {
    return res.status(401).json({ user: null });
  }

  return res.json({ user });
});

// 3. LOGOUT: Clears the cookies
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('reboot_session', { path: '/' });
  res.clearCookie('XSRF-TOKEN', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});
```

---

### Step 2: Server-Sent Events (SSE) AI Token Streaming Endpoint

The frontend `<StreamingText protocol="sse" src="/api/ai/stream?id=..." />` connects via `EventSource`. The backend must establish a continuous `text/event-stream` response and emit chunks.

#### Supported Data Formats:
The frontend parser accepts any of the following SSE payload structures:
1. `data: {"token": "word"}`
2. `data: {"content": "word"}`
3. `data: {"delta": {"text": "word"}}`
4. `event: token\ndata: {"token": "word"}`
5. `event: done\ndata: [DONE]` (signals completion)

#### Node.js / Express Example (with Google GenAI / Gemini):
```typescript
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const router = express.Router();

router.get('/api/ai/stream', async (req, res) => {
  const queryId = req.query.id as string;
  const prompt = getStoredPrompt(queryId) || 'Analyze manufacturing telemetry for Line 01.';

  // 1. Set required SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx proxy buffering
  res.flushHeaders();

  try {
    // 2. Stream tokens from model
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        // 3. Format as SSE data line
        res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
      }
    }

    // 4. Send completion event
    res.write(`event: done\ndata: [DONE]\n\n`);
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: (error as Error).message })}\n\n`);
    res.end();
  }
});
```

#### Python / FastAPI Example:
```python
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import asyncio
import json

app = FastAPI()

async def ai_token_generator(query_id: str):
    tokens = ["Root ", "Cause ", "Identified: ", "Cavity ", "pressure ", "drop ", "due ", "to ", "valve ", "gate ", "wear."]
    for token in tokens:
        # Emit standard SSE packet
        yield f"data: {json.dumps({'token': token})}\n\n"
        await asyncio.sleep(0.04) # simulate generation cadence
    
    # Emit completion
    yield "event: done\ndata: [DONE]\n\n"

@app.get("/api/ai/stream")
async def stream_ai(id: str):
    return StreamingResponse(
        ai_token_generator(id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
```

---

### Step 3: WebSocket Streaming Alternative

If `<StreamingText protocol="websocket" src="ws://localhost:3000/api/ai/ws?id=123" />` is used:

```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const queryId = url.searchParams.get('id');

  // Stream token packets
  const tokens = ['Extruder ', 'Zone ', '03 ', 'temperature ', 'stabilized.'];
  for (const token of tokens) {
    ws.send(JSON.stringify({ token }));
    await new Promise((r) => setTimeout(r, 40));
  }

  // Completion packet
  ws.send(JSON.stringify({ done: true }));
  ws.close();
});
```

---

### Step 4: Prompt Analysis & AI Gateway Endpoints

When the user clicks "Compile & Analyze" in `<PromptBuilder />`, the frontend calls:
`POST /api/ai/analyze`

#### Expected Request Payload:
```json
{
  "config": {
    "domainContext": "manufacturing",
    "systemPersona": "Senior Process & Tooling Engineer...",
    "temperature": 0.4,
    "tone": "technical_precision",
    "injectLiveTelemetry": true,
    "injectActiveWorkOrders": true,
    "injectIatfRequirements": false,
    "injectBomRecipes": false,
    "maxTokens": 2048
  },
  "promptText": "[Parameter: Cavity Pressure Delta-P > 15 bar] Investigate short shot defects on Mold M-204."
}
```

#### Expected Response Format:
```json
{
  "analysis": "Parametric analysis completed for MANUFACTURING. Cavity pressure sensor telemetry indicates late fill transition.",
  "recommendations": [
    "Verify hydraulic switchover position from velocity to pressure control",
    "Check barrel thermocouple calibration at Zone 3 and nozzle"
  ],
  "confidenceScore": 0.96,
  "compiledPrompt": "...full compiled system + user prompt string..."
}
```

---

### Step 5: Backend Role-Based Access Control (RBAC)

> **CRITICAL SECURITY DIRECTIVE:** Client-side `<RequireAuth />` handles visual presentation and DOM isolation. **The backend API must independently enforce authorization on all protected endpoints.**

#### Backend RBAC Middleware Pattern (Express):
```typescript
export function requireBackendRoles(allowedRoles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = req.user; // Populated from session cookie verification
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const role = (user.role || '').toLowerCase();

    // Admin super-user bypass
    if (role === 'admin' || role.includes('director') || role === 'superadmin') {
      return next();
    }

    // Role check
    const authorized = allowedRoles.some((allowed) => {
      const target = allowed.toLowerCase();
      return role === target || (target === 'user' && role.length > 0) || role.includes(target);
    });

    if (!authorized) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient clearance. Required: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}

// Usage in API Routes:
app.post('/api/operations/approve', requireBackendRoles(['admin', 'manager']), (req, res) => {
  // Execute approval...
});

app.post('/api/admin/firmware/reflash', requireBackendRoles(['admin']), (req, res) => {
  // Execute high-privilege action...
});
```

---

### Step 6: Strict CSP HTTP Headers Configuration

To ensure strict Content Security Policy enforcement in staging and production, configure your reverse proxy (Nginx) or application server (Helmet in Express) with the following headers:

#### Express (Helmet) Configuration:
```typescript
import helmet from 'helmet';

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],                          // ZERO inline scripts ('unsafe-inline' is forbidden)
      styleSrc: ["'self'", "'unsafe-inline'"],        // Allow bundled Tailwind CSS styles
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],      // SSE, WebSockets, REST APIs
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],                          // Block flash/plugins
      frameAncestors: ["'self'"],                     // Prevent clickjacking
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  })
);
```

#### Nginx Configuration:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' wss: https:; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; frame-ancestors 'self';" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 5. API Contract & Schema Reference

### Auth Schemas (`/src/features/auth/types/authSchemas.ts`)
```typescript
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor?: string;
  initials?: string;
  plantId?: string;
  badgeId?: string;
}
```

### Workspace RBAC Schemas (`/src/types/workspaceRbac.ts`)
```typescript
export interface ScreenSyncReport {
  totalDiscovered: number;
  newScreensCount: number;
  unassignedScreensCount: number;
  quarantinedCount: number;
  lastSyncTime: string;
}

export interface WorkspaceRolePermission {
  roleId: string;
  workspaceVisible: boolean;
  sidebarVisible: boolean;
  canExecute?: boolean;
}
```

### Prompt Builder Schemas (`/src/shared/components/PromptBuilder.tsx`)
```typescript
export interface PromptBuilderFormValues {
  domainContext: 'manufacturing' | 'quality' | 'mep_facilities' | 'inventory_wms' | 'financials_costing' | 'supply_chain';
  systemPersona: string;
  temperature: number;
  tone: 'technical_precision' | 'executive_summary' | 'root_cause_rca' | 'sop_operator' | 'concise_audit';
  injectLiveTelemetry: boolean;
  injectActiveWorkOrders: boolean;
  injectIatfRequirements: boolean;
  injectBomRecipes: boolean;
  maxTokens: number;
}
```

---

## 6. Frontend File Structure

```text
/src
├── components/                          # Domain Feature Components
│   ├── admin/                           # Administration & RBAC Hub
│   │   ├── WorkspaceModuleRbacView.tsx  # Dual-matrix Home & Sidebar governance & sync console
│   │   ├── AdminRbacSecurityMultiContextView.tsx
│   │   ├── AdminCompanyPlantsView.tsx   # Multi-plant & branch configs
│   │   ├── AdminApprovalWorkflowConfigView.tsx # Dynamic multi-tier workflow engine
│   │   ├── AdminMachineWorkCentersView.tsx     # Work center & telemetry mapping
│   │   └── ...                          # Master data, numbering, security audit views
│   ├── hr/                              # Industrial HR Suite (12 Sub-views)
│   │   ├── HrCommandCenter.tsx          # Real-time workforce operational dashboard
│   │   ├── HrEmployeeListView.tsx       # Worker records, statutory IDs & emergency contacts
│   │   ├── HrShiftRosterView.tsx        # Shift rotation & overtime planner
│   │   ├── HrAttendanceView.tsx         # Clock-in / clock-out & geofence validation
│   │   ├── HrPayrollView.tsx            # Industrial wage calculation & payslips
│   │   ├── HrSafetyPpeView.tsx          # Safety audits, PPE logs & incident tracking
│   │   ├── HrSkillsTrainingView.tsx     # IATF 16949 competency & qualification matrix
│   │   └── ...                          # Org tree, leave/OT, onboarding, compliance
│   ├── stockTransfer/                   # Multi-Plant Stock Transfer & Logistics
│   │   ├── StockTransferManager.tsx     # Master view & transfer router
│   │   ├── CreateTransferWizard.tsx     # Multi-step outbound shipment generator
│   │   ├── InboundReceiptScreen.tsx     # Inbound GRN with barcode verification
│   │   ├── ReturnableDCScreen.tsx       # Returnable delivery challan & aging alerts
│   │   ├── AssetMoldTransferScreen.tsx  # High-value tooling logistics & environmental logs
│   │   ├── InterPlantTaxComplianceScreen.tsx # GST & E-Way Bill reconciliation
│   │   └── TransferTrackingAuditDrawer.tsx   # Milestone transit progression drawer
│   ├── dispatch/                        # Dispatch & Logistics Execution
│   │   ├── DispatchDashboard.tsx        # Logistics console & dock optimization
│   │   ├── DeliveryChallanManagement.tsx# Multi-pack list validation & dispatch signs
│   │   ├── EWayBillManagement.tsx       # Direct government portal E-Way Bill sync
│   │   ├── EInvoiceManagement.tsx       # QR-verified GST e-Invoicing
│   │   └── GatePassVerification.tsx     # Security booth physical verification checkpoints
│   ├── quality/                         # Quality & IATF 16949 Compliance
│   │   ├── QualityDashboardView.tsx     # PPM defect rates, scrap % & inspection gauges
│   │   ├── NcrManagementView.tsx        # 8D Non-conformance containment workflow
│   │   ├── CapaManagementView.tsx       # Corrective action verification stages
│   │   ├── SpcMonitorView.tsx           # Real-time X-bar & R control charts
│   │   ├── CoaManagementView.tsx        # Certificate of Analysis generation
│   │   └── InspectionPlansView.tsx      # Sampling plans & tolerance thresholds
│   ├── Sidebar.tsx                      # Dynamic sidebar with RBAC filtering & quarantine groups
│   ├── HomeView.tsx                     # Workspace tile dashboard with RBAC card filtering
│   └── Topbar.tsx                       # Global header with plant selector & user avatar
├── services/
│   └── workspaceRbacService.ts          # Auto-discovery engine, dual-matrix storage & audit trails
├── hooks/
│   └── useWorkspaceRbac.ts              # Reactive hook for isWorkspaceVisible & isSidebarVisible
├── types/
│   ├── workspaceRbac.ts                 # Dual-matrix permissions & sync report schemas
│   ├── stockTransferTypes.ts            # Stock transfer, DC & transit data models
│   └── ...
├── shared/                              # Cross-Cutting Infrastructure
│   ├── api/
│   │   └── client.ts                    # Centralized Axios client (BFF, withCredentials)
│   ├── components/
│   │   ├── RequireAuth.tsx              # Role-Based UI Guard (<RequireAuth roles=[...]>)
│   │   ├── SanitizedHtml.tsx            # DOMPurify XSS prevention primitive
│   │   ├── StreamingText.tsx            # SSE / WebSocket AI text typewriter
│   │   ├── PromptBuilder.tsx            # Industrial prompt constructor container
│   │   └── prompt-builder/              # Modular sub-components
│   └── layouts/
│       ├── AppLayout.tsx                # Authenticated application shell layout
│       └── AuthLayout.tsx               # Unauthenticated login screen layout
└── features/                            # Bounded Context Modules
    ├── auth/                            # Login, PIN verification, session hook
    ├── hr/                              # HR domain schemas, APIs & hooks
    ├── manufacturing/                   # Production dispatch, machines, OEE
    ├── quality/                         # IATF 16949, SPC, NCRs, inspections
    └── ai/                              # AI prompt analysis & streaming APIs
```

---

## Conclusion & Verification
All components and directives have been compiled, type-checked (`tsc --noEmit`), and verified against the live development server. For interactive testing of both the **AI Streaming UI** and the **Security Directives**, navigate to the **"7. Architecture & AI Readiness"** tab in the main application menu.
