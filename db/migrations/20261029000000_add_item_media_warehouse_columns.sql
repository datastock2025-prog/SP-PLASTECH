-- migrate:up
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS technical_doc_url text,
  ADD COLUMN IF NOT EXISTS processing_method text,
  ADD COLUMN IF NOT EXISTS default_warehouse text,
  ADD COLUMN IF NOT EXISTS default_bin text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- migrate:down
ALTER TABLE public.items
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS technical_doc_url,
  DROP COLUMN IF EXISTS processing_method,
  DROP COLUMN IF EXISTS default_warehouse,
  DROP COLUMN IF EXISTS default_bin,
  DROP COLUMN IF EXISTS metadata;
