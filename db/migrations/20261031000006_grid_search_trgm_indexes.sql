-- migrate:up
-- Ensure Trigram Extension for fast ILIKE '%...%' substring search on grids
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Item Master fast substring search
CREATE INDEX IF NOT EXISTS idx_items_code_trgm ON public.items USING gin (code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_items_name_trgm ON public.items USING gin (name gin_trgm_ops);

-- User table search
CREATE INDEX IF NOT EXISTS idx_user_username_trgm ON public."user" USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_email_trgm ON public."user" USING gin (email gin_trgm_ops);

-- Bill of Materials search
CREATE INDEX IF NOT EXISTS idx_bom_item_code_trgm ON public.bill_of_materials USING gin (item_code gin_trgm_ops);

-- Customer & Supplier code search
CREATE INDEX IF NOT EXISTS idx_customers_code_trgm ON public.customers USING gin (code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_suppliers_code_trgm ON public.suppliers USING gin (code gin_trgm_ops);

-- migrate:down
DROP INDEX IF EXISTS idx_items_code_trgm;
DROP INDEX IF EXISTS idx_items_name_trgm;
DROP INDEX IF EXISTS idx_user_username_trgm;
DROP INDEX IF EXISTS idx_user_email_trgm;
DROP INDEX IF EXISTS idx_bom_item_code_trgm;
DROP INDEX IF EXISTS idx_customers_code_trgm;
DROP INDEX IF EXISTS idx_suppliers_code_trgm;
