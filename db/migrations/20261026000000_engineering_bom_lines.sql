-- migrate:up
-- Create normalized bom_lines table for multi-level BOM explosion and recipe management

CREATE TABLE IF NOT EXISTS public.bom_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  plant_id uuid REFERENCES public.plants(id) ON DELETE RESTRICT,
  bom_id text NOT NULL REFERENCES public.bill_of_materials(id) ON DELETE CASCADE,
  line_no integer NOT NULL,
  component_item_code text NOT NULL,
  component_item_name text,
  category text,
  quantity_per_unit numeric(14, 5) NOT NULL,
  uom text NOT NULL DEFAULT 'PCS',
  scrap_pct numeric(5, 2) NOT NULL DEFAULT 0,
  is_critical boolean NOT NULL DEFAULT false,
  notes text,
  version integer NOT NULL DEFAULT 1,
  created_by text,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS bom_lines_bom_line_uq ON public.bom_lines (bom_id, line_no) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bom_lines_tenant_comp ON public.bom_lines (tenant_id, component_item_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bom_lines_bom_id ON public.bom_lines (bom_id) WHERE deleted_at IS NULL;

-- Enable and enforce Row Level Security
ALTER TABLE public.bom_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_lines FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bom_lines_tenant_isolation ON public.bom_lines;
CREATE POLICY bom_lines_tenant_isolation ON public.bom_lines
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.bom_lines TO erp_app;
  END IF;
END $$;

-- migrate:down
DROP TABLE IF EXISTS public.bom_lines;
