-- migrate:up
-- Protocol 1F: Integrations, Data Import/Export Centre & Platform Operations

-- 1. Integrations Table (Encrypted Secrets)
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL, -- 'ERP', 'ACCOUNTING', 'IOT_MES', 'LOGISTICS', 'PAYMENTS'
  provider text NOT NULL, -- 'SAP', 'TALLY', 'OPC_UA', 'SHIPROCKET', 'RAZORPAY', 'CUSTOM_WEBHOOK'
  auth_type text NOT NULL DEFAULT 'API_KEY', -- 'API_KEY', 'BEARER_TOKEN', 'BASIC', 'OAUTH2'
  status text NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'FAILED'
  base_url text,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  secret_ciphertext text,
  secret_iv text,
  secret_last_four text,
  last_sync_at timestamptz,
  last_error text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT uq_integrations_tenant_name UNIQUE (tenant_id, name)
);

-- 2. Data Jobs Table (Batch Import & Export Orchestrator)
CREATE TABLE IF NOT EXISTS public.data_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  job_type text NOT NULL, -- 'IMPORT', 'EXPORT'
  entity_type text NOT NULL, -- 'ITEM', 'SUPPLIER', 'CUSTOMER', 'BOM', 'WORK_ORDER'
  status text NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VALIDATED', 'COMMITTED', 'FAILED'
  file_name text,
  total_rows integer NOT NULL DEFAULT 0,
  processed_rows integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  error_summary jsonb,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Staging Import Rows Table (Dry-run validation before committing)
CREATE TABLE IF NOT EXISTS public.import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.data_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_data jsonb NOT NULL,
  validation_errors jsonb,
  status text NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VALID', 'INVALID', 'COMMITTED'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Retention Policies Table
CREATE TABLE IF NOT EXISTS public.retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  retention_days integer NOT NULL DEFAULT 365,
  purge_soft_deleted boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_retention_policy_tenant_entity UNIQUE (tenant_id, entity_type)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON public.integrations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_jobs_tenant_status ON public.data_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_import_rows_job ON public.import_rows(job_id);
CREATE INDEX IF NOT EXISTS idx_retention_policies_tenant ON public.retention_policies(tenant_id);

-- 6. Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS integrations_tenant_isolation ON public.integrations;
CREATE POLICY integrations_tenant_isolation ON public.integrations
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS data_jobs_tenant_isolation ON public.data_jobs;
CREATE POLICY data_jobs_tenant_isolation ON public.data_jobs
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS import_rows_isolation ON public.import_rows;
CREATE POLICY import_rows_isolation ON public.import_rows
  USING (job_id IN (SELECT id FROM public.data_jobs WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid));

DROP POLICY IF EXISTS retention_policies_tenant_isolation ON public.retention_policies;
CREATE POLICY retention_policies_tenant_isolation ON public.retention_policies
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 7. Seed standard integrations and retention policies
INSERT INTO public.retention_policies (tenant_id, entity_type, retention_days, purge_soft_deleted)
SELECT id, 'AUDIT_LOGS', 730, false FROM public.tenants
ON CONFLICT (tenant_id, entity_type) DO NOTHING;

INSERT INTO public.retention_policies (tenant_id, entity_type, retention_days, purge_soft_deleted)
SELECT id, 'LOGIN_EVENTS', 180, true FROM public.tenants
ON CONFLICT (tenant_id, entity_type) DO NOTHING;

INSERT INTO public.retention_policies (tenant_id, entity_type, retention_days, purge_soft_deleted)
SELECT id, 'IMPORT_JOBS', 90, true FROM public.tenants
ON CONFLICT (tenant_id, entity_type) DO NOTHING;

-- migrate:down
DROP TABLE IF EXISTS public.retention_policies CASCADE;
DROP TABLE IF EXISTS public.import_rows CASCADE;
DROP TABLE IF EXISTS public.data_jobs CASCADE;
DROP TABLE IF EXISTS public.integrations CASCADE;
