-- migrate:up
-- Better Auth `jwt` plugin key store. auth.ts enables the plugin, and sign-in fails with
-- "Database schema mismatch: missing tables jwks" on a database built only from migrations.
CREATE TABLE IF NOT EXISTS public.jwks (
  id text PRIMARY KEY,
  "publicKey" text NOT NULL,
  "privateKey" text NOT NULL,
  alg text,
  crv text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "expiresAt" timestamp
);

-- migrate:down
DROP TABLE IF EXISTS public.jwks;
