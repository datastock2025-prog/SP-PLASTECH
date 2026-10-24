import { registerResourceRoutes } from '../../core/resource.js';
import * as zod from '../../schema/zod.js';
import { withTx, withDrizzleTx, schema } from '../../db.js';
import { eq, and, or, sql, isNull } from 'drizzle-orm';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import { writeAudit } from '../../core/audit.js';

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
  async function ensureDefaultAccount(tx: any, tenantId: string, plantId: string | null, code: string, name: string, type: string) {
    const [existing] = await tx
      .select({
        id: schema.glAccounts.id,
        account_code: schema.glAccounts.accountCode,
        account_type: schema.glAccounts.accountType,
        current_balance: schema.glAccounts.currentBalance,
      })
      .from(schema.glAccounts)
      .where(and(
        eq(schema.glAccounts.accountCode, code),
        eq(schema.glAccounts.tenantId, tenantId),
        isNull(schema.glAccounts.deletedAt),
      ));
    if (existing) return existing;

    const [ins] = await tx
      .insert(schema.glAccounts)
      .values({
        tenantId,
        plantId,
        accountCode: code,
        accountName: name,
        accountType: type,
        isPostable: true,
        isActive: true,
        currency: 'INR',
        openingBalance: '0',
        currentBalance: '0',
        version: 1,
      })
      .returning({
        id: schema.glAccounts.id,
        account_code: schema.glAccounts.accountCode,
        account_type: schema.glAccounts.accountType,
        current_balance: schema.glAccounts.currentBalance,
      });
    return ins;
  }

  // --------------------------------------------------------------------------
  // Custom Action: Post Journal Entry (Double-Entry Balance Validation & GL Posting)
  // --------------------------------------------------------------------------
  const handlePostJournalEntry = async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = req.params.id;

    const posted = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (tx, c) => {
      // 1. Fetch Journal Entry with FOR UPDATE
      const [je] = await tx
        .select()
        .from(schema.journalEntries)
        .where(and(
          sql`(${schema.journalEntries.id}::text = ${id} OR ${schema.journalEntries.jeNumber} = ${id})`,
          eq(schema.journalEntries.tenantId, a.tenantId),
          isNull(schema.journalEntries.deletedAt),
        ))
        .for('update');
      if (!je) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');

      if (je.status === 'POSTED') {
        return je;
      }

      // 2. Load lines from journal_lines table or lines JSONB column
      const dbLines = await tx
        .select({
          id: schema.journalLines.id,
          line_no: schema.journalLines.lineNo,
          account_id: schema.journalLines.accountId,
          account_code: schema.journalLines.accountCode,
          account_name: schema.journalLines.accountName,
          debit_amount: schema.journalLines.debitAmount,
          credit_amount: schema.journalLines.creditAmount,
          description: schema.journalLines.description,
        })
        .from(schema.journalLines)
        .where(and(
          eq(schema.journalLines.jeId, je.id),
          eq(schema.journalLines.tenantId, a.tenantId),
          isNull(schema.journalLines.deletedAt),
        ))
        .orderBy(schema.journalLines.lineNo);

      let linesToProcess = [...dbLines];
      if (linesToProcess.length === 0 && Array.isArray(je.lines) && je.lines.length > 0) {
        // Persist JSONB lines into journal_lines table
        for (let i = 0; i < je.lines.length; i++) {
          const l: any = je.lines[i];
          const lineNo = l.line_no ?? l.lineNo ?? (i + 1);
          const accCode = String(l.account_code ?? l.accountCode ?? '').trim();
          const accName = l.account_name ?? l.accountName ?? null;
          const accId = l.account_id ?? l.accountId ?? null;
          const dr = parseFloat(String(l.debit_amount ?? l.debitAmount ?? l.debit ?? 0));
          const cr = parseFloat(String(l.credit_amount ?? l.creditAmount ?? l.credit ?? 0));
          const desc = l.description ?? null;

          const [insLine] = await tx
            .insert(schema.journalLines)
            .values({
              tenantId: a.tenantId,
              plantId: je.plantId,
              jeId: je.id,
              lineNo,
              accountId: accId,
              accountCode: accCode,
              accountName: accName,
              debitAmount: String(dr),
              creditAmount: String(cr),
              description: desc,
              version: 1,
            })
            .returning({
              id: schema.journalLines.id,
              line_no: schema.journalLines.lineNo,
              account_id: schema.journalLines.accountId,
              account_code: schema.journalLines.accountCode,
              account_name: schema.journalLines.accountName,
              debit_amount: schema.journalLines.debitAmount,
              credit_amount: schema.journalLines.creditAmount,
              description: schema.journalLines.description,
            });
          linesToProcess.push(insLine);
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
          const [row] = await tx
            .select({
              id: schema.glAccounts.id,
              account_code: schema.glAccounts.accountCode,
              account_type: schema.glAccounts.accountType,
              current_balance: schema.glAccounts.currentBalance,
            })
            .from(schema.glAccounts)
            .where(and(
              eq(schema.glAccounts.id, accId),
              eq(schema.glAccounts.tenantId, a.tenantId),
              isNull(schema.glAccounts.deletedAt),
            ))
            .for('update');
          accRow = row;
        }
        if (!accRow && accCode) {
          const [row] = await tx
            .select({
              id: schema.glAccounts.id,
              account_code: schema.glAccounts.accountCode,
              account_type: schema.glAccounts.accountType,
              current_balance: schema.glAccounts.currentBalance,
            })
            .from(schema.glAccounts)
            .where(and(
              eq(schema.glAccounts.accountCode, accCode),
              eq(schema.glAccounts.tenantId, a.tenantId),
              isNull(schema.glAccounts.deletedAt),
            ))
            .for('update');
          accRow = row;
        }

        if (accRow) {
          const accType = String(accRow.account_type || '').toUpperCase();
          // Asset and Expense accounts increase with Debit, decrease with Credit.
          // Liability, Equity, and Revenue accounts increase with Credit, decrease with Debit.
          const isDebitNormal = accType === 'ASSET' || accType === 'EXPENSE' || accType === 'CONTRA_LIABILITY';
          const balanceDelta = isDebitNormal ? (dr - cr) : (cr - dr);

          await tx
            .update(schema.glAccounts)
            .set({
              currentBalance: sql`${schema.glAccounts.currentBalance} + ${balanceDelta}`,
              updatedAt: new Date(),
              version: sql`${schema.glAccounts.version} + 1`,
            })
            .where(and(eq(schema.glAccounts.id, accRow.id), eq(schema.glAccounts.tenantId, a.tenantId)));
        }
      }

      // 5. Update Journal Entry Status to POSTED
      const [updatedJe] = await tx
        .update(schema.journalEntries)
        .set({
          status: 'POSTED',
          totalDebit: String(totalDebit),
          totalCredit: String(totalCredit),
          version: sql`${schema.journalEntries.version} + 1`,
          updatedAt: new Date(),
          updatedBy: a.userId,
        })
        .where(and(eq(schema.journalEntries.id, je.id), eq(schema.journalEntries.tenantId, a.tenantId)))
        .returning();

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'journal_entries',
        entityId: String(je.id),
        action: 'APPROVE',
        performedBy: a.userId,
        newValues: updatedJe,
        ip: a.ip,
      });

      return updatedJe;
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

    const reversed = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (tx) => {
      const [je] = await tx
        .select()
        .from(schema.journalEntries)
        .where(and(
          sql`(${schema.journalEntries.id}::text = ${id} OR ${schema.journalEntries.jeNumber} = ${id})`,
          eq(schema.journalEntries.tenantId, a.tenantId),
          isNull(schema.journalEntries.deletedAt),
        ))
        .for('update');
      if (!je) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
      if (je.status !== 'POSTED') {
        throw new AppError(400, 'INVALID_STATUS', 'Only POSTED journal entries can be reversed');
      }

      const lines = await tx
        .select({
          id: schema.journalLines.id,
          account_id: schema.journalLines.accountId,
          account_code: schema.journalLines.accountCode,
          debit_amount: schema.journalLines.debitAmount,
          credit_amount: schema.journalLines.creditAmount,
        })
        .from(schema.journalLines)
        .where(and(
          eq(schema.journalLines.jeId, je.id),
          eq(schema.journalLines.tenantId, a.tenantId),
          isNull(schema.journalLines.deletedAt),
        ));

      // Revert account balances
      for (const line of lines) {
        const accCode = line.account_code;
        const accId = line.account_id;
        const dr = parseFloat(String(line.debit_amount ?? 0));
        const cr = parseFloat(String(line.credit_amount ?? 0));

        let accRow: any = null;
        if (accId) {
          const [row] = await tx
            .select({
              id: schema.glAccounts.id,
              account_code: schema.glAccounts.accountCode,
              account_type: schema.glAccounts.accountType,
            })
            .from(schema.glAccounts)
            .where(and(
              eq(schema.glAccounts.id, accId),
              eq(schema.glAccounts.tenantId, a.tenantId),
              isNull(schema.glAccounts.deletedAt),
            ))
            .for('update');
          accRow = row;
        }
        if (!accRow && accCode) {
          const [row] = await tx
            .select({
              id: schema.glAccounts.id,
              account_code: schema.glAccounts.accountCode,
              account_type: schema.glAccounts.accountType,
            })
            .from(schema.glAccounts)
            .where(and(
              eq(schema.glAccounts.accountCode, accCode),
              eq(schema.glAccounts.tenantId, a.tenantId),
              isNull(schema.glAccounts.deletedAt),
            ))
            .for('update');
          accRow = row;
        }

        if (accRow) {
          const accType = String(accRow.account_type || '').toUpperCase();
          const isDebitNormal = accType === 'ASSET' || accType === 'EXPENSE' || accType === 'CONTRA_LIABILITY';
          const balanceDelta = isDebitNormal ? (dr - cr) : (cr - dr);

          // Reverse: subtract the original delta
          await tx
            .update(schema.glAccounts)
            .set({
              currentBalance: sql`${schema.glAccounts.currentBalance} - ${balanceDelta}`,
              updatedAt: new Date(),
              version: sql`${schema.glAccounts.version} + 1`,
            })
            .where(and(eq(schema.glAccounts.id, accRow.id), eq(schema.glAccounts.tenantId, a.tenantId)));
        }
      }

      const [updatedJe] = await tx
        .update(schema.journalEntries)
        .set({
          status: 'REVERSED',
          version: sql`${schema.journalEntries.version} + 1`,
          updatedAt: new Date(),
          updatedBy: a.userId,
        })
        .where(and(eq(schema.journalEntries.id, je.id), eq(schema.journalEntries.tenantId, a.tenantId)))
        .returning();

      return updatedJe;
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

    const matched = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (tx) => {
      const [inv] = await tx
        .select()
        .from(schema.apInvoices)
        .where(and(
          sql`(${schema.apInvoices.id}::text = ${id} OR ${schema.apInvoices.invoiceNumber} = ${id})`,
          eq(schema.apInvoices.tenantId, a.tenantId),
          isNull(schema.apInvoices.deletedAt),
        ))
        .for('update');
      const invRow = inv as any;
      if (!invRow) throw new AppError(404, 'NOT_FOUND', 'AP invoice not found');

      // Fetch linked PO
      let po: any = null;
      if (invRow.poId) {
        const [poRow] = await tx
          .select({
            id: schema.purchaseOrders.id,
            po_number: schema.purchaseOrders.poNumber,
            total_amount: schema.purchaseOrders.totalAmount,
            items: schema.purchaseOrders.items,
          })
          .from(schema.purchaseOrders)
          .where(and(
            sql`(${schema.purchaseOrders.id}::text = ${invRow.poId} OR ${schema.purchaseOrders.poNumber} = ${invRow.poId})`,
            eq(schema.purchaseOrders.tenantId, a.tenantId),
            isNull(schema.purchaseOrders.deletedAt),
          ));
        po = poRow;
      }

      // Fetch linked GRN
      let grn: any = null;
      if (invRow.grnId) {
        const [grnRow] = await tx
          .select({
            id: schema.goodsReceiptNotes.id,
            grn_number: schema.goodsReceiptNotes.grnNumber,
            total_amount: schema.goodsReceiptNotes.totalAmount,
            lines: schema.goodsReceiptNotes.lines,
          })
          .from(schema.goodsReceiptNotes)
          .where(and(
            sql`(${schema.goodsReceiptNotes.id}::text = ${invRow.grnId} OR ${schema.goodsReceiptNotes.grnNumber} = ${invRow.grnId})`,
            eq(schema.goodsReceiptNotes.tenantId, a.tenantId),
            isNull(schema.goodsReceiptNotes.deletedAt),
          ));
        grn = grnRow;
      }

      let matchStatus = 'MATCHED';
      const notes: string[] = [];

      if (!po && !grn) {
        matchStatus = 'UNMATCHED';
        notes.push('No linked PO or GRN found for 3-way matching.');
      } else {
        const invLines = Array.isArray(invRow.lines) ? invRow.lines : [];
        const poItems = po && Array.isArray(po.items) ? po.items : [];
        const grnLines = grn && Array.isArray(grn.lines) ? grn.lines : [];

        // Check PO pricing
        if (po) {
          const invTotal = parseFloat(String(invRow.totalAmount ?? 0));
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
      const [updatedInv] = await tx
        .update(schema.apInvoices)
        .set({
          matchStatus,
          matchNotes,
          version: sql`${schema.apInvoices.version} + 1`,
          updatedAt: new Date(),
          updatedBy: a.userId,
        })
        .where(and(eq(schema.apInvoices.id, invRow.id), eq(schema.apInvoices.tenantId, a.tenantId)))
        .returning();

      return updatedInv;
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

    const result = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (tx, c) => {
      const [inv] = await tx
        .select()
        .from(schema.apInvoices)
        .where(and(
          sql`(${schema.apInvoices.id}::text = ${id} OR ${schema.apInvoices.invoiceNumber} = ${id})`,
          eq(schema.apInvoices.tenantId, a.tenantId),
          isNull(schema.apInvoices.deletedAt),
        ))
        .for('update');
      const invRow = inv as any;
      if (!invRow) throw new AppError(404, 'NOT_FOUND', 'AP invoice not found');

      // 1. Update Invoice status to APPROVED
      const [approvedInv] = await tx
        .update(schema.apInvoices)
        .set({
          status: 'APPROVED',
          version: sql`${schema.apInvoices.version} + 1`,
          updatedAt: new Date(),
          updatedBy: a.userId,
        })
        .where(and(eq(schema.apInvoices.id, invRow.id), eq(schema.apInvoices.tenantId, a.tenantId)))
        .returning();

      // 2. Auto-generate balanced double-entry Journal Entry
      const totalAmount = parseFloat(String(invRow.totalAmount ?? 0));
      const taxAmount = parseFloat(String(invRow.taxAmount ?? 0));
      const netAmount = Math.max(0, Math.round((totalAmount - taxAmount) * 100) / 100);

      const jeNumber = `JE-AP-${invRow.invoiceNumber}`;

      // Check if JE already exists for this invoice
      const [existingJe] = await tx
        .select({
          id: schema.journalEntries.id,
          je_number: schema.journalEntries.jeNumber,
          status: schema.journalEntries.status,
          total_debit: schema.journalEntries.totalDebit,
          total_credit: schema.journalEntries.totalCredit,
        })
        .from(schema.journalEntries)
        .where(and(
          or(eq(schema.journalEntries.referenceNumber, invRow.invoiceNumber), eq(schema.journalEntries.jeNumber, jeNumber)),
          eq(schema.journalEntries.tenantId, a.tenantId),
          isNull(schema.journalEntries.deletedAt),
        ));

      if (existingJe) {
        return { invoice: approvedInv, journalEntry: existingJe };
      }

      // Ensure GL Accounts exist
      // 5000: Raw Material / Purchase Expense (EXPENSE)
      // 1400: Input GST / Tax Receivable (ASSET)
      // 2000: Accounts Payable (LIABILITY)
      const expAcc = await ensureDefaultAccount(tx, a.tenantId, invRow.plantId, '5000', 'Material Purchase Expense', 'EXPENSE');
      const taxAcc = await ensureDefaultAccount(tx, a.tenantId, invRow.plantId, '1400', 'Input Tax Credit (GST)', 'ASSET');
      const apAcc = await ensureDefaultAccount(tx, a.tenantId, invRow.plantId, '2000', 'Accounts Payable', 'LIABILITY');

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
        description: `Expense for Invoice ${invRow.invoiceNumber}`,
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
          description: `Tax on Invoice ${invRow.invoiceNumber}`,
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
        description: `Payable for Invoice ${invRow.invoiceNumber}`,
      });

      // Insert Journal Entry Header
      const [createdJe] = await tx
        .insert(schema.journalEntries)
        .values({
          tenantId: a.tenantId,
          plantId: invRow.plantId,
          jeNumber,
          jeDate: new Date(),
          fiscalYear: 2026,
          jeType: 'AUTO_FROM_INVOICE',
          status: 'POSTED',
          referenceType: 'AP_INVOICE',
          referenceId: invRow.id,
          referenceNumber: invRow.invoiceNumber,
          description: `Automated double-entry posting for AP Invoice ${invRow.invoiceNumber}`,
          totalDebit: String(totalAmount),
          totalCredit: String(totalAmount),
          lines,
          version: 1,
          createdBy: a.userId,
          updatedBy: a.userId,
        })
        .returning();

      // Insert Journal Lines
      for (const l of lines) {
        await tx.insert(schema.journalLines).values({
          tenantId: a.tenantId,
          plantId: invRow.plantId,
          jeId: createdJe.id,
          lineNo: l.line_no,
          accountId: l.account_id,
          accountCode: l.account_code,
          accountName: l.account_name,
          debitAmount: String(l.debit_amount),
          creditAmount: String(l.credit_amount),
          description: l.description,
          version: 1,
          createdBy: a.userId,
          updatedBy: a.userId,
        });
      }

      // Update GL Account balances
      // Expense +netAmount
      await tx
        .update(schema.glAccounts)
        .set({
          currentBalance: sql`${schema.glAccounts.currentBalance} + ${netAmount}`,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.glAccounts.id, expAcc.id), eq(schema.glAccounts.tenantId, a.tenantId)));

      // Tax +taxAmount
      if (taxAmount > 0) {
        await tx
          .update(schema.glAccounts)
          .set({
            currentBalance: sql`${schema.glAccounts.currentBalance} + ${taxAmount}`,
            updatedAt: new Date(),
          })
          .where(and(eq(schema.glAccounts.id, taxAcc.id), eq(schema.glAccounts.tenantId, a.tenantId)));
      }

      // AP +totalAmount (Liability balance increases with Credit)
      await tx
        .update(schema.glAccounts)
        .set({
          currentBalance: sql`${schema.glAccounts.currentBalance} + ${totalAmount}`,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.glAccounts.id, apAcc.id), eq(schema.glAccounts.tenantId, a.tenantId)));

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'ap_invoices',
        entityId: String(invRow.id),
        action: 'APPROVE',
        performedBy: a.userId,
        newValues: approvedInv,
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
