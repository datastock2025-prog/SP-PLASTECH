-- migrate:up
-- Migration: 20261027000004_finance_double_entry.sql
-- Description: Chart of Accounts, Double-Entry Journal Entries, Journal Lines, and 3-Way Match AP Invoices

-- 1. Chart of Accounts (GL Accounts)
CREATE TABLE IF NOT EXISTS gl_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL, -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    account_group TEXT,
    parent_account_id UUID REFERENCES gl_accounts(id) ON DELETE SET NULL,
    is_postable BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    currency TEXT NOT NULL DEFAULT 'INR',
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gl_accounts_tenant_code ON gl_accounts(tenant_id, account_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gl_accounts_tenant_type ON gl_accounts(tenant_id, account_type) WHERE deleted_at IS NULL;

ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY gl_accounts_tenant_isolation ON gl_accounts
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON gl_accounts TO erp_app;

-- 2. Journal Entries (General Ledger Header)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    je_number TEXT NOT NULL,
    je_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    period TEXT,
    fiscal_year INTEGER NOT NULL DEFAULT 2026,
    je_type TEXT NOT NULL DEFAULT 'MANUAL',
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'POSTED', 'REVERSED'
    reference_type TEXT,
    reference_id TEXT,
    reference_number TEXT,
    description TEXT NOT NULL,
    total_debit NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(14, 2) NOT NULL DEFAULT 0,
    lines JSONB NOT NULL DEFAULT '[]',
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_num ON journal_entries(tenant_id, je_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_status ON journal_entries(tenant_id, status) WHERE deleted_at IS NULL;

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_entries_tenant_isolation ON journal_entries
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO erp_app;

-- 3. Journal Lines (Double-Entry Debit & Credit Items)
CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    je_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    line_no INTEGER NOT NULL,
    account_id UUID REFERENCES gl_accounts(id) ON DELETE RESTRICT,
    account_code TEXT NOT NULL,
    account_name TEXT,
    debit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    credit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_tenant_je ON journal_lines(tenant_id, je_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_lines_tenant_acc ON journal_lines(tenant_id, account_code) WHERE deleted_at IS NULL;

ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_lines_tenant_isolation ON journal_lines
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON journal_lines TO erp_app;

-- 4. Accounts Payable Invoices (3-Way Match AP Invoices)
CREATE TABLE IF NOT EXISTS ap_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    supplier_id TEXT NOT NULL,
    po_id TEXT,
    grn_id TEXT,
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date TIMESTAMPTZ,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'PAID', 'REJECTED'
    match_status TEXT NOT NULL DEFAULT 'UNMATCHED', -- 'MATCHED', 'PRICE_VARIANCE', 'QTY_VARIANCE', 'UNMATCHED'
    match_notes TEXT,
    lines JSONB NOT NULL DEFAULT '[]',
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ap_invoices_tenant_num ON ap_invoices(tenant_id, invoice_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ap_invoices_tenant_po ON ap_invoices(tenant_id, po_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ap_invoices_tenant_grn ON ap_invoices(tenant_id, grn_id) WHERE deleted_at IS NULL;

ALTER TABLE ap_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY ap_invoices_tenant_isolation ON ap_invoices
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON ap_invoices TO erp_app;

-- migrate:down
-- shortcut: no automated rollback for this historical migration; restore from backup.
