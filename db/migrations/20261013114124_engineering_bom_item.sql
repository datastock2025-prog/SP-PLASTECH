-- migrate:up
CREATE TABLE IF NOT EXISTS public.engineering_bom_item (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engineering_id uuid NOT NULL,
  tenant_id   uuid NOT NULL,
  plant_id    uuid,
  code        text NOT NULL,
  name        text NOT NULL,
  quantity    numeric(12, 4) NOT NULL DEFAULT 1,
  status      text NOT NULL DEFAULT 'ACTIVE',
  version     integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  created_by  text,
  updated_by  text
);

CREATE INDEX IF NOT EXISTS idx_engineering_bom_item_parent ON public.engineering_bom_item (engineering_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_engineering_bom_item_tenant ON public.engineering_bom_item (tenant_id) WHERE deleted_at IS NULL;

ALTER TABLE public.engineering_bom_item ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'engineering_bom_item' AND policyname = 'engineering_bom_item_tenant_isolation'
  ) THEN
    CREATE POLICY engineering_bom_item_tenant_isolation ON public.engineering_bom_item
      FOR ALL
      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
  END IF;
END $$;

REVOKE ALL ON public.engineering_bom_item FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.engineering_bom_item TO erp_app;
  END IF;
END $$;

-- migrate:down
DROP TABLE IF EXISTS public.engineering_bom_item CASCADE;
