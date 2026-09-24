-- ============================================================================
-- REBOOT ERP ENTERPRISE SCALABLE & SECURE POSTGRESQL ARCHITECTURE (v2.0)
-- Compliant with: SOC2 Type II, GDPR, ISO 27001, IATF 16949, Multi-Tenant Native RLS
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS system;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS scm;
CREATE SCHEMA IF NOT EXISTS manufacturing;
CREATE SCHEMA IF NOT EXISTS quality;

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
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'TENANT-ALPHA-IND' / UUID
    code VARCHAR(32) UNIQUE NOT NULL,             -- e.g. 'PLANT-01'
    name VARCHAR(255) NOT NULL,                   -- e.g. 'Plant 01: Injection Molding Unit'
    location VARCHAR(255) NOT NULL,               -- e.g. 'Hosur, Tamil Nadu'
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
    resource VARCHAR(64) NOT NULL,                -- 'SCM', 'Finance', 'Manufacturing', 'Approvals'
    action VARCHAR(32) NOT NULL,                  -- 'READ', 'WRITE', 'APPROVE', 'DELETE', 'OVERRIDE'
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
-- 5. ACTIVE SESSIONS & REFRESH TOKENS (core.auth_active_sessions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_active_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. UNIVERSAL APPROVAL WORKFLOW DEFINITIONS (admin.approval_workflows)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_approval_workflows (
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'WF-PO-POLYMER'
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    name VARCHAR(255) NOT NULL,
    module VARCHAR(64) NOT NULL,                  -- 'Procurement', 'Finance', 'Engineering', 'Quality'
    document_type VARCHAR(128) NOT NULL,          -- 'Purchase Order', 'MRB Quarantine', 'Credit Exception'
    description TEXT,
    min_amount NUMERIC(15, 2) DEFAULT 0,
    max_amount NUMERIC(15, 2),
    condition_formula TEXT,
    sla_hours_total INTEGER NOT NULL DEFAULT 24,
    tiers JSONB NOT NULL DEFAULT '[]'::jsonb,     -- Array of stage configurations
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wf_tenant_mod ON admin_approval_workflows(tenant_id, module) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 7. APPROVAL WORKFLOW INSTANCES & TASKS (admin.approval_instances & tasks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_approval_instances (
    id VARCHAR(64) PRIMARY KEY,                   -- e.g. 'WFI-2026-0099'
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    workflow_id VARCHAR(64) NOT NULL REFERENCES admin_approval_workflows(id),
    document_ref VARCHAR(128) NOT NULL,           -- e.g. 'PO-2026-00789'
    domain VARCHAR(64) NOT NULL,
    total_amount NUMERIC(15, 2),
    current_tier INTEGER NOT NULL DEFAULT 1,
    total_tiers INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',-- 'PENDING', 'APPROVED', 'REJECTED', 'REWORK', 'OVERRIDDEN'
    initiator_user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    payload_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wf_inst_status ON admin_approval_instances(tenant_id, status);

CREATE TABLE IF NOT EXISTS admin_approval_tasks (
    id VARCHAR(64) PRIMARY KEY,
    instance_id VARCHAR(64) NOT NULL REFERENCES admin_approval_instances(id) ON DELETE CASCADE,
    tier_number INTEGER NOT NULL,
    stage_name VARCHAR(255) NOT NULL,
    assigned_role VARCHAR(128),
    assigned_user_id VARCHAR(64) REFERENCES auth_users(id),
    delegated_from_user_id VARCHAR(64) REFERENCES auth_users(id),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',-- 'PENDING', 'APPROVED', 'REJECTED', 'REWORK', 'ESCALATED'
    due_date TIMESTAMPTZ NOT NULL,
    acted_by_user_id VARCHAR(64) REFERENCES auth_users(id),
    decision_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wf_tasks_user_status ON admin_approval_tasks(assigned_user_id, status);

-- ----------------------------------------------------------------------------
-- 8. OUT-OF-OFFICE DELEGATION PROXIES (admin.approval_delegations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_approval_delegations (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    delegator_user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    delegatee_user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    domain_scope VARCHAR(128) NOT NULL DEFAULT 'ALL',
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delegation_dates ON admin_approval_delegations(delegator_user_id, valid_from, valid_until) WHERE is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 9. BREAK-GLASS EMERGENCY OVERRIDE FORENSICS (admin.break_glass_audit_vault)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_break_glass_vault (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    document_ref VARCHAR(128) NOT NULL,
    domain VARCHAR(64) NOT NULL,
    primary_admin_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    secondary_admin_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    reason_code VARCHAR(64) NOT NULL,             -- 'EMERGENCY_LINE_STOP', 'VIP_CUSTOMER_EXPEDITE'
    justification TEXT NOT NULL,
    signature_hash VARCHAR(256) NOT NULL,         -- SHA-256 HMAC non-repudiation signature
    client_ip VARCHAR(45) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. SYSTEM PARAMETERS & CONFIG (admin.system_parameters)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_system_parameters (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    param_group VARCHAR(64) NOT NULL,
    param_key VARCHAR(128) NOT NULL,
    param_name VARCHAR(255) NOT NULL,
    param_value TEXT NOT NULL,
    default_value TEXT NOT NULL,
    value_type VARCHAR(32) NOT NULL DEFAULT 'NUMBER',
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_params_tenant_key ON admin_system_parameters(tenant_id, param_key) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 11. SECURITY AUDIT TRAIL & FORENSICS (system.security_audit_logs)
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

-- ----------------------------------------------------------------------------
-- 12. ROW-LEVEL SECURITY (RLS) ACTIVATION
-- ----------------------------------------------------------------------------
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_approval_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_system_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_users ON auth_users;
CREATE POLICY tenant_isolation_users ON auth_users
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_workflows ON admin_approval_workflows;
CREATE POLICY tenant_isolation_workflows ON admin_approval_workflows
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_instances ON admin_approval_instances;
CREATE POLICY tenant_isolation_instances ON admin_approval_instances
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_audit ON security_audit_logs;
CREATE POLICY tenant_isolation_audit ON security_audit_logs
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);
