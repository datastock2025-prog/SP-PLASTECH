-- migrate:up
-- 1. Enable Trigram Extension for Fast Substring Search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Drop Plain Indexes Duplicating UNIQUE/Primary Keys
DROP INDEX IF EXISTS idx_items_code;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_suppliers_code;
DROP INDEX IF EXISTS idx_customers_code;

-- 3. Drop Unused Compound & Sorting Indexes
DROP INDEX IF EXISTS idx_items_stock_reorder;
DROP INDEX IF EXISTS idx_items_created_desc;

-- 4. Add Trigram Substring Search Indexes
CREATE INDEX IF NOT EXISTS idx_items_name_trgm ON public.items USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON public.customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm ON public.suppliers USING gin (name gin_trgm_ops);

-- 5. Add Fast Prefix Index for Autocomplete Pickers
CREATE INDEX IF NOT EXISTS idx_items_code_prefix ON public.items (code text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_suppliers_code_prefix ON public.suppliers (code text_pattern_ops);

-- 6. Add Covering Indexes for Foreign Keys
CREATE INDEX IF NOT EXISTS idx_session_user_id ON public.session ("userId");
CREATE INDEX IF NOT EXISTS idx_account_user_id ON public.account ("userId");
CREATE INDEX IF NOT EXISTS idx_plant_user_tenant_id ON public.plant_user (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_tenant_id ON public.user_preferences (tenant_id);
CREATE INDEX IF NOT EXISTS idx_bom_item_code ON public.bill_of_materials (item_code);

-- migrate:down
DROP INDEX IF EXISTS idx_items_name_trgm;
DROP INDEX IF EXISTS idx_customers_name_trgm;
DROP INDEX IF EXISTS idx_suppliers_name_trgm;
DROP INDEX IF EXISTS idx_items_code_prefix;
DROP INDEX IF EXISTS idx_suppliers_code_prefix;
DROP INDEX IF EXISTS idx_session_user_id;
DROP INDEX IF EXISTS idx_account_user_id;
DROP INDEX IF EXISTS idx_plant_user_tenant_id;
DROP INDEX IF EXISTS idx_user_preferences_tenant_id;
DROP INDEX IF EXISTS idx_bom_item_code;
