-- migrate:up
-- Protocol 1G: Administrative Master Tables, Backup Runs, Privacy Requests & High-Performance Indexes

-- 1. Backup Runs Table (for AdminBackupsView)
CREATE TABLE IF NOT EXISTS public.backup_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  backup_type text NOT NULL DEFAULT 'FULL', -- 'FULL', 'SCHEMA_ONLY', 'TRANSACTION_LOGS'
  status text NOT NULL DEFAULT 'PENDING',   -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
  file_name text,
  file_path text,
  size_bytes bigint DEFAULT 0,
  checksum text,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_backup_runs_tenant ON public.backup_runs (tenant_id, created_at DESC) WHERE deleted_at IS NULL;

-- 2. Privacy Requests Table (for AdminBackupRetentionPrivacyView - GDPR Art 17/20)
CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text REFERENCES public.user(id) ON DELETE SET NULL,
  request_type text NOT NULL, -- 'DATA_PORTABILITY', 'RIGHT_TO_BE_FORGOTTEN', 'RECTIFICATION'
  status text NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'FULFILLED', 'REJECTED'
  tracking_number text NOT NULL UNIQUE,
  reason text,
  fulfillment_notes text,
  fulfilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_tenant ON public.privacy_requests (tenant_id, status);

-- 3. Reason Codes Table (for AdminReasonCodesView)
CREATE TABLE IF NOT EXISTS public.reason_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  category text NOT NULL, -- 'SCRAP', 'DOWNTIME', 'REJECTION', 'RETURN', 'ADJUSTMENT'
  code text NOT NULL,
  description text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT uq_reason_codes_tenant_category_code UNIQUE (tenant_id, category, code)
);

CREATE INDEX IF NOT EXISTS idx_reason_codes_tenant_cat ON public.reason_codes (tenant_id, category, is_active) WHERE deleted_at IS NULL;

-- Seed standard plastic injection molding reason codes
INSERT INTO public.reason_codes (tenant_id, category, code, description)
SELECT t.id, 'SCRAP', 'SCRAP-STARTUP', 'Startup purging and thermal stabilization scrap' FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.reason_codes (tenant_id, category, code, description)
SELECT t.id, 'SCRAP', 'SCRAP-FLASH', 'Excessive parting line flash and overpacking' FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.reason_codes (tenant_id, category, code, description)
SELECT t.id, 'DOWNTIME', 'DT-MOLD-CHANGE', 'Scheduled tooling setup and mold changeover' FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.reason_codes (tenant_id, category, code, description)
SELECT t.id, 'DOWNTIME', 'DT-HEATER-BAND', 'Barrel heater band burnout and temperature recovery' FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.reason_codes (tenant_id, category, code, description)
SELECT t.id, 'REJECTION', 'REJ-SINK-MARKS', 'Sink marks on structural ribs and thick wall sections' FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.reason_codes (tenant_id, category, code, description)
SELECT t.id, 'REJECTION', 'REJ-SILVER-STREAKS', 'Silver streaking due to moisture trapped in hygroscopic polymer' FROM public.tenants t
ON CONFLICT DO NOTHING;

-- 4. Document Templates Table (for AdminDocumentSettingsView)
CREATE TABLE IF NOT EXISTS public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  doc_type text NOT NULL, -- 'PURCHASE_ORDER', 'SALES_ORDER', 'INVOICE', 'DELIVERY_CHALLAN', 'COA'
  name text NOT NULL,
  subject_template text,
  body_template text NOT NULL,
  header_html text,
  footer_html text,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT uq_doc_templates_tenant_type UNIQUE (tenant_id, doc_type)
);

CREATE INDEX IF NOT EXISTS idx_doc_templates_tenant ON public.document_templates (tenant_id, is_active) WHERE deleted_at IS NULL;

-- 5. System Parameters & Custom Fields (for AdminSystemParametersView)
CREATE TABLE IF NOT EXISTS public.system_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'GENERAL', -- 'GENERAL', 'PRODUCTION', 'QUALITY', 'FINANCE', 'SECURITY'
  param_key text NOT NULL,
  param_value text NOT NULL,
  data_type text NOT NULL DEFAULT 'STRING', -- 'STRING', 'NUMBER', 'BOOLEAN', 'JSON'
  description text,
  is_read_only boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_system_parameters_tenant_key UNIQUE (tenant_id, param_key)
);

CREATE INDEX IF NOT EXISTS idx_system_parameters_tenant ON public.system_parameters (tenant_id, category);

-- Seed core system parameters
INSERT INTO public.system_parameters (tenant_id, category, param_key, param_value, data_type, description)
SELECT t.id, 'PRODUCTION', 'AUTO_MRP_RUN_INTERVAL_HOURS', '12', 'NUMBER', 'Interval in hours between automated MRP recalculation passes' FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.system_parameters (tenant_id, category, param_key, param_value, data_type, description)
SELECT t.id, 'PRODUCTION', 'REGRIND_MAX_RATIO_PERCENT', '20.0', 'NUMBER', 'Maximum allowable regrind recycling ratio in virgin resin mix' FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.system_parameters (tenant_id, category, param_key, param_value, data_type, description)
SELECT t.id, 'QUALITY', 'SPC_DEFAULT_SAMPLE_SIZE', '5', 'NUMBER', 'Default sample size for X-bar and R statistical process control charts' FROM public.tenants t
ON CONFLICT DO NOTHING;

-- 6. Search Configuration Table (for AdminGlobalSearchConfigView)
CREATE TABLE IF NOT EXISTS public.search_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'ITEM', 'SUPPLIER', 'CUSTOMER', 'PLANT', 'WORK_ORDER', 'PURCHASE_ORDER'
  is_enabled boolean NOT NULL DEFAULT true,
  search_weight integer NOT NULL DEFAULT 1,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_search_config_tenant_entity UNIQUE (tenant_id, entity_type)
);

-- Seed search config
INSERT INTO public.search_config (tenant_id, entity_type, is_enabled, search_weight, display_order)
SELECT t.id, 'ITEM', true, 10, 1 FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.search_config (tenant_id, entity_type, is_enabled, search_weight, display_order)
SELECT t.id, 'SUPPLIER', true, 8, 2 FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.search_config (tenant_id, entity_type, is_enabled, search_weight, display_order)
SELECT t.id, 'CUSTOMER', true, 8, 3 FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.search_config (tenant_id, entity_type, is_enabled, search_weight, display_order)
SELECT t.id, 'PLANT', true, 5, 4 FROM public.tenants t
ON CONFLICT DO NOTHING;

-- 7. High-Performance Indexes (Section 4.1 Indexing Strategy)
-- Audit Logs Keyset paging on (tenant_id, performed_at DESC, id)
CREATE INDEX IF NOT EXISTS idx_audit_logs_keyset ON public.audit_logs (tenant_id, performed_at DESC, id);

-- Login Events BRIN index on created_at for time-series efficiency
CREATE INDEX IF NOT EXISTS idx_login_events_brin ON public.login_events USING BRIN (created_at);

-- 8. Enable Row-Level Security
ALTER TABLE public.backup_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reason_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS backup_runs_tenant_isolation ON public.backup_runs;
CREATE POLICY backup_runs_tenant_isolation ON public.backup_runs
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS privacy_requests_tenant_isolation ON public.privacy_requests;
CREATE POLICY privacy_requests_tenant_isolation ON public.privacy_requests
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS reason_codes_tenant_isolation ON public.reason_codes;
CREATE POLICY reason_codes_tenant_isolation ON public.reason_codes
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS document_templates_tenant_isolation ON public.document_templates;
CREATE POLICY document_templates_tenant_isolation ON public.document_templates
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS system_parameters_tenant_isolation ON public.system_parameters;
CREATE POLICY system_parameters_tenant_isolation ON public.system_parameters
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS search_config_tenant_isolation ON public.search_config;
CREATE POLICY search_config_tenant_isolation ON public.search_config
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 9. Permissions for erp_app role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_runs TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_requests TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reason_codes TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_templates TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_parameters TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_config TO erp_app;

-- migrate:down
DROP TABLE IF EXISTS public.search_config CASCADE;
DROP TABLE IF EXISTS public.system_parameters CASCADE;
DROP TABLE IF EXISTS public.document_templates CASCADE;
DROP TABLE IF EXISTS public.reason_codes CASCADE;
DROP TABLE IF EXISTS public.privacy_requests CASCADE;
DROP TABLE IF EXISTS public.backup_runs CASCADE;
DROP INDEX IF EXISTS idx_audit_logs_keyset;
DROP INDEX IF EXISTS idx_login_events_brin;
