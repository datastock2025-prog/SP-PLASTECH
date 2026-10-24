-- migrate:up
-- Migration: 20261027000005_hr_analytics_workspace.sql
-- Description: Employees, Attendance Records, Shift Rosters, Operator Skills, Workspace Tasks, Notifications, Workspace Presets

-- 1. Employees Master
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    employee_code TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    gender TEXT,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    employment_type TEXT NOT NULL DEFAULT 'PERMANENT',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    date_of_joining TIMESTAMPTZ NOT NULL DEFAULT now(),
    aadhaar_masked TEXT,
    pan_masked TEXT,
    bank_account_masked TEXT,
    skills JSONB NOT NULL DEFAULT '[]',
    certifications JSONB NOT NULL DEFAULT '[]',
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_employees_tenant_code ON employees(tenant_id, employee_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_tenant_dept ON employees(tenant_id, department) WHERE deleted_at IS NULL;

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY employees_tenant_isolation ON employees
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO erp_app;

-- 2. Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'PRESENT',
    shift TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant_emp ON attendance_records(tenant_id, employee_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date ON attendance_records(tenant_id, date) WHERE deleted_at IS NULL;

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendance_records_tenant_isolation ON attendance_records
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_records TO erp_app;

-- 3. Shift Rosters
CREATE TABLE IF NOT EXISTS shift_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT,
    week_start_date DATE NOT NULL,
    schedule JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'PUBLISHED',
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shift_rosters_tenant_emp ON shift_rosters(tenant_id, employee_id) WHERE deleted_at IS NULL;

ALTER TABLE shift_rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_rosters_tenant_isolation ON shift_rosters
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON shift_rosters TO erp_app;

-- 4. Operator Skills
CREATE TABLE IF NOT EXISTS operator_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    operator_id TEXT NOT NULL,
    machine_id TEXT,
    skill_name TEXT NOT NULL,
    competency_level INTEGER NOT NULL DEFAULT 1,
    is_certified BOOLEAN NOT NULL DEFAULT true,
    certified_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_operator_skills_tenant_op ON operator_skills(tenant_id, operator_id) WHERE deleted_at IS NULL;

ALTER TABLE operator_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY operator_skills_tenant_isolation ON operator_skills
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON operator_skills TO erp_app;

-- 5. Workspace Tasks
CREATE TABLE IF NOT EXISTS workspace_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'TODO',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    assigned_to TEXT,
    due_date TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_tenant_status ON workspace_tasks(tenant_id, status) WHERE deleted_at IS NULL;

ALTER TABLE workspace_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_tasks_tenant_isolation ON workspace_tasks
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_tasks TO erp_app;

-- 6. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON notifications(tenant_id, user_id) WHERE deleted_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_tenant_isolation ON notifications
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO erp_app;

-- 7. Workspace Presets
CREATE TABLE IF NOT EXISTS workspace_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    view_name TEXT NOT NULL,
    preset_name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    columns JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workspace_presets_tenant_user ON workspace_presets(tenant_id, user_id, view_name) WHERE deleted_at IS NULL;

ALTER TABLE workspace_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_presets_tenant_isolation ON workspace_presets
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_presets TO erp_app;

-- migrate:down
-- shortcut: no automated rollback for this historical migration; restore from backup.
