-- migrate:up
-- Better Auth username plugin stores the display form in "displayUsername"; userStore.ts and auth.ts depend on it.
-- The baseline migration never created it (older dev databases got it from retired boot-time DDL), so a fresh
-- database could not bootstrap its first admin.
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS "displayUsername" text;
UPDATE public."user" SET "displayUsername" = username WHERE "displayUsername" IS NULL AND username IS NOT NULL;

-- migrate:down
ALTER TABLE public."user" DROP COLUMN IF EXISTS "displayUsername";
