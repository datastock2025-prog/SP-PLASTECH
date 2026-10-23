import { uuid, integer, timestamp, text } from 'drizzle-orm/pg-core';
import { tenants, plants } from '../schema/identity.js';

/**
 * Shared audit columns helper for all business tables (Part A1 specification)
 * Enforces:
 * - tenant_id uuid NOT NULL references tenants(id)
 * - plant_id uuid references plants(id) (null = tenant-wide)
 * - version integer NOT NULL default 1 (Optimistic Concurrency Control)
 * - created_by / updated_by audit trails
 * - created_at / updated_at timestamps with timezone
 * - deleted_at soft delete marker
 */
export const auditColumns = () => ({
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  plantId: uuid('plant_id').references(() => plants.id, { onDelete: 'restrict' }),
  version: integer('version').notNull().default(1),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
});
