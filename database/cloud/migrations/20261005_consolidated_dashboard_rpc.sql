-- ============================================================================
-- CONSOLIDATED DASHBOARD & INITIAL SCREEN RPC FOR SUPABASE CLOUD POSTGRESQL
-- Project: https://gqrelwvmeoqvfnanoutz.supabase.co
-- ============================================================================

-- 1. Ensure plants table exists in Supabase PostgreSQL
CREATE TABLE IF NOT EXISTS public.plants (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  entity_type TEXT DEFAULT 'Plant',
  address TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  gstin TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed default plants if empty
INSERT INTO public.plants (id, code, name, location, address, gstin, is_default, is_active)
VALUES
  ('PLANT-01', 'PLANT-01', 'SP-Plastech Main Unit (Hosur)', 'Hosur, Tamil Nadu', 'Plot 42-45, SIPCOT Phase II, Hosur, Tamil Nadu 635126', '33AABCS1234F1Z1', true, true),
  ('PLANT-02', 'PLANT-02', 'SP-Plastech Western Hub (Pune)', 'Pune, Maharashtra', 'Plot 18, MIDC Chakan, Phase III, Pune 410501', '27AABCS1234F1Z5', false, true),
  ('PLANT-03', 'PLANT-03', 'SP-Plastech Auto Components (Chennai)', 'Chennai, Tamil Nadu', 'Survey No. 128, Oragadam Industrial Corridor, Sriperumbudur 602105', '33AABCS1234F2Z2', false, true)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS & Public Access
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access on plants" ON public.plants FOR SELECT USING (true);
CREATE POLICY "Public Write Access on plants" ON public.plants FOR ALL USING (true);

-- 2. Consolidated RPC Function: get_dashboard_summary()
-- Single HTTP call to /rest/v1/rpc/get_dashboard_summary returns all initial live data from PostgreSQL
CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  summary_payload JSONB;
BEGIN
  SELECT jsonb_build_object(
    'items', (
      SELECT coalesce(jsonb_agg(row_to_json(i)), '[]'::jsonb)
      FROM (SELECT * FROM public.items ORDER BY created_at DESC LIMIT 50) i
    ),
    'work_orders', (
      SELECT coalesce(jsonb_agg(row_to_json(w)), '[]'::jsonb)
      FROM (SELECT * FROM public.work_orders ORDER BY created_at DESC LIMIT 50) w
    ),
    'purchase_orders', (
      SELECT coalesce(jsonb_agg(row_to_json(p)), '[]'::jsonb)
      FROM (SELECT * FROM public.purchase_orders ORDER BY created_at DESC LIMIT 50) p
    ),
    'sales_orders', (
      SELECT coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb)
      FROM (SELECT * FROM public.sales_orders ORDER BY created_at DESC LIMIT 50) s
    ),
    'customers', (
      SELECT coalesce(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM (SELECT * FROM public.customers ORDER BY name ASC LIMIT 50) c
    ),
    'machines', (
      SELECT coalesce(jsonb_agg(row_to_json(m)), '[]'::jsonb)
      FROM (SELECT * FROM public.machines ORDER BY machine_code ASC LIMIT 50) m
    ),
    'quality_ncrs', (
      SELECT coalesce(jsonb_agg(row_to_json(q)), '[]'::jsonb)
      FROM (SELECT * FROM public.quality_ncrs ORDER BY created_at DESC LIMIT 50) q
    ),
    'plants', (
      SELECT coalesce(jsonb_agg(row_to_json(pl)), '[]'::jsonb)
      FROM (SELECT * FROM public.plants ORDER BY code ASC LIMIT 10) pl
    ),
    'server_time', CURRENT_TIMESTAMP
  ) INTO summary_payload;

  RETURN summary_payload;
END;
$$;

-- Grant execution permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO anon, authenticated, service_role;
