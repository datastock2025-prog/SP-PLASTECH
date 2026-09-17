-- ============================================================================
-- REBOOT ERP ENTERPRISE SCALABLE & SECURE POSTGRESQL ARCHITECTURE
-- Compliant with: SOC2, GDPR, ISO 27001, Multi-Tenant Shared Schema + RLS
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS system;

-- ----------------------------------------------------------------------------
-- 1. TENANT & FACILITY PROFILES (core.tenant_profiles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_profiles (
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'TENANT-ALPHA-IND' / UUID
    code VARCHAR(32) UNIQUE NOT NULL,             -- e.g. 'PLANT-01'
    name VARCHAR(255) NOT NULL,                   -- e.g. 'Plant 01: Injection Molding Unit'
    location VARCHAR(255) NOT NULL,               -- e.g. 'Hosur, Tamil Nadu'
    entity_type VARCHAR(64) NOT NULL DEFAULT 'Plant', -- 'Plant', 'Warehouse', 'Corporate office'
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
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'ROLE-SUPER-ADMIN', 'SUPER_ADMIN'
    name VARCHAR(128) NOT NULL,
    description TEXT,
    scope VARCHAR(64) NOT NULL DEFAULT 'Plant Scoped', -- 'Enterprise-wide', 'Plant Scoped', 'Press Scoped'
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

CREATE INDEX IF NOT EXISTS idx_roles_active ON auth_roles(is_active) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3. GRANULAR ROLE PERMISSION MAPPINGS (core.auth_role_permissions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_role_permissions (
    role_id VARCHAR(64) NOT NULL REFERENCES auth_roles(id) ON DELETE CASCADE,
    permission_key VARCHAR(128) NOT NULL,         -- e.g. 'finance.approve', 'mfg.execute'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_key)
);

-- ----------------------------------------------------------------------------
-- 4. USER DIRECTORY & PROFILES (core.auth_users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_users (
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'USR-ADMIN-01' / UUID
    email VARCHAR(128) UNIQUE NOT NULL,
    username VARCHAR(64) UNIQUE,
    full_name VARCHAR(128) NOT NULL,
    phone VARCHAR(32),
    designation VARCHAR(128),
    department VARCHAR(64) NOT NULL DEFAULT 'Operations',
    role_id VARCHAR(64) NOT NULL REFERENCES auth_roles(id),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    plant_ids JSONB NOT NULL DEFAULT '["PLANT-01"]'::jsonb, -- Array of accessible plant IDs
    assigned_shift VARCHAR(64) DEFAULT 'General Shift (09:00 – 18:00)',
    badge_id VARCHAR(64),
    avatar_color VARCHAR(64) DEFAULT 'from-[#0F8B8D] to-[#E8622C]',
    initials VARCHAR(8) DEFAULT 'PR',
    password_hash VARCHAR(255) NOT NULL,          -- bcrypt hash
    pin_hash VARCHAR(255),                        -- 4-digit operator PIN bcrypt hash
    status VARCHAR(32) NOT NULL DEFAULT 'Active', -- 'Active', 'Suspended', 'Pending Verification'
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_method VARCHAR(64) DEFAULT 'Authenticator App (TOTP)',
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

CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON auth_users(tenant_id, LOWER(email)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON auth_users(role_id) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 5. ACTIVE MULTI-DEVICE USER SESSIONS (core.auth_active_sessions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_active_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(128) NOT NULL,
    device_info VARCHAR(255) NOT NULL,            -- e.g. 'Chrome 128 / Windows 11'
    device_type VARCHAR(32) NOT NULL DEFAULT 'DESKTOP', -- 'DESKTOP', 'MOBILE', 'TABLET'
    ip_address VARCHAR(45) NOT NULL,
    location VARCHAR(128),
    refresh_token_hash VARCHAR(255) NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_tenant ON auth_active_sessions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON auth_active_sessions(last_active_at);

-- ----------------------------------------------------------------------------
-- 6. DOCUMENT NUMBERING SEQUENCES (admin.document_numbering_sequences)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_numbering_sequences (
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'SEQ-WO-01'
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    module VARCHAR(64) NOT NULL,                  -- 'Manufacturing', 'Procurement', 'Sales', 'Finance', 'Quality'
    document_type VARCHAR(128) NOT NULL,          -- 'Work Order', 'Purchase Order', 'Sales Order', 'GRN', 'NCR'
    prefix VARCHAR(32) NOT NULL,                  -- e.g. 'WO-', 'PO-', 'GRN-'
    include_year BOOLEAN NOT NULL DEFAULT TRUE,   -- e.g. '2026'
    year_format VARCHAR(16) DEFAULT 'YYYY',       -- 'YYYY' or 'YY'
    include_month BOOLEAN NOT NULL DEFAULT FALSE,
    separator VARCHAR(8) DEFAULT '-',
    padding_length INTEGER NOT NULL DEFAULT 4,    -- e.g. 4 -> 0001
    current_number INTEGER NOT NULL DEFAULT 1,
    step_size INTEGER NOT NULL DEFAULT 1,
    reset_frequency VARCHAR(32) DEFAULT 'Yearly', -- 'Never', 'Yearly', 'Monthly'
    sample_preview VARCHAR(128),                  -- e.g. 'WO-2026-0001'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_numbering_tenant_doctype ON admin_numbering_sequences(tenant_id, document_type) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 7. MULTI-TIER APPROVAL WORKFLOWS (admin.approval_workflows)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_approval_workflows (
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'WF-PO-01'
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    name VARCHAR(255) NOT NULL,
    module VARCHAR(64) NOT NULL,                  -- 'Procurement', 'Finance', 'Engineering', 'Sales'
    document_type VARCHAR(128) NOT NULL,          -- 'Purchase Order', 'Journal Entry', 'ECO Order'
    description TEXT,
    min_amount NUMERIC(15, 2) DEFAULT 0,
    max_amount NUMERIC(15, 2),
    tiers JSONB NOT NULL DEFAULT '[]'::jsonb,     -- Array of approval tier objects
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflows_tenant_module ON admin_approval_workflows(tenant_id, module) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 8. GLOBAL SYSTEM PARAMETERS & CONFIG (admin.system_parameters)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_system_parameters (
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'PARAM-SEC-01'
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    param_group VARCHAR(64) NOT NULL,             -- 'Security', 'Database', 'Scheduling', 'Quality', 'Finance'
    param_key VARCHAR(128) NOT NULL,              -- 'SESSION_INACTIVITY_TIMEOUT_MINUTES'
    param_name VARCHAR(255) NOT NULL,
    param_value TEXT NOT NULL,
    default_value TEXT NOT NULL,
    value_type VARCHAR(32) NOT NULL DEFAULT 'NUMBER', -- 'STRING', 'NUMBER', 'BOOLEAN', 'JSON'
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_params_tenant_key ON admin_system_parameters(tenant_id, param_key) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 9. MFA CREDENTIALS & STEP-UP CHALLENGES (core.user_mfa_credentials)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_mfa_credentials (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
    is_mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    totp_secret VARCHAR(512),
    sms_phone VARCHAR(32),
    recovery_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_verified_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_mfa_challenges (
    challenge_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    required_method VARCHAR(16) NOT NULL DEFAULT 'TOTP',
    action_context VARCHAR(128) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. SECURITY AUDIT TRAIL & FORENSICS (system.security_audit_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_email VARCHAR(128),
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'INFO',
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_type ON security_audit_logs(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON security_audit_logs(actor_id);

-- ----------------------------------------------------------------------------
-- 11. GDPR DATA PORTABILITY & ERASURE (system.gdpr_compliance_requests)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gdpr_compliance_requests (
    tracking_number VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    user_id VARCHAR(64) NOT NULL,
    request_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. ITEM & PRODUCT MASTER CATALOG (mfg.mfg_items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mfg_items (
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'ITM-FG-001' / UUID
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    code VARCHAR(64) NOT NULL,                    -- e.g. 'FG-BMP-NEXON-F'
    name VARCHAR(255) NOT NULL,
    item_type VARCHAR(64) NOT NULL,               -- 'Finished Good', 'Raw Material', 'Masterbatch', etc.
    category VARCHAR(128) NOT NULL,
    item_group VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'Active', -- 'Active', 'Draft', 'Pending Approval'
    approval_status VARCHAR(32) NOT NULL DEFAULT 'Approved',
    description TEXT,
    base_uom VARCHAR(32) NOT NULL DEFAULT 'KG',
    cycle_time_sec NUMERIC(10, 2) DEFAULT 0,
    part_weight_grams NUMERIC(10, 3) DEFAULT 0,
    cavity_count INTEGER DEFAULT 1,
    runner_weight_grams NUMERIC(10, 3) DEFAULT 0,
    shot_weight_grams NUMERIC(10, 3) DEFAULT 0,
    resin_type VARCHAR(128),
    mfi VARCHAR(64),
    density VARCHAR(64),
    regrind_allowance_pct NUMERIC(5, 2) DEFAULT 0,
    moisture_sensitive BOOLEAN DEFAULT FALSE,
    default_warehouse VARCHAR(64) DEFAULT 'FG-WH-01',
    default_bin VARCHAR(64) DEFAULT 'A-01-01',
    routing_destination VARCHAR(32) DEFAULT 'DOL', -- 'DOL', 'ASSEMBLY', 'DEFLASH'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_tenant_code ON mfg_items(tenant_id, code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_items_tenant_type ON mfg_items(tenant_id, item_type) WHERE deleted_at IS NULL;

