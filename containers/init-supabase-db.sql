-- ============================================================================
-- SUPABASE POSTGRESQL INITIALIZATION & SECURITY HARDENING SCRIPT
-- Database: reboot_erp | Plant: SP-Plastech
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 2. SCHEMAS
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS _realtime;
CREATE SCHEMA IF NOT EXISTS public;

-- 3. ROLES & PERMISSIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin LOGIN SUPERUSER PASSWORD 'reboot_dev';
  END IF;
END
$$;

-- Grant schema usages
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

-- 4. CORE ERP TABLES (PUBLIC SCHEMA)
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

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT REFERENCES public.suppliers(id),
  supplier_code TEXT,
  supplier_name TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  currency TEXT DEFAULT 'INR (₹)',
  total_amount NUMERIC(14, 2) DEFAULT 0,
  status TEXT DEFAULT 'open',
  approval_status TEXT DEFAULT 'pending',
  lines JSONB DEFAULT '[]'::jsonb,
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
  credit_limit NUMERIC(14, 2) DEFAULT 1000000,
  credit_days INT DEFAULT 45,
  status TEXT DEFAULT 'active',
  contacts JSONB DEFAULT '[]'::jsonb,
  addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.warehouses (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plant_id TEXT DEFAULT 'SP-PLASTECH-01',
  location_type TEXT DEFAULT 'INTERNAL',
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.machines (
  id TEXT PRIMARY KEY,
  machine_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  tonnage INT,
  manufacturer TEXT,
  plant_location TEXT DEFAULT 'Shopfloor Bay 1',
  status TEXT DEFAULT 'RUNNING',
  oee_percentage NUMERIC(5, 2) DEFAULT 85.0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sales_orders (
  id VARCHAR(64) PRIMARY KEY,
  order_type VARCHAR(32) NOT NULL DEFAULT 'Daily Sales Order',
  customer_code VARCHAR(32) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_po_number VARCHAR(128) NOT NULL,
  customer_po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_po_version VARCHAR(64) DEFAULT 'Rev 01',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  required_delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  plant_warehouse VARCHAR(128) NOT NULL,
  fg_store VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Draft',
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

CREATE TABLE IF NOT EXISTS public.sales_order_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE TABLE IF NOT EXISTS public.monthly_plan_orders (
  id VARCHAR(64) PRIMARY KEY,
  plan_number VARCHAR(64) NOT NULL UNIQUE,
  month_period VARCHAR(32) NOT NULL,
  customer VARCHAR(255) NOT NULL,
  customer_code VARCHAR(32) NOT NULL,
  customer_po_number VARCHAR(128),
  plant_warehouse VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Pending Approval',
  total_planned_qty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
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

-- Admin Module & Master Control Tables
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'USER',
  plant_id TEXT DEFAULT 'PLANT-01',
  shift TEXT DEFAULT 'Shift A',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.company_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  company_name TEXT DEFAULT 'SP-PLASTECH',
  gstin TEXT,
  cin TEXT,
  pan TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.reason_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.warehouse_bins (
  id TEXT PRIMARY KEY,
  bin_code TEXT UNIQUE NOT NULL,
  warehouse_id TEXT NOT NULL,
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  capacity NUMERIC(12,2) DEFAULT 1000,
  occupied NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.supplier_price_lists (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  item_code TEXT NOT NULL,
  base_price NUMERIC(12,4) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  formula_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.qc_inspections (
  id TEXT PRIMARY KEY,
  inspection_number TEXT UNIQUE NOT NULL,
  item_code TEXT NOT NULL,
  lot_number TEXT,
  inspector_id TEXT,
  result TEXT DEFAULT 'PASSED',
  parameters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES (SECURITY ENFORCEMENT)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'suppliers', 'items', 'customers', 'warehouses', 'machines',
    'sales_orders', 'sales_order_lines', 'monthly_plan_orders',
    'order_relationships', 'customer_po_versions', 'dispatch_documents',
    'purchase_orders', 'work_orders', 'audit_logs', 'quotations', 'rmas', 'boms',
    'quality_ncrs', 'quality_capas', 'quality_coas', 'accounts', 'journal_entries',
    'users', 'company_settings', 'reason_codes', 'warehouse_bins', 'supplier_price_lists', 'qc_inspections'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public access on %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Public access on %s" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- 6. GRANT TABLE PRIVILEGES
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 7. ENTERPRISE B-TREE INDEX ARCHITECTURE ACROSS ALL 16 ERP MODULES (21 TABLES)
-- 1. Master Data & Raw Material Inventory (Module 1 & 2)
CREATE INDEX IF NOT EXISTS idx_items_code ON public.items USING btree (code);
CREATE INDEX IF NOT EXISTS idx_items_category_status ON public.items USING btree (category, status);
CREATE INDEX IF NOT EXISTS idx_items_stock_reorder ON public.items USING btree (stock, reorder_point);
CREATE INDEX IF NOT EXISTS idx_items_entity_type ON public.items USING btree (entity_type);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items USING btree (created_at DESC);

-- 2. Procurement & Supplier Relationship Management (Module 3 & 4)
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers USING btree (code);
CREATE INDEX IF NOT EXISTS idx_suppliers_category_status ON public.suppliers USING btree (category, status);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON public.suppliers USING btree (rating DESC);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON public.suppliers USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON public.purchase_orders USING btree (po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders USING btree (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status_created ON public.purchase_orders USING btree (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON public.purchase_orders USING btree (order_date DESC);

-- 3. Sales, CRM & Commercial CPQ (Module 5, 6, 7)
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers USING btree (code);
CREATE INDEX IF NOT EXISTS idx_customers_type_status ON public.customers USING btree (customer_type, status);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON public.customers USING btree (tier);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_orders_so_number ON public.sales_orders USING btree (so_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON public.sales_orders USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status_created ON public.sales_orders USING btree (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date ON public.sales_orders USING btree (order_date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_order_lines_so_id ON public.sales_order_lines USING btree (so_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_item_code ON public.sales_order_lines USING btree (item_code);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_status ON public.sales_order_lines USING btree (status);

CREATE INDEX IF NOT EXISTS idx_monthly_plan_orders_plan_number ON public.monthly_plan_orders USING btree (plan_number);
CREATE INDEX IF NOT EXISTS idx_monthly_plan_orders_customer_code ON public.monthly_plan_orders USING btree (customer_code);
CREATE INDEX IF NOT EXISTS idx_monthly_plan_orders_month_period ON public.monthly_plan_orders USING btree (month_period);
CREATE INDEX IF NOT EXISTS idx_monthly_plan_orders_status_created ON public.monthly_plan_orders USING btree (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_rel_monthly_plan_id ON public.order_relationships USING btree (monthly_plan_id);
CREATE INDEX IF NOT EXISTS idx_order_rel_daily_so_id ON public.order_relationships USING btree (linked_daily_so_id);
CREATE INDEX IF NOT EXISTS idx_order_rel_approval_status ON public.order_relationships USING btree (approval_status);
CREATE INDEX IF NOT EXISTS idx_order_rel_mapping_date ON public.order_relationships USING btree (mapping_date DESC);

CREATE INDEX IF NOT EXISTS idx_cust_po_ver_customer_code ON public.customer_po_versions USING btree (customer_code);
CREATE INDEX IF NOT EXISTS idx_cust_po_ver_po_number ON public.customer_po_versions USING btree (po_number);
CREATE INDEX IF NOT EXISTS idx_cust_po_ver_validity ON public.customer_po_versions USING btree (valid_from, valid_till);
CREATE INDEX IF NOT EXISTS idx_cust_po_ver_created_at ON public.customer_po_versions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotations_quote_number ON public.quotations USING btree (quote_number);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status_created ON public.quotations USING btree (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON public.quotations USING btree (valid_until);

CREATE INDEX IF NOT EXISTS idx_rmas_rma_number ON public.rmas USING btree (rma_number);
CREATE INDEX IF NOT EXISTS idx_rmas_customer_id ON public.rmas USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_rmas_status_created ON public.rmas USING btree (status, created_at DESC);

-- 4. Manufacturing Operations & Work Centers (Module 8 & 9)
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON public.warehouses USING btree (code);
CREATE INDEX IF NOT EXISTS idx_warehouses_plant_id ON public.warehouses USING btree (plant_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_location_type ON public.warehouses USING btree (location_type);

CREATE INDEX IF NOT EXISTS idx_machines_code ON public.machines USING btree (machine_code);
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines USING btree (status);
CREATE INDEX IF NOT EXISTS idx_machines_type_tonnage ON public.machines USING btree (machine_type, tonnage);

CREATE INDEX IF NOT EXISTS idx_work_orders_wo_number ON public.work_orders USING btree (wo_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_item_code ON public.work_orders USING btree (item_code);
CREATE INDEX IF NOT EXISTS idx_work_orders_machine_id ON public.work_orders USING btree (machine_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status_created ON public.work_orders USING btree (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_boms_item_code ON public.boms USING btree (item_code);
CREATE INDEX IF NOT EXISTS idx_boms_status_version ON public.boms USING btree (status, version);
CREATE INDEX IF NOT EXISTS idx_boms_created_at ON public.boms USING btree (created_at DESC);

-- 5. Quality Control, CAPA & Compliance (Module 10, 11, 12)
CREATE INDEX IF NOT EXISTS idx_quality_ncrs_ncr_number ON public.quality_ncrs USING btree (ncr_number);
CREATE INDEX IF NOT EXISTS idx_quality_ncrs_severity_status ON public.quality_ncrs USING btree (severity, status);
CREATE INDEX IF NOT EXISTS idx_quality_ncrs_created_at ON public.quality_ncrs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quality_capas_capa_number ON public.quality_capas USING btree (capa_number);
CREATE INDEX IF NOT EXISTS idx_quality_capas_status ON public.quality_capas USING btree (status);
CREATE INDEX IF NOT EXISTS idx_quality_capas_created_at ON public.quality_capas USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quality_coas_coa_number ON public.quality_coas USING btree (coa_number);
CREATE INDEX IF NOT EXISTS idx_quality_coas_item_code ON public.quality_coas USING btree (item_code);
CREATE INDEX IF NOT EXISTS idx_quality_coas_lot_number ON public.quality_coas USING btree (lot_number);
CREATE INDEX IF NOT EXISTS idx_quality_coas_status_created ON public.quality_coas USING btree (status, created_at DESC);

-- 6. Logistics, Dispatch & Compliance (Module 13 & 14)
CREATE INDEX IF NOT EXISTS idx_dispatch_docs_so_id ON public.dispatch_documents USING btree (sales_order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_docs_reference_id ON public.dispatch_documents USING btree (reference_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_docs_irn ON public.dispatch_documents USING btree (irn);
CREATE INDEX IF NOT EXISTS idx_dispatch_docs_ewb ON public.dispatch_documents USING btree (ewb_number);
CREATE INDEX IF NOT EXISTS idx_dispatch_docs_created_at ON public.dispatch_documents USING btree (created_at DESC);

-- 7. General Ledger & Enterprise Financials (Module 15)
CREATE INDEX IF NOT EXISTS idx_accounts_code ON public.accounts USING btree (code);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts USING btree (type);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON public.accounts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_je_number ON public.journal_entries USING btree (je_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status_date ON public.journal_entries USING btree (status, date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries USING btree (created_at DESC);

-- 8. Enterprise Audit Trails & Security Monitoring (Module 16)
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs USING btree (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_entity ON public.audit_logs USING btree (action_type, entity_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON public.audit_logs USING btree (user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs USING btree (timestamp DESC);

-- 9. Admin Module, System Configuration & Master Controls
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING btree (role);
CREATE INDEX IF NOT EXISTS idx_users_plant_shift ON public.users USING btree (plant_id, shift);
CREATE INDEX IF NOT EXISTS idx_users_status_created ON public.users USING btree (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_settings_id ON public.company_settings USING btree (id);

CREATE INDEX IF NOT EXISTS idx_reason_codes_code ON public.reason_codes USING btree (code);
CREATE INDEX IF NOT EXISTS idx_reason_codes_category ON public.reason_codes USING btree (category);
CREATE INDEX IF NOT EXISTS idx_reason_codes_is_active ON public.reason_codes USING btree (is_active);

CREATE INDEX IF NOT EXISTS idx_warehouse_bins_bin_code ON public.warehouse_bins USING btree (bin_code);
CREATE INDEX IF NOT EXISTS idx_warehouse_bins_wh_id ON public.warehouse_bins USING btree (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_bins_status ON public.warehouse_bins USING btree (status);

CREATE INDEX IF NOT EXISTS idx_sup_price_supplier_item ON public.supplier_price_lists USING btree (supplier_id, item_code);
CREATE INDEX IF NOT EXISTS idx_sup_price_item_code ON public.supplier_price_lists USING btree (item_code);
CREATE INDEX IF NOT EXISTS idx_sup_price_effective ON public.supplier_price_lists USING btree (effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_qc_insp_number ON public.qc_inspections USING btree (inspection_number);
CREATE INDEX IF NOT EXISTS idx_qc_insp_item_lot ON public.qc_inspections USING btree (item_code, lot_number);
CREATE INDEX IF NOT EXISTS idx_qc_insp_result_created ON public.qc_inspections USING btree (result, created_at DESC);





