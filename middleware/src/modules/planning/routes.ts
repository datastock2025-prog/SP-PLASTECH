import crypto from 'node:crypto';
import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';
import { withTx } from '../../db.js';
import { can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';

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

    const result = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      // 1. Fetch sales orders to plan
      let soQuery = `SELECT id, so_number, items, plant_id FROM sales_orders WHERE status IN ('confirmed', 'open') AND tenant_id = $1 AND deleted_at IS NULL`;
      const soParams: any[] = [a.tenantId];
      if (specificSoIds && specificSoIds.length > 0) {
        soQuery += ` AND id = ANY($2)`;
        soParams.push(specificSoIds);
      }
      const { rows: soRows } = await c.query(soQuery, soParams);

      // 2. Fetch sales order lines if available
      let solQuery = `SELECT so_id, item_code, item_name, quantity, dispatched_qty FROM sales_order_lines WHERE tenant_id = $1 AND deleted_at IS NULL`;
      const solParams: any[] = [a.tenantId];
      if (specificSoIds && specificSoIds.length > 0) {
        solQuery += ` AND so_id = ANY($2)`;
        solParams.push(specificSoIds);
      }
      const { rows: solRows } = await c.query(solQuery, solParams);

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
          const items = Array.isArray(so.items) ? so.items : [];
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
        const { rows: bomLineRows } = await c.query(
          `SELECT b.item_code as parent_code, bl.component_item_code, bl.component_item_name, bl.quantity_per_unit, bl.uom, bl.scrap_pct
             FROM bill_of_materials b
             JOIN bom_lines bl ON bl.bom_id = b.id
            WHERE b.item_code = ANY($1) AND b.tenant_id = $2 AND b.deleted_at IS NULL AND bl.deleted_at IS NULL`,
          [fgCodes, a.tenantId]
        );

        const foundParents = new Set(bomLineRows.map((r: any) => r.parent_code));
        const missingParents = fgCodes.filter((code) => !foundParents.has(code));
        let bomJsonRows: any[] = [];
        if (missingParents.length > 0) {
          const res = await c.query(
            `SELECT item_code, lines FROM bill_of_materials WHERE item_code = ANY($1) AND tenant_id = $2 AND deleted_at IS NULL`,
            [missingParents, a.tenantId]
          );
          bomJsonRows = res.rows;
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
          const lines = Array.isArray(r.lines) ? r.lines : [];
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
      let stockRows: any[] = [];
      let itemRows: any[] = [];
      if (rmCodes.length > 0) {
        const sRes = await c.query(
          `SELECT sku, name, total_on_hand, available_to_promise, uom, unit_cost_inr FROM warehouse_stock WHERE sku = ANY($1) AND tenant_id = $2 AND deleted_at IS NULL`,
          [rmCodes, a.tenantId]
        );
        stockRows = sRes.rows;

        const iRes = await c.query(
          `SELECT code, name, stock, unit, cost FROM items WHERE code = ANY($1) AND tenant_id = $2 AND deleted_at IS NULL`,
          [rmCodes, a.tenantId]
        );
        itemRows = iRes.rows;
      }

      const stockMap = new Map(stockRows.map((r: any) => [r.sku, r]));
      const itemMap = new Map(itemRows.map((r: any) => [r.code, r]));

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

        const { rows } = await c.query(
          `INSERT INTO purchase_requisitions (
            id, pr_number, department, priority, status, lines, total_estimated_amount,
            notes, tenant_id, created_by, updated_by
          ) VALUES ($1, $2, 'Materials Planning', 'Normal', 'draft', $3, $4, $5, $6, $7, $7)
          RETURNING id`,
          [
            prId,
            prNumber,
            JSON.stringify([line]),
            totalEstAmount,
            `Auto-generated via MRP Calculation for ${pr.item_code}`,
            a.tenantId,
            a.userId
          ]
        );
        generatedPrIds.push(rows[0].id);
      }

      // 6. Record MRP Run
      const runNumber = 'MRP-' + Math.floor(100000 + Math.random() * 900000);
      const mrpId = crypto.randomUUID();
      const insertRunRes = await c.query(
        `INSERT INTO mrp_runs (
          id, tenant_id, plant_id, run_number, status, total_so_processed,
          total_items_planned, total_prs_generated, generated_pr_ids,
          gross_requirements, net_requirements, executed_at, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, 'COMPLETED', $5, $6, $7, $8, $9, $10, now(), $11, $11)
        RETURNING *`,
        [
          mrpId,
          a.tenantId,
          a.activePlantId || null,
          runNumber,
          soRows.length,
          grossRequirements.length,
          generatedPrIds.length,
          JSON.stringify(generatedPrIds),
          JSON.stringify(grossRequirements),
          JSON.stringify(netRequirements),
          a.userId
        ]
      );

      return insertRunRes.rows[0];
    });

    res.json({ data: result });
  };

  r.post('/mrp/runs', can('read', 'WorkOrder'), wrap(executeMrp));
  r.post('/mrp-runs/execute', can('read', 'WorkOrder'), wrap(executeMrp));
  r.post('/mrp_runs/execute', can('read', 'WorkOrder'), wrap(executeMrp));
}
