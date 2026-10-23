-- migrate:up
-- 1. Security Policies Table
CREATE TABLE IF NOT EXISTS public.security_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  min_password_length integer NOT NULL DEFAULT 10,
  require_uppercase boolean NOT NULL DEFAULT true,
  require_lowercase boolean NOT NULL DEFAULT true,
  require_numbers boolean NOT NULL DEFAULT true,
  require_symbols boolean NOT NULL DEFAULT true,
  lockout_threshold integer NOT NULL DEFAULT 5,
  lockout_duration_minutes integer NOT NULL DEFAULT 15,
  session_max_age_hours integer NOT NULL DEFAULT 8,
  idle_timeout_minutes integer NOT NULL DEFAULT 30,
  mfa_required_roles text[] NOT NULL DEFAULT '{}',
  ip_allowlist text[] NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_security_policies_tenant UNIQUE (tenant_id)
);

-- Seed default policy for existing tenants
INSERT INTO public.security_policies (tenant_id, min_password_length, lockout_threshold, lockout_duration_minutes, session_max_age_hours, idle_timeout_minutes)
SELECT id, 10, 5, 15, 8, 30 FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- 2. Account Auto-Unlock: Add locked_until to user_profiles and user
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE public.user ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- 3. Login Events Audit Table
CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text REFERENCES public.user(id) ON DELETE SET NULL,
  identifier_hash text NOT NULL,
  success boolean NOT NULL,
  reason text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_events_tenant_created ON public.login_events (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_user_created ON public.login_events (user_id, created_at DESC);

-- 4. Better-Auth Two-Factor Authentication Table
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public."twoFactor" (
  id text PRIMARY KEY,
  secret text NOT NULL,
  "backupCodes" text NOT NULL,
  "userId" text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  verified boolean DEFAULT true,
  "failedVerificationCount" integer DEFAULT 0,
  "lockedUntil" timestamp
);

-- Permissions for erp_app role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_policies TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.login_events TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."twoFactor" TO erp_app;

-- migrate:down
DROP TABLE IF EXISTS public.login_events;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS locked_until;
ALTER TABLE public.user DROP COLUMN IF EXISTS locked_until;
DROP TABLE IF EXISTS public.security_policies;
