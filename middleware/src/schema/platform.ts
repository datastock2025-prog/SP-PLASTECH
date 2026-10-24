import { pgTable, text, timestamp, uuid, integer, bigint, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './identity.js';

// Protocol 1G administrative tables (db/migrations/20261023000000_*, soft-delete/version columns added in 20261031000002_*).
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const standard = {
  version: integer('version').notNull().default(1),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  deletedAt: ts('deleted_at'),
};
const tenantId = () => uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' });

export const backupRuns = pgTable('backup_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  backupType: text('backup_type').notNull().default('FULL'),
  status: text('status').notNull().default('PENDING'),
  fileName: text('file_name'),
  filePath: text('file_path'),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).default(0),
  checksum: text('checksum'),
  errorMessage: text('error_message'),
  startedAt: ts('started_at').defaultNow(),
  completedAt: ts('completed_at'),
  ...standard,
});

export const privacyRequests = pgTable('privacy_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  userId: text('user_id'),
  requestType: text('request_type').notNull(),
  status: text('status').notNull().default('PENDING'),
  trackingNumber: text('tracking_number').notNull().$defaultFn(() => 'PR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()),
  reason: text('reason'),
  fulfillmentNotes: text('fulfillment_notes'),
  fulfilledAt: ts('fulfilled_at'),
  ...standard,
});

export const reasonCodes = pgTable('reason_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  category: text('category').notNull(),
  code: text('code').notNull(),
  description: text('description').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  ...standard,
});

export const documentTemplates = pgTable('document_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  docType: text('doc_type').notNull(),
  name: text('name').notNull(),
  subjectTemplate: text('subject_template'),
  bodyTemplate: text('body_template').notNull(),
  headerHtml: text('header_html'),
  footerHtml: text('footer_html'),
  isActive: boolean('is_active').notNull().default(true),
  ...standard,
});

export const systemParameters = pgTable('system_parameters', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  category: text('category').notNull().default('GENERAL'),
  paramKey: text('param_key').notNull(),
  paramValue: text('param_value').notNull(),
  dataType: text('data_type').notNull().default('STRING'),
  description: text('description'),
  isReadOnly: boolean('is_read_only').notNull().default(false),
  ...standard,
});
