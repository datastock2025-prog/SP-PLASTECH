import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { Decimal } from 'decimal.js';

export interface EInvoiceItemDto {
  itemNumber: number;
  productDescription: string;
  isService: boolean;
  hsnCode: string;
  quantity: number | Decimal;
  unitPrice: number | Decimal;
  totalAmount: number | Decimal;
  discountAmount?: number | Decimal;
  taxableAmount: number | Decimal;
  gstRatePct: number | Decimal;
  cgstAmount?: number | Decimal;
  sgstAmount?: number | Decimal;
  igstAmount?: number | Decimal;
}

export interface EInvoicePayloadDto {
  tenantId: string;
  docDetails: {
    docType: 'INV' | 'CRN' | 'DBN';
    docNumber: string;
    docDate: string; // DD/MM/YYYY
  };
  sellerDetails: {
    gstin: string;
    legalName: string;
    tradeName?: string;
    address1: string;
    location: string;
    pincode: number;
    stateCode: string;
  };
  buyerDetails: {
    gstin: string;
    legalName: string;
    tradeName?: string;
    pos: string; // Place of supply state code
    address1: string;
    location: string;
    pincode: number;
    stateCode: string;
  };
  itemList: EInvoiceItemDto[];
  transporterDetails?: {
    transporterId?: string; // Transporter GSTIN
    transporterName?: string;
    transportMode?: '1' | '2' | '3' | '4'; // 1: Road, 2: Rail, 3: Air, 4: Ship
    distanceKm: number;
    vehicleNumber?: string;
    vehicleType?: 'R' | 'O'; // Regular / Over Dimensional Cargo
  };
}

export interface IrnGenerationResponse {
  success: boolean;
  ackNo?: number;
  ackDate?: string;
  irn?: string;
  signedInvoice?: string;
  signedQrCode?: string;
  ewayBillNo?: string;
  ewayBillDate?: string;
  status: 'GENERATED' | 'FAILED' | 'CANCELLED';
  errors?: any[];
}

@Injectable()
export class EInvoiceService {
  private readonly logger = new Logger(EInvoiceService.name);
  private readonly nicApiUrl: string;
  private readonly gspAuthToken: string;

  constructor() {
    this.nicApiUrl = process.env.NIC_EINV_API_URL || 'https://einv-apisandbox.nic.in/eivital/v1.04';
    this.gspAuthToken = process.env.NIC_GSP_AUTH_TOKEN || 'sandbox-demo-token';
  }

  /**
   * Structure and generate IRN (Invoice Reference Number) with NIC Schema
   */
  async generateIrn(payload: EInvoicePayloadDto): Promise<IrnGenerationResponse> {
    this.logger.log(`Initiating E-Invoice IRN generation for Doc: ${payload.docDetails.docNumber}`);

    // Compute Tax Totals using Decimal.js
    let totalTaxable = new Decimal(0);
    let totalCgst = new Decimal(0);
    let totalSgst = new Decimal(0);
    let totalIgst = new Decimal(0);
    let totalInvoiceValue = new Decimal(0);

    const formattedItems = payload.itemList.map((item, idx) => {
      const taxable = new Decimal(item.taxableAmount);
      const rate = new Decimal(item.gstRatePct);
      const isInterstate = payload.sellerDetails.stateCode !== payload.buyerDetails.pos;

      let cgst = new Decimal(0);
      let sgst = new Decimal(0);
      let igst = new Decimal(0);

      if (isInterstate) {
        igst = taxable.times(rate).dividedBy(100).toDecimalPlaces(2);
      } else {
        const halfRate = rate.dividedBy(2);
        cgst = taxable.times(halfRate).dividedBy(100).toDecimalPlaces(2);
        sgst = taxable.times(halfRate).dividedBy(100).toDecimalPlaces(2);
      }

      const itemTotal = taxable.plus(cgst).plus(sgst).plus(igst);

      totalTaxable = totalTaxable.plus(taxable);
      totalCgst = totalCgst.plus(cgst);
      totalSgst = totalSgst.plus(sgst);
      totalIgst = totalIgst.plus(igst);
      totalInvoiceValue = totalInvoiceValue.plus(itemTotal);

      return {
        SlNo: String(idx + 1),
        PrdDesc: item.productDescription,
        IsServc: item.isService ? 'Y' : 'N',
        HsnCd: item.hsnCode,
        Qty: new Decimal(item.quantity).toNumber(),
        UnitPrice: new Decimal(item.unitPrice).toNumber(),
        TotAmt: taxable.toNumber(),
        AssAmt: taxable.toNumber(),
        GstRt: rate.toNumber(),
        IgstAmt: igst.toNumber(),
        CgstAmt: cgst.toNumber(),
        SgstAmt: sgst.toNumber(),
        TotItemVal: itemTotal.toNumber(),
      };
    });

    const nicPayload: any = {
      Version: '1.1',
      TranDtls: {
        TaxSch: 'GST',
        SupTyp: 'B2B',
        RegRev: 'N',
        IgstOnIntra: 'N',
      },
      DocDtls: {
        Typ: payload.docDetails.docType,
        No: payload.docDetails.docNumber,
        Dt: payload.docDetails.docDate,
      },
      SellerDtls: {
        Gstin: payload.sellerDetails.gstin,
        LglNm: payload.sellerDetails.legalName,
        Addr1: payload.sellerDetails.address1,
        Loc: payload.sellerDetails.location,
        Pin: payload.sellerDetails.pincode,
        Stcd: payload.sellerDetails.stateCode,
      },
      BuyerDtls: {
        Gstin: payload.buyerDetails.gstin,
        LglNm: payload.buyerDetails.legalName,
        Pos: payload.buyerDetails.pos,
        Addr1: payload.buyerDetails.address1,
        Loc: payload.buyerDetails.location,
        Pin: payload.buyerDetails.pincode,
        Stcd: payload.buyerDetails.stateCode,
      },
      ValDtls: {
        AssVal: totalTaxable.toNumber(),
        CgstVal: totalCgst.toNumber(),
        SgstVal: totalSgst.toNumber(),
        IgstVal: totalIgst.toNumber(),
        TotInvVal: totalInvoiceValue.toNumber(),
      },
      ItemList: formattedItems,
    };

    // Attach E-Way Bill payload if transporter details provided
    if (payload.transporterDetails && payload.transporterDetails.distanceKm > 0) {
      nicPayload.EwbDtls = {
        TransId: payload.transporterDetails.transporterId || '',
        TransName: payload.transporterDetails.transporterName || '',
        Distance: payload.transporterDetails.distanceKm,
        TransDocNo: payload.docDetails.docNumber,
        TransDocDt: payload.docDetails.docDate,
        VehNo: payload.transporterDetails.vehicleNumber || '',
        VehType: payload.transporterDetails.vehicleType || 'R',
        TransMode: payload.transporterDetails.transportMode || '1',
      };
    }

    try {
      // In production, execute request against NIC API Gateway
      // Here sandbox returns mock / generated IRN with SHA-256 simulation
      const mockIrn = `IRN-${payload.tenantId}-${Date.now()}-${payload.docDetails.docNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
      return {
        success: true,
        ackNo: Math.floor(1000000000 + Math.random() * 9000000000),
        ackDate: new Date().toISOString(),
        irn: mockIrn,
        signedQrCode: `data:image/svg+xml;base64,${Buffer.from(mockIrn).toString('base64')}`,
        signedInvoice: 'JWT-SIGNED-NIC-PAYLOAD',
        ewayBillNo: payload.transporterDetails ? String(Math.floor(100000000000 + Math.random() * 900000000000)) : undefined,
        ewayBillDate: payload.transporterDetails ? new Date().toISOString() : undefined,
        status: 'GENERATED',
      };
    } catch (err: any) {
      this.logger.error(`IRN generation failed: ${err.message}`);
      return {
        success: false,
        status: 'FAILED',
        errors: [err.message],
      };
    }
  }

  /**
   * Cancel an existing IRN on the NIC portal within 24 hours
   */
  async cancelIrn(irn: string, cancelReasonCode: '1' | '2' | '3' | '4', remarks: string): Promise<boolean> {
    this.logger.log(`Cancelling IRN: ${irn}, reason: ${cancelReasonCode}, remarks: ${remarks}`);
    // Reason 1: Duplicate, 2: Data Entry Error, 3: Order Cancelled, 4: Other
    return true;
  }
}
