-- migrate:up
-- Create normalized purchase_requisitions and goods_receipt_notes tables

CREATE TABLE IF NOT EXISTS public.purchase_requisitions (
  id text PRIMARY KEY,
  pr_number text NOT NULL,
  plant_id uuid REFERENCES public.plants(id) ON DELETE RESTRICT,
  department text NOT NULL DEFAULT 'Production',
  required_date date,
  priority text NOT NULL DEFAULT 'Normal',
  status text NOT NULL DEFAULT 'draft',
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_estimated_amount numeric(14, 2) DEFAULT 0,
  notes text,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  created_by text,
  updated_by text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS pr_tenant_number_uq ON public.purchase_requisitions (tenant_id, pr_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_tenant_status ON public.purchase_requisitions (tenant_id, status) WHERE deleted_at IS NULL;

-- Enable and enforce Row Level Security
ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requisitions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pr_tenant_isolation ON public.purchase_requisitions;
CREATE POLICY pr_tenant_isolation ON public.purchase_requisitions
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_requisitions TO erp_app;

CREATE TABLE IF NOT EXISTS public.goods_receipt_notes (
  id text PRIMARY KEY,
  grn_number text NOT NULL,
  po_id text NOT NULL,
  supplier_id text NOT NULL,
  supplier_invoice_no text,
  vehicle_no text,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'draft',
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric(14, 2) DEFAULT 0,
  notes text,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  plant_id uuid REFERENCES public.plants(id) ON DELETE RESTRICT,
  created_by text,
  updated_by text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS grn_tenant_number_uq ON public.goods_receipt_notes (tenant_id, grn_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_grn_tenant_po ON public.goods_receipt_notes (tenant_id, po_id) WHERE deleted_at IS NULL;

-- Enable and enforce Row Level Security
ALTER TABLE public.goods_receipt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipt_notes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grn_tenant_isolation ON public.goods_receipt_notes;
CREATE POLICY grn_tenant_isolation ON public.goods_receipt_notes
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goods_receipt_notes TO erp_app;

-- migrate:down
DROP TABLE IF EXISTS public.goods_receipt_notes;
DROP TABLE IF EXISTS public.purchase_requisitions;
