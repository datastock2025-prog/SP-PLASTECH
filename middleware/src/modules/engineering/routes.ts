import { z } from 'zod';
import { and, asc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { withDrizzleTx } from '../../db.js';
import { AppError, can, wrap } from '../../middleware.js';
import { registerResourceRoutes } from '../../core/resource.js';
import { ctx } from '../../core/query.js';
import { writeAudit } from '../../core/audit.js';
import { patchRow, type ScopedTable } from '../../core/query.js';
import { billOfMaterials, bomLines, items } from '../../schema/erp.js';
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

      const data = await withDrizzleTx(
        ctx(a),
        async (db) => {
          // 1. Fetch BOM Header
          const [bom] = await db
            .select({
              id: billOfMaterials.id,
              item_code: billOfMaterials.itemCode,
              bom_version: billOfMaterials.bomVersion,
              status: billOfMaterials.status,
              lines: billOfMaterials.lines,
            })
            .from(billOfMaterials)
            .where(
              and(
                eq(billOfMaterials.id, bomId),
                eq(billOfMaterials.tenantId, a.tenantId),
                isNull(billOfMaterials.deletedAt)
              )
            );

          if (!bom) {
            throw new AppError(404, 'NOT_FOUND', 'Bill of Materials not found');
          }

          // 2. Fetch lines: check normalized bom_lines table first
          let rawComponents: any[] = await db
            .select({
              line_no: bomLines.lineNo,
              component_item_code: bomLines.componentItemCode,
              component_item_name: bomLines.componentItemName,
              category: bomLines.category,
              quantity_per_unit: bomLines.quantityPerUnit,
              uom: bomLines.uom,
              scrap_pct: bomLines.scrapPct,
              is_critical: bomLines.isCritical,
              notes: bomLines.notes,
            })
            .from(bomLines)
            .where(
              and(
                eq(bomLines.bomId, bomId),
                eq(bomLines.tenantId, a.tenantId),
                isNull(bomLines.deletedAt)
              )
            )
            .orderBy(asc(bomLines.lineNo));

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
            const itemsList = await db
              .select({
                code: items.code,
                name: items.name,
                category: items.category,
                stock: items.stock,
                cost: items.cost,
                unit: items.unit,
              })
              .from(items)
              .where(
                and(
                  inArray(items.code, compCodes),
                  eq(items.tenantId, a.tenantId),
                  isNull(items.deletedAt)
                )
              );
            for (const item of itemsList) {
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

      const out = await withDrizzleTx(ctx(a), async (db, c) => {
        // Fetch target BOM
        const [bom] = await db
          .select({
            id: billOfMaterials.id,
            item_code: billOfMaterials.itemCode,
            bom_version: billOfMaterials.bomVersion,
            status: billOfMaterials.status,
            version: billOfMaterials.version,
          })
          .from(billOfMaterials)
          .where(
            and(
              eq(billOfMaterials.id, bomId),
              eq(billOfMaterials.tenantId, a.tenantId),
              isNull(billOfMaterials.deletedAt)
            )
          )
          .for('update');

        if (!bom) {
          throw new AppError(404, 'NOT_FOUND', 'Bill of Materials not found');
        }

        // Archive previously released BOMs for the same parent item
        await db
          .update(billOfMaterials)
          .set({ status: 'archived', updatedAt: new Date() })
          .where(
            and(
              eq(billOfMaterials.tenantId, a.tenantId),
              eq(billOfMaterials.itemCode, bom.item_code),
              eq(billOfMaterials.status, 'released'),
              ne(billOfMaterials.id, bomId)
            )
          );

        // Release the selected BOM
        const updated = await patchRow(
          db,
          billOfMaterials as ScopedTable,
          a,
          bomId,
          { status: 'released' },
          ['id', 'item_code', 'bom_version', 'status', 'version', 'updated_at']
        );

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
