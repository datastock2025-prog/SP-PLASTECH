-- Migration: 20261027000003_sales_delivery_mrp.sql
-- Description: Sales order lines, delivery challans, and MRP engine runs

-- 1. Sales Order Lines
CREATE TABLE IF NOT EXISTS sales_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    so_id TEXT NOT NULL,
    line_no INTEGER NOT NULL,
    item_code TEXT NOT NULL,
    item_name TEXT,
    quantity NUMERIC(14, 2) NOT NULL,
    dispatched_qty NUMERIC(14, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 4) NOT NULL DEFAULT 0,
    total_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    uom TEXT NOT NULL DEFAULT 'PCS',
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sales_order_lines_tenant_so ON sales_order_lines(tenant_id, so_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_tenant_item ON sales_order_lines(tenant_id, item_code) WHERE deleted_at IS NULL;

ALTER TABLE sales_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_order_lines_tenant_isolation ON sales_order_lines
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON sales_order_lines TO erp_app;

-- 2. Delivery Challans (Outward Dispatch Notes)
CREATE TABLE IF NOT EXISTS delivery_challans (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    challan_number TEXT NOT NULL,
    so_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    vehicle_no TEXT,
    transporter TEXT,
    lr_number TEXT,
    dispatch_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'draft',
    lines JSONB NOT NULL DEFAULT '[]',
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_delivery_challans_tenant_num ON delivery_challans(tenant_id, challan_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_challans_tenant_so ON delivery_challans(tenant_id, so_id) WHERE deleted_at IS NULL;

ALTER TABLE delivery_challans ENABLE ROW LEVEL SECURITY;

CREATE POLICY delivery_challans_tenant_isolation ON delivery_challans
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON delivery_challans TO erp_app;

-- 3. MRP Runs (Material Requirements Planning Execution Log)
CREATE TABLE IF NOT EXISTS mrp_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    run_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    total_so_processed INTEGER NOT NULL DEFAULT 0,
    total_items_planned INTEGER NOT NULL DEFAULT 0,
    total_prs_generated INTEGER NOT NULL DEFAULT 0,
    generated_pr_ids JSONB NOT NULL DEFAULT '[]',
    gross_requirements JSONB NOT NULL DEFAULT '[]',
    net_requirements JSONB NOT NULL DEFAULT '[]',
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mrp_runs_tenant_num ON mrp_runs(tenant_id, run_number) WHERE deleted_at IS NULL;

ALTER TABLE mrp_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY mrp_runs_tenant_isolation ON mrp_runs
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON mrp_runs TO erp_app;
