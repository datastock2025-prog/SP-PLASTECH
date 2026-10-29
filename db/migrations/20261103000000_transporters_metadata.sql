-- migrate:up
-- Additive: extended transporter attributes (address, city, state, modes, vehicles, notes) live in JSONB.
ALTER TABLE transporters ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS uq_transporters_tenant_code
    ON transporters (tenant_id, code) WHERE deleted_at IS NULL;

-- migrate:down
DROP INDEX IF EXISTS uq_transporters_tenant_code;
ALTER TABLE transporters DROP COLUMN IF EXISTS metadata;

