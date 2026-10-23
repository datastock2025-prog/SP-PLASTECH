import { z } from 'zod';
import { withTx } from '../../db.js';
import { AppError, can, wrap } from '../../middleware.js';
import { registerResourceRoutes } from '../../crud.js';
import { ctx } from '../../core/helpers.js';
import { writeAudit } from '../../userStore.js';
import * as zod from '../../schema/zod.js';

export function engineeringRoutes(r: any) {
  // 1. Core BOM Header CRUD
  registerResourceRoutes(r, '/bill-of-materials', {
    subject: 'BillOfMaterial',
    table: 'bill_of_materials',
    columns: ['id', 'item_code', 'bom_version', 'status', 'lines', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['item_code', 'status', 'bom_version'],
    filterColumns: ['item_code', 'status', 'bom_version', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'item_code', 'status'],
    createSchema: zod.bomCreateSchema,
    updateSchema: zod.bomUpdateSchema,
  });

  // Backward compatibility alias for migration
  registerResourceRoutes(r, '/bill_of_materials', {
    subject: 'BillOfMaterial',
    table: 'bill_of_materials',
    columns: ['id', 'item_code', 'bom_version', 'status', 'lines', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['item_code', 'status', 'bom_version'],
    filterColumns: ['item_code', 'status', 'bom_version', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'item_code', 'status'],
    createSchema: zod.bomCreateSchema,
    updateSchema: zod.bomUpdateSchema,
  });

  registerResourceRoutes(r, '/boms', {
    subject: 'BillOfMaterial',
    table: 'bill_of_materials',
    columns: ['id', 'item_code', 'bom_version', 'status', 'lines', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['item_code', 'status', 'bom_version'],
    filterColumns: ['item_code', 'status', 'bom_version', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'item_code', 'status'],
    createSchema: zod.bomCreateSchema,
    updateSchema: zod.bomUpdateSchema,
  });

  // 2. Normalized BOM Lines CRUD
  registerResourceRoutes(r, '/bom-lines', {
    subject: 'BillOfMaterial',
    table: 'bom_lines',
    columns: [
      'id', 'bom_id', 'line_no', 'component_item_code', 'component_item_name',
      'category', 'quantity_per_unit', 'uom', 'scrap_pct', 'is_critical',
      'notes', 'version', 'plant_id', 'created_at', 'updated_at'
    ],
    searchColumns: ['component_item_code', 'component_item_name', 'category'],
    filterColumns: ['bom_id', 'component_item_code', 'category', 'is_critical', 'plant_id'],
    sortAllowlist: ['line_no', 'created_at', 'updated_at', 'component_item_code'],
    createSchema: zod.bomLineCreateSchema,
    updateSchema: zod.bomLineUpdateSchema,
  });

  // 3. Server-Side Recursive BOM Explosion Endpoint
  r.get(
    '/bill-of-materials/:id/explode',
    can('read', 'BillOfMaterial'),
    wrap(async (req, res) => {
      const a = req.actor!;
      const bomId = z.string().trim().min(1).parse(req.params.id);
      const plannedQty = Math.max(1, Number(req.query.qty) || 1);

      const data = await withTx(
        ctx(a),
        async (c) => {
          // 1. Fetch BOM Header
          const bomRes = await c.query(
            `SELECT id, item_code, bom_version, status, lines
               FROM bill_of_materials
              WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
            [bomId, a.tenantId]
          );

          if (!bomRes.rows[0]) {
            throw new AppError(404, 'NOT_FOUND', 'Bill of Materials not found');
          }

          const bom = bomRes.rows[0];

          // 2. Fetch lines: check normalized bom_lines table first
          const linesRes = await c.query(
            `SELECT line_no, component_item_code, component_item_name, category,
                    quantity_per_unit, uom, scrap_pct, is_critical, notes
               FROM bom_lines
              WHERE bom_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
              ORDER BY line_no ASC`,
            [bomId, a.tenantId]
          );

          let rawComponents: any[] = linesRes.rows;

          // Fallback to JSONB lines if bom_lines has not been populated for this record
          if (rawComponents.length === 0 && Array.isArray(bom.lines) && bom.lines.length > 0) {
            rawComponents = bom.lines.map((l: any, idx: number) => ({
              line_no: idx + 1,
              component_item_code: l.component_item_code || l.rawItemCode || l.itemCode || l.item_code,
              component_item_name: l.component_item_name || l.rawItemName || l.itemName || l.name || '',
              category: l.category || 'Raw Material',
              quantity_per_unit: Number(l.quantity_per_unit || l.ratioPerPiece || l.quantity || l.qty || 1),
              uom: l.uom || 'KG',
              scrap_pct: Number(l.scrap_pct || l.scrapPct || 0),
              is_critical: Boolean(l.is_critical || l.isCritical),
            }));
          }

          // 3. Collect component item codes to fetch live stock & cost
          const compCodes = [...new Set(rawComponents.map((c) => c.component_item_code).filter(Boolean))];
          const itemMap = new Map<string, any>();

          if (compCodes.length > 0) {
            const itemsRes = await c.query(
              `SELECT code, name, category, stock, cost, unit
                 FROM items
                WHERE code = ANY($1::text[]) AND tenant_id = $2 AND deleted_at IS NULL`,
              [compCodes, a.tenantId]
            );
            for (const item of itemsRes.rows) {
              itemMap.set(item.code, item);
            }
          }

          // 4. Compute exploded requirements
          const explodedComponents = rawComponents.map((comp) => {
            const liveItem = itemMap.get(comp.component_item_code);
            const qtyPerUnit = Number(comp.quantity_per_unit);
            const scrapFactor = 1 + Number(comp.scrap_pct || 0) / 100;
            const grossRequired = Number((plannedQty * qtyPerUnit * scrapFactor).toFixed(4));
            const currentStock = Number(liveItem?.stock || 0);
            const netNeed = Math.max(0, Number((grossRequired - currentStock).toFixed(4)));
            const unitCost = Number(liveItem?.cost || 0);
            const totalCost = Number((grossRequired * unitCost).toFixed(2));

            return {
              lineNo: comp.line_no,
              componentItemCode: comp.component_item_code,
              componentItemName: liveItem?.name || comp.component_item_name || comp.component_item_code,
              category: liveItem?.category || comp.category || 'Raw Material',
              quantityPerUnit: qtyPerUnit,
              uom: liveItem?.unit || comp.uom || 'KG',
              scrapPct: Number(comp.scrap_pct || 0),
              isCritical: Boolean(comp.is_critical),
              grossRequired,
              currentStock,
              netNeed,
              unitCost,
              totalCost,
              status: netNeed === 0 ? 'Sufficient Buffer' : (currentStock > 0 ? 'Partial Stock' : 'Critical Shortage'),
            };
          });

          return {
            bomId: bom.id,
            parentItemCode: bom.item_code,
            bomVersion: bom.bom_version,
            status: bom.status,
            plannedQty,
            totalEstimatedCost: Number(explodedComponents.reduce((acc, c) => acc + c.totalCost, 0).toFixed(2)),
            components: explodedComponents,
          };
        },
        { readOnly: true }
      );

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json({ data });
    })
  );

  // 4. Release BOM Version (Archives older active versions of same item)
  r.post(
    '/bill-of-materials/:id/release',
    can('update', 'BillOfMaterial'),
    wrap(async (req, res) => {
      const a = req.actor!;
      const bomId = z.string().trim().min(1).parse(req.params.id);

      const out = await withTx(ctx(a), async (c) => {
        // Fetch target BOM
        const targetRes = await c.query(
          `SELECT id, item_code, bom_version, status, version
             FROM bill_of_materials
            WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
             FOR UPDATE`,
          [bomId, a.tenantId]
        );

        if (!targetRes.rows[0]) {
          throw new AppError(404, 'NOT_FOUND', 'Bill of Materials not found');
        }

        const bom = targetRes.rows[0];

        // Archive previously released BOMs for the same parent item
        await c.query(
          `UPDATE bill_of_materials
              SET status = 'archived', updated_at = now()
            WHERE tenant_id = $1 AND item_code = $2 AND status = 'released' AND id != $3`,
          [a.tenantId, bom.item_code, bomId]
        );

        // Release the selected BOM
        const updatedRes = await c.query(
          `UPDATE bill_of_materials
              SET status = 'released', updated_at = now(), version = version + 1
            WHERE id = $1 AND tenant_id = $2
            RETURNING id, item_code, bom_version, status, version, updated_at`,
          [bomId, a.tenantId]
        );

        const updated = updatedRes.rows[0];

        await writeAudit(c, {
          tenantId: a.tenantId,
          entityType: 'BillOfMaterial',
          entityId: bomId,
          action: 'RELEASE',
          oldValues: { status: bom.status },
          newValues: { status: 'released' },
          performedBy: a.userId,
        });

        return updated;
      });

      res.setHeader('X-Invalidate', 'bill_of_materials');
      res.json({ data: out });
    })
  );
}
