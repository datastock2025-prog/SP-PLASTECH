-- ============================================================================
-- REBOOT ERP (SP-PLASTECH) — COMPLETE ENTERPRISE SUPABASE DATABASE SCHEMA
-- Full End-to-End Multi-Module Schema with Complete RLS & Realtime
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 2. SCHEMAS
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS realtime;

-- 3. ROLES & GRANTS
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
END
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 4. UTILITY FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. DOMAIN 1: AUTH, USERS, ROLES & AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID,
  email CITEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'OPERATOR',
  department TEXT,
  designation TEXT,
  plant_id TEXT DEFAULT 'SP-PLASTECH-01',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  permissions JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT DEFAULT 'USER',
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_code TEXT UNIQUE NOT NULL,
  module TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  trigger_condition JSONB DEFAULT '{}'::jsonb,
  approver_roles JSONB DEFAULT '["ADMIN"]'::jsonb,
  required_approvals INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES public.approval_workflows(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  request_title TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
  payload JSONB DEFAULT '{}'::jsonb,
  previous_state JSONB DEFAULT '{}'::jsonb,
  requested_by TEXT NOT NULL,
  requested_by_role TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. DOMAIN 2: MASTER DATA (ITEMS, BOM, UOM, WAREHOUSES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.units_of_measure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  category TEXT DEFAULT 'QUANTITY',
  conversion_factor NUMERIC(12, 6) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true
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

CREATE TABLE IF NOT EXISTS public.storage_bins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id TEXT REFERENCES public.warehouses(id),
  bin_code TEXT NOT NULL,
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  capacity_kg NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(warehouse_id, bin_code)
);

CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  entity_type TEXT DEFAULT 'Finished Molded Component',
  unit TEXT DEFAULT 'NOS',
  stock NUMERIC(14, 4) DEFAULT 0,
  min_stock NUMERIC(14, 4) DEFAULT 0,
  max_stock NUMERIC(14, 4) DEFAULT 0,
  reorder_point NUMERIC(14, 4) DEFAULT 0,
  safety_stock NUMERIC(14, 4) DEFAULT 0,
  cost NUMERIC(14, 4) DEFAULT 0,
  selling_price NUMERIC(14, 4) DEFAULT 0,
  valuation_method TEXT DEFAULT 'FIFO' CHECK (valuation_method IN ('FIFO', 'LIFO', 'WEIGHTED_AVG', 'STANDARD')),
  approval TEXT DEFAULT 'approved',
  status TEXT DEFAULT 'active',
  part_weight_grams NUMERIC(10, 3) DEFAULT 0,
  runner_weight_grams NUMERIC(10, 3) DEFAULT 0,
  cavity_count INT DEFAULT 1,
  cycle_time_seconds NUMERIC(8, 2) DEFAULT 0,
  mold_code TEXT,
  item_group TEXT,
  resin_type TEXT,
  color TEXT,
  hsn_code TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.bill_of_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bom_number TEXT UNIQUE NOT NULL,
  parent_item_id UUID REFERENCES public.items(id),
  parent_item_code TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT true,
  yield_percent NUMERIC(5, 2) DEFAULT 100.0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.bom_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bom_id UUID REFERENCES public.bill_of_materials(id) ON DELETE CASCADE,
  component_item_id UUID REFERENCES public.items(id),
  component_code TEXT NOT NULL,
  component_name TEXT NOT NULL,
  quantity NUMERIC(14, 6) NOT NULL,
  uom TEXT DEFAULT 'KG',
  scrap_percentage NUMERIC(5, 2) DEFAULT 0,
  routing_step_index INT DEFAULT 1,
  remarks TEXT
);

-- ============================================================================
-- 7. DOMAIN 3: PROCUREMENT & SCM (SUPPLIERS, PR, RFQ, PO, GRN)
-- ============================================================================

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

CREATE TABLE IF NOT EXISTS public.purchase_requisitions (
  id TEXT PRIMARY KEY,
  pr_number TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  required_by_date DATE,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Rejected', 'Converted_to_PO')),
  total_estimated_amount NUMERIC(14, 2) DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.rfqs (
  id TEXT PRIMARY KEY,
  rfq_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  submission_deadline DATE NOT NULL,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Draft', 'Open', 'Under_Review', 'Awarded', 'Closed')),
  items JSONB DEFAULT '[]'::jsonb,
  invited_suppliers JSONB DEFAULT '[]'::jsonb,
  quotations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  pr_number TEXT,
  supplier_id TEXT REFERENCES public.suppliers(id),
  supplier_code TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  payment_terms TEXT DEFAULT 'Net 60 Days',
  delivery_terms TEXT DEFAULT 'Ex Work',
  currency TEXT DEFAULT 'INR (₹)',
  subtotal NUMERIC(14, 2) DEFAULT 0,
  tax_amount NUMERIC(14, 2) DEFAULT 0,
  total_amount NUMERIC(14, 2) DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'partially_received', 'received', 'closed', 'cancelled')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  lines JSONB DEFAULT '[]'::jsonb,
  terms_conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.goods_receipt_notes (
  id TEXT PRIMARY KEY,
  grn_number TEXT UNIQUE NOT NULL,
  po_number TEXT REFERENCES public.purchase_orders(po_number),
  supplier_id TEXT REFERENCES public.suppliers(id),
  supplier_name TEXT NOT NULL,
  invoice_challan_number TEXT,
  invoice_date DATE,
  receipt_date DATE DEFAULT CURRENT_DATE,
  warehouse_id TEXT REFERENCES public.warehouses(id),
  received_by TEXT NOT NULL,
  qc_status TEXT DEFAULT 'Pending' CHECK (qc_status IN ('Pending', 'Approved', 'Rejected', 'Partially_Accepted')),
  total_accepted_qty NUMERIC(12, 2) DEFAULT 0,
  total_rejected_qty NUMERIC(12, 2) DEFAULT 0,
  lines JSONB DEFAULT '[]'::jsonb,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.supplier_price_lists (
  id TEXT PRIMARY KEY,
  price_list_id TEXT NOT NULL,
  supplier_id TEXT,
  supplier_name TEXT NOT NULL,
  group_category TEXT,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  uom TEXT DEFAULT 'NOS',
  currency TEXT DEFAULT 'INR (₹)',
  unit_price NUMERIC(14, 4) NOT NULL,
  effective_from DATE,
  effective_to DATE,
  moq INT DEFAULT 1,
  lead_time_days INT DEFAULT 7,
  price_type TEXT DEFAULT 'Fixed' CHECK (price_type IN ('Fixed', 'Indexed', 'Tiered', 'Formula')),
  index_reference TEXT,
  base_index_value NUMERIC(14, 4),
  adjustment_formula TEXT,
  freight_included BOOLEAN DEFAULT true,
  packing_included BOOLEAN DEFAULT true,
  tax_pct NUMERIC(5, 2) DEFAULT 18,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Under_Review', 'Expired', 'Draft')),
  tiers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. DOMAIN 4: WAREHOUSE & INVENTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.items(id),
  item_code TEXT NOT NULL,
  warehouse_id TEXT REFERENCES public.warehouses(id),
  bin_id UUID REFERENCES public.storage_bins(id),
  batch_number TEXT,
  quantity_on_hand NUMERIC(14, 4) DEFAULT 0,
  quantity_reserved NUMERIC(14, 4) DEFAULT 0,
  quantity_available NUMERIC(14, 4) DEFAULT 0,
  unit_cost NUMERIC(14, 4) DEFAULT 0,
  last_counted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_code, warehouse_id, batch_number)
);

CREATE TABLE IF NOT EXISTS public.stock_ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_type TEXT NOT NULL CHECK (voucher_type IN ('GRN', 'PURCHASE_RETURN', 'PRODUCTION_ISSUE', 'PRODUCTION_RECEIPT', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT', 'SALES_DISPATCH')),
  voucher_number TEXT NOT NULL,
  item_code TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  batch_number TEXT,
  quantity_change NUMERIC(14, 4) NOT NULL,
  resulting_quantity NUMERIC(14, 4) NOT NULL,
  unit_rate NUMERIC(14, 4) DEFAULT 0,
  total_valuation NUMERIC(16, 4) DEFAULT 0,
  posted_by TEXT NOT NULL,
  posting_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id TEXT PRIMARY KEY,
  transfer_number TEXT UNIQUE NOT NULL,
  source_warehouse_id TEXT REFERENCES public.warehouses(id),
  target_warehouse_id TEXT REFERENCES public.warehouses(id),
  transfer_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
  transferred_by TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. DOMAIN 5: MANUFACTURING & SHOP FLOOR
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.machines (
  id TEXT PRIMARY KEY,
  machine_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  tonnage INT,
  manufacturer TEXT,
  model_number TEXT,
  plant_location TEXT DEFAULT 'Shopfloor Bay 1',
  status TEXT DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'IDLE', 'BREAKDOWN', 'MAINTENANCE', 'OFFLINE')),
  current_operator TEXT,
  oee_percentage NUMERIC(5, 2) DEFAULT 85.0,
  power_kw NUMERIC(6, 2),
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.work_orders (
  id TEXT PRIMARY KEY,
  wo_number TEXT UNIQUE NOT NULL,
  sales_order_number TEXT,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  target_quantity NUMERIC(12, 2) NOT NULL,
  produced_quantity NUMERIC(12, 2) DEFAULT 0,
  rejected_quantity NUMERIC(12, 2) DEFAULT 0,
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  assigned_machine_id TEXT REFERENCES public.machines(id),
  status TEXT DEFAULT 'PLANNED' CHECK (status IN ('DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED')),
  priority TEXT DEFAULT 'MEDIUM',
  bom_id UUID REFERENCES public.bill_of_materials(id),
  operations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.shift_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_name TEXT NOT NULL CHECK (shift_name IN ('Shift A (Morning)', 'Shift B (Evening)', 'Shift C (Night)')),
  shift_date DATE DEFAULT CURRENT_DATE,
  machine_id TEXT REFERENCES public.machines(id),
  work_order_id TEXT REFERENCES public.work_orders(id),
  operator_name TEXT NOT NULL,
  good_shots INT DEFAULT 0,
  reject_shots INT DEFAULT 0,
  downtime_minutes INT DEFAULT 0,
  downtime_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. DOMAIN 6: QUALITY MANAGEMENT (QC & NCR)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.qc_inspections (
  id TEXT PRIMARY KEY,
  inspection_number TEXT UNIQUE NOT NULL,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('INCOMING', 'IN_PROCESS', 'FINAL_PDI', 'AUDIT')),
  reference_voucher_number TEXT,
  item_code TEXT NOT NULL,
  lot_number TEXT,
  sample_size INT NOT NULL,
  accepted_quantity NUMERIC(12, 2) DEFAULT 0,
  rejected_quantity NUMERIC(12, 2) DEFAULT 0,
  inspector_name TEXT NOT NULL,
  inspection_status TEXT DEFAULT 'PASSED' CHECK (inspection_status IN ('PASSED', 'REJECTED', 'CONCESSION', 'PENDING')),
  parameters_measured JSONB DEFAULT '[]'::jsonb,
  defects_found JSONB DEFAULT '[]'::jsonb,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ncr_reports (
  id TEXT PRIMARY KEY,
  ncr_number TEXT UNIQUE NOT NULL,
  severity TEXT DEFAULT 'Minor' CHECK (severity IN ('Minor', 'Major', 'Critical')),
  source TEXT NOT NULL CHECK (source IN ('Incoming Material', 'In-Process', 'Final Inspection', 'Customer Complaint')),
  item_code TEXT NOT NULL,
  defect_description TEXT NOT NULL,
  containment_action TEXT,
  root_cause TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  assigned_to TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATION', 'ACTION_PENDING', 'CLOSED')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. DOMAIN 7: SALES & CRM (CUSTOMERS, ORDERS, INVOICES)
-- ============================================================================

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

CREATE TABLE IF NOT EXISTS public.sales_orders (
  id TEXT PRIMARY KEY,
  so_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES public.customers(id),
  customer_code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  po_reference TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_due_date DATE,
  currency TEXT DEFAULT 'INR (₹)',
  subtotal NUMERIC(14, 2) DEFAULT 0,
  tax_amount NUMERIC(14, 2) DEFAULT 0,
  total_amount NUMERIC(14, 2) DEFAULT 0,
  status TEXT DEFAULT 'CONFIRMED' CHECK (status IN ('DRAFT', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED')),
  lines JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sales_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  sales_order_number TEXT REFERENCES public.sales_orders(so_number),
  customer_id TEXT REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(14, 2) DEFAULT 0,
  gst_amount NUMERIC(14, 2) DEFAULT 0,
  total_amount NUMERIC(14, 2) DEFAULT 0,
  status TEXT DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
  payment_status JSONB DEFAULT '{}'::jsonb,
  lines JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 12. DOMAIN 8: FINANCE & ACCOUNTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_code TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  parent_code TEXT,
  currency TEXT DEFAULT 'INR',
  is_reconciliation BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.general_ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posting_date DATE DEFAULT CURRENT_DATE,
  voucher_type TEXT NOT NULL,
  voucher_number TEXT NOT NULL,
  account_code TEXT REFERENCES public.chart_of_accounts(account_code),
  debit NUMERIC(16, 2) DEFAULT 0,
  credit NUMERIC(16, 2) DEFAULT 0,
  party_type TEXT,
  party_id TEXT,
  narration TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 13. DOMAIN 9: HUMAN RESOURCES & PAYROLL
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  employee_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  date_of_joining DATE,
  employment_type TEXT DEFAULT 'FULL_TIME',
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PROBATION', 'RESIGNED', 'TERMINATED')),
  bank_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT REFERENCES public.employees(id),
  date DATE DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY')),
  shift TEXT DEFAULT 'Shift A',
  work_hours NUMERIC(4, 2) DEFAULT 8.0,
  UNIQUE(employee_id, date)
);

-- ============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES ON ALL TABLES
-- ============================================================================

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'users_profile', 'audit_logs', 'approval_workflows', 'approval_requests',
    'categories', 'units_of_measure', 'warehouses', 'storage_bins', 'items', 'bill_of_materials', 'bom_items',
    'suppliers', 'supplier_price_lists', 'purchase_requisitions', 'rfqs', 'purchase_orders', 'goods_receipt_notes',
    'inventory_stock', 'stock_ledger_entries', 'stock_transfers',
    'machines', 'work_orders', 'shift_logs',
    'qc_inspections', 'ncr_reports',
    'customers', 'sales_orders', 'sales_invoices',
    'chart_of_accounts', 'general_ledger_entries',
    'employees', 'attendance_records'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- SELECT policy for anon, authenticated, service_role
    EXECUTE format('DROP POLICY IF EXISTS "select_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "select_all_%s" ON public.%I FOR SELECT TO anon, authenticated, service_role USING (true);', tbl, tbl);
    
    -- INSERT policy
    EXECUTE format('DROP POLICY IF EXISTS "insert_auth_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "insert_auth_%s" ON public.%I FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);', tbl, tbl);

    -- UPDATE policy
    EXECUTE format('DROP POLICY IF EXISTS "update_auth_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "update_auth_%s" ON public.%I FOR UPDATE TO anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl, tbl);

    -- DELETE policy
    EXECUTE format('DROP POLICY IF EXISTS "delete_auth_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "delete_auth_%s" ON public.%I FOR DELETE TO authenticated, service_role USING (true);', tbl, tbl);
  END LOOP;
END
$$;

-- 15. AUTO-UPDATING TIMESTAMP TRIGGERS
DO $$
DECLARE
  tbl text;
  tables_with_updated_at text[] := ARRAY[
    'users_profile', 'approval_workflows', 'approval_requests',
    'items', 'bill_of_materials', 'suppliers', 'supplier_price_lists', 'purchase_requisitions', 'rfqs',
    'purchase_orders', 'goods_receipt_notes', 'machines', 'work_orders',
    'ncr_reports', 'customers', 'sales_orders', 'sales_invoices', 'employees'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_with_updated_at
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_update_timestamp ON public.%I;', tbl);
    EXECUTE format('CREATE TRIGGER trg_update_timestamp BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();', tbl);
  END LOOP;
END
$$;

-- 16. REALTIME REPLICATION PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.items,
  public.suppliers,
  public.supplier_price_lists,
  public.purchase_orders,
  public.goods_receipt_notes,
  public.work_orders,
  public.machines,
  public.qc_inspections,
  public.sales_orders,
  public.approval_requests,
  public.audit_logs;

-- Grant permissions to public schemas
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
