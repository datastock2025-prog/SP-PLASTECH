-- migrate:up
-- Protocol 1E: Approval Engine, Governance Diffs, Audit Logs & Full-Text Search

-- 1. Approval Workflows
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  entity_type text NOT NULL,
  min_amount numeric(15,2),
  max_amount numeric(15,2),
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT uq_approval_workflows_tenant_code UNIQUE (tenant_id, code)
);

-- 2. Approval Steps
CREATE TABLE IF NOT EXISTS public.approval_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  step_name text NOT NULL,
  approver_type text NOT NULL DEFAULT 'ROLE', -- 'ROLE', 'USER', 'GROUP'
  approver_id text NOT NULL,
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_approval_steps_order UNIQUE (workflow_id, step_number)
);

-- 3. Approval Requests
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.approval_workflows(id) ON DELETE RESTRICT,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  current_step_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
  requested_by text NOT NULL,
  amount numeric(15,2),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- 4. Approval Actions (Audit trail of decisions)
CREATE TABLE IF NOT EXISTS public.approval_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  action text NOT NULL, -- 'APPROVE', 'REJECT'
  performed_by text NOT NULL,
  comments text,
  performed_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Master Data Change Requests (Maker-Checker with field-level diffs)
CREATE TABLE IF NOT EXISTS public.master_data_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'ITEM', 'BOM', 'SUPPLIER', 'CUSTOMER', 'PLANT'
  entity_id text NOT NULL,
  change_type text NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  status text NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  proposed_diff jsonb NOT NULL, -- { "old": {...}, "new": {...} }
  submitted_by text NOT NULL,
  reviewed_by text,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Full-Text Search Catalog Function
CREATE OR REPLACE FUNCTION public.search_erp_catalog(
  p_tenant_id uuid,
  p_query text,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  entity_type text,
  entity_id text,
  code text,
  title text,
  subtitle text,
  url_path text
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  -- Items
  SELECT
    'ITEM'::text AS entity_type,
    i.id::text AS entity_id,
    i.code,
    i.name AS title,
    COALESCE(i.category, 'Item') || ' - ' || COALESCE(i.resin_type, 'Standard') AS subtitle,
    '/items/' || i.id::text AS url_path
  FROM public.items i
  WHERE i.tenant_id::text = p_tenant_id::text
    AND i.deleted_at IS NULL
    AND (
      i.code ILIKE '%' || p_query || '%'
      OR i.name ILIKE '%' || p_query || '%'
      OR COALESCE(i.category, '') ILIKE '%' || p_query || '%'
      OR COALESCE(i.resin_type, '') ILIKE '%' || p_query || '%'
    )

  UNION ALL

  -- Suppliers
  SELECT
    'SUPPLIER'::text AS entity_type,
    s.id::text AS entity_id,
    s.code,
    s.name AS title,
    COALESCE(s.category, 'Supplier') || ' - ' || COALESCE(s.country, '') AS subtitle,
    '/suppliers/' || s.id::text AS url_path
  FROM public.suppliers s
  WHERE s.tenant_id::text = p_tenant_id::text
    AND s.deleted_at IS NULL
    AND (
      s.code ILIKE '%' || p_query || '%'
      OR s.name ILIKE '%' || p_query || '%'
      OR COALESCE(s.short_name, '') ILIKE '%' || p_query || '%'
    )

  UNION ALL

  -- Customers
  SELECT
    'CUSTOMER'::text AS entity_type,
    c.id::text AS entity_id,
    c.code,
    c.name AS title,
    COALESCE(c.customer_type, 'Customer') || ' - ' || COALESCE(c.gstin, '') AS subtitle,
    '/customers/' || c.id::text AS url_path
  FROM public.customers c
  WHERE c.tenant_id::text = p_tenant_id::text
    AND c.deleted_at IS NULL
    AND (
      c.code ILIKE '%' || p_query || '%'
      OR c.name ILIKE '%' || p_query || '%'
    )

  UNION ALL

  -- Plants
  SELECT
    'PLANT'::text AS entity_type,
    p.id::text AS entity_id,
    p.code,
    p.name AS title,
    COALESCE(p.location, 'Facility') || ' - ' || COALESCE(p.gstin, '') AS subtitle,
    '/plants/' || p.id::text AS url_path
  FROM public.plants p
  WHERE p.tenant_id::text = p_tenant_id::text
    AND p.deleted_at IS NULL
    AND (
      p.code ILIKE '%' || p_query || '%'
      OR p.name ILIKE '%' || p_query || '%'
      OR COALESCE(p.location, '') ILIKE '%' || p_query || '%'
    )

  LIMIT p_limit;
END;
$$;

-- 7. Indexes for Performance & Tenant Isolation
CREATE INDEX IF NOT EXISTS idx_approval_wf_tenant ON public.approval_workflows(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_approval_steps_wf ON public.approval_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_status ON public.approval_requests(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON public.approval_requests(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON public.approval_actions(request_id);
CREATE INDEX IF NOT EXISTS idx_master_data_cr_tenant_status ON public.master_data_change_requests(tenant_id, status);

-- 8. Seed Standard Workflows for tenants
INSERT INTO public.approval_workflows (id, tenant_id, code, name, entity_type, min_amount, max_amount)
SELECT
  gen_random_uuid(),
  t.id,
  'WF-PO-HIGH',
  'High-Value Purchase Order Approval (> ₹50,000)',
  'PURCHASE_ORDER',
  50000.00,
  NULL
FROM public.tenants t
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Seed Steps for WF-PO-HIGH
INSERT INTO public.approval_steps (workflow_id, tenant_id, step_number, step_name, approver_type, approver_id)
SELECT
  w.id,
  w.tenant_id,
  1,
  'Plant Manager Approval',
  'ROLE',
  'plant_manager'
FROM public.approval_workflows w
WHERE w.code = 'WF-PO-HIGH'
ON CONFLICT (workflow_id, step_number) DO NOTHING;

INSERT INTO public.approval_steps (workflow_id, tenant_id, step_number, step_name, approver_type, approver_id)
SELECT
  w.id,
  w.tenant_id,
  2,
  'Finance Director Final Sign-Off',
  'ROLE',
  'director'
FROM public.approval_workflows w
WHERE w.code = 'WF-PO-HIGH'
ON CONFLICT (workflow_id, step_number) DO NOTHING;

-- 9. Enable RLS
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_data_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS approval_workflows_tenant_isolation ON public.approval_workflows;
CREATE POLICY approval_workflows_tenant_isolation ON public.approval_workflows
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS approval_steps_tenant_isolation ON public.approval_steps;
CREATE POLICY approval_steps_tenant_isolation ON public.approval_steps
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS approval_requests_tenant_isolation ON public.approval_requests;
CREATE POLICY approval_requests_tenant_isolation ON public.approval_requests
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS approval_actions_tenant_isolation ON public.approval_actions;
CREATE POLICY approval_actions_tenant_isolation ON public.approval_actions
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS master_data_cr_tenant_isolation ON public.master_data_change_requests;
CREATE POLICY master_data_cr_tenant_isolation ON public.master_data_change_requests
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- migrate:down
DROP FUNCTION IF EXISTS public.search_erp_catalog(uuid, text, int);
DROP TABLE IF EXISTS public.master_data_change_requests CASCADE;
DROP TABLE IF EXISTS public.approval_actions CASCADE;
DROP TABLE IF EXISTS public.approval_requests CASCADE;
DROP TABLE IF EXISTS public.approval_steps CASCADE;
DROP TABLE IF EXISTS public.approval_workflows CASCADE;
