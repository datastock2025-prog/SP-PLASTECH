-- migrate:up
-- Add UI-invented columns to items table (cycle_time_seconds, mold_code, safety_stock, valuation_method, description)

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS cycle_time_seconds numeric(8, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mold_code text,
  ADD COLUMN IF NOT EXISTS safety_stock numeric(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valuation_method text DEFAULT 'FIFO',
  ADD COLUMN IF NOT EXISTS description text;

-- Sync any existing cycle_time to cycle_time_seconds if present
UPDATE public.items
   SET cycle_time_seconds = cycle_time::numeric(8, 2)
 WHERE cycle_time IS NOT NULL AND cycle_time_seconds = 0;

-- migrate:down

ALTER TABLE public.items
  DROP COLUMN IF EXISTS cycle_time_seconds,
  DROP COLUMN IF EXISTS mold_code,
  DROP COLUMN IF EXISTS safety_stock,
  DROP COLUMN IF EXISTS valuation_method,
  DROP COLUMN IF EXISTS description;
