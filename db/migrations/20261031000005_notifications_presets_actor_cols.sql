-- migrate:up
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_by text;
ALTER TABLE workspace_presets ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE workspace_presets ADD COLUMN IF NOT EXISTS updated_by text;

-- migrate:down
ALTER TABLE notifications DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS updated_by;
ALTER TABLE workspace_presets DROP COLUMN IF EXISTS created_by, DROP COLUMN IF EXISTS updated_by;
