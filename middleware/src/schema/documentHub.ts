import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core';
import { tenants, plants } from './identity.js';

// Document Hub (db/migrations/20261102000000_document_hub.sql).
// Read-only consumer of business tables; owns only job + file metadata. No FK to `user`
// so the module can be extracted into its own service without cross-schema coupling.
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const documentReportJobs = pgTable('document_report_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  plantId: uuid('plant_id').references(() => plants.id, { onDelete: 'set null' }),
  requestedBy: text('requested_by').notNull(),
  reportType: text('report_type').notNull(),
  reportVersion: integer('report_version').notNull().default(1),
  status: text('status').notNull().default('QUEUED'),
  outputFormat: text('output_format').notNull(),
  filters: jsonb('filters').notNull().default({}),
  options: jsonb('options').notNull().default({}),
  idempotencyKey: text('idempotency_key'),
  attemptCount: integer('attempt_count').notNull().default(0),
  rowCount: integer('row_count').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  errorCode: text('error_code'),
  errorSummary: text('error_summary'),
  startedAt: ts('started_at'),
  completedAt: ts('completed_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const generatedDocuments = pgTable('generated_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').notNull().references(() => documentReportJobs.id, { onDelete: 'cascade' }),
  ownerUserId: text('owner_user_id').notNull(),
  storageProvider: text('storage_provider').notNull().default('local'),
  storageKey: text('storage_key').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull().default(0),
  checksumSha256: text('checksum_sha256'),
  downloadCount: integer('download_count').notNull().default(0),
  lastDownloadedAt: ts('last_downloaded_at'),
  expiresAt: ts('expires_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
  deletedAt: ts('deleted_at'),
});

