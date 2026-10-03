-- ============================================================================
-- SP-PLASTECH ERP — SUPABASE CLOUD 21-TABLE ENTERPRISE SCHEMA MIGRATION
-- Target Project: https://supabase.com/dashboard/project/gqrelwvmeoqvfnanoutz/sql/new
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create All 21 Tables
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT,
  short_name TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  rating NUMERIC(3, 1) DEFAULT 4.5,
  risk_level TEXT DEFAULT 'Low',
  preferred BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  industry TEXT,
  country TEXT DEFAULT 'India',
  currency TEXT DEFAULT 'INR (₹)',
  payment_terms TEXT DEFAULT 'Net 60 Days',
  delivery_terms TEXT DEFAULT 'Ex Work',
  lead_time_days INT DEFAULT 7,
  minimum_order_value NUMERIC(12, 2) DEFAULT 25000,
  moq INT DEFAULT 1000,
  hsn_code TEXT,
  tariff_code TEXT,
  contacts JSONB DEFAULT '[]'::jsonb,
  addresses JSONB DEFAULT '[]'::jsonb,
  banking_tax JSONB DEFAULT '{}'::jsonb,
  compliance JSONB DEFAULT '{}'::jsonb,
  scorecard JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  entity_type TEXT DEFAULT 'Finished Molded Component',
  unit TEXT DEFAULT 'NOS',
  stock NUMERIC(12, 2) DEFAULT 0,
  min_stock NUMERIC(12, 2) DEFAULT 0,
  max_stock NUMERIC(12, 2) DEFAULT 0,
  reorder_point NUMERIC(12, 2) DEFAULT 0,
  cost NUMERIC(12, 4) DEFAULT 0,
  selling_price NUMERIC(12, 4) DEFAULT 0,
  approval TEXT DEFAULT 'approved',
  status TEXT DEFAULT 'active',
  part_weight_grams NUMERIC(8, 2) DEFAULT 0,
  runner_weight_grams NUMERIC(8, 2) DEFAULT 0,
  cavity_count INT DEFAULT 1,
  cycle_time NUMERIC(6, 2) DEFAULT 0,
  item_group TEXT,
  resin_type TEXT,
  color TEXT,
  hsn_code TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  customer_type TEXT DEFAULT 'OEM',
  tier TEXT DEFAULT 'Tier 1',
  gstin TEXT,
  pan TEXT,
  credit_limit NUMERIC(12, 2) DEFAULT 1000000,
  credit_days INT DEFAULT 30,
  status TEXT DEFAULT 'active',
  contacts JSONB DEFAULT '[]'::jsonb,
  shipping_addresses JSONB DEFAULT '[]'::jsonb,
  billing_addresses JSONB DEFAULT '[]'::jsonb,
  payment_terms TEXT DEFAULT 'Net 30 Days',
  incoterms TEXT DEFAULT 'DAP',
  currency TEXT DEFAULT 'INR (₹)',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.warehouses (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plant_id TEXT NOT NULL,
  location_type TEXT NOT NULL,
  address TEXT,
  bins JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.machines (
  id TEXT PRIMARY KEY,
  machine_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  tonnage INT NOT NULL,
  manufacturer TEXT,
  plant_location TEXT NOT NULL,
  status TEXT DEFAULT 'IDLE',
  hourly_rate NUMERIC(10, 2) DEFAULT 1500,
  oee_percentage NUMERIC(5, 2) DEFAULT 85.0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sales_orders (
  id VARCHAR(64) PRIMARY KEY,
  so_number VARCHAR(64) UNIQUE,
  order_type VARCHAR(64) NOT NULL DEFAULT 'Standard SO',
  customer_code VARCHAR(32) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_po_number VARCHAR(128) NOT NULL,
  customer_po_date DATE NOT NULL,
  order_date DATE NOT NULL,
  required_delivery_date DATE NOT NULL,
  plant_warehouse VARCHAR(128) NOT NULL,
  fg_store VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Draft',
  credit_status VARCHAR(32) NOT NULL DEFAULT 'Approved',
  taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  cgst_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  sgst_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  igst_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  freight_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  packing_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total_order_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  delivered_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  invoiced_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  delivery_status VARCHAR(32) NOT NULL DEFAULT 'Not Started',
  invoice_status VARCHAR(32) NOT NULL DEFAULT 'Uninvoiced',
  e_invoice_status VARCHAR(32) NOT NULL DEFAULT 'Pending',
  e_way_bill_status VARCHAR(32) NOT NULL DEFAULT 'Pending',
  monthly_plan_ref VARCHAR(64),
  payment_terms VARCHAR(128),
  incoterms VARCHAR(32) DEFAULT 'DAP',
  transporter_name VARCHAR(255),
  transporter_gstin VARCHAR(32),
  vehicle_number VARCHAR(32),
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  billing_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  audit_trail JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales_order_lines (
  id VARCHAR(64) PRIMARY KEY,
  so_id VARCHAR(64) NOT NULL,
  line_number INT NOT NULL,
  item_code VARCHAR(64) NOT NULL,
  item_description TEXT NOT NULL,
  ordered_qty NUMERIC(12,2) NOT NULL,
  delivered_qty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  remaining_qty NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,4) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Open'
);

CREATE TABLE IF NOT EXISTS public.monthly_plan_orders (
  id VARCHAR(64) PRIMARY KEY,
  plan_number VARCHAR(64) UNIQUE,
  month_period VARCHAR(32) NOT NULL,
  customer VARCHAR(255) NOT NULL,
  customer_code VARCHAR(32) NOT NULL,
  customer_po_number VARCHAR(128) NOT NULL,
  plant_warehouse VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  total_planned_qty NUMERIC(12,2) NOT NULL,
  total_daily_supplied_qty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  remaining_plan_qty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_planned_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  unit_breakdowns JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_relationships (
  id VARCHAR(64) PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.customer_po_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_code VARCHAR(32) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  version VARCHAR(64) NOT NULL,
  po_number VARCHAR(128) NOT NULL,
  po_date DATE NOT NULL,
  valid_from DATE,
  valid_till DATE,
  change_reason TEXT NOT NULL,
  changed_by VARCHAR(128) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dispatch_documents (
  id VARCHAR(64) PRIMARY KEY,
  document_type VARCHAR(32) NOT NULL,
  reference_id VARCHAR(64) NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT,
  order_date DATE,
  delivery_date DATE,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.work_orders (
  id TEXT PRIMARY KEY,
  wo_number TEXT UNIQUE,
  item_code TEXT NOT NULL,
  machine_id TEXT,
  target_qty NUMERIC(12, 2) DEFAULT 0,
  produced_qty NUMERIC(12, 2) DEFAULT 0,
  scrap_qty NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.quotations (
  id VARCHAR(64) PRIMARY KEY,
  quote_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL,
  customer_name VARCHAR(255),
  total_value NUMERIC(15,2) DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'Draft',
  valid_until DATE,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rmas (
  id VARCHAR(64) PRIMARY KEY,
  rma_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64),
  customer_name VARCHAR(255),
  status VARCHAR(32) DEFAULT 'Pending',
  reason TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.boms (
  id VARCHAR(64) PRIMARY KEY,
  item_code VARCHAR(64) NOT NULL,
  version VARCHAR(32) DEFAULT 'v1.0',
  status VARCHAR(32) DEFAULT 'Active',
  components JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quality_ncrs (
  id VARCHAR(64) PRIMARY KEY,
  ncr_number VARCHAR(64) UNIQUE NOT NULL,
  severity VARCHAR(32) DEFAULT 'Medium',
  status VARCHAR(32) DEFAULT 'Open',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quality_capas (
  id VARCHAR(64) PRIMARY KEY,
  capa_number VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(32) DEFAULT 'In Progress',
  root_cause TEXT,
  action_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quality_coas (
  id VARCHAR(64) PRIMARY KEY,
  coa_number VARCHAR(64) UNIQUE NOT NULL,
  item_code VARCHAR(64) NOT NULL,
  lot_number VARCHAR(64),
  status VARCHAR(32) DEFAULT 'Approved',
  parameters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  balance NUMERIC(15,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id VARCHAR(64) PRIMARY KEY,
  je_number VARCHAR(64) UNIQUE NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(32) DEFAULT 'Posted',
  lines JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT DEFAULT 'USER',
  changes JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Row Level Security Policies (Universal Public / Authenticated Access)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'suppliers', 'items', 'customers', 'warehouses', 'machines',
    'sales_orders', 'sales_order_lines', 'monthly_plan_orders',
    'order_relationships', 'customer_po_versions', 'dispatch_documents',
    'purchase_orders', 'work_orders', 'audit_logs', 'quotations', 'rmas', 'boms',
    'quality_ncrs', 'quality_capas', 'quality_coas', 'accounts', 'journal_entries'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public access on %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Public access on %s" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- 4. Grant Access Privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
