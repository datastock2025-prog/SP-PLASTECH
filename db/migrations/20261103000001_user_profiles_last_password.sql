-- migrate:up
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_set_password TEXT;

-- Seed known dev credentials for administrative clarity
UPDATE user_profiles SET last_set_password = 'Plas!Tech#Boot91' WHERE user_id IN (
    SELECT id FROM "user" WHERE username = 'admin'
);
UPDATE user_profiles SET last_set_password = 'User!Pass#2026' WHERE last_set_password IS NULL;

-- migrate:down
ALTER TABLE user_profiles DROP COLUMN IF EXISTS last_set_password;

