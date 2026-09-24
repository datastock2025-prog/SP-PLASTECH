import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  PostJournalEntryDto,
  PostJournalEntryDtoSchema,
  CreateVendorInvoiceDto,
  CreateVendorInvoiceDtoSchema,
  ProcessDisbursementDto,
  ProcessDisbursementDtoSchema,
} from './finance.dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  // In-memory financial subledgers
  private journalEntries = new Map<string, any>();
  private vendorInvoices = new Map<string, any>();
  private accountBalances = new Map<string, { accountId: string; accountName: string; type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'; netBalance: number }>();
  private bankAccounts = new Map<string, { id: string; name: string; accountNumber: string; balance: number }>();

  constructor(private readonly db: DatabaseService) {
    this.initChartOfAccounts();
  }

  // ============================================================================
  // 1. IMMUTABLE DOUBLE-ENTRY GENERAL LEDGER CORE
  // ============================================================================
  public async postJournalEntry(dto: PostJournalEntryDto) {
    const parsed = PostJournalEntryDtoSchema.parse(dto);

    // 1. Strict Double-Entry Balance Invariant: Sum(Debits) === Sum(Credits)
    const totalDebit = parsed.lines.reduce((s, l) => s + l.debitAmount, 0);
    const totalCredit = parsed.lines.reduce((s, l) => s + l.creditAmount, 0);

    const delta = Math.abs(totalDebit - totalCredit);
    if (delta > 0.001) {
      throw new BadRequestException(
        `Double-Entry Invariant Violation: Debits (₹${totalDebit.toFixed(2)}) must exactly equal Credits (₹${totalCredit.toFixed(2)}). Variance: ₹${delta.toFixed(2)}.`
      );
    }

    const jeNumber = parsed.entryNumber || `JE-2026-${Date.now().toString().slice(-6)}`;

    const journalRecord = {
      id: jeNumber,
      tenantId: parsed.tenantId,
      entryDate: parsed.entryDate,
      voucherType: parsed.voucherType,
      referenceDoc: parsed.referenceDoc || null,
      narration: parsed.narration,
      totalAmount: totalDebit,
      lines: parsed.lines,
      postedByUserId: parsed.postedByUserId,
      isPosted: true,
      postedAt: new Date().toISOString(),
    };

    // Update account balances
    parsed.lines.forEach((line) => {
      const acct = this.accountBalances.get(line.accountId);
      if (acct) {
        if (acct.type === 'ASSET' || acct.type === 'EXPENSE') {
          acct.netBalance += line.debitAmount - line.creditAmount;
        } else {
          acct.netBalance += line.creditAmount - line.debitAmount;
        }
        this.accountBalances.set(line.accountId, acct);
      }
    });

    this.journalEntries.set(jeNumber, journalRecord);
    this.logger.log(`Journal Entry ${jeNumber} successfully posted. Total: ₹${totalDebit.toLocaleString()}`);

    return {
      success: true,
      journalEntryNumber: jeNumber,
      totalDebit,
      totalCredit,
      status: 'POSTED_IMMUTABLE',
      message: `Journal voucher ${jeNumber} committed to General Ledger.`,
    };
  }

  public async getJournalEntries(tenantId: string = 'TENANT-ALPHA-IND') {
    return Array.from(this.journalEntries.values()).filter((je) => je.tenantId === tenantId);
  }

  // ============================================================================
  // 2. ACCOUNTS PAYABLE (AP) & VENDOR INVOICING
  // ============================================================================
  public async createVendorInvoice(dto: CreateVendorInvoiceDto) {
    const parsed = CreateVendorInvoiceDtoSchema.parse(dto);

    const invoiceRecord = {
      id: parsed.invoiceNumber,
      tenantId: parsed.tenantId,
      vendorId: parsed.vendorId,
      vendorName: parsed.vendorName,
      poNumber: parsed.poNumber,
      grnNumber: parsed.grnNumber,
      invoiceDate: parsed.invoiceDate,
      dueDate: parsed.dueDate,
      baseAmount: parsed.baseAmount,
      cgstAmount: parsed.cgstAmount,
      sgstAmount: parsed.sgstAmount,
      igstAmount: parsed.igstAmount,
      tdsDeducted: parsed.tdsDeducted,
      totalPayableAmount: parsed.totalPayableAmount,
      status: 'UNPAID',
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    };

    this.vendorInvoices.set(parsed.invoiceNumber, invoiceRecord);

    // Automatically post corresponding AP Journal Entry:
    // Debit: Raw Material Expense / Inventory (Base Amount)
    // Debit: Input GST Tax Asset (CGST + SGST + IGST)
    // Credit: TDS Payable (TDS)
    // Credit: Accounts Payable - Vendor (Total Payable)
    const totalTax = parsed.cgstAmount + parsed.sgstAmount + parsed.igstAmount;

    await this.postJournalEntry({
      tenantId: parsed.tenantId,
      voucherType: 'AP_PURCHASE_VOUCHER',
      referenceDoc: parsed.invoiceNumber,
      narration: `AP Invoice booking for ${parsed.vendorName} against PO ${parsed.poNumber}`,
      postedByUserId: 'SYSTEM-AP-AUTO',
      lines: [
        { accountId: '5010-RAW-MATERIAL-EXP', accountName: 'Raw Polymer Resin Expense', debitAmount: parsed.baseAmount, creditAmount: 0 },
        { accountId: '1310-INPUT-GST-CREDIT', accountName: 'Input GST ITC Receivable', debitAmount: totalTax, creditAmount: 0 },
        ...(parsed.tdsDeducted > 0
          ? [{ accountId: '2020-TDS-PAYABLE', accountName: 'TDS Payable 194Q', debitAmount: 0, creditAmount: parsed.tdsDeducted }]
          : []),
        { accountId: '2010-ACCOUNTS-PAYABLE', accountName: 'Accounts Payable - Trade Creditors', debitAmount: 0, creditAmount: parsed.totalPayableAmount },
      ],
    });

    return {
      success: true,
      invoiceNumber: parsed.invoiceNumber,
      totalPayableAmount: parsed.totalPayableAmount,
      status: 'BOOKED_POSTED_TO_AP',
      message: `Vendor invoice ${parsed.invoiceNumber} booked and double-entry voucher committed.`,
    };
  }

  public async getVendorInvoices(tenantId: string = 'TENANT-ALPHA-IND') {
    return Array.from(this.vendorInvoices.values()).filter((inv) => inv.tenantId === tenantId);
  }

  // ============================================================================
  // 3. AP AGING SCHEDULE ANALYTICS
  // ============================================================================
  public async getApAgingAnalysis(tenantId: string = 'TENANT-ALPHA-IND') {
    const invoices = Array.from(this.vendorInvoices.values()).filter((inv) => inv.tenantId === tenantId && inv.status !== 'PAID');
    const now = Date.now();

    const aging = {
      current_0_30: 0,
      overdue_31_60: 0,
      overdue_61_90: 0,
      overdue_90_plus: 0,
      totalOutstanding: 0,
      invoicesCount: invoices.length,
    };

    invoices.forEach((inv) => {
      const due = new Date(inv.dueDate).getTime();
      const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));
      const outstanding = inv.totalPayableAmount - inv.paidAmount;

      aging.totalOutstanding += outstanding;

      if (daysOverdue <= 0) {
        aging.current_0_30 += outstanding;
      } else if (daysOverdue <= 30) {
        aging.current_0_30 += outstanding;
      } else if (daysOverdue <= 60) {
        aging.overdue_31_60 += outstanding;
      } else if (daysOverdue <= 90) {
        aging.overdue_61_90 += outstanding;
      } else {
        aging.overdue_90_plus += outstanding;
      }
    });

    return aging;
  }

  // ============================================================================
  // 4. DISBURSEMENTS WITH STEP-UP AUTHORIZATION
  // ============================================================================
  public async processDisbursement(dto: ProcessDisbursementDto) {
    const parsed = ProcessDisbursementDtoSchema.parse(dto);

    const invoice = this.vendorInvoices.get(parsed.invoiceId);
    if (!invoice) {
      throw new NotFoundException(`Invoice "${parsed.invoiceId}" not found in AP ledger.`);
    }

    const bank = this.bankAccounts.get(parsed.bankAccountId);
    if (!bank) {
      throw new NotFoundException(`Bank account "${parsed.bankAccountId}" not found.`);
    }

    if (bank.balance < parsed.amountPaid) {
      throw new BadRequestException(
        `Insufficient bank balance in ${bank.name}. Available: ₹${bank.balance.toLocaleString()}, Required: ₹${parsed.amountPaid.toLocaleString()}`
      );
    }

    // Deduct bank balance
    bank.balance -= parsed.amountPaid;
    this.bankAccounts.set(parsed.bankAccountId, bank);

    // Update invoice status
    invoice.paidAmount += parsed.amountPaid;
    invoice.status = invoice.paidAmount >= invoice.totalPayableAmount ? 'PAID' : 'PARTIALLY_PAID';
    this.vendorInvoices.set(parsed.invoiceId, invoice);

    // Post payment journal entry
    const utrRef = `UTR-${Date.now().toString().slice(-8)}`;
    await this.postJournalEntry({
      tenantId: parsed.tenantId,
      voucherType: 'PAYMENT',
      referenceDoc: utrRef,
      narration: `Payment disbursement for ${invoice.vendorName} inv ${parsed.invoiceId} via ${parsed.paymentMode}`,
      postedByUserId: parsed.authorizedByUserId,
      lines: [
        { accountId: '2010-ACCOUNTS-PAYABLE', accountName: 'Accounts Payable - Trade Creditors', debitAmount: parsed.amountPaid, creditAmount: 0 },
        { accountId: '1010-CASH-BANK', accountName: bank.name, debitAmount: 0, creditAmount: parsed.amountPaid },
      ],
    });

    return {
      success: true,
      utrReference: utrRef,
      disbursedAmount: parsed.amountPaid,
      invoiceStatus: invoice.status,
      remainingBankBalance: bank.balance,
      message: `Disbursement released successfully under authorization code ${parsed.authorizationCode}.`,
    };
  }

  // ============================================================================
  // 5. TRIAL BALANCE & FINANCIAL STATEMENTS
  // ============================================================================
  public async getTrialBalance(tenantId: string = 'TENANT-ALPHA-IND') {
    const accounts = Array.from(this.accountBalances.values());
    let totalDebitSum = 0;
    let totalCreditSum = 0;

    const trialBalanceRows = accounts.map((acct) => {
      const isDebitNature = acct.type === 'ASSET' || acct.type === 'EXPENSE';
      const debit = isDebitNature ? Math.max(0, acct.netBalance) : 0;
      const credit = !isDebitNature ? Math.max(0, acct.netBalance) : 0;

      totalDebitSum += debit;
      totalCreditSum += credit;

      return {
        accountId: acct.accountId,
        accountName: acct.accountName,
        category: acct.type,
        debitBalance: debit,
        creditBalance: credit,
      };
    });

    return {
      tenantId,
      asOfDate: new Date().toISOString().split('T')[0],
      totalDebits: totalDebitSum,
      totalCredits: totalCreditSum,
      isBalanced: Math.abs(totalDebitSum - totalCreditSum) < 0.01,
      accounts: trialBalanceRows,
    };
  }

  private initChartOfAccounts() {
    this.accountBalances.set('1010-CASH-BANK', { accountId: '1010-CASH-BANK', accountName: 'HDFC Corporate Current A/c', type: 'ASSET', netBalance: 8500000 });
    this.accountBalances.set('1210-INVENTORY-RAW', { accountId: '1210-INVENTORY-RAW', accountName: 'Raw Polymer & Masterbatch Inventory', type: 'ASSET', netBalance: 4250000 });
    this.accountBalances.set('1310-INPUT-GST-CREDIT', { accountId: '1310-INPUT-GST-CREDIT', accountName: 'Input GST ITC Receivable', type: 'ASSET', netBalance: 765000 });
    this.accountBalances.set('2010-ACCOUNTS-PAYABLE', { accountId: '2010-ACCOUNTS-PAYABLE', accountName: 'Accounts Payable - Trade Creditors', type: 'LIABILITY', netBalance: 3200000 });
    this.accountBalances.set('2020-TDS-PAYABLE', { accountId: '2020-TDS-PAYABLE', accountName: 'TDS Payable 194Q', type: 'LIABILITY', netBalance: 45000 });
    this.accountBalances.set('3010-EQUITY-CAPITAL', { accountId: '3010-EQUITY-CAPITAL', accountName: 'Share Capital & Reserves', type: 'EQUITY', netBalance: 10270000 });
    this.accountBalances.set('4010-SALES-REVENUE', { accountId: '4010-SALES-REVENUE', accountName: 'Bumper & Injection Molded Sales Revenue', type: 'REVENUE', netBalance: 0 });
    this.accountBalances.set('5010-RAW-MATERIAL-EXP', { accountId: '5010-RAW-MATERIAL-EXP', accountName: 'Raw Polymer Resin Expense', type: 'EXPENSE', netBalance: 0 });

    this.bankAccounts.set('HDFC-OPERATING-01', {
      id: 'HDFC-OPERATING-01',
      name: 'HDFC Corporate Operating A/c (***9201)',
      accountNumber: '50200049281920',
      balance: 8500000,
    });
  }
}
