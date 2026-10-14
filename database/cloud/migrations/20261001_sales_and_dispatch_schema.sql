-- ============================================================================
-- SP PLASTECH ERP - SALES & DISPATCH ENTERPRISE SCHEMA MIGRATION
-- Migration: 20261001_sales_and_dispatch_schema.sql
-- ============================================================================

-- 1. Sales Orders Table (Header)
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'SO-2026-5001'
    order_type VARCHAR(32) NOT NULL,              -- 'Daily Sales Order', 'Monthly Plan Order', 'Blanket/Contract Order'
    customer_code VARCHAR(32) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_po_number VARCHAR(128) NOT NULL,
    customer_po_date DATE NOT NULL,
    customer_po_version VARCHAR(64) DEFAULT 'Rev 01',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_delivery_date DATE NOT NULL,
    plant_warehouse VARCHAR(128) NOT NULL,
    fg_store VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Draft',  -- 'Draft', 'Pending Approval', 'Confirmed', 'Partially Delivered', 'Delivered', 'Invoiced', 'Credit Hold'
    credit_status VARCHAR(16) DEFAULT 'Approved',
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    cgst_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    sgst_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    igst_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    freight_amount NUMERIC(15,2) DEFAULT 0.00,
    packing_amount NUMERIC(15,2) DEFAULT 0.00,
    total_order_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    delivered_value NUMERIC(15,2) DEFAULT 0.00,
    invoiced_value NUMERIC(15,2) DEFAULT 0.00,
    delivery_status VARCHAR(32) DEFAULT 'Not Started',
    invoice_status VARCHAR(32) DEFAULT 'Uninvoiced',
    e_invoice_status VARCHAR(32) DEFAULT 'Pending',
    e_way_bill_status VARCHAR(32) DEFAULT 'Pending',
    monthly_plan_ref VARCHAR(64),
    payment_terms VARCHAR(128),
    incoterms VARCHAR(64),
    transporter_name VARCHAR(255),
    transporter_gstin VARCHAR(32),
    vehicle_number VARCHAR(64),
    shipping_address JSONB,
    billing_address JSONB,
    audit_trail JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Sales Order Line Items Table
CREATE TABLE IF NOT EXISTS public.sales_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id VARCHAR(64) NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_code VARCHAR(64) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    customer_item_code VARCHAR(128),
    hsn VARCHAR(32) NOT NULL,
    uom VARCHAR(16) NOT NULL DEFAULT 'PCS',
    ordered_qty NUMERIC(12,2) NOT NULL,
    allocated_qty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    delivered_qty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    invoiced_qty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    remaining_qty NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    discount_pct NUMERIC(5,2) DEFAULT 0.00,
    taxable_value NUMERIC(15,2) NOT NULL,
    gst_rate_pct NUMERIC(5,2) DEFAULT 18.00,
    cgst_amount NUMERIC(12,2) DEFAULT 0.00,
    sgst_amount NUMERIC(12,2) DEFAULT 0.00,
    igst_amount NUMERIC(12,2) DEFAULT 0.00,
    total_value NUMERIC(15,2) NOT NULL,
    polymer_grade VARCHAR(128),
    mould_code VARCHAR(128),
    available_stock NUMERIC(12,2) DEFAULT 0.00,
    reserved_stock NUMERIC(12,2) DEFAULT 0.00,
    shortage_qty NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(32) DEFAULT 'In Stock'
);

-- 3. Monthly Plan Orders (Contract Commitments & Demand Master)
CREATE TABLE IF NOT EXISTS public.monthly_plan_orders (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'PLN-2026-09-01'
    plan_number VARCHAR(64) NOT NULL UNIQUE,
    month_period VARCHAR(32) NOT NULL,           -- 'September 2026'
    customer VARCHAR(255) NOT NULL,
    customer_code VARCHAR(32) NOT NULL,
    customer_po_number VARCHAR(128),
    plant_warehouse VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending Approval', -- 'Pending Approval', 'Committed', 'Partially Supplied', 'Fully Supplied', 'Expired'
    total_planned_qty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_daily_supplied_qty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    remaining_plan_qty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_planned_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    unit_breakdowns JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Order Relationships (Monthly vs. Daily Reconciliation Bindings)
CREATE TABLE IF NOT EXISTS public.order_relationships (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'MAP-17277028-101'
    monthly_plan_id VARCHAR(64) NOT NULL,
    monthly_plan_line_item VARCHAR(64),
    linked_daily_so_id VARCHAR(64) NOT NULL,
    linked_daily_so_line_item VARCHAR(64),
    link_type VARCHAR(64) DEFAULT 'Manually Mapped',
    linked_quantity NUMERIC(12,2) NOT NULL,
    remaining_monthly_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    mapping_reason TEXT NOT NULL,
    mapped_by VARCHAR(128) NOT NULL,
    mapping_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approval_status VARCHAR(32) DEFAULT 'Approved'
);

-- 5. Customer PO Amendment History (Audit Traceability)
CREATE TABLE IF NOT EXISTS public.customer_po_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(32) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    version VARCHAR(64) NOT NULL,                -- e.g. 'Rev 03'
    po_number VARCHAR(128) NOT NULL,
    po_date DATE NOT NULL,
    valid_from DATE,
    valid_till DATE,
    change_reason TEXT NOT NULL,
    changed_by VARCHAR(128) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Dispatched Documents & PDF Archival Metadata (Cloudflare R2 Linked)
CREATE TABLE IF NOT EXISTS public.dispatch_documents (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'DOC-INV-2026-9001'
    document_type VARCHAR(32) NOT NULL,          -- 'E-Invoice', 'E-Way Bill', 'Delivery Challan', 'Gate Pass'
    reference_id VARCHAR(64) NOT NULL,           -- e.g. 'INV-2026-9001' / 'DC-2026-501'
    sales_order_id VARCHAR(64) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    irn VARCHAR(128),
    ewb_number VARCHAR(64),
    pdf_file_name VARCHAR(255) NOT NULL,
    r2_bucket VARCHAR(128) NOT NULL DEFAULT 'sp-plastech-erp-documents',
    r2_object_key VARCHAR(512) NOT NULL,
    r2_public_cdn_url TEXT,
    document_hash VARCHAR(128),
    generated_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid query performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON public.sales_orders (customer_code);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders (status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_type ON public.sales_orders (order_type);
CREATE INDEX IF NOT EXISTS idx_monthly_plan_period ON public.monthly_plan_orders (month_period);
CREATE INDEX IF NOT EXISTS idx_order_rel_plan ON public.order_relationships (monthly_plan_id);
CREATE INDEX IF NOT EXISTS idx_order_rel_so ON public.order_relationships (linked_daily_so_id);
CREATE INDEX IF NOT EXISTS idx_po_versions_cust ON public.customer_po_versions (customer_code);
CREATE INDEX IF NOT EXISTS idx_dispatch_docs_ref ON public.dispatch_documents (reference_id);
