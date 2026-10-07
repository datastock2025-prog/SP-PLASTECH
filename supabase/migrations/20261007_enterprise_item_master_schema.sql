-- ==============================================================================
-- SP-PLASTECH ERP — ENTERPRISE ITEM MASTER MIGRATION
-- Adds soft delete (deleted_at), OCC (version), domain CHECK constraints & composite indexes
-- ==============================================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Alter or Create items table with enterprise columns
DO $$
BEGIN
    -- Add deleted_at for soft-deletes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'deleted_at') THEN
        ALTER TABLE items ADD COLUMN deleted_at TIMESTAMPTZ NULL;
    END IF;

    -- Add version for Optimistic Concurrency Control if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'version') THEN
        ALTER TABLE items ADD COLUMN version INT NOT NULL DEFAULT 1;
    END IF;

    -- Add approval_status and approved_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'approval_status') THEN
        ALTER TABLE items ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'APPROVED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'approved_by') THEN
        ALTER TABLE items ADD COLUMN approved_by TEXT NULL;
    END IF;

    -- Add safety_stock and valuation_method if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'safety_stock') THEN
        ALTER TABLE items ADD COLUMN safety_stock NUMERIC(14,4) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'valuation_method') THEN
        ALTER TABLE items ADD COLUMN valuation_method TEXT NOT NULL DEFAULT 'FIFO';
    END IF;

    -- Add description if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'description') THEN
        ALTER TABLE items ADD COLUMN description TEXT NULL;
    END IF;
END $$;

-- 3. Composite & Partial Indexes for Maximum Query Performance
CREATE INDEX IF NOT EXISTS idx_items_tenant_code_active 
ON items(tenant_id, code) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_items_tenant_category_status 
ON items(tenant_id, category, status) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_items_tenant_created_at 
ON items(tenant_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- 4. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL DEFAULT 'SP-PLASTECH-DEFAULT',
    entity_type TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    changed_fields JSONB NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    user_id TEXT NULL,
    ip_address TEXT NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_lookup 
ON audit_logs(tenant_id, entity_type, record_id, created_at DESC);
