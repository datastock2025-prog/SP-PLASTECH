import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { withDrizzleTx, schema } from '../../db.js';
import { can, wrap, type Actor } from '../../middleware.js';
import { ctx } from '../../core/query.js';
import { itemRepository } from './items.repository.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function masterdataRoutes(r: any) {
  // ── Dynamic Admin-Governed Catalog Options (Persisted in PostgreSQL system_parameters + approval_workflows + plants) ──
  r.get(
    '/master-data/options',
    wrap(async (req, res) => {
      const a = req.actor! as Actor;
      const data = await withDrizzleTx(
        ctx(a),
        async (tx) => {
          const params = await tx
            .select()
            .from(schema.systemParameters)
            .where(
              and(
                eq(schema.systemParameters.tenantId, a.tenantId),
                eq(schema.systemParameters.category, 'MASTER_DATA_OPTIONS'),
                isNull(schema.systemParameters.deletedAt)
              )
            );
          const options: Record<string, string[]> = {};
          for (const p of params) {
            try {
              const parsed = JSON.parse(p.paramValue);
              if (Array.isArray(parsed)) options[p.paramKey] = parsed;
            } catch (_) {}
          }

          // Merge live plants from DB
          const dbPlants = await tx
            .select()
            .from(schema.plants)
            .where(and(eq(schema.plants.tenantId, a.tenantId), isNull(schema.plants.deletedAt)))
            .orderBy(asc(schema.plants.code));
          const plantList = new Set<string>(options.plantScopes || []);
          for (const pl of dbPlants) {
            if (pl.name) plantList.add(pl.name);
          }
          options.plantScopes = Array.from(plantList);

          // Merge live approval workflows from DB
          const wfList = await tx
            .select()
            .from(schema.approvalWorkflows)
            .where(and(eq(schema.approvalWorkflows.tenantId, a.tenantId), isNull(schema.approvalWorkflows.deletedAt)))
            .orderBy(asc(schema.approvalWorkflows.code));
          const wfSteps = await tx
            .select()
            .from(schema.approvalSteps)
            .where(eq(schema.approvalSteps.tenantId, a.tenantId))
            .orderBy(asc(schema.approvalSteps.stepNumber));
          const routeSet = new Set<string>(options.workflowRoutes || []);
          for (const wf of wfList) {
            const steps = wfSteps.filter((s) => s.workflowId === wf.id).map((s) => s.stepName);
            const label = steps.length > 0 ? `${wf.name}: ${steps.join(' -> ')}` : wf.name;
            routeSet.add(label);
          }
          options.workflowRoutes = Array.from(routeSet);

          return options;
        },
        { readOnly: true }
      );
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json({ data });
    })
  );

  r.post(
    '/master-data/options',
    wrap(async (req, res) => {
      const a = req.actor! as Actor;
      const body = req.body ?? {};
      const key = String(body.key || '').trim();
      const value = String(body.value || '').trim();
      const valuesInput = Array.isArray(body.values) ? body.values.map((v: any) => String(v).trim()).filter(Boolean) : [];
      if (!key || (!value && valuesInput.length === 0)) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'key and value are required' } });
      }

      const updated = await withDrizzleTx(ctx(a), async (tx) => {
        const [existing] = await tx
          .select()
          .from(schema.systemParameters)
          .where(
            and(
              eq(schema.systemParameters.tenantId, a.tenantId),
              eq(schema.systemParameters.category, 'MASTER_DATA_OPTIONS'),
              eq(schema.systemParameters.paramKey, key),
              isNull(schema.systemParameters.deletedAt)
            )
          )
          .limit(1);

        let list: string[] = [];
        if (existing) {
          try {
            const parsed = JSON.parse(existing.paramValue);
            if (Array.isArray(parsed)) list = parsed;
          } catch (_) {}
        }
        for (const v of valuesInput) {
          if (!list.includes(v)) list.push(v);
        }
        if (value && !list.includes(value)) {
          list.unshift(value);
        }

        if (existing) {
          await tx
            .update(schema.systemParameters)
            .set({
              paramValue: JSON.stringify(list),
              version: sql`${schema.systemParameters.version} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(schema.systemParameters.id, existing.id));
        } else {
          await tx.insert(schema.systemParameters).values({
            tenantId: a.tenantId,
            category: 'MASTER_DATA_OPTIONS',
            paramKey: key,
            paramValue: JSON.stringify(list),
            dataType: 'JSON',
            description: `Dynamic Master Data Options for ${key}`,
            isReadOnly: false,
          });
        }

        // If admin created a new Approval Workflow Route, also register it in approval_workflows table
        if (key === 'workflowRoutes' && value) {
          const wfCode = `WF-${value.replace(/[^A-Za-z0-9]/g, '').slice(0, 12).toUpperCase()}-${Date.now().toString().slice(-4)}`;
          const [wf] = await tx
            .insert(schema.approvalWorkflows)
            .values({
              tenantId: a.tenantId,
              code: wfCode,
              name: value.split(':')[0]?.trim() || value,
              entityType: 'ITEM_MASTER',
              isActive: true,
            })
            .returning();
          if (wf) {
            const parts = value.includes(':') ? value.split(':')[1]!.split(/->|→/) : [value];
            let idx = 1;
            for (const step of parts) {
              const cleanStep = step.trim();
              if (!cleanStep) continue;
              await tx.insert(schema.approvalSteps).values({
                tenantId: a.tenantId,
                workflowId: wf.id,
                stepNumber: idx++,
                stepName: cleanStep,
                approverType: 'ROLE',
                approverId: 'admin',
                isMandatory: true,
              });
            }
          }
        }

        await tx.insert(schema.auditLogs).values({
          tenantId: a.tenantId,
          entityType: 'master_data_options',
          entityId: key,
          action: 'UPDATE',
          changedFields: [key],
          oldValues: null,
          newValues: { key, value, totalOptions: list.length },
          performedBy: a.userId,
        });

        return { key, values: list };
      });

      res.status(201).json({ data: updated });
    })
  );

  // ── Cloud R2 / Media Object Storage Upload Endpoint ──
  r.post(
    '/storage/upload',
    wrap(async (req, res) => {
      const a = req.actor! as Actor;
      const raw = req.body ?? {};
      const folder = String(raw.folder || 'documents');
      const itemCode = String(raw.itemCode || 'GLOBAL');
      const objectKey = String(raw.objectKey || `erp-media/${folder}/${itemCode}/${Date.now()}`);
      const publicCdnUrl = `https://cdn.sp-plastech-erp.r2.cloudflarestorage.com/${objectKey}`;

      await withDrizzleTx(ctx(a), async (tx) => {
        await tx.insert(schema.auditLogs).values({
          tenantId: a.tenantId,
          entityType: 'storage_media',
          entityId: itemCode,
          action: 'CREATE',
          changedFields: ['objectKey', 'publicCdnUrl'],
          oldValues: null,
          newValues: { folder, itemCode, objectKey, publicCdnUrl },
          performedBy: a.userId,
        });
      });

      res.status(201).json({
        data: {
          success: true,
          objectKey,
          publicCdnUrl,
        },
      });
    })
  );
  // Aggregate Metrics Endpoint: Type-safe Drizzle aggregation (Collapses metrics into 1 round-trip)
  r.get(
    '/items/summary',
    can('read', 'Item'),
    wrap(async (req, res) => {
      const a = req.actor! as Actor;
      const data = await withDrizzleTx(
        ctx(a),
        async (tx) => itemRepository.getSummary(tx, a.tenantId),
        { readOnly: true }
      );
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json({ data });
    })
  );

  // ── 2-Layer Direct Drizzle Item Routes (SSOT, zero CRUD reflection) ──

  // GET /items — paginated item catalog
  r.get(
    '/items',
    can('read', 'Item'),
    wrap(async (req, res) => {
      const a = req.actor! as Actor;
      const result = await withDrizzleTx(
        ctx(a),
        async (tx) => itemRepository.findPaginated(tx, a.tenantId, req.query),
        { readOnly: true }
      );
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json(result);
    })
  );

  // GET /items/:id — get by UUID or Code
  r.get(
    '/items/:id',
    can('read', 'Item'),
    wrap(async (req, res) => {
      const a = req.actor! as Actor;
      const idOrCode = req.params.id;
      const item = await withDrizzleTx(
        ctx(a),
        async (tx) => {
          if (UUID_REGEX.test(idOrCode)) {
            const byId = await itemRepository.findById(tx, a.tenantId, idOrCode);
            if (byId) return byId;
          }
          return itemRepository.findByCode(tx, a.tenantId, idOrCode);
        },
        { readOnly: true }
      );
      if (!item) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Item '${idOrCode}' not found` } });
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json({ data: item });
    })
  );

  // POST /items — direct SKU creation
  r.post(
    '/items',
    can('create', 'Item'),
    wrap(async (req, res) => {
      const a = req.actor! as Actor;
      const raw = req.body ?? {};
      const b = {
        ...raw,
        category: raw.category || raw.cat || raw.type || 'Finished Good',
        entityType: raw.entityType || raw.type || raw.category || 'Finished Good',
        unit: raw.unit || raw.baseUOM || 'PCS',
        description: raw.description ?? raw.desc,
        defaultWarehouse: raw.defaultWarehouse ?? raw.wh,
        defaultBin: raw.defaultBin ?? raw.locationCode,
        reorderPoint: raw.reorderPoint ?? raw.reorderLevel,
      };
      if (b.plantId && !UUID_REGEX.test(b.plantId)) {
        delete b.plantId;
      }
      if (b.plant && UUID_REGEX.test(b.plant)) {
        b.plantId = b.plant;
      }
      const missing = ['code', 'name', 'category'].filter((k) => typeof b[k] !== 'string' || !b[k].trim());
      if (missing.length) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: `Required: ${missing.join(', ')}`, details: { missing } },
        });
      }
      try {
        const created = await withDrizzleTx(
          ctx(a),
          async (tx) => itemRepository.create(tx, a.tenantId, b, a.userId)
        );
        res.status(201).json({ data: created });
      } catch (e: any) {
        if (e?.code === '23505' || e?.cause?.code === '23505') {
          return res.status(409).json({ error: { code: 'DUPLICATE_CODE', message: `Item code '${b.code}' already exists` } });
        }
        throw e;
      }
    })
  );

  // PATCH /items/:id — atomic OCC update
  r.patch(
    '/items/:id',
    can('update', 'Item'),
    wrap(async (req, res) => {
      const a = req.actor! as Actor;
      const idOrCode = req.params.id;
      const result = await withDrizzleTx(
        ctx(a),
        async (tx) => {
          let targetId = idOrCode;
          let expectedVersion = req.body?.version;
          if (!UUID_REGEX.test(idOrCode)) {
            const existing = await itemRepository.findByCode(tx, a.tenantId, idOrCode);
            if (!existing) return { notFound: true };
            targetId = existing.id;
            if (expectedVersion === undefined) expectedVersion = existing.version;
          } else if (expectedVersion === undefined) {
            const existing = await itemRepository.findById(tx, a.tenantId, targetId);
            if (!existing) return { notFound: true };
            expectedVersion = existing.version;
          }

          const updated = await itemRepository.update(
            tx,
            a.tenantId,
            targetId,
            Number(expectedVersion),
            req.body,
            a.userId
          );
          return { updated };
        }
      );

      if ((result as any).notFound) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Item '${idOrCode}' not found` } });
      }
      if (!(result as any).updated) {
        return res.status(409).json({
          error: { code: 'CONCURRENCY_CONFLICT', message: 'Item version mismatch or concurrently modified' }
        });
      }
      res.json({ data: (result as any).updated });
    })
  );

  // DELETE /items/:id — soft delete
  r.delete(
    '/items/:id',
    can('delete', 'Item'),
    wrap(async (req, res) => {
      const a = req.actor! as Actor;
      const idOrCode = req.params.id;
      const success = await withDrizzleTx(
        ctx(a),
        async (tx) => {
          let targetId = idOrCode;
          if (!UUID_REGEX.test(idOrCode)) {
            const existing = await itemRepository.findByCode(tx, a.tenantId, idOrCode);
            if (!existing) return false;
            targetId = existing.id;
          }
          return itemRepository.softDelete(tx, a.tenantId, targetId, a.userId);
        }
      );
      if (!success) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Item '${idOrCode}' not found` } });
      }
      res.json({ data: { success: true } });
    })
  );
}
