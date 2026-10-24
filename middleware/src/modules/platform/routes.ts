import { z } from 'zod';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { withDrizzleTx } from '../../db.js';
import { can, wrap } from '../../middleware.js';
import { registerResourceRoutes } from '../../core/resource.js';
import { ctx } from '../../core/query.js';
import { items, machines, auditLogs, userProfiles } from '../../schema/index.js';
import * as zod from '../../schema/zod.js';

async function hostMetrics() {
  try {
    const os = await import('node:os');
    const cores = os.cpus().length;
    if (!cores) throw new Error('no host metrics');
    const total = os.totalmem();
    return {
      cpuCores: cores,
      loadPct: Math.min(100, Math.round((os.loadavg()[0] / cores) * 1000) / 10),
      memoryTotalGb: Math.round((total / 1073741824) * 10) / 10,
      memoryUsedGb: Math.round(((total - os.freemem()) / 1073741824) * 10) / 10,
      uptimeSeconds: Math.round(process.uptime()),
    };
  } catch {
    return { cpuCores: null, loadPct: null, memoryTotalGb: null, memoryUsedGb: null, uptimeSeconds: null };
  }
}

export function platformRoutes(r: any) {
  // ---------- dashboard summary (P4 Step 6) ----------
  r.get('/dashboard/summary', can('read', 'Dashboard'), wrap(async (req, res) => {
    const a = req.actor!;
    const plantId = (req.query.plantId as string | undefined) || a.activePlantId;
    const data = await withDrizzleTx(
      ctx(a),
      async (db) => {
        const [itemStats] = await db
          .select({
            total_items: sql<number>`count(*)::int`,
            low_stock_items: sql<number>`count(*) FILTER (WHERE ${items.stock} <= ${items.reorderPoint})::int`,
            active_items: sql<number>`count(*) FILTER (WHERE ${items.status} = 'active')::int`,
          })
          .from(items)
          .where(and(eq(items.tenantId, a.tenantId), isNull(items.deletedAt)));

        const machineConditions = [isNull(machines.deletedAt)];
        if (plantId) {
          machineConditions.push(
            eq(machines.plant, sql`(SELECT name FROM plants WHERE id = ${plantId})`)
          );
        }

        const [machineStats] = await db
          .select({
            total_machines: sql<number>`count(*)::int`,
            running_machines: sql<number>`count(*) FILTER (WHERE ${machines.status} = 'running')::int`,
          })
          .from(machines)
          .where(and(...machineConditions));

        return {
          items: itemStats ?? { total_items: 0, low_stock_items: 0, active_items: 0 },
          machines: machineStats ?? { total_machines: 0, running_machines: 0 },
          activePlantId: plantId,
        };
      },
      { readOnly: true },
    );
    res.setHeader('Cache-Control', 'private, max-age=30');
    res.json({ data });
  }));



  r.get('/system/health', can('manage', 'Plant'), wrap(async (_req, res) => {
    const t0 = performance.now();
    const stats = await withDrizzleTx(
      { tenantId: '00000000-0000-0000-0000-000000000000', userId: 'system' },
      async (db) => {
        const [sessions] = await db
          .select({ n: sql<number>`count(*)::int` })
          .from(sql`"session"`)
          .where(sql`"expiresAt" > now()`);
        const [users] = await db
          .select({ n: sql<number>`count(*)::int` })
          .from(userProfiles)
          .where(isNull(userProfiles.deletedAt));
        return { sessions: sessions?.n ?? 0, users: users?.n ?? 0 };
      },
      { readOnly: true }
    );
    const dbLatencyMs = performance.now() - t0;
    res.json({ data: {
      status: 'ok',
      dbLatencyMs: Math.round(dbLatencyMs * 10) / 10,
      activeSessions: stats.sessions,
      userCount: stats.users,
      ...(await hostMetrics()),
    } });
  }));

  r.get('/audit-logs', can('read', 'Preference'), wrap(async (req, res) => {
    const a = req.actor!;
    const q = z.object({
      cursor: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      search: z.string().optional(),
      action: z.string().optional(),
      format: z.enum(['json', 'csv']).default('json'),
    }).parse(req.query);

    const out = await withDrizzleTx(ctx(a), async (db) => {
      const conditions = [eq(auditLogs.tenantId, a.tenantId)];

      if (q.entityType) {
        conditions.push(eq(auditLogs.entityType, q.entityType));
      }
      if (q.entityId) {
        conditions.push(
          or(
            eq(auditLogs.entityId, q.entityId),
            sql`${auditLogs.oldValues}->>'code' = ${q.entityId}`,
            sql`${auditLogs.newValues}->>'code' = ${q.entityId}`
          )!
        );
      }
      if (q.search) {
        const pattern = `%${q.search.replace(/[\\%_]/g, '\\$&')}%`;
        conditions.push(
          or(
            ilike(auditLogs.entityId, pattern),
            ilike(auditLogs.performedBy, pattern),
            ilike(auditLogs.action, pattern),
            sql`${auditLogs.newValues}::text ILIKE ${pattern}`,
            sql`${auditLogs.oldValues}::text ILIKE ${pattern}`
          )!
        );
      }
      if (q.action) {
        conditions.push(eq(auditLogs.action, q.action));
      }
      if (q.cursor) {
        conditions.push(sql`${auditLogs.performedAt} < ${q.cursor}::timestamptz`);
      }

      if (q.format === 'csv') {
        const rows = await db
          .select({
            id: auditLogs.id,
            entity_type: auditLogs.entityType,
            entity_id: auditLogs.entityId,
            action: auditLogs.action,
            performed_by: auditLogs.performedBy,
            ip_address: auditLogs.ipAddress,
            performed_at: auditLogs.performedAt,
          })
          .from(auditLogs)
          .where(and(...conditions))
          .orderBy(desc(auditLogs.performedAt))
          .limit(50000);
        return { isCsv: true, rows, data: rows, nextCursor: null };
      }

      const rows = await db
        .select({
          id: auditLogs.id,
          entity_type: auditLogs.entityType,
          entity_id: auditLogs.entityId,
          action: auditLogs.action,
          changed_fields: auditLogs.changedFields,
          old_values: auditLogs.oldValues,
          new_values: auditLogs.newValues,
          performed_by: auditLogs.performedBy,
          ip_address: auditLogs.ipAddress,
          performed_at: auditLogs.performedAt,
        })
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.performedAt))
        .limit(q.limit + 1);

      const hasMore = rows.length > q.limit;
      const data = hasMore ? rows.slice(0, q.limit) : rows;
      const nextCursor = hasMore && data.length > 0 ? (data[data.length - 1].performed_at ? new Date(data[data.length - 1].performed_at!).toISOString() : null) : null;

      return { isCsv: false, data, nextCursor, rows: [] };
    });

    if (out.isCsv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
      const csvHeader = 'id,entity_type,entity_id,action,performed_by,ip_address,performed_at\n';
      const csvRows = out.rows.map((r: any) =>
        `"${r.id}","${r.entity_type}","${r.entity_id}","${r.action}","${r.performed_by || ''}","${r.ip_address || ''}","${new Date(r.performed_at).toISOString()}"`
      ).join('\n');
      return res.send(csvHeader + csvRows);
    }

    res.json({ data: out.data, meta: { nextCursor: out.nextCursor } });
  }));

  r.get('/search', wrap(async (req, res) => {
    const a = req.actor!;
    const q = req.query.q ? String(req.query.q).trim() : '';
    if (!q) {
      return res.json({ data: [] });
    }
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const rows = await withDrizzleTx(ctx(a), async (db) => {
      const resSearch = await db
        .select({
          entity_type: sql`entity_type`,
          entity_id: sql`entity_id`,
          code: sql`code`,
          title: sql`title`,
          subtitle: sql`subtitle`,
          url_path: sql`url_path`,
        })
        .from(sql`public.search_erp_catalog(${a.tenantId}::uuid, ${q}::text, ${limit}::int)`);
      return resSearch;
    });

    res.json({ data: rows });
  }));


  // ---------- Protocol 1G Administrative Resources ----------
  registerResourceRoutes(r, '/reason-codes', {
    subject: 'ReasonCode',
    table: 'reason_codes',
    columns: ['id', 'category', 'code', 'description', 'is_active', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'description', 'category'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'category', 'id'],
    createSchema: zod.insertReasonCodeSchema,
    updateSchema: zod.updateReasonCodeSchema,
  });

  registerResourceRoutes(r, '/document-templates', {
    subject: 'DocumentTemplate',
    table: 'document_templates',
    columns: ['id', 'doc_type', 'name', 'subject_template', 'body_template', 'header_html', 'footer_html', 'is_active', 'version', 'created_at', 'updated_at'],
    searchColumns: ['name', 'doc_type'],
    sortAllowlist: ['created_at', 'updated_at', 'name', 'doc_type', 'id'],
    createSchema: zod.insertDocumentTemplateSchema,
    updateSchema: zod.updateDocumentTemplateSchema,
  });

  registerResourceRoutes(r, '/system-parameters', {
    subject: 'SystemParameter',
    table: 'system_parameters',
    columns: ['id', 'category', 'param_key', 'param_value', 'data_type', 'description', 'is_read_only', 'version', 'created_at', 'updated_at'],
    searchColumns: ['param_key', 'category', 'description'],
    sortAllowlist: ['created_at', 'updated_at', 'param_key', 'category', 'id'],
    createSchema: zod.insertSystemParameterSchema,
    updateSchema: zod.updateSystemParameterSchema,
  });

  registerResourceRoutes(r, '/backups', {
    subject: 'Backup',
    table: 'backup_runs',
    columns: ['id', 'backup_type', 'status', 'file_name', 'file_path', 'size_bytes', 'checksum', 'error_message', 'started_at', 'completed_at', 'version', 'created_at', 'updated_at'],
    searchColumns: ['file_name', 'status', 'backup_type'],
    sortAllowlist: ['created_at', 'started_at', 'completed_at', 'id'],
    createSchema: zod.insertBackupRunSchema,
    updateSchema: zod.updateBackupRunSchema,
  });

  registerResourceRoutes(r, '/privacy-requests', {
    subject: 'PrivacyRequest',
    table: 'privacy_requests',
    columns: ['id', 'user_id', 'request_type', 'status', 'tracking_number', 'reason', 'fulfillment_notes', 'fulfilled_at', 'created_at', 'updated_at'],
    searchColumns: ['tracking_number', 'request_type', 'status'],
    sortAllowlist: ['created_at', 'status', 'id'],
    createSchema: zod.insertPrivacyRequestSchema,
    updateSchema: zod.updatePrivacyRequestSchema,
  });

  // Platform Standards Specification (Page 2): Client Error Ingestion (rate-limited, structured JSON logs)
  r.post('/client-errors', wrap(async (req, res) => {
    const errorBody = (req.body || {}) as any;
    const reqId = req.headers.get('x-request-id') || `err-${Date.now()}`;
    const logEntry = {
      level: 'error',
      type: 'client_telemetry_error',
      requestId: reqId,
      actor: req.actor ? { userId: req.actor.userId, tenantId: req.actor.tenantId } : null,
      message: String(errorBody?.message ?? 'Unknown client error').slice(0, 500),
      url: String(errorBody?.url ?? '').slice(0, 200),
      timestamp: new Date().toISOString(),
    };
    console.error('[client-error]', JSON.stringify(logEntry));
    return res.status(200).json({ data: { recorded: true, requestId: reqId } });
  }));
}
