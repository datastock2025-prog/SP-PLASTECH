-- migrate:up
-- Protocol 1C: RBAC Matrix, Roles, Groups, Scopes & SoD Architecture

-- 1. User Groups Table
CREATE TABLE IF NOT EXISTS public.user_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_groups_tenant_code
  ON public.user_groups (tenant_id, code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_groups_tenant_active
  ON public.user_groups (tenant_id, is_active)
  WHERE deleted_at IS NULL;

-- 2. User Group Members Table (Many-to-Many: User to Group)
CREATE TABLE IF NOT EXISTS public.user_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_group_user UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_group_members_user ON public.user_group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_group ON public.user_group_members (group_id);

-- 3. User Group Roles Table (Roles inherited by Group members)
CREATE TABLE IF NOT EXISTS public.user_group_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_group_role UNIQUE (group_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_group_roles_group ON public.user_group_roles (group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_roles_role ON public.user_group_roles (role_id);

-- 4. User Scopes Table (Fine-grained plant / warehouse row level access)
CREATE TABLE IF NOT EXISTS public.user_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  user_id text NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  scope_type text NOT NULL, -- 'PLANT', 'WAREHOUSE', 'COST_CENTER'
  scope_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_scope UNIQUE (user_id, scope_type, scope_value)
);

CREATE INDEX IF NOT EXISTS idx_user_scopes_user ON public.user_scopes (user_id, scope_type);

-- 5. Segregation of Duties (SoD) Rules Table
CREATE TABLE IF NOT EXISTS public.sod_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  rule_code text NOT NULL,
  name text NOT NULL,
  description text,
  risk_level text NOT NULL DEFAULT 'HIGH', -- 'CRITICAL', 'HIGH', 'MEDIUM'
  conflicting_actions jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_sod_rules_tenant_code UNIQUE (tenant_id, rule_code)
);

CREATE INDEX IF NOT EXISTS idx_sod_rules_tenant_active ON public.sod_rules (tenant_id, is_active);

-- 6. Role Screen Access Table (Granular UI screen authorization)
CREATE TABLE IF NOT EXISTS public.role_screen_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  screen_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_role_screen UNIQUE (role_id, screen_key)
);

CREATE INDEX IF NOT EXISTS idx_role_screen_access_role ON public.role_screen_access (role_id);

-- 7. Seed Standard SoD Rules for existing tenants
INSERT INTO public.sod_rules (tenant_id, rule_code, name, description, risk_level, conflicting_actions)
SELECT
  t.id,
  'SOD-01',
  'Purchase Order Creation vs. Approval',
  'A single user cannot both create and approve the same purchase order.',
  'CRITICAL',
  '{"first": {"subject": "PurchaseOrder", "action": "create"}, "second": {"subject": "PurchaseOrder", "action": "approve"}}'::jsonb
FROM public.tenants t
ON CONFLICT (tenant_id, rule_code) DO NOTHING;

INSERT INTO public.sod_rules (tenant_id, rule_code, name, description, risk_level, conflicting_actions)
SELECT
  t.id,
  'SOD-02',
  'Supplier Master Maintenance vs. PO Approval',
  'Users who manage supplier profiles cannot approve purchase orders to those suppliers.',
  'CRITICAL',
  '{"first": {"subject": "Supplier", "action": "manage"}, "second": {"subject": "PurchaseOrder", "action": "approve"}}'::jsonb
FROM public.tenants t
ON CONFLICT (tenant_id, rule_code) DO NOTHING;

INSERT INTO public.sod_rules (tenant_id, rule_code, name, description, risk_level, conflicting_actions)
SELECT
  t.id,
  'SOD-03',
  'Bill of Material Authoring vs. Engineering Approval',
  'The engineer authoring or updating a BOM cannot self-approve its release.',
  'HIGH',
  '{"first": {"subject": "BillOfMaterial", "action": "update"}, "second": {"subject": "BillOfMaterial", "action": "approve"}}'::jsonb
FROM public.tenants t
ON CONFLICT (tenant_id, rule_code) DO NOTHING;

INSERT INTO public.sod_rules (tenant_id, rule_code, name, description, risk_level, conflicting_actions)
SELECT
  t.id,
  'SOD-04',
  'Scrap Recording vs. Scrap Write-off Approval',
  'Shopfloor operators recording resin scrap cannot approve financial scrap write-offs.',
  'HIGH',
  '{"first": {"subject": "ScrapDowntime", "action": "create"}, "second": {"subject": "ScrapDowntime", "action": "approve"}}'::jsonb
FROM public.tenants t
ON CONFLICT (tenant_id, rule_code) DO NOTHING;

INSERT INTO public.sod_rules (tenant_id, rule_code, name, description, risk_level, conflicting_actions)
SELECT
  t.id,
  'SOD-05',
  'Goods Receipt Entry vs. Inbound Quality Approval',
  'Receiving dock clerks cannot perform quality sign-off and lot release.',
  'HIGH',
  '{"first": {"subject": "GoodsReceipt", "action": "create"}, "second": {"subject": "GoodsReceipt", "action": "approve"}}'::jsonb
FROM public.tenants t
ON CONFLICT (tenant_id, rule_code) DO NOTHING;

-- 8. Seed Reference Domain Roles
INSERT INTO public.roles (tenant_id, code, name, description, is_system, permissions)
SELECT
  t.id,
  'PLANT_MANAGER',
  'Plant Operations Manager',
  'Supervises shopfloor machines, production schedules, shift rosters, and maintenance',
  true,
  '[
    {"action": "read", "subject": "all"},
    {"action": "manage", "subject": "WorkOrder"},
    {"action": "manage", "subject": "ProductionEntry"},
    {"action": "manage", "subject": "ScrapDowntime"},
    {"action": "manage", "subject": "Machine"},
    {"action": "approve", "subject": "WorkOrder"},
    {"action": "approve", "subject": "ScrapDowntime"}
  ]'::jsonb
FROM public.tenants t
ON CONFLICT (tenant_id, code) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO public.roles (tenant_id, code, name, description, is_system, permissions)
SELECT
  t.id,
  'PRODUCTION_PLANNER',
  'MRP & Production Planner',
  'Manages production schedules, BOM releases, job grouping, and material requisitions',
  true,
  '[
    {"action": "read", "subject": "all"},
    {"action": "manage", "subject": "WorkOrder"},
    {"action": "manage", "subject": "BillOfMaterial"},
    {"action": "manage", "subject": "PurchaseRequisition"},
    {"action": "read", "subject": "Item"},
    {"action": "read", "subject": "Warehouse"}
  ]'::jsonb
FROM public.tenants t
ON CONFLICT (tenant_id, code) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO public.roles (tenant_id, code, name, description, is_system, permissions)
SELECT
  t.id,
  'MACHINE_OPERATOR',
  'Injection Molding Operator',
  'Logs hourly press cycle counts, shot weights, and machine breakdown stoppages',
  true,
  '[
    {"action": "read", "subject": "WorkOrder"},
    {"action": "read", "subject": "Machine"},
    {"action": "create", "subject": "ProductionEntry"},
    {"action": "create", "subject": "ScrapDowntime"}
  ]'::jsonb
FROM public.tenants t
ON CONFLICT (tenant_id, code) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO public.roles (tenant_id, code, name, description, is_system, permissions)
SELECT
  t.id,
  'QUALITY_INSPECTOR',
  'Quality Assurance Inspector',
  'Performs IQC raw material tests, in-process AQL inspections, and logs NCR reports',
  true,
  '[
    {"action": "read", "subject": "Item"},
    {"action": "read", "subject": "WorkOrder"},
    {"action": "read", "subject": "GoodsReceipt"},
    {"action": "manage", "subject": "InspectionPlan"},
    {"action": "manage", "subject": "NonConformanceReport"},
    {"action": "manage", "subject": "CAPA"},
    {"action": "approve", "subject": "GoodsReceipt"}
  ]'::jsonb
FROM public.tenants t
ON CONFLICT (tenant_id, code) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO public.roles (tenant_id, code, name, description, is_system, permissions)
SELECT
  t.id,
  'WAREHOUSE_OFFICER',
  'Warehouse & Stores Officer',
  'Manages raw resin silo receipts, putaway, picking, and lot quarantine staging',
  true,
  '[
    {"action": "read", "subject": "Item"},
    {"action": "manage", "subject": "Warehouse"},
    {"action": "manage", "subject": "WarehouseBin"},
    {"action": "manage", "subject": "GoodsReceipt"},
    {"action": "manage", "subject": "StockTransfer"}
  ]'::jsonb
FROM public.tenants t
ON CONFLICT (tenant_id, code) WHERE deleted_at IS NULL DO NOTHING;

-- Grant permissions to application role
GRANT ALL ON TABLE public.user_groups TO erp_app;
GRANT ALL ON TABLE public.user_group_members TO erp_app;
GRANT ALL ON TABLE public.user_group_roles TO erp_app;
GRANT ALL ON TABLE public.user_scopes TO erp_app;
GRANT ALL ON TABLE public.sod_rules TO erp_app;
GRANT ALL ON TABLE public.role_screen_access TO erp_app;

-- migrate:down
-- shortcut: no automated rollback for this historical migration; restore from backup.
