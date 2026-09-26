import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Decimal } from 'decimal.js';

export interface CreateOrderParams {
  tenantId: string;
  invoiceId: string;
  amountInr: number | Decimal;
  currency?: string;
  receiptNumber: string;
  notes?: Record<string, string>;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_sampleKeyId';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'sampleSecret123';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'sampleWebhookSecret123';
  }

  /**
   * Create Razorpay Order with amount converted to paise (INR * 100)
   */
  async createPaymentOrder(params: CreateOrderParams) {
    const amountInPaise = new Decimal(params.amountInr).times(100).round().toNumber();

    this.logger.log(`Creating Razorpay Order for invoice: ${params.invoiceId}, amount: ${amountInPaise} paise`);

    // In production, execute against Razorpay API
    const orderId = `order_${params.tenantId}_${Date.now()}`;

    return {
      orderId,
      amount: amountInPaise,
      currency: params.currency || 'INR',
      receipt: params.receiptNumber,
      status: 'created',
      keyId: this.keyId,
    };
  }

  /**
   * Verify Razorpay Payment Signature
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Verify Razorpay Webhook Signature
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  }
}
