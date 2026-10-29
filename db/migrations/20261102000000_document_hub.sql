-- migrate:up
-- Document Hub: additive job + file metadata tables. Business tables are untouched.
CREATE TABLE IF NOT EXISTS document_report_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    requested_by TEXT NOT NULL,
    report_type TEXT NOT NULL,
    report_version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'QUEUED'
        CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    output_format TEXT NOT NULL CHECK (output_format IN ('PDF', 'XLSX', 'CSV')),
    filters JSONB NOT NULL DEFAULT '{}',
    options JSONB NOT NULL DEFAULT '{}',
    idempotency_key TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
    duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
    error_code TEXT,
    error_summary TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_jobs_tenant_user_created
    ON document_report_jobs (tenant_id, requested_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_jobs_tenant_status
    ON document_report_jobs (tenant_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_doc_jobs_idempotency
    ON document_report_jobs (tenant_id, requested_by, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES document_report_jobs(id) ON DELETE CASCADE,
    owner_user_id TEXT NOT NULL,
    storage_provider TEXT NOT NULL DEFAULT 'local',
    storage_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (file_size_bytes >= 0),
    checksum_sha256 TEXT,
    download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),
    last_downloaded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gen_docs_job ON generated_documents (job_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_tenant_owner
    ON generated_documents (tenant_id, owner_user_id) WHERE deleted_at IS NULL;

ALTER TABLE document_report_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY document_report_jobs_tenant_isolation ON document_report_jobs
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY generated_documents_tenant_isolation ON generated_documents
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON document_report_jobs TO erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON generated_documents TO erp_app;

-- migrate:down
DROP TABLE IF EXISTS generated_documents;
DROP TABLE IF EXISTS document_report_jobs;

