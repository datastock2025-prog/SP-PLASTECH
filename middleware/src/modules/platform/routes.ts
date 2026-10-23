import { z } from 'zod';
import { pool, withTx, withDrizzleTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import { registerResourceRoutes } from '../../crud.js';
import { ctx, hostMetrics } from '../../core/helpers.js';
import * as zod from '../../schema/zod.js';

export function platformRoutes(r: any) {
  // ---------- dashboard summary (P4 Step 6) ----------
  r.get('/dashboard/summary', can('read', 'Dashboard'), wrap(async (req, res) => {
    const a = req.actor!;
    const plantId = (req.query.plantId as string | undefined) || a.activePlantId;
    const data = await withTx(
      ctx(a),
      async (c) => {
        const itemRes = await c.query(
          `SELECT count(*)::int AS total_items,
                  count(*) FILTER (WHERE stock <= reorder_point)::int AS low_stock_items,
                  count(*) FILTER (WHERE status = 'active')::int AS active_items
             FROM items
            WHERE tenant_id = $1 AND deleted_at IS NULL`,
          [a.tenantId],
        );
        const plantParam = plantId ? [plantId] : [];
        const machineRes = await c.query(
          `SELECT count(*)::int AS total_machines,
                  count(*) FILTER (WHERE status = 'running')::int AS running_machines
             FROM machines
            WHERE deleted_at IS NULL ${plantId ? 'AND plant = (SELECT name FROM plants WHERE id = $1)' : ''}`,
          plantParam,
        );
        return {
          items: itemRes.rows[0],
          machines: machineRes.rows[0],
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
    const sessions = await pool.query(`SELECT count(*)::int AS n FROM "session" WHERE "expiresAt" > now()`);
    const dbLatencyMs = performance.now() - t0;
    const users = await pool.query(`SELECT count(*)::int AS n FROM user_profiles WHERE deleted_at IS NULL`);
    res.json({ data: {
      status: 'ok',
      dbLatencyMs: Math.round(dbLatencyMs * 10) / 10,
      activeSessions: sessions.rows[0].n,
      userCount: users.rows[0].n,
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

    const out = await withTx(ctx(a), async (c) => {
      const where = ['tenant_id = $1'];
      const params: any[] = [a.tenantId];

      if (q.entityType) {
        params.push(q.entityType);
        where.push(`entity_type = $${params.length}`);
      }
      if (q.entityId) {
        params.push(q.entityId);
        where.push(`(entity_id = $${params.length} OR old_values->>'code' = $${params.length} OR new_values->>'code' = $${params.length})`);
      }
      if (q.search) {
        params.push(`%${q.search.replace(/[\\%_]/g, '\\$&')}%`);
        where.push(`(entity_id ILIKE $${params.length} OR performed_by ILIKE $${params.length} OR action ILIKE $${params.length} OR new_values::text ILIKE $${params.length} OR old_values::text ILIKE $${params.length})`);
      }
      if (q.action) {
        params.push(q.action);
        where.push(`action = $${params.length}`);
      }
      if (q.cursor) {
        params.push(q.cursor);
        where.push(`performed_at < $${params.length}::timestamptz`);
      }

      if (q.format === 'csv') {
        const rows = (await c.query(
          `SELECT id, entity_type, entity_id, action, performed_by, ip_address, performed_at
           FROM public.audit_logs
           WHERE ${where.join(' AND ')}
           ORDER BY performed_at DESC
           LIMIT 50000`,
          params
        )).rows;
        return { isCsv: true, rows, data: rows, nextCursor: null };
      }

      params.push(q.limit + 1);
      const rows = (await c.query(
        `SELECT id, entity_type, entity_id, action, changed_fields, old_values, new_values, performed_by, ip_address, performed_at
         FROM public.audit_logs
         WHERE ${where.join(' AND ')}
         ORDER BY performed_at DESC
         LIMIT $${params.length}`,
        params
      )).rows;

      const hasMore = rows.length > q.limit;
      const data = hasMore ? rows.slice(0, q.limit) : rows;
      const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].performed_at : null;

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

    const rows = await withTx(ctx(a), async (c) => {
      const resSearch = await c.query(
        `SELECT entity_type, entity_id, code, title, subtitle, url_path
         FROM public.search_erp_catalog($1::uuid, $2::text, $3::int)`,
        [a.tenantId, q, limit]
      );
      return resSearch.rows;
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
