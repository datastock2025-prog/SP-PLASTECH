-- migrate:up
-- Create normalized warehouse_stock and stock_movement_ledger tables for enterprise inventory

CREATE TABLE IF NOT EXISTS public.warehouse_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  plant_id uuid REFERENCES public.plants(id) ON DELETE RESTRICT,
  sku text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Virgin Polymer',
  store_type text DEFAULT 'RM',
  sub_category text DEFAULT '',
  resin_grade text,
  primary_warehouse text NOT NULL DEFAULT 'WH-RM-01',
  primary_bin text NOT NULL DEFAULT 'A1',
  total_on_hand numeric(14, 4) NOT NULL DEFAULT 0,
  allocated_to_production numeric(14, 4) NOT NULL DEFAULT 0,
  reserved_for_orders numeric(14, 4) NOT NULL DEFAULT 0,
  available_to_promise numeric(14, 4) NOT NULL DEFAULT 0,
  in_transit_from_vendors numeric(14, 4) NOT NULL DEFAULT 0,
  uom text NOT NULL DEFAULT 'KG',
  unit_cost_inr numeric(12, 4) NOT NULL DEFAULT 0,
  total_valuation_inr numeric(14, 2) NOT NULL DEFAULT 0,
  reorder_point_kg numeric(14, 4) NOT NULL DEFAULT 0,
  safety_stock_kg numeric(14, 4) NOT NULL DEFAULT 0,
  maximum_stock_kg numeric(14, 4) NOT NULL DEFAULT 50000,
  status text NOT NULL DEFAULT 'in_stock',
  lead_time_days integer NOT NULL DEFAULT 7,
  abc_classification text NOT NULL DEFAULT 'A',
  lots jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_by text,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS warehouse_stock_tenant_sku_uq ON public.warehouse_stock (tenant_id, sku) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_tenant_wh ON public.warehouse_stock (tenant_id, primary_warehouse) WHERE deleted_at IS NULL;

-- Enable and enforce Row Level Security
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS warehouse_stock_tenant_isolation ON public.warehouse_stock;
CREATE POLICY warehouse_stock_tenant_isolation ON public.warehouse_stock
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouse_stock TO erp_app;

-- Immutable Append-Only Stock Movement Ledger
CREATE TABLE IF NOT EXISTS public.stock_movement_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  plant_id uuid REFERENCES public.plants(id) ON DELETE RESTRICT,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ledger_date text NOT NULL,
  doc_type text NOT NULL,
  doc_number text NOT NULL,
  location text NOT NULL,
  location_type text NOT NULL DEFAULT 'WAREHOUSE',
  customer text,
  supplier text,
  sku text NOT NULL,
  item_name text NOT NULL,
  lot_number text,
  unit_price numeric(12, 4) DEFAULT 0,
  parent_doc_type text,
  parent_doc_number text,
  reference_number text,
  qty_per_uom numeric(12, 4) DEFAULT 1,
  movement_type text NOT NULL,
  quantity numeric(14, 4) NOT NULL,
  qty_in numeric(14, 4) NOT NULL DEFAULT 0,
  qty_out numeric(14, 4) NOT NULL DEFAULT 0,
  uom text NOT NULL DEFAULT 'KG',
  status text NOT NULL DEFAULT 'CLOSED',
  source_type text,
  source_origin text,
  source_reference text,
  source_location text,
  purpose_type text,
  purpose_description text,
  destination_store text,
  outward_reference text,
  authorized_by text NOT NULL DEFAULT 'Store Keeper',
  running_balance numeric(14, 4) NOT NULL DEFAULT 0,
  plant text,
  notes text,
  version integer NOT NULL DEFAULT 1,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_tenant_sku ON public.stock_movement_ledger (tenant_id, sku) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_ledger_tenant_doc ON public.stock_movement_ledger (tenant_id, doc_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_ledger_tenant_time ON public.stock_movement_ledger (tenant_id, timestamp DESC) WHERE deleted_at IS NULL;

-- Enable and enforce Row Level Security
ALTER TABLE public.stock_movement_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movement_ledger FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_ledger_tenant_isolation ON public.stock_movement_ledger;
CREATE POLICY stock_ledger_tenant_isolation ON public.stock_movement_ledger
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movement_ledger TO erp_app;

-- migrate:down
DROP TABLE IF EXISTS public.stock_movement_ledger;
DROP TABLE IF EXISTS public.warehouse_stock;
