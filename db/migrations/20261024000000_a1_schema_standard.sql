-- migrate:up

-- 1. Standardize tenants table
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

UPDATE public.tenants
   SET slug = lower(code)
 WHERE slug IS NULL;

ALTER TABLE public.tenants
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_uq ON public.tenants (slug) WHERE deleted_at IS NULL;

-- 2. Standardize items table
ALTER TABLE public.bill_of_materials
  DROP CONSTRAINT IF EXISTS bill_of_materials_item_code_fkey;

ALTER TABLE public.items
  ALTER COLUMN tenant_id DROP DEFAULT,
  ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid,
  ALTER COLUMN tenant_id SET NOT NULL,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS plant_id uuid REFERENCES public.plants(id) ON DELETE RESTRICT;

ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS items_tenant_code_uq ON public.items (tenant_id, code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_items_tenant_deleted ON public.items (tenant_id) WHERE deleted_at IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'items_tenant_id_fkey') THEN
    ALTER TABLE public.items ADD CONSTRAINT items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 3. Standardize suppliers
ALTER TABLE public.suppliers
  ALTER COLUMN tenant_id DROP DEFAULT,
  ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid,
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.suppliers
  DROP CONSTRAINT IF EXISTS suppliers_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS suppliers_tenant_code_uq ON public.suppliers (tenant_id, code) WHERE deleted_at IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'suppliers_tenant_id_fkey') THEN
    ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 4. Standardize customers
ALTER TABLE public.customers
  ALTER COLUMN tenant_id DROP DEFAULT,
  ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid,
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_code_uq ON public.customers (tenant_id, code) WHERE deleted_at IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customers_tenant_id_fkey') THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 5. Standardize warehouses
ALTER TABLE public.warehouses
  ALTER COLUMN tenant_id DROP DEFAULT,
  ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid,
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.warehouses
  DROP CONSTRAINT IF EXISTS warehouses_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS warehouses_tenant_code_uq ON public.warehouses (tenant_id, code) WHERE deleted_at IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'warehouses_tenant_id_fkey') THEN
    ALTER TABLE public.warehouses ADD CONSTRAINT warehouses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 6. Standardize machines
ALTER TABLE public.machines
  ALTER COLUMN tenant_id DROP DEFAULT,
  ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid,
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.machines
  DROP CONSTRAINT IF EXISTS machines_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS machines_tenant_code_uq ON public.machines (tenant_id, code) WHERE deleted_at IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'machines_tenant_id_fkey') THEN
    ALTER TABLE public.machines ADD CONSTRAINT machines_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 7. Standardize bill_of_materials
ALTER TABLE public.bill_of_materials
  ALTER COLUMN tenant_id DROP DEFAULT,
  ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid,
  ALTER COLUMN tenant_id SET NOT NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bill_of_materials' AND column_name = 'version' AND data_type = 'text') THEN
    ALTER TABLE public.bill_of_materials RENAME COLUMN version TO bom_version;
    ALTER TABLE public.bill_of_materials ADD COLUMN version integer NOT NULL DEFAULT 1;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bom_tenant_id_fkey') THEN
    ALTER TABLE public.bill_of_materials ADD CONSTRAINT bom_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 8. Standardize work_orders
ALTER TABLE public.work_orders
  ALTER COLUMN tenant_id DROP DEFAULT,
  ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid,
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.work_orders
  DROP CONSTRAINT IF EXISTS work_orders_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS work_orders_tenant_code_uq ON public.work_orders (tenant_id, code) WHERE deleted_at IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'work_orders_tenant_id_fkey') THEN
    ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 9. Standardize sales_orders
ALTER TABLE public.sales_orders
  ALTER COLUMN tenant_id DROP DEFAULT,
  ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid,
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.sales_orders
  DROP CONSTRAINT IF EXISTS sales_orders_so_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS sales_orders_tenant_so_uq ON public.sales_orders (tenant_id, so_number) WHERE deleted_at IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sales_orders_tenant_id_fkey') THEN
    ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 10. Standardize purchase_orders
ALTER TABLE public.purchase_orders
  ALTER COLUMN tenant_id DROP DEFAULT,
  ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid,
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_po_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS purchase_orders_tenant_po_uq ON public.purchase_orders (tenant_id, po_number) WHERE deleted_at IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'purchase_orders_tenant_id_fkey') THEN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 11. Idempotency Keys table (24h document mutation protection)
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  request_hash text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_key ON public.idempotency_keys (tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON public.idempotency_keys (created_at);

-- 12. Row-Level Security (RLS) enforcement on all core ERP tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS items_tenant_isolation ON public.items;
CREATE POLICY items_tenant_isolation ON public.items
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS suppliers_tenant_isolation ON public.suppliers;
CREATE POLICY suppliers_tenant_isolation ON public.suppliers
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customers_tenant_isolation ON public.customers;
CREATE POLICY customers_tenant_isolation ON public.customers
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS warehouses_tenant_isolation ON public.warehouses;
CREATE POLICY warehouses_tenant_isolation ON public.warehouses
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS machines_tenant_isolation ON public.machines;
CREATE POLICY machines_tenant_isolation ON public.machines
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE public.bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_of_materials FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bom_tenant_isolation ON public.bill_of_materials;
CREATE POLICY bom_tenant_isolation ON public.bill_of_materials
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS work_orders_tenant_isolation ON public.work_orders;
CREATE POLICY work_orders_tenant_isolation ON public.work_orders
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sales_orders_tenant_isolation ON public.sales_orders;
CREATE POLICY sales_orders_tenant_isolation ON public.sales_orders
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS purchase_orders_tenant_isolation ON public.purchase_orders;
CREATE POLICY purchase_orders_tenant_isolation ON public.purchase_orders
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- 13. Audit logs append-only permissions for runtime application
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    REVOKE UPDATE, DELETE ON public.audit_logs FROM erp_app;
    GRANT INSERT, SELECT ON public.audit_logs TO erp_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.idempotency_keys TO erp_app;
  END IF;
END $$;

-- migrate:down

DROP TABLE IF EXISTS public.idempotency_keys;
