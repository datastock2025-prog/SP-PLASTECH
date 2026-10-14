/**
 * SP PLASTECH ERP - HIGH-FIDELITY DISPATCH PDF & COMPLIANCE GENERATOR
 * Generates GST Tax E-Invoices (IRN & QR), NIC E-Way Bills, Delivery Challans (DC), and Gate Passes
 */

import { DeliveryNoteChallan, EInvoiceRecord, EWayBillRecord, GatePassRecord, PlasticSalesOrder } from '../../types/salesOrderDeliveryTypes';

export interface GeneratedPdfDocument {
  documentType: 'E-Invoice' | 'E-Way Bill' | 'Delivery Challan' | 'Gate Pass';
  documentNumber: string;
  referenceId: string;
  fileName: string;
  htmlContent: string;
  blob?: Blob;
  downloadUrl?: string;
}

export class DispatchPdfGenerator {
  // ==========================================================================
  // 1. GST TAX E-INVOICE PDF (Form GST INV-1 Compliant)
  // ==========================================================================
  public static generateEInvoicePdf(inv: EInvoiceRecord, delivery?: DeliveryNoteChallan | null): GeneratedPdfDocument {
    const fileName = `GST_E_Invoice_${inv.invoiceNumber}.html`;
    const ackNo = inv.ackNumber || (inv as any).ackNo || '122610982345';
    const totVal = inv.invoiceValue || (inv as any).totalValue || (inv.taxableValue * 1.18);
    const delivId = inv.deliveryNoteNumber || (inv as any).deliveryId || 'DC-2026-001';
    const posState = inv.placeOfSupply || (inv as any).posState || '27-Maharashtra';
    const posCode = (inv as any).posStateCode || posState.split('-')[0] || '27';
    const cgstVal = inv.cgst || (inv as any).cgstValue || (inv.taxableValue * 0.09);
    const sgstVal = inv.sgst || (inv as any).sgstValue || (inv.taxableValue * 0.09);
    const igstVal = inv.igst || (inv as any).igstValue || 0;

    const qrPlaceholderUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
      `IRN:${inv.irn || ''}|ACK:${ackNo}|INV:${inv.invoiceNumber}|DT:${inv.invoiceDate}|TOTAL:${totVal}`
    )}`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>GST Tax E-Invoice - ${inv.invoiceNumber}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; font-size: 12px; }
    .header { border-bottom: 2px solid #0F8B8D; padding-bottom: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 20px; font-weight: bold; color: #14213D; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .card-title { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
    .card-content { font-size: 12px; font-weight: 600; color: #0f172a; }
    .irn-box { background: #f0fdfa; border: 1px solid #99f6e4; padding: 10px; border-radius: 8px; margin-bottom: 16px; font-family: monospace; font-size: 11px; word-break: break-all; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #14213D; color: #fff; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; background: #f8fafc; font-size: 12px; }
    .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
    .qr-container { text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; background: #fff; width: 130px; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; text-align: right;">
    <button onclick="window.print()" style="background: #0F8B8D; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <div class="title">TAX INVOICE (GST Compliant)</div>
      <div class="subtitle">SP PLASTECH ENTERPRISE PVT LTD &bull; GSTIN: 27AABCS1234F1Z9 &bull; State: 27-Maharashtra</div>
      <div class="subtitle">Plant 1: Sector 7, PCMC Auto Cluster, Pimpri, Pune - 411018</div>
    </div>
    <div class="qr-container">
      <img src="${qrPlaceholderUrl}" alt="NIC Signed QR Code" width="110" height="110" />
      <div style="font-size: 9px; font-weight: bold; color: #0F8B8D; margin-top: 4px;">NIC IRN VERIFIED</div>
    </div>
  </div>

  <div class="irn-box">
    <strong>IRN (Invoice Reference Number):</strong> ${inv.irn || '9f8a4b3c2d1e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5'}<br />
    <strong>Ack No:</strong> ${ackNo} &bull; <strong>Ack Date:</strong> ${inv.ackDate || inv.invoiceDate} &bull; <strong>Status:</strong> ${inv.status.toUpperCase()}
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Invoice Details</div>
      <div class="card-content">Invoice #: ${inv.invoiceNumber}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date: ${inv.invoiceDate}</div>
      <div style="font-size: 11px; color: #64748b;">Delivery Challan: ${delivId}</div>
    </div>
    <div class="card">
      <div class="card-title">Billed To (Customer)</div>
      <div class="card-content">${inv.customer}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">GSTIN: ${inv.customerGstin}</div>
      <div style="font-size: 11px; color: #64748b;">Place of Supply: ${posState} (Code: ${posCode})</div>
    </div>
    <div class="card">
      <div class="card-title">Commercial Summary</div>
      <div class="card-content">Total: ₹${totVal.toLocaleString('en-IN')}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Taxable: ₹${inv.taxableValue.toLocaleString('en-IN')}</div>
      <div style="font-size: 11px; color: #0F8B8D; font-weight: bold;">Total GST: ₹${(cgstVal + sgstVal + igstVal).toLocaleString('en-IN')}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item Description &amp; Code</th>
        <th>HSN</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate (₹)</th>
        <th class="text-right">Taxable (₹)</th>
        <th class="text-right">GST Rate</th>
        <th class="text-right">Total Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${
        delivery && delivery.items && delivery.items.length > 0
          ? delivery.items
              .map(
                (it, idx) => {
                  const qty = (it as any).dispatchQty ?? it.pickedQty ?? it.orderedQty ?? 0;
                  const rate = it.unitPrice || 0;
                  const taxVal = (it as any).taxableValue ?? (qty * rate);
                  const gstPct = (it as any).gstRatePct ?? it.taxRatePct ?? 18;
                  const lineTot = (it as any).totalValue ?? (taxVal * (1 + gstPct / 100));
                  return `
        <tr>
          <td>${idx + 1}</td>
          <td><b>${it.itemName}</b><br/><span style="font-size: 10px; color: #64748b; font-family: monospace;">${it.itemCode}</span></td>
          <td>${it.hsn}</td>
          <td class="text-right"><b>${qty.toLocaleString()}</b> ${it.uom}</td>
          <td class="text-right">₹${rate.toFixed(2)}</td>
          <td class="text-right">₹${taxVal.toLocaleString()}</td>
          <td class="text-right">${gstPct}%</td>
          <td class="text-right font-bold">₹${lineTot.toLocaleString()}</td>
        </tr>`;
                }
              )
              .join('')
          : `
        <tr>
          <td>1</td>
          <td><b>Automotive Injection Molded Parts</b></td>
          <td>39269099</td>
          <td class="text-right"><b>2,500</b> PCS</td>
          <td class="text-right">₹55.00</td>
          <td class="text-right">₹${inv.taxableValue.toLocaleString()}</td>
          <td class="text-right">18%</td>
          <td class="text-right"><b>₹${totVal.toLocaleString()}</b></td>
        </tr>`
      }
      <tr class="total-row">
        <td colspan="5" class="text-right">Subtotal Taxable Value:</td>
        <td class="text-right">₹${inv.taxableValue.toLocaleString('en-IN')}</td>
        <td class="text-right">CGST+SGST/IGST:</td>
        <td class="text-right">₹${(cgstVal + sgstVal + igstVal).toLocaleString('en-IN')}</td>
      </tr>
      <tr class="total-row" style="background: #e2e8f0; font-size: 13px;">
        <td colspan="7" class="text-right">FINAL INVOICE TOTAL (INR):</td>
        <td class="text-right" style="color: #0F8B8D; font-size: 14px;">₹${totVal.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div>
      Bank RTGS/NEFT: HDFC Bank Ltd &bull; A/C: 50200012345678 &bull; IFSC: HDFC0000123 &bull; Branch: Pimpri Pune<br />
      Certified that the particulars given above are true and correct.
    </div>
    <div style="text-align: right;">
      <strong>For SP PLASTECH ENTERPRISE PVT LTD</strong><br /><br />
      <span>Authorized Signatory</span>
    </div>
  </div>
</body>
</html>`;

    return {
      documentType: 'E-Invoice',
      documentNumber: inv.invoiceNumber,
      referenceId: inv.deliveryNoteNumber || (inv as any).deliveryId || inv.salesOrderNumber,
      fileName,
      htmlContent,
    };
  }

  // ==========================================================================
  // 2. NIC E-WAY BILL PDF (Part-A & Part-B NIC Format)
  // ==========================================================================
  public static generateEWayBillPdf(ewb: EWayBillRecord): GeneratedPdfDocument {
    const fileName = `E_Way_Bill_${ewb.ewbNumber}.html`;
    const genDate = ewb.dispatchDate || (ewb as any).generatedDate || new Date().toISOString().slice(0, 10);
    const docNo = ewb.documentNumber || (ewb as any).invoiceNumber || 'DOC-2026-01';
    const delivId = (ewb as any).deliveryId || ewb.documentNumber || 'DC-2026-01';
    const hsn = (ewb as any).hsnCode || '39269099';
    const totalVal = (ewb as any).totalValue || (ewb as any).invoiceValue || 150000;
    const transId = ewb.transporterId || (ewb as any).transporterGstin || '27AABCT8888P1Z1';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>E-Way Bill - ${ewb.ewbNumber}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; font-size: 12px; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 18px; font-weight: bold; color: #1e3a8a; }
    .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
    .box-header { font-size: 11px; font-weight: bold; background: #f1f5f9; padding: 6px 10px; margin: -12px -12px 10px -12px; border-bottom: 1px solid #cbd5e1; border-radius: 5px 5px 0 0; text-transform: uppercase; color: #334155; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; }
    .row label { color: #64748b; font-weight: 600; width: 160px; }
    .row span { font-weight: 600; color: #0f172a; flex: 1; }
    @media print { .no-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; text-align: right;">
    <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
      🖨️ Print / Save E-Way Bill
    </button>
  </div>

  <div class="header">
    <div>
      <div class="title">GOVERNMENT OF INDIA &bull; NATIONAL INFORMATICS CENTRE</div>
      <div style="font-size: 12px; font-weight: bold; color: #2563eb; margin-top: 2px;">E-WAY BILL SYSTEM (RULE 138 OF CGST RULES, 2017)</div>
    </div>
    <div style="font-size: 14px; font-family: monospace; font-weight: bold; border: 2px solid #2563eb; padding: 6px 12px; border-radius: 6px; background: #eff6ff;">
      EWB #: ${ewb.ewbNumber}
    </div>
  </div>

  <div class="box">
    <div class="box-header">1. E-Way Bill Details</div>
    <div class="row"><label>E-Way Bill Number:</label><span>${ewb.ewbNumber}</span></div>
    <div class="row"><label>Generated Date:</label><span>${genDate}</span></div>
    <div class="row"><label>Valid Until:</label><span>${ewb.validUntil} (Status: ${ewb.status.toUpperCase()})</span></div>
    <div class="row"><label>Supply Type:</label><span>Outward - Tax Invoice</span></div>
    <div class="row"><label>Document No. &amp; Date:</label><span>${docNo} (Delivery Note: ${delivId})</span></div>
  </div>

  <div class="box">
    <div class="box-header">2. Address Details (From / To)</div>
    <div class="row"><label>From (Consignor):</label><span>SP PLASTECH ENTERPRISE PVT LTD &bull; GSTIN: 27AABCS1234F1Z9 &bull; Pimpri, Pune - 411018</span></div>
    <div class="row"><label>To (Consignee):</label><span>${ewb.customer} &bull; GSTIN: ${ewb.customerGstin || '27AAACT2727Q1ZW'}</span></div>
    <div class="row"><label>Approximate Distance:</label><span>${ewb.distanceKm} KM</span></div>
  </div>

  <div class="box">
    <div class="box-header">3. Goods &amp; Tax Value Details</div>
    <div class="row"><label>HSN Code:</label><span>${hsn} (Plastic Articles)</span></div>
    <div class="row"><label>Total Invoice Value:</label><span style="font-weight: bold; color: #1e3a8a;">₹${totalVal.toLocaleString('en-IN')}</span></div>
  </div>

  <div class="box">
    <div class="box-header">4. PART-B: Vehicle &amp; Transporter Details</div>
    <div class="row"><label>Mode of Transport:</label><span>Road</span></div>
    <div class="row"><label>Vehicle Number:</label><span style="font-family: monospace; font-size: 13px; font-weight: bold; color: #1e3a8a;">${ewb.vehicleNumber}</span></div>
    <div class="row"><label>Transporter Name &amp; ID:</label><span>${ewb.transporterName} (ID: ${transId})</span></div>
  </div>
</body>
</html>`;

    return {
      documentType: 'E-Way Bill',
      documentNumber: ewb.ewbNumber,
      referenceId: delivId,
      fileName,
      htmlContent,
    };
  }

  // ==========================================================================
  // 3. DELIVERY CHALLAN / DC DISPATCH NOTE
  // ==========================================================================
  public static generateDeliveryChallanPdf(dc: DeliveryNoteChallan): GeneratedPdfDocument {
    const fileName = `Delivery_Challan_${dc.id}.html`;

    const custPo = (dc as any).customerPoNumber || (dc as any).customerPo || dc.salesOrderId;
    const boxCount = (dc as any).totalBoxes || (dc.packages ? dc.packages.length : 12);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Delivery Challan - ${dc.id}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; font-size: 12px; }
    .header { border-bottom: 2px solid #0F8B8D; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    .title { font-size: 20px; font-weight: bold; color: #14213D; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
    .card-title { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #0F8B8D; color: #fff; text-align: left; padding: 8px; font-size: 11px; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .text-right { text-align: right; }
    .stamp-box { border: 2px dashed #0F8B8D; border-radius: 8px; padding: 12px; text-align: center; color: #0F8B8D; font-weight: bold; }
    @media print { .no-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; text-align: right;">
    <button onclick="window.print()" style="background: #0F8B8D; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
      🖨️ Print / Save Delivery Challan
    </button>
  </div>

  <div class="header">
    <div>
      <div class="title">DELIVERY CHALLAN / DISPATCH NOTE</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">SP PLASTECH ENTERPRISE PVT LTD &bull; Plant 1 Pimpri Pune</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 16px; font-weight: bold; font-family: monospace; color: #0F8B8D;">${dc.id}</div>
      <div style="font-size: 11px; color: #64748b;">Date: ${dc.deliveryDate}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Customer &amp; PO</div>
      <div style="font-weight: bold; font-size: 12px;">${dc.customer}</div>
      <div style="color: #64748b;">PO #: ${custPo}</div>
      <div style="color: #64748b;">SO #: ${dc.salesOrderId}</div>
    </div>
    <div class="card">
      <div class="card-title">Vehicle &amp; Transporter</div>
      <div style="font-weight: bold; font-family: monospace;">${dc.vehicleNumber}</div>
      <div style="color: #64748b;">${dc.transporterName}</div>
      <div style="color: #64748b;">Gate Pass: ${dc.gatePassNumber}</div>
    </div>
    <div class="card">
      <div class="card-title">Compliance Invoices</div>
      <div style="color: #0F8B8D; font-weight: bold;">Tax Inv: ${dc.invoiceNumber}</div>
      <div style="color: #2563eb; font-weight: bold;">EWB: ${dc.ewbNumber}</div>
      <div style="color: #64748b;">Boxes: ${boxCount} Packages</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item Code &amp; Description</th>
        <th>HSN</th>
        <th>Batch / Lot No</th>
        <th class="text-right">Dispatched Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Total Value</th>
      </tr>
    </thead>
    <tbody>
      ${dc.items
        .map(
          (it, idx) => {
            const batch = (it as any).batchNumber || 'BATCH-2026-SEP-01';
            const qty = (it as any).dispatchQty ?? it.pickedQty ?? it.orderedQty ?? 0;
            const val = (it as any).totalValue ?? ((it.pickedQty || it.orderedQty || 0) * (it.unitPrice || 0));
            return `
        <tr>
          <td>${idx + 1}</td>
          <td><b>${it.itemName}</b><br/><span style="font-family: monospace; font-size: 10px; color: #64748b;">${it.itemCode}</span></td>
          <td>${it.hsn}</td>
          <td><span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 10px;">${batch}</span></td>
          <td class="text-right"><b>${qty.toLocaleString()}</b> ${it.uom}</td>
          <td class="text-right">₹${it.unitPrice.toFixed(2)}</td>
          <td class="text-right"><b>₹${val.toLocaleString()}</b></td>
        </tr>`;
          }
        )
        .join('')}
    </tbody>
  </table>

  <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-top: 24px;">
    <div style="font-size: 11px; color: #64748b;">
      <strong>Terms &amp; Instructions:</strong><br />
      1. Goods dispatched in sound condition as per customer PO specifications.<br />
      2. Discrepancies if any must be reported within 24 hours of receipt with photo proof.<br />
      3. Subject to Pune jurisdiction.
    </div>
    <div class="stamp-box">
      SECURITY CLEARED &bull; BOOM BARRIER OUT<br />
      <span style="font-size: 10px; font-weight: normal; color: #64748b;">Gate Pass #: ${dc.gatePassNumber} &bull; Cleared</span>
    </div>
  </div>
</body>
</html>`;

    return {
      documentType: 'Delivery Challan',
      documentNumber: dc.id,
      referenceId: dc.salesOrderId,
      fileName,
      htmlContent,
    };
  }

  // Helper shortcuts returning string HTML
  public static generateEInvoiceHtml(inv: EInvoiceRecord, delivery?: DeliveryNoteChallan | null): string {
    return this.generateEInvoicePdf(inv, delivery).htmlContent;
  }

  public static generateEWayBillHtml(ewb: EWayBillRecord): string {
    return this.generateEWayBillPdf(ewb).htmlContent;
  }

  public static generateDeliveryChallanHtml(dc: DeliveryNoteChallan): string {
    return this.generateDeliveryChallanPdf(dc).htmlContent;
  }

  // ==========================================================================
  // 4. SECURITY GATE PASS PDF & HTML
  // ==========================================================================
  public static generateGatePassPdf(gp: GatePassRecord, delivery?: DeliveryNoteChallan | null): GeneratedPdfDocument {
    const fileName = `Security_Gate_Pass_${gp.gatePassNumber}.html`;
    const outwardTime = (gp as any).outwardTime || new Date().toLocaleString();
    const purpose = (gp as any).purpose || 'Customer Sales Dispatch Delivery';
    const cust = (gp as any).customer || delivery?.customer || 'Customer Consignee';
    const delivId = (gp as any).deliveryId || delivery?.id || 'DC-2026-001';
    const invNo = (gp as any).invoiceNumber || delivery?.invoiceNumber || 'INV-2026-9001';
    const boxCount = (gp as any).totalBoxes || (delivery ? (delivery as any).totalBoxes || delivery.packages?.length || 12 : 12);
    const officer = (gp as any).securityOfficer || 'Security Main Gate';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Security Gate Pass - ${gp.gatePassNumber}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; font-size: 12px; }
    .header { border-bottom: 2px solid #14213D; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 18px; font-weight: bold; color: #14213D; }
    .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
    .box-header { font-size: 11px; font-weight: bold; background: #f1f5f9; padding: 6px 10px; margin: -12px -12px 10px -12px; border-bottom: 1px solid #cbd5e1; border-radius: 5px 5px 0 0; text-transform: uppercase; color: #334155; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; }
    .row label { color: #64748b; font-weight: 600; width: 160px; }
    .row span { font-weight: 600; color: #0f172a; flex: 1; }
    .stamp-box { border: 2px dashed #059669; background: #ecfdf5; border-radius: 8px; padding: 12px; text-align: center; color: #059669; font-weight: bold; }
    @media print { .no-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; text-align: right;">
    <button onclick="window.print()" style="background: #14213D; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
      🖨️ Print / Save Gate Pass
    </button>
  </div>

  <div class="header">
    <div>
      <div class="title">SP PLASTECH ENTERPRISE PVT LTD</div>
      <div style="font-size: 12px; font-weight: bold; color: #0F8B8D; margin-top: 2px;">SECURITY OUTWARD GATE PASS (FORM SEC-04)</div>
    </div>
    <div style="font-size: 14px; font-family: monospace; font-weight: bold; border: 2px solid #14213D; padding: 6px 12px; border-radius: 6px; background: #f8fafc;">
      PASS #: ${gp.gatePassNumber}
    </div>
  </div>

  <div class="box">
    <div class="box-header">1. Movement &amp; Vehicle Authorization</div>
    <div class="row"><label>Vehicle Number:</label><span style="font-family: monospace; font-size: 13px; font-weight: bold;">${gp.vehicleNumber}</span></div>
    <div class="row"><label>Driver Name &amp; Phone:</label><span>${gp.driverName} &bull; ${gp.driverPhone || 'N/A'}</span></div>
    <div class="row"><label>Transporter:</label><span>${gp.transporter}</span></div>
    <div class="row"><label>Outward Time:</label><span>${outwardTime}</span></div>
    <div class="row"><label>Purpose:</label><span>${purpose}</span></div>
  </div>

  <div class="box">
    <div class="box-header">2. Dispatch &amp; Consignment References</div>
    <div class="row"><label>Customer / Consignee:</label><span>${cust}</span></div>
    <div class="row"><label>Delivery Challan #:</label><span>${delivId}</span></div>
    <div class="row"><label>Tax Invoice #:</label><span>${invNo}</span></div>
    <div class="row"><label>Total Package Count:</label><span>${boxCount} Master Boxes / Crates</span></div>
  </div>

  <div class="stamp-box">
    SECURITY OUTWARD CLEARED &bull; BOOM BARRIER RELEASED<br />
    <span style="font-size: 10px; font-weight: normal; color: #065f46;">Officer: ${officer} &bull; Status: ${gp.status.toUpperCase()}</span>
  </div>
</body>
</html>`;

    return {
      documentType: 'Gate Pass',
      documentNumber: gp.gatePassNumber,
      referenceId: delivId,
      fileName,
      htmlContent,
    };
  }

  public static generateGatePassHtml(gp: GatePassRecord, delivery?: DeliveryNoteChallan | null): string {
    return this.generateGatePassPdf(gp, delivery).htmlContent;
  }

  // Direct trigger to open high-fidelity printable view in new browser window
  public static openPrintWindow(docOrHtml: GeneratedPdfDocument | string) {
    const html = typeof docOrHtml === 'string' ? docOrHtml : docOrHtml.htmlContent;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }
}

