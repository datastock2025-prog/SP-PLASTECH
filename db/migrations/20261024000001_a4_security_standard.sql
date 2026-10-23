-- migrate:up
-- Part A4: Security Standard (OWASP ASVS L2 Mapped)

-- 1. Add password_history_limit to security_policies
ALTER TABLE public.security_policies
  ADD COLUMN IF NOT EXISTS password_history_limit integer NOT NULL DEFAULT 3;

-- 2. User password history table for password reuse prevention
CREATE TABLE IF NOT EXISTS public.user_password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_password_history_user_id ON public.user_password_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_password_history_tenant_id ON public.user_password_history (tenant_id);

-- 3. Row-level security for user_password_history
ALTER TABLE public.user_password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_password_history FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_password_history_tenant_isolation ON public.user_password_history;
CREATE POLICY user_password_history_tenant_isolation ON public.user_password_history
  AS PERMISSIVE
  FOR ALL
  TO erp_app
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

GRANT SELECT, INSERT, DELETE ON public.user_password_history TO erp_app;

-- migrate:down
DROP TABLE IF EXISTS public.user_password_history;
ALTER TABLE public.security_policies DROP COLUMN IF EXISTS password_history_limit;
