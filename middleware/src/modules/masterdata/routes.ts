import { withDrizzleTx } from '../../db.js';
import { can, wrap, type Actor } from '../../middleware.js';
import { ctx } from '../../core/query.js';
import { itemRepository } from './items.repository.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function masterdataRoutes(r: any) {
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
      const b = req.body ?? {};
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
