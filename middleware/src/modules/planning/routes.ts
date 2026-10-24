import crypto from 'node:crypto';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { registerResourceRoutes } from '../../core/resource.js';
import * as zod from '../../schema/zod.js';
import { withDrizzleTx } from '../../db.js';
import { can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import {
  salesOrders,
  salesOrderLines,
  billOfMaterials,
  bomLines,
  warehouseStock,
  items,
  purchaseRequisitions,
  mrpRuns,
} from '../../schema/erp.js';

export function planningRoutes(r: any) {
  const mrpRunConfig = {
    subject: 'WorkOrder' as const,
    table: 'mrp_runs',
    columns: [
      'id', 'tenant_id', 'plant_id', 'run_number', 'status',
      'total_so_processed', 'total_items_planned', 'total_prs_generated',
      'generated_pr_ids', 'gross_requirements', 'net_requirements',
      'executed_at', 'version', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['run_number', 'status'],
    sortAllowlist: ['created_at', 'updated_at', 'executed_at', 'run_number'],
    createSchema: zod.mrpRunCreateSchema,
    updateSchema: zod.mrpRunUpdateSchema,
  };
  registerResourceRoutes(r, '/mrp-runs', mrpRunConfig);
  registerResourceRoutes(r, '/mrp_runs', mrpRunConfig);

  const executeMrp = async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const body = req.body || {};
    const specificSoIds: string[] | undefined = Array.isArray(body.so_ids || body.soIds) ? (body.so_ids || body.soIds) : undefined;

    const result = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (tx) => {
      // 1. Fetch sales orders to plan
      const soConditions = [
        inArray(salesOrders.status, ['confirmed', 'open']),
        isNull(salesOrders.deletedAt),
      ];
      if (specificSoIds && specificSoIds.length > 0) {
        soConditions.push(inArray(salesOrders.id, specificSoIds));
      }
      const soRows = await tx
        .select({
          id: salesOrders.id,
          so_number: salesOrders.soNumber,
          items: salesOrders.items,
          plant_id: salesOrders.plantId,
        })
        .from(salesOrders)
        .where(and(...soConditions));

      // 2. Fetch sales order lines if available
      const solConditions = [isNull(salesOrderLines.deletedAt)];
      if (specificSoIds && specificSoIds.length > 0) {
        solConditions.push(inArray(salesOrderLines.soId, specificSoIds));
      }
      const solRows = await tx
        .select({
          so_id: salesOrderLines.soId,
          item_code: salesOrderLines.itemCode,
          item_name: salesOrderLines.itemName,
          quantity: salesOrderLines.quantity,
          dispatched_qty: salesOrderLines.dispatchedQty,
        })
        .from(salesOrderLines)
        .where(and(...solConditions));

      // Build demand map for finished goods: { [item_code]: { qty, itemName } }
      const fgDemand: Record<string, { qty: number; itemName: string }> = {};

      if (solRows.length > 0) {
        for (const line of solRows) {
          const rem = Math.max(0, Number(line.quantity) - Number(line.dispatched_qty || 0));
          if (rem <= 0) continue;
          if (!fgDemand[line.item_code]) {
            fgDemand[line.item_code] = { qty: 0, itemName: line.item_name || line.item_code };
          }
          fgDemand[line.item_code].qty += rem;
        }
      } else {
        // Fallback to SO items jsonb
        for (const so of soRows) {
          const items = Array.isArray(so.items) ? (so.items as any[]) : [];
          for (const it of items) {
            const itemCode = it.item_code || it.itemCode || it.sku;
            const qty = Number(it.quantity || it.qty || 0);
            if (!itemCode || qty <= 0) continue;
            if (!fgDemand[itemCode]) {
              fgDemand[itemCode] = { qty: 0, itemName: it.item_name || it.itemName || it.name || itemCode };
            }
            fgDemand[itemCode].qty += qty;
          }
        }
      }

      // If specific items requested in body
      if (Array.isArray(body.items)) {
        for (const it of body.items) {
          const itemCode = it.item_code || it.itemCode || it.sku;
          const qty = Number(it.quantity || it.qty || 0);
          if (!itemCode || qty <= 0) continue;
          if (!fgDemand[itemCode]) {
            fgDemand[itemCode] = { qty: 0, itemName: it.item_name || it.itemName || it.name || itemCode };
          }
          fgDemand[itemCode].qty += qty;
        }
      }

      // 3. Multi-level / Single-level BOM traversal for each required finished good
      const grossMap: Record<string, { item_code: string; item_name: string; uom: string; gross_qty: number }> = {};

      const fgCodes = Object.keys(fgDemand);
      if (fgCodes.length > 0) {
        const bomLineRows = await tx
          .select({
            parent_code: billOfMaterials.itemCode,
            component_item_code: bomLines.componentItemCode,
            component_item_name: bomLines.componentItemName,
            quantity_per_unit: bomLines.quantityPerUnit,
            uom: bomLines.uom,
            scrap_pct: bomLines.scrapPct,
          })
          .from(billOfMaterials)
          .innerJoin(bomLines, eq(bomLines.bomId, billOfMaterials.id))
          .where(
            and(
              inArray(billOfMaterials.itemCode, fgCodes),
              isNull(billOfMaterials.deletedAt),
              isNull(bomLines.deletedAt)
            )
          );

        const foundParents = new Set(bomLineRows.map((r) => r.parent_code));
        const missingParents = fgCodes.filter((code) => !foundParents.has(code));
        let bomJsonRows: { item_code: string; lines: unknown }[] = [];
        if (missingParents.length > 0) {
          bomJsonRows = await tx
            .select({
              item_code: billOfMaterials.itemCode,
              lines: billOfMaterials.lines,
            })
            .from(billOfMaterials)
            .where(
              and(
                inArray(billOfMaterials.itemCode, missingParents),
                isNull(billOfMaterials.deletedAt)
              )
            );
        }

        for (const r of bomLineRows) {
          const demand = fgDemand[r.parent_code]?.qty || 0;
          const scrap = 1 + Number(r.scrap_pct || 0) / 100;
          const needed = demand * Number(r.quantity_per_unit) * scrap;
          const code = r.component_item_code;
          if (!grossMap[code]) {
            grossMap[code] = {
              item_code: code,
              item_name: r.component_item_name || code,
              uom: r.uom || 'KG',
              gross_qty: 0,
            };
          }
          grossMap[code].gross_qty += needed;
        }

        for (const r of bomJsonRows) {
          const demand = fgDemand[r.item_code]?.qty || 0;
          const lines = Array.isArray(r.lines) ? (r.lines as any[]) : [];
          for (const l of lines) {
            const compCode = l.component_item_code || l.componentItemCode || l.item_code || l.itemCode;
            const qpu = Number(l.quantity_per_unit || l.quantityPerUnit || l.quantity || 1);
            const scrap = 1 + Number(l.scrap_pct || l.scrapPct || 0) / 100;
            const needed = demand * qpu * scrap;
            if (!compCode) continue;
            if (!grossMap[compCode]) {
              grossMap[compCode] = {
                item_code: compCode,
                item_name: l.component_item_name || l.componentItemName || compCode,
                uom: l.uom || 'KG',
                gross_qty: 0,
              };
            }
            grossMap[compCode].gross_qty += needed;
          }
        }
      }

      // If no BOM was configured for an item, treat demand itself as gross requirement
      for (const [code, d] of Object.entries(fgDemand)) {
        if (!grossMap[code] && Object.keys(grossMap).length === 0) {
          grossMap[code] = {
            item_code: code,
            item_name: d.itemName,
            uom: 'PCS',
            gross_qty: d.qty,
          };
        }
      }

      const grossRequirements = Object.values(grossMap);
      const rmCodes = grossRequirements.map((g) => g.item_code);

      // 4. Netting against warehouse_stock and items master
      let stockRows: {
        sku: string;
        name: string | null;
        total_on_hand: string | null;
        available_to_promise: string | null;
        uom: string;
        unit_cost_inr: string | null;
      }[] = [];
      let itemRows: {
        code: string;
        name: string;
        stock: string | null;
        unit: string | null;
        cost: string | null;
      }[] = [];

      if (rmCodes.length > 0) {
        stockRows = await tx
          .select({
            sku: warehouseStock.sku,
            name: warehouseStock.name,
            total_on_hand: warehouseStock.totalOnHand,
            available_to_promise: warehouseStock.availableToPromise,
            uom: warehouseStock.uom,
            unit_cost_inr: warehouseStock.unitCostInr,
          })
          .from(warehouseStock)
          .where(and(inArray(warehouseStock.sku, rmCodes), isNull(warehouseStock.deletedAt)));

        itemRows = await tx
          .select({
            code: items.code,
            name: items.name,
            stock: items.stock,
            unit: items.unit,
            cost: items.cost,
          })
          .from(items)
          .where(and(inArray(items.code, rmCodes), isNull(items.deletedAt)));
      }

      const stockMap = new Map(stockRows.map((r) => [r.sku, r]));
      const itemMap = new Map(itemRows.map((r) => [r.code, r]));

      const netRequirements: any[] = [];
      const prsToCreate: any[] = [];

      for (const g of grossRequirements) {
        const s = stockMap.get(g.item_code);
        const it = itemMap.get(g.item_code);
        const onHand = Number(s?.available_to_promise ?? s?.total_on_hand ?? it?.stock ?? 0);
        const unitCost = Number(s?.unit_cost_inr ?? it?.cost ?? 100);
        const netDeficit = Math.max(0, Number(g.gross_qty) - onHand);

        netRequirements.push({
          item_code: g.item_code,
          item_name: g.item_name,
          uom: g.uom,
          gross_qty: Number(g.gross_qty.toFixed(2)),
          on_hand: Number(onHand.toFixed(2)),
          net_deficit: Number(netDeficit.toFixed(2)),
          unit_cost: unitCost,
        });

        if (netDeficit > 0) {
          prsToCreate.push({
            item_code: g.item_code,
            item_name: g.item_name,
            uom: g.uom,
            deficit: Number(netDeficit.toFixed(2)),
            unit_cost: unitCost,
          });
        }
      }

      // 5. Generate automated Draft Purchase Requisitions for deficits
      const generatedPrIds: string[] = [];
      for (const pr of prsToCreate) {
        const prId = 'PR-' + crypto.randomUUID().slice(0, 8);
        const prNumber = 'PR-' + Math.floor(100000 + Math.random() * 900000);
        const totalEstAmount = pr.deficit * pr.unit_cost;
        const line = {
          line_no: 1,
          item_code: pr.item_code,
          item_name: pr.item_name,
          quantity: pr.deficit,
          uom: pr.uom,
          estimated_unit_cost: pr.unit_cost,
          total_estimated_cost: totalEstAmount,
        };

        const [insertedPr] = await tx
          .insert(purchaseRequisitions)
          .values({
            id: prId,
            prNumber: prNumber,
            department: 'Materials Planning',
            priority: 'Normal',
            status: 'draft',
            lines: [line],
            totalEstimatedAmount: String(totalEstAmount),
            notes: `Auto-generated via MRP Calculation for ${pr.item_code}`,
            tenantId: a.tenantId,
            createdBy: a.userId,
            updatedBy: a.userId,
          })
          .returning({ id: purchaseRequisitions.id });
        generatedPrIds.push(insertedPr.id);
      }

      // 6. Record MRP Run
      const runNumber = 'MRP-' + Math.floor(100000 + Math.random() * 900000);
      const mrpId = crypto.randomUUID();
      const [insertRunRes] = await tx
        .insert(mrpRuns)
        .values({
          id: mrpId,
          tenantId: a.tenantId,
          plantId: a.activePlantId || null,
          runNumber: runNumber,
          status: 'COMPLETED',
          totalSoProcessed: soRows.length,
          totalItemsPlanned: grossRequirements.length,
          totalPrsGenerated: generatedPrIds.length,
          generatedPrIds: generatedPrIds,
          grossRequirements: grossRequirements,
          netRequirements: netRequirements,
          executedAt: new Date(),
          createdBy: a.userId,
          updatedBy: a.userId,
        })
        .returning();

      return insertRunRes;
    });

    res.json({ data: result });
  };

  r.post('/mrp/runs', can('read', 'WorkOrder'), wrap(executeMrp));
  r.post('/mrp-runs/execute', can('read', 'WorkOrder'), wrap(executeMrp));
  r.post('/mrp_runs/execute', can('read', 'WorkOrder'), wrap(executeMrp));
}
