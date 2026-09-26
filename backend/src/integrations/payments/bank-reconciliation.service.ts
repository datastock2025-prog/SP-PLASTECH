import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';

export interface BankTransactionRow {
  date: string;
  description: string;
  referenceNumber: string;
  debitAmount: Decimal;
  creditAmount: Decimal;
  balance: Decimal;
}

export interface OpenInvoiceCandidate {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  outstandingAmount: Decimal;
  referenceTags: string[];
}

export interface ReconciliationMatchResult {
  transaction: {
    date: string;
    description: string;
    referenceNumber: string;
    amount: number;
  };
  matchedInvoice?: {
    invoiceId: string;
    invoiceNumber: string;
    customerName: string;
    matchedAmount: number;
    confidenceScore: number; // 0.0 - 1.0
    matchReason: string;
  };
  status: 'AUTO_MATCHED' | 'PROBABLE_MATCH' | 'UNMATCHED';
}

@Injectable()
export class BankReconciliationService {
  private readonly logger = new Logger(BankReconciliationService.name);

  /**
   * Parse Indian Bank Statement CSV (e.g. HDFC, ICICI, SBI, Axis)
   */
  parseCsvStatement(csvContent: string): BankTransactionRow[] {
    const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);
    const transactions: BankTransactionRow[] = [];

    for (const line of lines) {
      // Basic CSV splitter handling quotes
      const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols.length < 5) continue;

      // Skip header lines
      if (/date|narration|description|transaction/i.test(cols[0])) continue;

      try {
        const date = cols[0];
        const description = cols[1];
        const refNo = cols[2] || this.extractUpiOrUtr(description);
        const debit = new Decimal(cols[3] || 0);
        const credit = new Decimal(cols[4] || 0);
        const balance = cols[5] ? new Decimal(cols[5]) : new Decimal(0);

        transactions.push({
          date,
          description,
          referenceNumber: refNo,
          debitAmount: debit,
          creditAmount: credit,
          balance,
        });
      } catch {
        // Skip malformed rows
      }
    }

    return transactions;
  }

  /**
   * Auto-match bank incoming credits with open invoices
   */
  autoMatchTransactions(
    transactions: BankTransactionRow[],
    openInvoices: OpenInvoiceCandidate[],
  ): ReconciliationMatchResult[] {
    const results: ReconciliationMatchResult[] = [];

    for (const txn of transactions) {
      // Only reconcile incoming credit transactions
      if (txn.creditAmount.lte(0)) continue;

      let bestMatch: OpenInvoiceCandidate | null = null;
      let highestScore = 0;
      let reason = '';

      const txnText = `${txn.description} ${txn.referenceNumber}`.toUpperCase();

      for (const inv of openInvoices) {
        let score = 0;
        const invNum = inv.invoiceNumber.toUpperCase();

        // Exact amount match
        if (txn.creditAmount.equals(inv.outstandingAmount)) {
          score += 0.5;
        } else if (txn.creditAmount.lte(inv.outstandingAmount)) {
          score += 0.2; // Partial payment candidate
        }

        // Invoice number contained in narration
        if (txnText.includes(invNum)) {
          score += 0.4;
        }

        // Customer name match in narration
        const cleanCust = inv.customerName.toUpperCase().split(' ')[0];
        if (cleanCust && cleanCust.length > 3 && txnText.includes(cleanCust)) {
          score += 0.2;
        }

        // UTR / Reference match
        if (inv.referenceTags.some((tag) => txnText.includes(tag.toUpperCase()))) {
          score += 0.3;
        }

        if (score > highestScore) {
          highestScore = score;
          bestMatch = inv;
          reason =
            score >= 0.8
              ? 'Exact amount and invoice reference detected'
              : score >= 0.5
              ? 'Exact amount match with customer name candidate'
              : 'Partial match criteria';
        }
      }

      if (bestMatch && highestScore >= 0.8) {
        results.push({
          transaction: {
            date: txn.date,
            description: txn.description,
            referenceNumber: txn.referenceNumber,
            amount: txn.creditAmount.toNumber(),
          },
          matchedInvoice: {
            invoiceId: bestMatch.invoiceId,
            invoiceNumber: bestMatch.invoiceNumber,
            customerName: bestMatch.customerName,
            matchedAmount: txn.creditAmount.toNumber(),
            confidenceScore: Math.min(highestScore, 1.0),
            matchReason: reason,
          },
          status: 'AUTO_MATCHED',
        });
      } else if (bestMatch && highestScore >= 0.5) {
        results.push({
          transaction: {
            date: txn.date,
            description: txn.description,
            referenceNumber: txn.referenceNumber,
            amount: txn.creditAmount.toNumber(),
          },
          matchedInvoice: {
            invoiceId: bestMatch.invoiceId,
            invoiceNumber: bestMatch.invoiceNumber,
            customerName: bestMatch.customerName,
            matchedAmount: txn.creditAmount.toNumber(),
            confidenceScore: highestScore,
            matchReason: reason,
          },
          status: 'PROBABLE_MATCH',
        });
      } else {
        results.push({
          transaction: {
            date: txn.date,
            description: txn.description,
            referenceNumber: txn.referenceNumber,
            amount: txn.creditAmount.toNumber(),
          },
          status: 'UNMATCHED',
        });
      }
    }

    return results;
  }

  private extractUpiOrUtr(narration: string): string {
    const utrMatch = narration.match(/[A-Z0-9]{12,22}/i);
    return utrMatch ? utrMatch[0] : '';
  }
}
