// GENERATED from sql/001_identity.sql by `npm run gen:sql` - do not edit.
export const identitySql = `-- Domain schema for identity, access, plants and preferences.
-- Runs AFTER Better Auth creates its core tables ("user", "account", "session").
-- Idempotent: safe to run on every boot.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    CREATE ROLE erp_app NOLOGIN;
  END IF;
END $$;
GRANT erp_app TO CURRENT_USER;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

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
  -- CASL rules: [{ "action": "read", "subject": "User", "conditions": {...} }]
  permissions  jsonb NOT NULL DEFAULT '[]'::jsonb,
  version      integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS roles_tenant_code_uq ON roles (tenant_id, code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS roles_permissions_gin ON roles USING gin (permissions);

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
CREATE INDEX IF NOT EXISTS user_profiles_tenant_idx ON user_profiles (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles (role_id);
CREATE INDEX IF NOT EXISTS user_profiles_plant_idx ON user_profiles (primary_plant_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_badge_uq ON user_profiles (tenant_id, badge_id)
  WHERE deleted_at IS NULL AND badge_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS plant_user (
  plant_id   uuid NOT NULL REFERENCES plants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  user_id    text NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE ON UPDATE RESTRICT,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plant_id, user_id)
);
CREATE INDEX IF NOT EXISTS plant_user_user_idx ON plant_user (user_id);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id        text PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE ON UPDATE RESTRICT,
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  theme          text NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  density        text NOT NULL DEFAULT 'comfortable' CHECK (density IN ('compact','comfortable','spacious')),
  landing_view   text NOT NULL DEFAULT 'home',
  language       text NOT NULL DEFAULT 'en',
  timezone       text NOT NULL DEFAULT 'Asia/Kolkata',
  date_format    text NOT NULL DEFAULT 'DD/MM/YYYY',
  notifications  jsonb NOT NULL DEFAULT '{}'::jsonb,
  version        integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
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
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (tenant_id, entity_type, entity_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_performed_brin ON audit_logs USING brin (performed_at);

-- Audit log is append-only, even for the table owner.
CREATE OR REPLACE FUNCTION audit_logs_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'audit_logs is immutable'; END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS audit_logs_no_change ON audit_logs;
CREATE TRIGGER audit_logs_no_change BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();

-- Session context chosen AFTER login (active plant / shift).
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS active_plant_id uuid;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS active_shift text;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tenants','plants','roles','user_profiles','user_preferences'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_updated_at', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
                   t || '_updated_at', t);
  END LOOP;
END $$;

-- Row Level Security: every row is scoped to app.tenant_id.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['plants','roles','user_profiles','plant_user','user_preferences','audit_logs'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    -- Table owner (auth internals/migrations) bypasses RLS; request handlers run as erp_app via withTx and never do.
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format($p$CREATE POLICY tenant_isolation ON %I
      USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)$p$, t);
  END LOOP;
END $$;

REVOKE ALL ON tenants, plants, roles, user_profiles, plant_user, user_preferences, audit_logs FROM erp_app;
GRANT SELECT ON tenants TO erp_app;
GRANT SELECT, INSERT, UPDATE ON plants, roles, user_profiles, user_preferences TO erp_app;
GRANT SELECT, INSERT, DELETE ON plant_user TO erp_app;
GRANT SELECT, INSERT ON audit_logs TO erp_app;
GRANT SELECT, UPDATE ON "session" TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "user", "account" TO erp_app;
GRANT SELECT, DELETE ON "session" TO erp_app;
`;
