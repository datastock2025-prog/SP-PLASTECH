-- migrate:up

-- 1. Standardize items tenant_id to default tenant UUID
UPDATE public.items
   SET tenant_id = 'b8f8c37c-860e-402f-b287-3acb83d32297'
 WHERE tenant_id = 'SP-PLASTECH' OR tenant_id IS NULL;

-- 2. Add D3 Standard Columns to suppliers
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS tenant_id text DEFAULT 'b8f8c37c-860e-402f-b287-3acb83d32297',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS plant_id uuid;

UPDATE public.suppliers
   SET tenant_id = 'b8f8c37c-860e-402f-b287-3acb83d32297'
 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON public.suppliers (tenant_id) WHERE deleted_at IS NULL;

-- 3. Add D3 Standard Columns to customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS tenant_id text DEFAULT 'b8f8c37c-860e-402f-b287-3acb83d32297',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS plant_id uuid;

UPDATE public.customers
   SET tenant_id = 'b8f8c37c-860e-402f-b287-3acb83d32297'
 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON public.customers (tenant_id) WHERE deleted_at IS NULL;

-- 4. Add D3 Standard Columns to warehouses
ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS tenant_id text DEFAULT 'b8f8c37c-860e-402f-b287-3acb83d32297',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text;

UPDATE public.warehouses
   SET tenant_id = 'b8f8c37c-860e-402f-b287-3acb83d32297'
 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant ON public.warehouses (tenant_id) WHERE deleted_at IS NULL;

-- 5. Add D3 Standard Columns to machines
ALTER TABLE public.machines
  ADD COLUMN IF NOT EXISTS tenant_id text DEFAULT 'b8f8c37c-860e-402f-b287-3acb83d32297',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS plant_id uuid;

UPDATE public.machines
   SET tenant_id = 'b8f8c37c-860e-402f-b287-3acb83d32297'
 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_machines_tenant ON public.machines (tenant_id) WHERE deleted_at IS NULL;

-- 6. Add D3 Standard Columns to bill_of_materials
ALTER TABLE public.bill_of_materials
  ADD COLUMN IF NOT EXISTS tenant_id text DEFAULT 'b8f8c37c-860e-402f-b287-3acb83d32297',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS plant_id uuid;

UPDATE public.bill_of_materials
   SET tenant_id = 'b8f8c37c-860e-402f-b287-3acb83d32297'
 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_bom_tenant ON public.bill_of_materials (tenant_id) WHERE deleted_at IS NULL;

-- 7. Add D3 Standard Columns to work_orders
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS tenant_id text DEFAULT 'b8f8c37c-860e-402f-b287-3acb83d32297',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS plant_id uuid;

UPDATE public.work_orders
   SET tenant_id = 'b8f8c37c-860e-402f-b287-3acb83d32297'
 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_work_orders_tenant ON public.work_orders (tenant_id) WHERE deleted_at IS NULL;

-- 8. Add D3 Standard Columns to sales_orders
ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS tenant_id text DEFAULT 'b8f8c37c-860e-402f-b287-3acb83d32297',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS plant_id uuid;

UPDATE public.sales_orders
   SET tenant_id = 'b8f8c37c-860e-402f-b287-3acb83d32297'
 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_orders_tenant ON public.sales_orders (tenant_id) WHERE deleted_at IS NULL;

-- 9. Add D3 Standard Columns to purchase_orders
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS tenant_id text DEFAULT 'b8f8c37c-860e-402f-b287-3acb83d32297',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS updated_by text,
  ADD COLUMN IF NOT EXISTS plant_id uuid;

UPDATE public.purchase_orders
   SET tenant_id = 'b8f8c37c-860e-402f-b287-3acb83d32297'
 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON public.purchase_orders (tenant_id) WHERE deleted_at IS NULL;

-- 10. Grant Runtime App Access to erp_app Role
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO erp_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erp_app;
  END IF;
END $$;

-- migrate:down

DROP INDEX IF EXISTS idx_suppliers_tenant;
DROP INDEX IF EXISTS idx_customers_tenant;
DROP INDEX IF EXISTS idx_warehouses_tenant;
DROP INDEX IF EXISTS idx_machines_tenant;
DROP INDEX IF EXISTS idx_bom_tenant;
DROP INDEX IF EXISTS idx_work_orders_tenant;
DROP INDEX IF EXISTS idx_sales_orders_tenant;
DROP INDEX IF EXISTS idx_purchase_orders_tenant;
