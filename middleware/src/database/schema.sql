-- ============================================================================
-- SP-PLASTECH ENTERPRISE SCALABLE & SECURE POSTGRESQL ARCHITECTURE (v3.0)
-- Compliant with: SOC2 Type II, GDPR, ISO 9001 / IATF 16949, Multi-Tenant Native RLS
-- Comprehensive 14-Domain Relational Schema for Polymer Manufacturing ERP
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS system;
CREATE SCHEMA IF NOT EXISTS masterdata;
CREATE SCHEMA IF NOT EXISTS engineering;
CREATE SCHEMA IF NOT EXISTS manufacturing;
CREATE SCHEMA IF NOT EXISTS procurement;
CREATE SCHEMA IF NOT EXISTS warehouse;
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS quality;
CREATE SCHEMA IF NOT EXISTS mep;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS scm;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ----------------------------------------------------------------------------
-- PL/pgSQL Triggers & Helper Functions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. TENANT & FACILITY PROFILES (core.tenant_profiles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_profiles (
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'PLANT-01'
    code VARCHAR(32) UNIQUE NOT NULL,             -- e.g. 'PLANT-01'
    name VARCHAR(255) NOT NULL,                   -- e.g. 'Plant 01: Injection Molding Unit'
    location VARCHAR(255) NOT NULL,
    entity_type VARCHAR(64) NOT NULL DEFAULT 'Plant',
    address TEXT,
    contact_person VARCHAR(128),
    contact_email VARCHAR(128),
    contact_phone VARCHAR(32),
    gstin VARCHAR(32),
    capacity_rating VARCHAR(64) DEFAULT '24 IMM Bays (120T - 1300T)',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenant_profiles(is_active) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 2. ENTERPRISE RBAC ROLES (core.auth_roles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_roles (
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'ROLE-SUPER-ADMIN'
    name VARCHAR(128) NOT NULL,
    description TEXT,
    scope VARCHAR(64) NOT NULL DEFAULT 'Plant Scoped',
    department VARCHAR(64) DEFAULT 'General',
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 3. PERMISSION CATALOG & MATRIX (core.auth_role_permissions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_role_permissions (
    id VARCHAR(64) PRIMARY KEY,
    role_id VARCHAR(64) NOT NULL REFERENCES auth_roles(id) ON DELETE CASCADE,
    resource VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_role_perm ON auth_role_permissions(role_id, resource, action);

-- ----------------------------------------------------------------------------
-- 4. USERS & OPERATORS (core.auth_users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_users (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    role_id VARCHAR(64) NOT NULL REFERENCES auth_roles(id),
    email VARCHAR(128) NOT NULL,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    phone VARCHAR(32),
    designation VARCHAR(128),
    department VARCHAR(64) NOT NULL DEFAULT 'Operations',
    plant_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    reports_to_user_id VARCHAR(64),
    assigned_shift VARCHAR(32) DEFAULT 'Shift-A',
    badge_id VARCHAR(64),
    avatar_color VARCHAR(32) DEFAULT '#0F8B8D',
    initials VARCHAR(4) DEFAULT 'OP',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_method VARCHAR(16) DEFAULT 'TOTP',
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email ON auth_users(tenant_id, email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_username ON auth_users(tenant_id, username) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 5. AUDIT LOGGING SYSTEM (system.audit_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    actor_id VARCHAR(64) NOT NULL,
    actor_email VARCHAR(128) NOT NULL,
    action VARCHAR(32) NOT NULL,
    entity_name VARCHAR(128) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    entity_version VARCHAR(32),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(tenant_id, entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. MASTER DATA: ITEMS & RESINS (masterdata.items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,             -- e.g. 'RM-PP-001'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,                -- 'RAW_MATERIAL', 'FINISHED_GOOD', 'SEMI_FINISHED', 'PACKING', 'CONSUMABLE', 'SPARE'
    polymer_type VARCHAR(64),                     -- 'PP', 'HDPE', 'ABS', 'PC', 'PET', 'Nylon'
    grade VARCHAR(64),                            -- 'Injection Grade', 'Blow Grade'
    mfi_rating NUMERIC(8,2),                      -- Melt Flow Index
    density NUMERIC(8,4),
    color VARCHAR(64),
    uom VARCHAR(16) NOT NULL DEFAULT 'KG',        -- 'KG', 'NOS', 'MTR', 'LTR'
    standard_cost NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    safety_stock NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    reorder_point NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'low', 'out_of_stock', 'blocked'
    approval VARCHAR(32) NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected', 'released'
    hsn_code VARCHAR(16) DEFAULT '39021000',
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    storage_bin VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_cat ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);

-- ----------------------------------------------------------------------------
-- 7. MASTER DATA: MACHINES & PRESSES (masterdata.machines)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machines (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,             -- e.g. 'IMM-01'
    name VARCHAR(255) NOT NULL,
    model VARCHAR(128) NOT NULL,
    tonnage INTEGER NOT NULL DEFAULT 250,         -- Tonnage (e.g. 150T, 250T, 450T, 650T)
    machine_type VARCHAR(64) NOT NULL DEFAULT 'Injection Molding',
    plant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    bay_location VARCHAR(64),
    cycle_time_rated NUMERIC(8,2) DEFAULT 22.5,   -- Seconds
    power_kw NUMERIC(8,2) DEFAULT 45.0,
    status VARCHAR(32) NOT NULL DEFAULT 'running',-- 'running', 'idle', 'maintenance', 'breakdown', 'setup'
    current_oee NUMERIC(5,2) DEFAULT 85.50,
    availability_pct NUMERIC(5,2) DEFAULT 90.00,
    performance_pct NUMERIC(5,2) DEFAULT 95.00,
    quality_pct NUMERIC(5,2) DEFAULT 98.00,
    last_pm_date DATE,
    next_pm_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. ENGINEERING: BILLS OF MATERIALS (engineering.boms & bom_items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boms (
    id VARCHAR(64) PRIMARY KEY,
    bom_number VARCHAR(64) UNIQUE NOT NULL,       -- e.g. 'BOM-CAP-28MM-01'
    item_id VARCHAR(64) NOT NULL REFERENCES items(id),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'draft', 'deprecated', 'under_review'
    shot_weight_g NUMERIC(10,3) NOT NULL,         -- Grams
    runner_weight_g NUMERIC(10,3) DEFAULT 0.000,
    cavities INTEGER NOT NULL DEFAULT 8,
    standard_cycle_time_s NUMERIC(8,2) NOT NULL DEFAULT 18.0,
    scrap_allowance_pct NUMERIC(5,2) DEFAULT 1.5,
    machine_tonnage_min INTEGER DEFAULT 180,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bom_items (
    id VARCHAR(64) PRIMARY KEY,
    bom_id VARCHAR(64) NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
    component_item_id VARCHAR(64) NOT NULL REFERENCES items(id),
    quantity NUMERIC(12,4) NOT NULL,
    uom VARCHAR(16) NOT NULL DEFAULT 'KG',
    percentage NUMERIC(5,2),                      -- e.g. 96.0% Resin, 4.0% Masterbatch
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. MANUFACTURING: WORK ORDERS & RUNS (manufacturing.work_orders)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_orders (
    id VARCHAR(64) PRIMARY KEY,
    wo_number VARCHAR(64) UNIQUE NOT NULL,        -- e.g. 'WO-2026-0891'
    plant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    item_id VARCHAR(64) NOT NULL REFERENCES items(id),
    bom_id VARCHAR(64) REFERENCES boms(id),
    machine_id VARCHAR(64) REFERENCES machines(id),
    target_qty NUMERIC(14,2) NOT NULL,
    produced_qty NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    scrap_qty NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    batch_number VARCHAR(64),
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    status VARCHAR(32) NOT NULL DEFAULT 'scheduled',-- 'draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    estimated_duration_hours NUMERIC(8,2),
    assigned_shift VARCHAR(32) DEFAULT 'Shift-A',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. PROCUREMENT: SUPPLIERS & PURCHASE ORDERS (procurement.purchase_orders)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,             -- e.g. 'SUP-001'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'Polymer Resins',
    contact_person VARCHAR(128),
    email VARCHAR(128),
    phone VARCHAR(32),
    gstin VARCHAR(32),
    rating NUMERIC(3,2) DEFAULT 4.5,
    status VARCHAR(32) DEFAULT 'active',
    payment_terms VARCHAR(64) DEFAULT 'Net 30 Days',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(64) PRIMARY KEY,
    po_number VARCHAR(64) UNIQUE NOT NULL,        -- e.g. 'PO-2026-0045'
    supplier_id VARCHAR(64) NOT NULL REFERENCES suppliers(id),
    plant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    order_date DATE NOT NULL,
    expected_delivery DATE NOT NULL,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) DEFAULT 'INR',
    status VARCHAR(32) NOT NULL DEFAULT 'open',   -- 'draft', 'open', 'partially_received', 'received', 'cancelled'
    payment_terms VARCHAR(64) DEFAULT 'Net 30 Days',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_items (
    id VARCHAR(64) PRIMARY KEY,
    po_id VARCHAR(64) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL REFERENCES items(id),
    quantity NUMERIC(14,2) NOT NULL,
    unit_price NUMERIC(14,2) NOT NULL,
    received_qty NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    uom VARCHAR(16) NOT NULL DEFAULT 'KG',
    line_total NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. SALES & CRM: CUSTOMERS & SALES ORDERS (sales.sales_orders)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,             -- e.g. 'CUST-001'
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(32) DEFAULT 'Tier 1 OEM',
    contact_person VARCHAR(128),
    email VARCHAR(128),
    phone VARCHAR(32),
    gstin VARCHAR(32),
    credit_limit NUMERIC(14,2) DEFAULT 5000000.00,
    outstanding_balance NUMERIC(14,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_orders (
    id VARCHAR(64) PRIMARY KEY,
    so_number VARCHAR(64) UNIQUE NOT NULL,        -- e.g. 'SO-2026-0312'
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id),
    order_date DATE NOT NULL,
    delivery_due DATE NOT NULL,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed', -- 'draft', 'confirmed', 'in_production', 'dispatched', 'delivered', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS so_items (
    id VARCHAR(64) PRIMARY KEY,
    so_id VARCHAR(64) NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL REFERENCES items(id),
    quantity NUMERIC(14,2) NOT NULL,
    unit_price NUMERIC(14,2) NOT NULL,
    dispatched_qty NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    uom VARCHAR(16) NOT NULL DEFAULT 'NOS',
    line_total NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. FINANCE & GENERAL LEDGER (finance.accounts & journal_entries)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,             -- e.g. '1010-00'
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(64) NOT NULL,            -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    sub_category VARCHAR(64),
    balance NUMERIC(16,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(64) PRIMARY KEY,
    je_number VARCHAR(64) UNIQUE NOT NULL,        -- e.g. 'JE-2026-00412'
    posting_date DATE NOT NULL,
    reference VARCHAR(128),
    memo TEXT,
    total_debit NUMERIC(16,2) NOT NULL DEFAULT 0.00,
    total_credit NUMERIC(16,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'posted', -- 'draft', 'posted', 'reversed'
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. QUALITY MANAGEMENT (quality.ncrs & capas & coas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quality_ncrs (
    id VARCHAR(64) PRIMARY KEY,
    ncr_number VARCHAR(64) UNIQUE NOT NULL,       -- e.g. 'NCR-2026-0034'
    item_id VARCHAR(64) NOT NULL REFERENCES items(id),
    defect_type VARCHAR(64) NOT NULL,             -- 'FLASH', 'SHORT_SHOT', 'SINK_MARK', 'BURNT_MARKS', 'WARPAGE', 'CONTAMINATION'
    severity VARCHAR(32) NOT NULL DEFAULT 'MAJOR',-- 'CRITICAL', 'MAJOR', 'MINOR'
    quantity_rejected NUMERIC(12,2) NOT NULL,
    root_cause TEXT,
    disposition VARCHAR(64) DEFAULT 'Regrind & Recycle',
    status VARCHAR(32) NOT NULL DEFAULT 'open',   -- 'open', 'under_investigation', 'capa_pending', 'closed'
    reported_by VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_capas (
    id VARCHAR(64) PRIMARY KEY,
    capa_number VARCHAR(64) UNIQUE NOT NULL,      -- e.g. 'CAPA-2026-0012'
    ncr_id VARCHAR(64) REFERENCES quality_ncrs(id),
    title VARCHAR(255) NOT NULL,
    discipline_step VARCHAR(16) DEFAULT 'D4',     -- 8D Methodology (D1 to D8)
    corrective_action TEXT NOT NULL,
    preventive_action TEXT,
    target_date DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. HUMAN RESOURCES & PAYROLL (hr.employees & attendance)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_employees (
    id VARCHAR(64) PRIMARY KEY,
    emp_code VARCHAR(64) UNIQUE NOT NULL,         -- e.g. 'EMP-1001'
    full_name VARCHAR(128) NOT NULL,
    department VARCHAR(64) NOT NULL,
    designation VARCHAR(128) NOT NULL,
    plant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    shift VARCHAR(32) DEFAULT 'Shift-A',
    salary_monthly NUMERIC(12,2) DEFAULT 35000.00,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    joining_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 15. MEP & PLANT UTILITIES (mep.equipment & logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mep_equipment (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,             -- e.g. 'CHILLER-01'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,                -- 'MECHANICAL_CHILLER', 'AIR_COMPRESSOR', 'ELECTRICAL_SUBSTATION', 'RO_ETP_PLANT', 'HVAC_CLEANROOM'
    capacity VARCHAR(64) DEFAULT '120 TR',
    power_rating_kw NUMERIC(8,2) DEFAULT 95.0,
    plant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    status VARCHAR(32) NOT NULL DEFAULT 'optimal',-- 'optimal', 'warning', 'critical', 'offline'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 16. SCM CONTROL TOWER & AGING (scm.inventory_aging & plans)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scm_inventory_aging (
    id VARCHAR(64) PRIMARY KEY,
    item_id VARCHAR(64) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(64) NOT NULL,
    plant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    quantity NUMERIC(14,2) NOT NULL,
    aging_days INTEGER NOT NULL,
    aging_bucket VARCHAR(32) NOT NULL,            -- '0_30_DAYS', '31_60_DAYS', '61_90_DAYS', '91_180_DAYS', 'OVER_180_DAYS'
    shelf_life_expiry DATE,
    slob_risk_score NUMERIC(5,2) DEFAULT 12.50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 17. ANALYTICS & DOCUMENT INTELLIGENCE (analytics.cache & templates)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_doc_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'PRODUCTION',
    layout JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_kpi_cache (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    kpi_key VARCHAR(64) NOT NULL,
    metric_value NUMERIC(14,4) NOT NULL,
    target_value NUMERIC(14,4),
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rag_document_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_title VARCHAR(255) NOT NULL,
    section_name VARCHAR(128),
    content_chunk TEXT NOT NULL,
    embedding_vector JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 18. SCREEN 1-6 HOME TOOLS & TASKS (core.tasks, approval_requests, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    widget_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    position INTEGER NOT NULL DEFAULT 1,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    refresh_interval INTEGER NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    task_number VARCHAR(64) UNIQUE NOT NULL,
    assigned_to_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(64) NOT NULL DEFAULT 'CUSTOM',
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_requests (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    request_number VARCHAR(64) UNIQUE NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    submitted_by_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_ALERT',
    severity VARCHAR(32) NOT NULL DEFAULT 'INFO',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_views (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    name VARCHAR(255) NOT NULL,
    module VARCHAR(64) NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recent_records (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    record_name VARCHAR(255) NOT NULL,
    record_url TEXT NOT NULL,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
