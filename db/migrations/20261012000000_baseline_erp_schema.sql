-- migrate:up

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1.1 Application Runtime Role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    CREATE ROLE erp_app WITH LOGIN PASSWORD 'erp_app_local';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO erp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO erp_app;

-- 2. Better Auth Core Tables
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  username text UNIQUE
);

CREATE TABLE IF NOT EXISTS "session" (
  id text PRIMARY KEY,
  "expiresAt" timestamp NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  active_plant_id uuid,
  active_shift text
);

CREATE TABLE IF NOT EXISTS "account" (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  scope text,
  password text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

-- 3. Identity, Roles & Multi-Tenant Access
CREATE TABLE IF NOT EXISTS tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE TABLE IF NOT EXISTS plants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  code        text NOT NULL CHECK (length(trim(code)) > 0),
  name        text NOT NULL CHECK (length(trim(name)) > 0),
  location    text,
  is_active   boolean NOT NULL DEFAULT true,
  version     integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS plants_tenant_code_uq ON plants (tenant_id, code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS plants_tenant_idx ON plants (tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS roles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  code         text NOT NULL CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
  name         text NOT NULL,
  description  text,
  is_system    boolean NOT NULL DEFAULT false,
  permissions  jsonb NOT NULL DEFAULT '[]'::jsonb,
  version      integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS roles_tenant_code_uq ON roles (tenant_id, code) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id                 text PRIMARY KEY REFERENCES "user"(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tenant_id               uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  role_id                 uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  full_name               text NOT NULL CHECK (length(trim(full_name)) > 0),
  phone                   text,
  badge_id                text,
  department              text,
  designation             text,
  assigned_shift          text,
  primary_plant_id        uuid REFERENCES plants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  reporting_manager       text,
  emergency_contact       text,
  status                  text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','LOCKED','SUSPENDED')),
  must_change_password    boolean NOT NULL DEFAULT false,
  failed_login_attempts   integer NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
  last_login_at           timestamptz,
  last_login_ip           text,
  version                 integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  deleted_at              timestamptz
);

CREATE TABLE IF NOT EXISTS plant_user (
  plant_id   uuid NOT NULL REFERENCES plants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  user_id    text NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE ON UPDATE RESTRICT,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plant_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id        text PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE ON UPDATE RESTRICT,
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  theme          text NOT NULL DEFAULT 'system',
  density        text NOT NULL DEFAULT 'comfortable',
  landing_view   text NOT NULL DEFAULT 'home',
  language       text NOT NULL DEFAULT 'en',
  timezone       text NOT NULL DEFAULT 'Asia/Kolkata',
  date_format    text NOT NULL DEFAULT 'DD/MM/YYYY',
  notifications  jsonb NOT NULL DEFAULT '{}'::jsonb,
  version        integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 4. ERP Domain 21 Tables
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
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  tenant_id TEXT DEFAULT 'SP-PLASTECH',
  deleted_at TIMESTAMPTZ,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_items_code ON public.items (code);
CREATE INDEX IF NOT EXISTS idx_items_category_status ON public.items (category, status);

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
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tonnage INT NOT NULL,
  plant TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  brand TEXT,
  model TEXT,
  hourly_rate NUMERIC(10, 2) DEFAULT 850.0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.bill_of_materials (
  id TEXT PRIMARY KEY,
  item_code TEXT NOT NULL REFERENCES public.items(code) ON DELETE RESTRICT,
  version TEXT NOT NULL,
  status TEXT DEFAULT 'approved',
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.work_orders (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  item_code TEXT NOT NULL,
  machine_id TEXT,
  target_qty INT NOT NULL,
  produced_qty INT DEFAULT 0,
  good_qty INT DEFAULT 0,
  rejection_qty INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sales_orders (
  id TEXT PRIMARY KEY,
  so_number TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed',
  total_amount NUMERIC(12, 2) DEFAULT 0,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  total_amount NUMERIC(12, 2) DEFAULT 0,
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid,
  entity_type    text NOT NULL,
  entity_id      text NOT NULL,
  action         text NOT NULL,
  changed_fields text[] NOT NULL DEFAULT '{}',
  old_values     jsonb,
  new_values     jsonb,
  performed_by   text,
  ip_address     text,
  performed_at   timestamptz NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS bill_of_materials CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS plant_user CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS plants CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
