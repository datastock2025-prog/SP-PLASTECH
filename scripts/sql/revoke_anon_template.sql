-- ==============================================================================
-- SP-PLASTECH ERP — Supabase Anon & Authenticated Privilege Revocation Template
-- ==============================================================================
-- IMPORTANT: Do NOT run for all tables at once. Apply module-by-module ONLY after
-- verifying that the module is completely routed through the backend API (/api/v1).
--
-- Usage: Replace {{TABLE_NAME}} with target table (e.g. plants, work_orders, items)
-- ==============================================================================

-- 1. Revoke public/anon/authenticated role table privileges
REVOKE ALL ON TABLE public.{{TABLE_NAME}} FROM anon;
REVOKE ALL ON TABLE public.{{TABLE_NAME}} FROM authenticated;

-- 2. Ensure RLS is active
ALTER TABLE public.{{TABLE_NAME}} ENABLE ROW LEVEL SECURITY;

-- 3. Ensure erp_app service role has full access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.{{TABLE_NAME}} TO erp_app;
