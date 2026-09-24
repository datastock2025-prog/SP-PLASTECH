-- ============================================================================
-- REBOOT ERP ENTERPRISE SCALABLE & SECURE POSTGRESQL ARCHITECTURE (v2.1)
-- Compliant with: SOC2 Type II, GDPR, ISO 27001, IATF 16949, Multi-Tenant Native RLS
-- Module-1: Home Tools & Universal Audit/Versioning Infrastructure
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
-- 5. AUDIT LOGGING SYSTEM (system.audit_logs - WHO, WHAT, WHEN + BEFORE/AFTER)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    actor_id VARCHAR(64) NOT NULL,
    actor_email VARCHAR(128) NOT NULL,
    action VARCHAR(32) NOT NULL,                  -- 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUBMIT', 'CANCEL', 'EXPORT', 'LOGIN'
    entity_name VARCHAR(128) NOT NULL,            -- e.g. 'ItemMaster', 'EngineeringBom', 'Task', 'ApprovalRequest'
    entity_id VARCHAR(64) NOT NULL,
    entity_version VARCHAR(32),
    old_data JSONB,                               -- Snapshot BEFORE mutation
    new_data JSONB,                               -- Snapshot AFTER mutation
    ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(tenant_id, entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. ENTITY VERSIONING SYSTEM (system.entity_versions - Historical Snapshots)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entity_versions (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    entity_name VARCHAR(128) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    version VARCHAR(32) NOT NULL,                 -- e.g. 'v1.0', 'v1.1', 'v2.0'
    snapshot JSONB NOT NULL,                      -- Full entity state at this version
    changed_by_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    change_reason TEXT,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_ver_unique ON entity_versions(tenant_id, entity_name, entity_id, version);
CREATE INDEX IF NOT EXISTS idx_entity_ver_search ON entity_versions(tenant_id, entity_name, entity_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 7. SCREEN 1: WORKSPACE HOME WIDGETS (admin.dashboard_widgets)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    widget_type VARCHAR(64) NOT NULL,             -- 'PENDING_TASKS', 'MY_APPROVALS', 'PRODUCTION_STATUS', 'MRP_SHORTAGES', 'INVENTORY_ALERTS', 'QUALITY_ISSUES', 'MACHINE_DOWNTIME', 'CUSTOM'
    title VARCHAR(255) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    position INTEGER NOT NULL DEFAULT 1,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    refresh_interval INTEGER NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_widget_user ON dashboard_widgets(tenant_id, user_id, is_visible, position);

-- ----------------------------------------------------------------------------
-- 8. SCREEN 2: MY TASKS (core.tasks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    task_number VARCHAR(64) UNIQUE NOT NULL,      -- e.g. 'TASK-2026-001234'
    assigned_to_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(64) NOT NULL DEFAULT 'CUSTOM', -- 'APPROVAL_REQUEST', 'INSPECTION', 'DATA_ENTRY', 'REVIEW', 'MAINTENANCE', 'QUALITY_CHECK', 'CUSTOM'
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',  -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',    -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    related_entity_type VARCHAR(64),              -- e.g. 'PurchaseRequisition', 'WorkOrder'
    related_entity_id VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(tenant_id, assigned_to_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);

-- ----------------------------------------------------------------------------
-- 9. SCREEN 3: MY APPROVALS (admin.approval_requests & stages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_requests (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    request_number VARCHAR(64) UNIQUE NOT NULL,   -- e.g. 'APR-2026-001234'
    entity_type VARCHAR(64) NOT NULL,             -- 'PurchaseRequisition', 'BOM', 'ItemMaster', 'PurchaseOrder', 'ECO'
    entity_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    submitted_by_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',  -- 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'ESCALATED'
    current_stage INTEGER NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_tenant_status ON approval_requests(tenant_id, status);

CREATE TABLE IF NOT EXISTS approval_stages (
    id VARCHAR(64) PRIMARY KEY,
    approval_request_id VARCHAR(64) NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    stage_number INTEGER NOT NULL,
    approver_id VARCHAR(64) NOT NULL,
    approver_email VARCHAR(128) NOT NULL,
    approver_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'SKIPPED', 'ESCALATED'
    action VARCHAR(32),                            -- 'APPROVE', 'REJECT', 'REQUEST_CHANGES', 'ESCALATE'
    comments TEXT,
    acted_at TIMESTAMPTZ,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stages_req ON approval_stages(approval_request_id, stage_number);
CREATE INDEX IF NOT EXISTS idx_stages_approver ON approval_stages(approver_id, status);

-- ----------------------------------------------------------------------------
-- 10. SCREEN 4: NOTIFICATIONS (core.notifications)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_ALERT', -- 'SYSTEM_ALERT', 'PRODUCTION_HALT', 'QUALITY_ISSUE', 'INVENTORY_LOW', 'MAINTENANCE_DUE', 'APPROVAL_REQUEST', 'TASK_ASSIGNED', 'MRP_SHORTAGE', 'CUSTOM'
    severity VARCHAR(32) NOT NULL DEFAULT 'INFO',     -- 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(tenant_id, user_id, is_read, created_at DESC);

-- ----------------------------------------------------------------------------
-- 11. SCREEN 5: SAVED VIEWS (core.saved_views)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_views (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    name VARCHAR(255) NOT NULL,
    module VARCHAR(64) NOT NULL,                  -- 'ItemMaster', 'BOM', 'PurchaseRequisition', 'PurchaseOrder', 'Tasks'
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    columns JSONB DEFAULT '[]'::jsonb,
    sort_order JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_views ON saved_views(tenant_id, user_id, module);

-- ----------------------------------------------------------------------------
-- 12. SCREEN 6: RECENT RECORDS (core.recent_records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recent_records (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_profiles(id),
    user_id VARCHAR(64) NOT NULL REFERENCES auth_users(id),
    entity_type VARCHAR(64) NOT NULL,             -- 'ItemMaster', 'EngineeringBom', 'WorkOrder', 'PurchaseOrder', 'Task'
    entity_id VARCHAR(64) NOT NULL,
    record_name VARCHAR(255) NOT NULL,
    record_url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recent_records ON recent_records(tenant_id, user_id, accessed_at DESC);

-- ----------------------------------------------------------------------------
-- 13. ROW-LEVEL SECURITY (RLS) ACTIVATION FOR ALL HOME TOOLS TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_records ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_users ON auth_users;
CREATE POLICY tenant_isolation_users ON auth_users FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_entity_versions ON entity_versions;
CREATE POLICY tenant_isolation_entity_versions ON entity_versions FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_dashboard_widgets ON dashboard_widgets;
CREATE POLICY tenant_isolation_dashboard_widgets ON dashboard_widgets FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_tasks ON tasks;
CREATE POLICY tenant_isolation_tasks ON tasks FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_approval_requests ON approval_requests;
CREATE POLICY tenant_isolation_approval_requests ON approval_requests FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_notifications ON notifications;
CREATE POLICY tenant_isolation_notifications ON notifications FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_saved_views ON saved_views;
CREATE POLICY tenant_isolation_saved_views ON saved_views FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);

DROP POLICY IF EXISTS tenant_isolation_recent_records ON recent_records;
CREATE POLICY tenant_isolation_recent_records ON recent_records FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR);
