# SP-PLASTECH ERP — RBAC Enforcement & Admin Workspace Settings Dynamic Migration Plan

## 1. Executive Summary & Goals

This implementation plan outlines the end-to-end strategy to fulfill:
1. **Task-0: Strict CASL RBAC Enforcement** — Ensure newly provisioned users can access **only** explicitly granted permissions across workspace views and backend endpoints, with zero static/dummy data in the Admin module.
2. **Task-1: Dynamic Admin Workspace Settings Migration & Bug Fixes** — Connect all 19 Admin screens directly to live PostgreSQL backend APIs, eliminating static arrays, and fixing the two UI crashes shown in attached error images:
   - **Image 1 Fix**: `Cannot read properties of undefined (reading 'toLowerCase')` in Warehouse & Bins screen (`AdminWarehouseLocationsView.tsx`).
   - **Image 2 Fix**: `Cannot read properties of null (reading 'id')` in Plant & Branch screen (`AdminPlantBranchSettingsView.tsx`).
   - **Machine / Work Centers Fix**: Correct routing and button links in `AdminViews.tsx` (replacing the erroneous `AdminMasterDataView` fallback with dedicated Machine & Work Center management).
3. **Task-2: Dynamic User Provisioning & SuperAdmin Password Governance** —
   - Convert **Designation**, **Department**, and **Shift** in the *Provision New User* modal into dynamic dropdowns backed by PostgreSQL via `/master-data/options` with inline `+ New` creation.
   - Persist provisioned users to PostgreSQL via `POST /api/v1/users`.
   - Add password management in the User Directory actions column (change and view/reset credentials), strictly authorized for `SUPER_ADMIN`.

---

## 2. Gap Analysis: What We Already Have vs. What Needs To Be Done

| Component / Area | What We Already Have | What Needs To Be Done |
| :--- | :--- | :--- |
| **CASL RBAC Engine** | `@casl/ability` & `@casl/react` in `AbilityProvider.tsx`; server evaluates permissions in `middleware/src/ability.ts`; `/api/v1/me` returns `abilityRules`. | Wire `ability.can('read', subject)` checks to sidebar tabs, breadcrumbs, and Admin settings categories so non-permitted screens are hidden from UI and blocked at route level. |
| **Warehouse & Bins (`AdminWarehouseLocationsView`)** | UI renders bins and warehouses; `/api/v1/warehouses` and `/api/v1/warehouse-bins` exist in middleware. | **Fix Image 1 crash**: Add null-safety to `.toLowerCase()` search filters. Replace local dummy array initialization with TanStack Query hooks fetching live warehouses and bins. |
| **Plant & Branch (`AdminPlantBranchSettingsView`)** | Plant cards and form; `/api/v1/plants` exists in middleware. | **Fix Image 2 crash**: Guard `selectedPlant?.id === plt.id` against `null`. Default to `plants[0]`. Wire CRUD operations to `/api/v1/plants`. |
| **Machine / Work Centers (`adminMachines`)** | `machines` table and `/api/v1/machines` CRUD router exist in `modules/manufacturing/routes.ts`. | `AdminViews.tsx` currently routes `adminMachines` to `AdminMasterDataView` (wrong screen!). Wire to dedicated Machine & Work Center view connected to `/machines` and `/master-data/options?key=workCenters`. |
| **Reason Code Setup (`AdminReasonCodesView`)** | UI component with category tabs and search; static fallback in `adminService.ts`. | Connect `useAdminReasonCodes` directly to live backend via `/system-parameters` (category: `REASON_CODES`) or `/master-data/options`. |
| **Shift & Calendar (`AdminShiftCalendarView`)** | Shift cards and weekly schedule UI; in-memory store in `adminService.ts`. | Connect to `/master-data/options?key=userShifts` and `/system-parameters?category=CALENDAR`. |
| **Transporter Master (`AdminTransportMasterView`)** | Fleet UI; in-memory store in `transportMasterService.ts`. | Connect to `/system-parameters` (category: `TRANSPORTERS`) or `/transporters` REST endpoint. |
| **Company Settings (`AdminCompanySettingsView`)** | Company profile form (GSTIN, PAN, address); in-memory store. | Connect to `/system-parameters` (category: `COMPANY_SETTINGS`) or tenant settings endpoint. |
| **User Groups & Crews (`AdminUserGroupsView`)** | Groups and crew assignment UI; in-memory store. | Connect to `/system-parameters` (category: `USER_GROUPS`) with live user membership from `/api/v1/users`. |
| **User Directory & Provisioning (`AdminUsersView`)** | Table and modal exist; `/api/v1/users` exists; `department` and `designation` are text inputs, `shift` is hardcoded. | **1.** Make Designation, Department, and Shift dynamic `<select>` with `+ New` inline creation syncing to DB.<br>**2.** Add SuperAdmin password management action in User Directory. |
| **RBAC Matrix & Simulator (`AdminRolesView`)** | Permissions matrix UI; `/api/v1/roles` exists in middleware. | Ensure permissions matrix saves directly to `/api/v1/roles` and simulator evaluates real CASL ability. |
| **Workspace RBAC (`WorkspaceModuleRbacView`)** | Screen and tab approval matrix UI. | Persist module visibility and screen approvals to `/roles/:id` or `/master-data/options?key=workspaceAccess`. |
| **Security & Multi-Context (`AdminRbacSecurityMultiContextView`)** | Multi-plant context cards; `/security-policy` exists. | Wire policy toggles and plant assignments to `/security-policy` and `/users/:id`. |
| **Approval Workflows (`AdminApprovalWorkflowConfigView`)** | Workflow step editor; `/master-data/options?key=workflowRoutes` exists. | Wire directly to `/master-data/options` (persisted in DB `system_parameters`). |
| **Numbering Series (`AdminNumberingView`)** | Prefix/suffix/counter UI; in-memory store. | Connect to `/system-parameters` (category: `NUMBERING_SERIES`). |
| **Security & MFA (`AdminSecurityView`)** | Security policy sliders (lockout, password length, session timeout). | Connect directly to `/api/v1/security-policy` (GET & PATCH). |
| **Document Settings (`AdminDocumentSettingsView`)** | Storage bucket & extension UI. | Connect to `/master-data/options?key=bomDocumentTypes` & `/system-parameters`. |
| **Quick Actions Config (`AdminQuickActionsConfigView`)** | Quick action toggles UI. | Connect to `/system-parameters` (category: `QUICK_ACTIONS`). |
| **Parameters & UDF (`AdminSystemParametersView`)** | Custom field builder. | Connect directly to `/api/v1/system-parameters` CRUD. |

---

## 3. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React 19 / TanStack Query v5 / CASL)"]
        AUTH_CTX["Auth Context (/api/v1/me)"] -->|Hydrates| CASL["CASL AbilityProvider"]
        CASL -->|can('read', Subject)| SIDEBAR["Sidebar & Navigation Filter"]
        CASL -->|can('manage', Subject)| ADMIN_TABS["Admin Workspace Settings Filter"]
        
        subgraph AdminScreens ["Admin Workspace Settings (19 Screens)"]
            SCR_WH["Warehouse & Bins (Fix toLowerCase)"]
            SCR_PL["Plant & Branch (Fix null id)"]
            SCR_MCH["Machine / Work Centers (Dedicated View)"]
            SCR_USR["User Directory & Provisioning (Dynamic Dropdowns)"]
            SCR_ROLES["RBAC Matrix & Simulator"]
            SCR_OPTS["Other 14 Admin Settings Screens"]
        end
    end

    subgraph Middleware ["Node.js / Hono Backend Service (middleware/src/)"]
        ROUTER_AUTH["/api/v1/me (User & CASL Rules)"]
        ROUTER_USERS["/api/v1/users & /users/:id/reset-password"]
        ROUTER_ROLES["/api/v1/roles (CASL Permissions)"]
        ROUTER_MD["/api/v1/master-data/options (Governed SSOT)"]
        ROUTER_PARAMS["/api/v1/system-parameters (Dynamic Settings)"]
        ROUTER_MCH["/api/v1/machines (Equipment Master)"]
        ROUTER_WH["/api/v1/warehouses & /warehouse-bins"]
        ROUTER_PLT["/api/v1/plants"]
        ROUTER_SEC["/api/v1/security-policy"]
    end

    subgraph Database ["PostgreSQL (Supabase / Container)"]
        DB_USERS[("user, user_profiles, account, plant_user")]
        DB_ROLES[("roles (CASL JSONB permissions)")]
        DB_PARAMS[("system_parameters (governed options & settings)")]
        DB_MCH[("machines")]
        DB_WH[("warehouses, warehouse_bins")]
        DB_PLT[("plants")]
        DB_SEC[("security_policies")]
    end

    AdminScreens -->|useQuery / useMutation| Middleware
    Middleware -->|Drizzle ORM ACID Tx| Database
```

---

## 4. Detailed Phased Implementation Roadmap

### Phase 1: Fix Image Crashes & Route Bindings (Immediate Fixes)
1. **Fix Image 1 Crash in `AdminWarehouseLocationsView.tsx`**:
   - Wrap all property lookups in safe string chaining:
     ```ts
     const term = (search || '').toLowerCase().trim();
     return (
       (loc.binCode || '').toLowerCase().includes(term) ||
       (loc.warehouseName || '').toLowerCase().includes(term) ||
       (loc.zoneName || '').toLowerCase().includes(term) ||
       (loc.warehouseCode || '').toLowerCase().includes(term)
     );
     ```
   - Replace in-memory array initialization with `useWarehouses()` and `useWarehouseBins()`.
2. **Fix Image 2 Crash in `AdminPlantBranchSettingsView.tsx`**:
   - Safe-guard plant selection:
     ```ts
     const isSelected = selectedPlant?.id ? selectedPlant.id === plt.id : false;
     ```
   - In `useEffect`, if `plants.length > 0 && !selectedPlant`, automatically set `setSelectedPlant(plants[0])`.
   - Add empty state placeholder when `!selectedPlant` to prevent rendering unselected property access.
   - Wire CRUD buttons to `/api/v1/plants`.
3. **Fix Machine / Work Centers Route in `AdminViews.tsx`**:
   - Create or assign `AdminMachinesWorkCentersView.tsx` specifically for `adminMachines` and `adminWorkCenters` (instead of falling back to item master data).
   - Connect directly to `/api/v1/machines` and `/api/v1/master-data/options?key=workCenters`.

---

### Phase 2: Dynamic User Provisioning & SuperAdmin Password Controls (Task-2)
1. **Extend Governed Options in Backend**:
   - In `middleware/src/modules/masterdata/routes.ts`, register `userDesignations`, `userDepartments`, and `userShifts` into `GOVERNED_OPTION_KEYS`.
2. **Update Master Data Governance Service in Frontend**:
   - In `masterDataGovernanceService.ts`, add getters and savers:
     - `getUserDesignations()`, `saveUserDesignation(name)`
     - `getUserDepartments()`, `saveUserDepartment(name)`
     - `getUserShifts()`, `saveUserShift(name)`
3. **Update Provision New User Modal in `AdminUsersView.tsx`**:
   - Replace plain text inputs for **Designation** and **Department** and static select for **Shift** with dynamic `<select>` dropdowns.
   - Include a `+ New` button next to each label opening a lightweight modal that pushes the new value to `/master-data/options` and immediately reflects in the dropdown.
   - Ensure the form submission calls `useCreateUser()` (`POST /api/v1/users`).
4. **Add SuperAdmin Password Governance to User Directory**:
   - Check if current user is SuperAdmin (`me?.roleCode === 'SUPER_ADMIN'`).
   - Add a "Password Actions" button/menu under the table actions:
     - Allows SuperAdmin to change the user's password directly or generate a temporary password via `POST /api/v1/users/:id/reset-password`.
     - Displays the generated temporary password in a secure modal with copy-to-clipboard.
     - Strictly hidden from non-SuperAdmin users.

---

### Phase 3: Strict CASL RBAC Enforcement (Task-0)
1. **Authoritative Server CASL Rules**:
   - Ensure `POST /api/v1/roles` and `PATCH /api/v1/roles/:id` store valid `RawRuleOf<AppAbility>[]` in `roles.permissions`.
   - Ensure `/api/v1/me` returns the full rule array.
2. **Navigation & Screen Access Filtering**:
   - In `frontend/src/App.tsx` and sidebar navigation, guard view rendering:
     - Users without `can('read', 'Item')` cannot open Item Master.
     - Users without `can('read', 'BillOfMaterial')` cannot open BOM Wizard or views.
     - Users without `can('read', 'WorkOrder')` cannot access Manufacturing screens.
     - Users without `can('manage', 'User')` or `can('manage', 'Role')` cannot see Admin settings.
3. **Admin Settings Tabs Filtering**:
   - In `AdminViews.tsx`, filter `allAdminTabs` based on user permissions:
     - `adminUsers`: requires `can('read', 'User')`
     - `adminRoles`, `adminWorkspaceRbac`: requires `can('manage', 'Role')`
     - `adminSecurity`: requires `can('manage', 'SecurityPolicy')`
     - `adminPlants`: requires `can('manage', 'Plant')`
     - Non-SuperAdmin users only see tabs relevant to their role.

---

### Phase 4: Dynamic API Migration of Remaining Admin Settings (Task-1)
Connect each of the remaining Admin screens to live REST endpoints via TanStack Query:
1. **Reason Code Setup** (`AdminReasonCodesView`):
   - Backed by `/system-parameters` (category: `REASON_CODES`) or `/master-data/options?key=reasonCodes`.
2. **Shift & Calendar** (`AdminShiftCalendarView`):
   - Backed by `/system-parameters` (category: `CALENDAR`) and `/master-data/options?key=userShifts`.
3. **Company Settings** (`AdminCompanySettingsView`):
   - Backed by `/system-parameters` (category: `COMPANY_SETTINGS`).
4. **User Groups & Crews** (`AdminUserGroupsView`):
   - Backed by `/system-parameters` (category: `USER_GROUPS`) and `/users`.
5. **Approval Workflows** (`AdminApprovalWorkflowConfigView`):
   - Backed by `/master-data/options` (key: `workflowRoutes`).
6. **Numbering Series** (`AdminNumberingView`):
   - Backed by `/system-parameters` (category: `NUMBERING_SERIES`).
7. **Security & MFA** (`AdminSecurityView`):
   - Backed by `/api/v1/security-policy` (GET & PATCH).
8. **Document Management Settings** (`AdminDocumentSettingsView`):
   - Backed by `/master-data/options?key=bomDocumentTypes`.
9. **Quick Actions Config** (`AdminQuickActionsConfigView`):
   - Backed by `/system-parameters` (category: `QUICK_ACTIONS`).
10. **Parameters & UDF** (`AdminSystemParametersView`):
    - Backed by `/api/v1/system-parameters` CRUD.

---

## 5. Verification & Acceptance Criteria

| Area | Acceptance Test | Verification Method |
| :--- | :--- | :--- |
| **Warehouse & Bins** | Open Warehouse & Bins tab with null/empty fields | 0 crashes; renders table with search filter working. |
| **Plant & Branch** | Open Plant & Branch settings tab | 0 crashes; selects first plant by default; saves updates to `/api/v1/plants`. |
| **Machine / Work Centers** | Click Machine / Work Centers tab in Admin | Opens dedicated Machine & Work Center management screen with live `/machines` data. |
| **User Provisioning** | Open Provision New User modal; select Designation/Dept/Shift; click `+ New` | New options persist in DB and populate dropdowns; submitting creates user in DB. |
| **SuperAdmin Password** | Log in as SuperAdmin; open User Directory | "Change Password" action visible; resets password via API. Non-admin cannot see it. |
| **CASL RBAC** | Provision operator user with only `read:Item` | Operator cannot navigate to Admin, Finance, HR, or BOM creation; only permitted screens appear. |
| **Typecheck & Tests** | Run monorepo typecheck & unit tests | `npm run lint` = 0 errors; `npm --prefix middleware run typecheck` = 0 errors; 104 tests pass. |

---

## 6. Execution Protocol

- **Ponytail**: Minimal surgical changes; reuse existing REST endpoints and tables (`system_parameters`, `plants`, `machines`, `users`, `roles`, `security_policies`).
- **Caveman**: Crisp, high-signal commits and responses.
- **Headroom**: Zero unnecessary file churn; verify with strict typecheck and unit tests after each phase.
- **Graphify**: Preserve strict domain boundaries between frontend apps, middleware routes, and database schemas.

