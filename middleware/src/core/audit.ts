import { drizzle } from 'drizzle-orm/node-postgres';
import { schema } from '../db.js';

export interface AuditLogInput {
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ip?: string | null;
}

export async function writeAudit(c: any, a: AuditLogInput): Promise<void> {
  const tx = 'insert' in c ? c : drizzle(c, { schema });
  const changed = a.newValues
    ? Object.keys(a.newValues).filter((k) => JSON.stringify(a.oldValues?.[k]) !== JSON.stringify(a.newValues![k]))
    : [];
  await tx.insert(schema.auditLogs).values({
    tenantId: a.tenantId,
    entityType: a.entityType,
    entityId: a.entityId,
    action: a.action,
    changedFields: changed,
    oldValues: a.oldValues ?? null,
    newValues: a.newValues ?? null,
    performedBy: a.performedBy,
    ipAddress: a.ip ?? null,
  });
}
