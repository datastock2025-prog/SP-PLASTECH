-- migrate:up
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS supplier text,
  ADD COLUMN IF NOT EXISTS lead_time text,
  ADD COLUMN IF NOT EXISTS routing_destination text DEFAULT 'WIP';

-- Set default routing to WIP for items where routing_destination is null or DOL
UPDATE public.items
   SET routing_destination = 'WIP'
 WHERE routing_destination IS NULL OR routing_destination = 'DOL';

-- migrate:down
ALTER TABLE public.items
  DROP COLUMN IF EXISTS supplier,
  DROP COLUMN IF EXISTS lead_time,
  DROP COLUMN IF EXISTS routing_destination;
