-- Migration: 20261027000002_manufacturing_quality_maintenance.sql
-- Description: Manufacturing production entries, downtime logs, QC inspections, PM schedules, and breakdown tickets

CREATE TABLE IF NOT EXISTS production_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    work_order_id TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    operator_id TEXT,
    shift_id TEXT,
    entry_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    shots_produced NUMERIC(14, 2) NOT NULL DEFAULT 0,
    good_qty NUMERIC(14, 2) NOT NULL DEFAULT 0,
    rejected_qty NUMERIC(14, 2) NOT NULL DEFAULT 0,
    rejection_reason_code TEXT,
    regrind_kg_generated NUMERIC(14, 2) NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_production_entries_tenant_wo ON production_entries(tenant_id, work_order_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_production_entries_tenant_machine ON production_entries(tenant_id, machine_id) WHERE deleted_at IS NULL;

ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY production_entries_tenant_isolation ON production_entries
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON production_entries TO erp_app;

-- Downtime logs
CREATE TABLE IF NOT EXISTS downtime_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    machine_id TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes NUMERIC(10, 2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    reason_code TEXT,
    comments TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_downtime_logs_tenant_machine ON downtime_logs(tenant_id, machine_id) WHERE deleted_at IS NULL;

ALTER TABLE downtime_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY downtime_logs_tenant_isolation ON downtime_logs
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON downtime_logs TO erp_app;

-- Quality QC Inspections
CREATE TABLE IF NOT EXISTS qc_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    inspection_no TEXT NOT NULL,
    doc_type TEXT NOT NULL DEFAULT 'WORK_ORDER',
    doc_id TEXT NOT NULL,
    item_code TEXT NOT NULL,
    lot_number TEXT,
    inspected_qty NUMERIC(14, 2) NOT NULL DEFAULT 0,
    sample_size NUMERIC(14, 2) NOT NULL DEFAULT 0,
    accepted_qty NUMERIC(14, 2) NOT NULL DEFAULT 0,
    rejected_qty NUMERIC(14, 2) NOT NULL DEFAULT 0,
    disposition TEXT NOT NULL DEFAULT 'ACCEPTED',
    defects JSONB NOT NULL DEFAULT '[]',
    inspector_id TEXT,
    notes TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_qc_inspections_tenant_doc ON qc_inspections(tenant_id, doc_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qc_inspections_tenant_item ON qc_inspections(tenant_id, item_code) WHERE deleted_at IS NULL;

ALTER TABLE qc_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY qc_inspections_tenant_isolation ON qc_inspections
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON qc_inspections TO erp_app;

-- Maintenance Schedules (Preventive Maintenance)
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    machine_id TEXT NOT NULL,
    mold_id TEXT,
    frequency_type TEXT NOT NULL DEFAULT 'DAYS',
    threshold_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    task_description TEXT NOT NULL,
    last_completed_date TIMESTAMPTZ,
    next_due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_tenant_machine ON maintenance_schedules(tenant_id, machine_id) WHERE deleted_at IS NULL;

ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY maintenance_schedules_tenant_isolation ON maintenance_schedules
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON maintenance_schedules TO erp_app;

-- Breakdown Tickets
CREATE TABLE IF NOT EXISTS breakdown_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    ticket_number TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    fault_category TEXT NOT NULL,
    symptom TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'MEDIUM',
    start_downtime TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_downtime TIMESTAMPTZ,
    action_taken TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_breakdown_tickets_tenant_machine ON breakdown_tickets(tenant_id, machine_id) WHERE deleted_at IS NULL;

ALTER TABLE breakdown_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY breakdown_tickets_tenant_isolation ON breakdown_tickets
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON breakdown_tickets TO erp_app;
