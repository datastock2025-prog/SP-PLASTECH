import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';
import { withTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import { writeAudit } from '../../userStore.js';

export function financeRoutes(r: any) {
  // 1. Chart of Accounts (GL Accounts)
  const glAccountConfig = {
    subject: 'Finance' as const,
    table: 'gl_accounts',
    columns: [
      'id', 'tenant_id', 'plant_id', 'account_code', 'account_name', 'account_type',
      'account_group', 'parent_account_id', 'is_postable', 'is_active', 'currency',
      'opening_balance', 'current_balance', 'version', 'created_by', 'updated_by',
      'created_at', 'updated_at'
    ],
    searchColumns: ['account_code', 'account_name', 'account_type', 'account_group'],
    filterColumns: ['account_code', 'account_name', 'account_type', 'account_group', 'is_active', 'is_postable', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'account_code', 'account_name', 'current_balance'],
    createSchema: zod.glAccountCreateSchema,
    updateSchema: zod.glAccountUpdateSchema,
  };

  registerResourceRoutes(r, '/gl-accounts', glAccountConfig);
  registerResourceRoutes(r, '/gl_accounts', glAccountConfig);
  registerResourceRoutes(r, '/accounts', glAccountConfig);
  registerResourceRoutes(r, '/coa', glAccountConfig);
  registerResourceRoutes(r, '/finance/coa', glAccountConfig);

  // 2. Journal Entries (General Ledger Header)
  const journalEntryConfig = {
    subject: 'Finance' as const,
    table: 'journal_entries',
    columns: [
      'id', 'tenant_id', 'plant_id', 'je_number', 'je_date', 'period', 'fiscal_year',
      'je_type', 'status', 'reference_type', 'reference_id', 'reference_number',
      'description', 'total_debit', 'total_credit', 'lines', 'version',
      'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['je_number', 'status', 'je_type', 'description', 'reference_number'],
    filterColumns: ['je_number', 'status', 'je_type', 'fiscal_year', 'period', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'je_number', 'je_date', 'total_debit'],
    createSchema: zod.journalEntryCreateSchema,
    updateSchema: zod.journalEntryUpdateSchema,
  };

  registerResourceRoutes(r, '/journal-entries', journalEntryConfig);
  registerResourceRoutes(r, '/journal_entries', journalEntryConfig);
  registerResourceRoutes(r, '/finance/journal-entries', journalEntryConfig);

  // 3. Journal Lines (Double-Entry Debit & Credit Items)
  const journalLineConfig = {
    subject: 'Finance' as const,
    table: 'journal_lines',
    columns: [
      'id', 'tenant_id', 'plant_id', 'je_id', 'line_no', 'account_id', 'account_code',
      'account_name', 'debit_amount', 'credit_amount', 'description', 'version',
      'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['account_code', 'account_name', 'description'],
    filterColumns: ['je_id', 'account_id', 'account_code', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'line_no', 'debit_amount', 'credit_amount'],
    createSchema: zod.journalLineCreateSchema,
    updateSchema: zod.journalLineUpdateSchema,
  };

  registerResourceRoutes(r, '/journal-lines', journalLineConfig);
  registerResourceRoutes(r, '/journal_lines', journalLineConfig);
  registerResourceRoutes(r, '/finance/journal-lines', journalLineConfig);

  // 4. Accounts Payable Invoices (3-Way Match AP Invoices)
  const apInvoiceConfig = {
    subject: 'Finance' as const,
    table: 'ap_invoices',
    columns: [
      'id', 'tenant_id', 'plant_id', 'invoice_number', 'supplier_id', 'po_id', 'grn_id',
      'invoice_date', 'due_date', 'total_amount', 'tax_amount', 'status', 'match_status',
      'match_notes', 'lines', 'version', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['invoice_number', 'supplier_id', 'po_id', 'grn_id', 'status', 'match_status'],
    filterColumns: ['invoice_number', 'supplier_id', 'po_id', 'grn_id', 'status', 'match_status', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'invoice_number', 'invoice_date', 'due_date', 'total_amount'],
    createSchema: zod.apInvoiceCreateSchema,
    updateSchema: zod.apInvoiceUpdateSchema,
  };

  registerResourceRoutes(r, '/ap-invoices', apInvoiceConfig);
  registerResourceRoutes(r, '/ap_invoices', apInvoiceConfig);
  registerResourceRoutes(r, '/ap', apInvoiceConfig);
  registerResourceRoutes(r, '/finance/ap', apInvoiceConfig);

  // Helper to ensure standard default GL accounts exist for a tenant
  async function ensureDefaultAccount(c: any, tenantId: string, plantId: string | null, code: string, name: string, type: string) {
    const { rows } = await c.query(
      `SELECT id, account_code, account_type, current_balance FROM gl_accounts WHERE account_code = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [code, tenantId]
    );
    if (rows[0]) return rows[0];

    const ins = await c.query(
      `INSERT INTO gl_accounts (tenant_id, plant_id, account_code, account_name, account_type, is_postable, is_active, currency, opening_balance, current_balance, version)
       VALUES ($1, $2, $3, $4, $5, true, true, 'INR', 0, 0, 1)
       RETURNING id, account_code, account_type, current_balance`,
      [tenantId, plantId, code, name, type]
    );
    return ins.rows[0];
  }

  // --------------------------------------------------------------------------
  // Custom Action: Post Journal Entry (Double-Entry Balance Validation & GL Posting)
  // --------------------------------------------------------------------------
  const handlePostJournalEntry = async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = req.params.id;

    const posted = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      // 1. Fetch Journal Entry with FOR UPDATE
      const { rows: jeRows } = await c.query(
        `SELECT id, je_number, je_date, period, fiscal_year, je_type, status, reference_type,
                reference_id, reference_number, description, total_debit, total_credit, lines,
                plant_id, version
           FROM journal_entries
          WHERE (id::text = $1 OR je_number = $1) AND tenant_id = $2 AND deleted_at IS NULL
          FOR UPDATE`,
        [id, a.tenantId]
      );
      const je = jeRows[0];
      if (!je) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');

      if (je.status === 'POSTED') {
        return je;
      }

      // 2. Load lines from journal_lines table or lines JSONB column
      const { rows: dbLines } = await c.query(
        `SELECT id, line_no, account_id, account_code, account_name, debit_amount, credit_amount, description
           FROM journal_lines
          WHERE je_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
          ORDER BY line_no ASC`,
        [je.id, a.tenantId]
      );

      let linesToProcess = dbLines;
      if (linesToProcess.length === 0 && Array.isArray(je.lines) && je.lines.length > 0) {
        // Persist JSONB lines into journal_lines table
        for (let i = 0; i < je.lines.length; i++) {
          const l = je.lines[i];
          const lineNo = l.line_no ?? l.lineNo ?? (i + 1);
          const accCode = String(l.account_code ?? l.accountCode ?? '').trim();
          const accName = l.account_name ?? l.accountName ?? null;
          const accId = l.account_id ?? l.accountId ?? null;
          const dr = parseFloat(String(l.debit_amount ?? l.debitAmount ?? l.debit ?? 0));
          const cr = parseFloat(String(l.credit_amount ?? l.creditAmount ?? l.credit ?? 0));
          const desc = l.description ?? null;

          const insLine = await c.query(
            `INSERT INTO journal_lines (tenant_id, plant_id, je_id, line_no, account_id, account_code, account_name, debit_amount, credit_amount, description, version)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
             RETURNING id, line_no, account_id, account_code, account_name, debit_amount, credit_amount, description`,
            [a.tenantId, je.plant_id, je.id, lineNo, accId, accCode, accName, dr, cr, desc]
          );
          linesToProcess.push(insLine.rows[0]);
        }
      }

      if (linesToProcess.length === 0) {
        throw new AppError(422, 'UNBALANCED_JOURNAL_ENTRY', 'Journal entry must contain at least two balanced lines');
      }

      // 3. Calculate and Validate Debit === Credit
      let totalDebit = 0;
      let totalCredit = 0;
      for (const line of linesToProcess) {
        const dr = parseFloat(String(line.debit_amount ?? 0));
        const cr = parseFloat(String(line.credit_amount ?? 0));
        totalDebit += dr;
        totalCredit += cr;
      }

      totalDebit = Math.round(totalDebit * 100) / 100;
      totalCredit = Math.round(totalCredit * 100) / 100;

      if (totalDebit <= 0 || totalCredit <= 0 || Math.abs(totalDebit - totalCredit) > 0.009) {
        throw new AppError(
          422,
          'UNBALANCED_JOURNAL_ENTRY',
          `Unbalanced journal entry: Total Debit (${totalDebit.toFixed(2)}) must equal Total Credit (${totalCredit.toFixed(2)}) and be greater than zero.`
        );
      }

      // 4. Update GL Account balances
      for (const line of linesToProcess) {
        const accCode = line.account_code;
        const accId = line.account_id;
        const dr = parseFloat(String(line.debit_amount ?? 0));
        const cr = parseFloat(String(line.credit_amount ?? 0));

        let accRow: any = null;
        if (accId) {
          const { rows } = await c.query(
            `SELECT id, account_code, account_type, current_balance FROM gl_accounts WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL FOR UPDATE`,
            [accId, a.tenantId]
          );
          accRow = rows[0];
        }
        if (!accRow && accCode) {
          const { rows } = await c.query(
            `SELECT id, account_code, account_type, current_balance FROM gl_accounts WHERE account_code = $1 AND tenant_id = $2 AND deleted_at IS NULL FOR UPDATE`,
            [accCode, a.tenantId]
          );
          accRow = rows[0];
        }

        if (accRow) {
          const accType = String(accRow.account_type || '').toUpperCase();
          // Asset and Expense accounts increase with Debit, decrease with Credit.
          // Liability, Equity, and Revenue accounts increase with Credit, decrease with Debit.
          const isDebitNormal = accType === 'ASSET' || accType === 'EXPENSE' || accType === 'CONTRA_LIABILITY';
          const balanceDelta = isDebitNormal ? (dr - cr) : (cr - dr);

          await c.query(
            `UPDATE gl_accounts
                SET current_balance = current_balance + $1,
                    updated_at = now(),
                    version = version + 1
              WHERE id = $2 AND tenant_id = $3`,
            [balanceDelta, accRow.id, a.tenantId]
          );
        }
      }

      // 5. Update Journal Entry Status to POSTED
      const { rows: updatedJeRows } = await c.query(
        `UPDATE journal_entries
            SET status = 'POSTED',
                total_debit = $1,
                total_credit = $2,
                version = version + 1,
                updated_at = now(),
                updated_by = $3
          WHERE id = $4 AND tenant_id = $5
          RETURNING id, je_number, je_date, period, fiscal_year, je_type, status, reference_type,
                    reference_id, reference_number, description, total_debit, total_credit, lines,
                    plant_id, version, created_at, updated_at`,
        [totalDebit, totalCredit, a.userId, je.id, a.tenantId]
      );

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'journal_entries',
        entityId: String(je.id),
        action: 'APPROVE',
        performedBy: a.userId,
        newValues: updatedJeRows[0],
        ip: a.ip,
      });

      return updatedJeRows[0];
    });

    res.json({ data: posted });
  };

  r.post('/journal-entries/:id/post', can('update', 'Finance'), wrap(handlePostJournalEntry));
  r.post('/journal_entries/:id/post', can('update', 'Finance'), wrap(handlePostJournalEntry));
  r.post('/finance/journal-entries/:id/post', can('update', 'Finance'), wrap(handlePostJournalEntry));

  // --------------------------------------------------------------------------
  // Custom Action: Reverse Journal Entry
  // --------------------------------------------------------------------------
  const handleReverseJournalEntry = async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = req.params.id;

    const reversed = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      const { rows: jeRows } = await c.query(
        `SELECT id, je_number, status, lines, plant_id, version
           FROM journal_entries
          WHERE (id::text = $1 OR je_number = $1) AND tenant_id = $2 AND deleted_at IS NULL
          FOR UPDATE`,
        [id, a.tenantId]
      );
      const je = jeRows[0];
      if (!je) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
      if (je.status !== 'POSTED') {
        throw new AppError(400, 'INVALID_STATUS', 'Only POSTED journal entries can be reversed');
      }

      const { rows: lines } = await c.query(
        `SELECT id, account_id, account_code, debit_amount, credit_amount
           FROM journal_lines
          WHERE je_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [je.id, a.tenantId]
      );

      // Revert account balances
      for (const line of lines) {
        const accCode = line.account_code;
        const accId = line.account_id;
        const dr = parseFloat(String(line.debit_amount ?? 0));
        const cr = parseFloat(String(line.credit_amount ?? 0));

        let accRow: any = null;
        if (accId) {
          const { rows } = await c.query(
            `SELECT id, account_code, account_type FROM gl_accounts WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL FOR UPDATE`,
            [accId, a.tenantId]
          );
          accRow = rows[0];
        }
        if (!accRow && accCode) {
          const { rows } = await c.query(
            `SELECT id, account_code, account_type FROM gl_accounts WHERE account_code = $1 AND tenant_id = $2 AND deleted_at IS NULL FOR UPDATE`,
            [accCode, a.tenantId]
          );
          accRow = rows[0];
        }

        if (accRow) {
          const accType = String(accRow.account_type || '').toUpperCase();
          const isDebitNormal = accType === 'ASSET' || accType === 'EXPENSE' || accType === 'CONTRA_LIABILITY';
          const balanceDelta = isDebitNormal ? (dr - cr) : (cr - dr);

          // Reverse: subtract the original delta
          await c.query(
            `UPDATE gl_accounts
                SET current_balance = current_balance - $1,
                    updated_at = now(),
                    version = version + 1
              WHERE id = $2 AND tenant_id = $3`,
            [balanceDelta, accRow.id, a.tenantId]
          );
        }
      }

      const { rows: updatedRows } = await c.query(
        `UPDATE journal_entries
            SET status = 'REVERSED',
                version = version + 1,
                updated_at = now(),
                updated_by = $1
          WHERE id = $2 AND tenant_id = $3
          RETURNING *`,
        [a.userId, je.id, a.tenantId]
      );

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'journal_entries',
        entityId: String(je.id),
        action: 'UPDATE',
        performedBy: a.userId,
        newValues: updatedRows[0],
        ip: a.ip,
      });

      return updatedRows[0];
    });

    res.json({ data: reversed });
  };

  r.post('/journal-entries/:id/reverse', can('update', 'Finance'), wrap(handleReverseJournalEntry));
  r.post('/journal_entries/:id/reverse', can('update', 'Finance'), wrap(handleReverseJournalEntry));
  r.post('/finance/journal-entries/:id/reverse', can('update', 'Finance'), wrap(handleReverseJournalEntry));

  // --------------------------------------------------------------------------
  // Custom Action: 3-Way Match AP Invoice (Invoice vs PO vs GRN)
  // --------------------------------------------------------------------------
  const handleMatchApInvoice = async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = req.params.id;

    const matched = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      const { rows: invRows } = await c.query(
        `SELECT id, invoice_number, supplier_id, po_id, grn_id, invoice_date, total_amount,
                tax_amount, status, match_status, match_notes, lines, plant_id, version
           FROM ap_invoices
          WHERE (id::text = $1 OR invoice_number = $1) AND tenant_id = $2 AND deleted_at IS NULL
          FOR UPDATE`,
        [id, a.tenantId]
      );
      const inv = invRows[0];
      if (!inv) throw new AppError(404, 'NOT_FOUND', 'AP invoice not found');

      // Fetch linked PO
      let po: any = null;
      if (inv.po_id) {
        const { rows: poRows } = await c.query(
          `SELECT id, po_number, total_amount, items FROM purchase_orders
            WHERE (id::text = $1 OR po_number = $1) AND tenant_id = $2 AND deleted_at IS NULL`,
          [inv.po_id, a.tenantId]
        );
        po = poRows[0];
      }

      // Fetch linked GRN
      let grn: any = null;
      if (inv.grn_id) {
        const { rows: grnRows } = await c.query(
          `SELECT id, grn_number, total_amount, lines FROM goods_receipt_notes
            WHERE (id::text = $1 OR grn_number = $1) AND tenant_id = $2 AND deleted_at IS NULL`,
          [inv.grn_id, a.tenantId]
        );
        grn = grnRows[0];
      }

      let matchStatus = 'MATCHED';
      const notes: string[] = [];

      if (!po && !grn) {
        matchStatus = 'UNMATCHED';
        notes.push('No linked PO or GRN found for 3-way matching.');
      } else {
        const invLines = Array.isArray(inv.lines) ? inv.lines : [];
        const poItems = po && Array.isArray(po.items) ? po.items : [];
        const grnLines = grn && Array.isArray(grn.lines) ? grn.lines : [];

        // Check PO pricing
        if (po) {
          const invTotal = parseFloat(String(inv.total_amount ?? 0));
          const poTotal = parseFloat(String(po.total_amount ?? 0));

          for (const invLine of invLines) {
            const itemCode = invLine.item_code ?? invLine.itemCode;
            const unitPrice = parseFloat(String(invLine.unit_price ?? invLine.unitPrice ?? 0));
            const poItem = poItems.find((p: any) => (p.item_code ?? p.itemCode) === itemCode);
            if (poItem) {
              const poPrice = parseFloat(String(poItem.unit_price ?? poItem.unitPrice ?? 0));
              if (unitPrice > poPrice + 0.01) {
                matchStatus = 'PRICE_VARIANCE';
                notes.push(`Price variance on item ${itemCode}: Invoice price ${unitPrice} > PO price ${poPrice}`);
              }
            }
          }

          if (invLines.length === 0 && invTotal > poTotal + 0.01) {
            matchStatus = 'PRICE_VARIANCE';
            notes.push(`Invoice total (${invTotal}) exceeds PO total (${poTotal})`);
          }
        }

        // Check GRN accepted quantity
        if (grn && matchStatus !== 'PRICE_VARIANCE') {
          for (const invLine of invLines) {
            const itemCode = invLine.item_code ?? invLine.itemCode;
            const qty = parseFloat(String(invLine.quantity ?? invLine.invoice_qty ?? invLine.invoiceQty ?? 0));
            const grnLine = grnLines.find((g: any) => (g.item_code ?? g.itemCode) === itemCode);
            if (grnLine) {
              const acceptedQty = parseFloat(String(grnLine.accepted_qty ?? grnLine.acceptedQty ?? grnLine.quantity ?? 0));
              if (qty > acceptedQty + 0.001) {
                matchStatus = 'QTY_VARIANCE';
                notes.push(`Quantity variance on item ${itemCode}: Invoiced qty ${qty} > GRN accepted qty ${acceptedQty}`);
              }
            }
          }
        }

        if (notes.length === 0) {
          notes.push('3-Way Match verified successfully: Invoice prices and quantities align with PO and GRN.');
        }
      }

      const matchNotes = notes.join('; ');
      const { rows: updatedRows } = await c.query(
        `UPDATE ap_invoices
            SET match_status = $1,
                match_notes = $2,
                version = version + 1,
                updated_at = now(),
                updated_by = $3
          WHERE id = $4 AND tenant_id = $5
          RETURNING *`,
        [matchStatus, matchNotes, a.userId, inv.id, a.tenantId]
      );

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'ap_invoices',
        entityId: String(inv.id),
        action: 'UPDATE',
        performedBy: a.userId,
        newValues: updatedRows[0],
        ip: a.ip,
      });

      return updatedRows[0];
    });

    res.json({ data: matched });
  };

  r.post('/ap-invoices/:id/match', can('update', 'Finance'), wrap(handleMatchApInvoice));
  r.post('/ap_invoices/:id/match', can('update', 'Finance'), wrap(handleMatchApInvoice));
  r.post('/ap/:id/match', can('update', 'Finance'), wrap(handleMatchApInvoice));
  r.post('/finance/ap/:id/match', can('update', 'Finance'), wrap(handleMatchApInvoice));

  // --------------------------------------------------------------------------
  // Custom Action: Approve AP Invoice & Auto-Post Balanced Double-Entry Journal Entry
  // --------------------------------------------------------------------------
  const handleApproveApInvoice = async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = req.params.id;

    const result = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      const { rows: invRows } = await c.query(
        `SELECT id, invoice_number, supplier_id, po_id, grn_id, invoice_date, total_amount,
                tax_amount, status, match_status, match_notes, lines, plant_id, version
           FROM ap_invoices
          WHERE (id::text = $1 OR invoice_number = $1) AND tenant_id = $2 AND deleted_at IS NULL
          FOR UPDATE`,
        [id, a.tenantId]
      );
      const inv = invRows[0];
      if (!inv) throw new AppError(404, 'NOT_FOUND', 'AP invoice not found');

      // 1. Update Invoice status to APPROVED
      const { rows: updatedInvRows } = await c.query(
        `UPDATE ap_invoices
            SET status = 'APPROVED',
                version = version + 1,
                updated_at = now(),
                updated_by = $1
          WHERE id = $2 AND tenant_id = $3
          RETURNING *`,
        [a.userId, inv.id, a.tenantId]
      );
      const approvedInv = updatedInvRows[0];

      // 2. Auto-generate balanced double-entry Journal Entry
      const totalAmount = parseFloat(String(inv.total_amount ?? 0));
      const taxAmount = parseFloat(String(inv.tax_amount ?? 0));
      const netAmount = Math.max(0, Math.round((totalAmount - taxAmount) * 100) / 100);

      const jeNumber = `JE-AP-${inv.invoice_number}`;

      // Check if JE already exists for this invoice
      const { rows: existingJe } = await c.query(
        `SELECT id, je_number, status, total_debit, total_credit FROM journal_entries
          WHERE (reference_number = $1 OR je_number = $2) AND tenant_id = $3 AND deleted_at IS NULL`,
        [inv.invoice_number, jeNumber, a.tenantId]
      );

      if (existingJe[0]) {
        return { invoice: approvedInv, journalEntry: existingJe[0] };
      }

      // Ensure GL Accounts exist
      // 5000: Raw Material / Purchase Expense (EXPENSE)
      // 1400: Input GST / Tax Receivable (ASSET)
      // 2000: Accounts Payable (LIABILITY)
      const expAcc = await ensureDefaultAccount(c, a.tenantId, inv.plant_id, '5000', 'Material Purchase Expense', 'EXPENSE');
      const taxAcc = await ensureDefaultAccount(c, a.tenantId, inv.plant_id, '1400', 'Input Tax Credit (GST)', 'ASSET');
      const apAcc = await ensureDefaultAccount(c, a.tenantId, inv.plant_id, '2000', 'Accounts Payable', 'LIABILITY');

      // Build lines: Net Debit + Tax Debit = Total Credit
      const lines: any[] = [];
      let lineIdx = 1;

      // Line 1: Expense Debit
      lines.push({
        line_no: lineIdx++,
        account_id: expAcc.id,
        account_code: expAcc.account_code,
        account_name: 'Material Purchase Expense',
        debit_amount: netAmount,
        credit_amount: 0,
        description: `Expense for Invoice ${inv.invoice_number}`,
      });

      // Line 2: Tax Debit (if tax > 0)
      if (taxAmount > 0) {
        lines.push({
          line_no: lineIdx++,
          account_id: taxAcc.id,
          account_code: taxAcc.account_code,
          account_name: 'Input Tax Credit (GST)',
          debit_amount: taxAmount,
          credit_amount: 0,
          description: `Tax on Invoice ${inv.invoice_number}`,
        });
      }

      // Line 3: AP Credit
      lines.push({
        line_no: lineIdx++,
        account_id: apAcc.id,
        account_code: apAcc.account_code,
        account_name: 'Accounts Payable',
        debit_amount: 0,
        credit_amount: totalAmount,
        description: `Payable for Invoice ${inv.invoice_number}`,
      });

      // Insert Journal Entry Header
      const { rows: jeInsRows } = await c.query(
        `INSERT INTO journal_entries (
            tenant_id, plant_id, je_number, je_date, fiscal_year, je_type, status,
            reference_type, reference_id, reference_number, description,
            total_debit, total_credit, lines, version, created_by, updated_by
         ) VALUES ($1, $2, $3, now(), 2026, 'AUTO_FROM_INVOICE', 'POSTED', 'AP_INVOICE', $4, $5, $6, $7, $8, $9, 1, $10, $10)
         RETURNING *`,
        [
          a.tenantId, inv.plant_id, jeNumber, inv.id, inv.invoice_number,
          `Automated double-entry posting for AP Invoice ${inv.invoice_number}`,
          totalAmount, totalAmount, JSON.stringify(lines), a.userId
        ]
      );
      const createdJe = jeInsRows[0];

      // Insert Journal Lines
      for (const l of lines) {
        await c.query(
          `INSERT INTO journal_lines (
              tenant_id, plant_id, je_id, line_no, account_id, account_code, account_name,
              debit_amount, credit_amount, description, version, created_by, updated_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, $11, $11)`,
          [
            a.tenantId, inv.plant_id, createdJe.id, l.line_no, l.account_id, l.account_code,
            l.account_name, l.debit_amount, l.credit_amount, l.description, a.userId
          ]
        );
      }

      // Update GL Account balances
      // Expense +netAmount
      await c.query(
        `UPDATE gl_accounts SET current_balance = current_balance + $1, updated_at = now() WHERE id = $2 AND tenant_id = $3`,
        [netAmount, expAcc.id, a.tenantId]
      );
      // Tax +taxAmount
      if (taxAmount > 0) {
        await c.query(
          `UPDATE gl_accounts SET current_balance = current_balance + $1, updated_at = now() WHERE id = $2 AND tenant_id = $3`,
          [taxAmount, taxAcc.id, a.tenantId]
        );
      }
      // AP +totalAmount (Liability balance increases with Credit)
      await c.query(
        `UPDATE gl_accounts SET current_balance = current_balance + $1, updated_at = now() WHERE id = $2 AND tenant_id = $3`,
        [totalAmount, apAcc.id, a.tenantId]
      );

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'ap_invoices',
        entityId: String(inv.id),
        action: 'APPROVE',
        performedBy: a.userId,
        newValues: approvedInv,
        ip: a.ip,
      });

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'journal_entries',
        entityId: String(createdJe.id),
        action: 'CREATE',
        performedBy: a.userId,
        newValues: createdJe,
        ip: a.ip,
      });

      return { invoice: approvedInv, journalEntry: createdJe };
    });

    res.json({ data: result });
  };

  r.post('/ap-invoices/:id/approve', can('update', 'Finance'), wrap(handleApproveApInvoice));
  r.post('/ap_invoices/:id/approve', can('update', 'Finance'), wrap(handleApproveApInvoice));
  r.post('/ap/:id/approve', can('update', 'Finance'), wrap(handleApproveApInvoice));
  r.post('/finance/ap/:id/approve', can('update', 'Finance'), wrap(handleApproveApInvoice));
}
