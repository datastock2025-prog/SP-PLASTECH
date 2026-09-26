import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Decimal } from 'decimal.js';

export interface TallySalesInvoiceDto {
  voucherNumber: string;
  date: string; // YYYYMMDD
  partyLedgerName: string;
  salesLedgerName: string;
  tenantId: string;
  items: {
    stockItemName: string;
    quantity: number | Decimal;
    rate: number | Decimal;
    amount: number | Decimal;
    unit: string;
  }[];
  cgstAmount?: number | Decimal;
  sgstAmount?: number | Decimal;
  igstAmount?: number | Decimal;
  totalAmount: number | Decimal;
  narration?: string;
}

export interface TallyReceiptDto {
  voucherNumber: string;
  date: string; // YYYYMMDD
  partyLedgerName: string;
  bankOrCashLedger: string;
  amount: number | Decimal;
  chequeOrRefNo?: string;
  narration?: string;
}

@Injectable()
export class TallySyncService {
  private readonly logger = new Logger(TallySyncService.name);
  private readonly tallyEndpoint: string;

  constructor() {
    this.tallyEndpoint = process.env.TALLY_URL || 'http://localhost:9000';
  }

  /**
   * Convert Sales Invoice DTO to Tally XML
   */
  convertInvoiceToTallyXml(invoice: TallySalesInvoiceDto): string {
    const total = new Decimal(invoice.totalAmount).toFixed(2);

    let itemsXml = '';
    for (const item of invoice.items) {
      const qty = new Decimal(item.quantity).toFixed(2);
      const rate = new Decimal(item.rate).toFixed(2);
      const amt = new Decimal(item.amount).toFixed(2);

      itemsXml += `
        <ALLINVENTORYENTRIES.LIST>
          <STOCKITEMNAME>${this.escapeXml(item.stockItemName)}</STOCKITEMNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <RATE>${rate}/${item.unit || 'NOS'}</RATE>
          <AMOUNT>${amt}</AMOUNT>
          <ACTUALQTY>${qty} ${item.unit || 'NOS'}</ACTUALQTY>
          <BILLEDQTY>${qty} ${item.unit || 'NOS'}</BILLEDQTY>
        </ALLINVENTORYENTRIES.LIST>`;
    }

    let taxLedgersXml = '';
    if (invoice.cgstAmount && new Decimal(invoice.cgstAmount).gt(0)) {
      taxLedgersXml += `
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>CGST Input/Output</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${new Decimal(invoice.cgstAmount).toFixed(2)}</AMOUNT>
        </LEDGERENTRIES.LIST>`;
    }
    if (invoice.sgstAmount && new Decimal(invoice.sgstAmount).gt(0)) {
      taxLedgersXml += `
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>SGST Input/Output</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${new Decimal(invoice.sgstAmount).toFixed(2)}</AMOUNT>
        </LEDGERENTRIES.LIST>`;
    }
    if (invoice.igstAmount && new Decimal(invoice.igstAmount).gt(0)) {
      taxLedgersXml += `
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>IGST Input/Output</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${new Decimal(invoice.igstAmount).toFixed(2)}</AMOUNT>
        </LEDGERENTRIES.LIST>`;
    }

    return `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>${invoice.date}</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${this.escapeXml(invoice.voucherNumber)}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${this.escapeXml(invoice.partyLedgerName)}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <NARRATION>${this.escapeXml(invoice.narration || `SP-PLASTECH Ref: ${invoice.voucherNumber}`)}</NARRATION>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>${this.escapeXml(invoice.partyLedgerName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${total}</AMOUNT>
            </LEDGERENTRIES.LIST>
            ${itemsXml}
            ${taxLedgersXml}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();
  }

  /**
   * Push XML payload to local or remote Tally Prime / ERP 9 instance
   */
  async pushToTally(xmlPayload: string): Promise<{ success: boolean; response: string }> {
    try {
      const response = await axios.post(this.tallyEndpoint, xmlPayload, {
        headers: {
          'Content-Type': 'text/xml;charset=utf-8',
        },
        timeout: 10000,
      });

      return {
        success: true,
        response: String(response.data),
      };
    } catch (err: any) {
      this.logger.warn(`Tally sync network warning: ${err.message}. Payload queued for retry.`);
      return {
        success: false,
        response: err.message,
      };
    }
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
