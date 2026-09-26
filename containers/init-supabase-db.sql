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
  id TEXT PRIMARY KEY,
  so_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES public.customers(id),
  customer_code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_due_date DATE,
  currency TEXT DEFAULT 'INR (₹)',
  subtotal NUMERIC(14, 2) DEFAULT 0,
  tax_amount NUMERIC(14, 2) DEFAULT 0,
  total_amount NUMERIC(14, 2) DEFAULT 0,
  status TEXT DEFAULT 'CONFIRMED',
  lines JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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

-- 5. ROW LEVEL SECURITY (RLS) POLICIES (SECURITY ENFORCEMENT)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone (anon & authenticated) can SELECT
CREATE POLICY "Allow public read access on suppliers" 
ON public.suppliers FOR SELECT 
TO anon, authenticated, service_role 
USING (true);

CREATE POLICY "Allow public read access on customers" 
ON public.customers FOR SELECT 
TO anon, authenticated, service_role 
USING (true);


CREATE POLICY "Allow public read access on items" 
ON public.items FOR SELECT 
TO anon, authenticated, service_role 
USING (true);

CREATE POLICY "Allow public read access on purchase orders" 
ON public.purchase_orders FOR SELECT 
TO anon, authenticated, service_role 
USING (true);

-- Policy 2: INSERT & UPDATE requires authenticated token or service_role
CREATE POLICY "Allow authenticated insert on suppliers" 
ON public.suppliers FOR INSERT 
TO authenticated, service_role 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on suppliers" 
ON public.suppliers FOR UPDATE 
TO authenticated, service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated insert on items" 
ON public.items FOR INSERT 
TO authenticated, service_role 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on items" 
ON public.items FOR UPDATE 
TO authenticated, service_role 
USING (true) 
WITH CHECK (true);

-- Policy 3: Audit logs append-only policy
CREATE POLICY "Allow authenticated insert audit logs" 
ON public.audit_logs FOR INSERT 
TO anon, authenticated, service_role 
WITH CHECK (true);

CREATE POLICY "Allow read audit logs" 
ON public.audit_logs FOR SELECT 
TO authenticated, service_role 
USING (true);

-- 6. GRANT TABLE PRIVILEGES
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
