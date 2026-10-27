-- migrate:up
-- Keyset cursor pagination index on items: tenant-scoped, ordering by (created_at DESC, id DESC)
CREATE INDEX IF NOT EXISTS idx_items_tenant_created_id ON public.items (tenant_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;

-- Composite index for category-filtered keyset queries
CREATE INDEX IF NOT EXISTS idx_items_tenant_cat_created_id ON public.items (tenant_id, category, created_at DESC, id DESC) WHERE deleted_at IS NULL;

-- migrate:down
DROP INDEX IF EXISTS idx_items_tenant_cat_created_id;
DROP INDEX IF EXISTS idx_items_tenant_created_id;

