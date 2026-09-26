import { Controller, Post, Headers, Body, Req, HttpCode, HttpStatus, UnauthorizedException, Logger } from '@nestjs/common';
import { z } from 'zod';
import { RazorpayService } from './razorpay.service';

const WebhookPayloadSchema = z.object({
  entity: z.literal('event'),
  account_id: z.string().optional(),
  event: z.enum([
    'payment.captured',
    'payment.failed',
    'refund.processed',
    'order.paid',
  ]),
  contains: z.array(z.string()).optional(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        order_id: z.string().nullable().optional(),
        invoice_id: z.string().nullable().optional(),
        method: z.string().optional(),
        notes: z.record(z.any()).optional(),
      }),
    }).optional(),
    refund: z.object({
      entity: z.object({
        id: z.string(),
        payment_id: z.string(),
        amount: z.number(),
        status: z.string(),
      }),
    }).optional(),
  }),
  created_at: z.number(),
});

@Controller('api/v1/integrations/payments/webhook')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing Razorpay signature header');
    }

    // Verify signature
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid && process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Invalid Razorpay webhook signature');
    }

    // Parse and validate schema
    const parseResult = WebhookPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      this.logger.warn(`Invalid webhook schema: ${JSON.stringify(parseResult.error.issues)}`);
      return { status: 'ignored_invalid_schema' };
    }

    const event = parseResult.data;
    this.logger.log(`Received Payment Webhook Event: ${event.event}`);

    switch (event.event) {
      case 'payment.captured':
        const payment = event.payload.payment?.entity;
        this.logger.log(`Payment Captured: ${payment?.id}, Amount: ${payment?.amount}`);
        // Handle invoice settlement logic
        break;

      case 'payment.failed':
        this.logger.warn(`Payment Failed for order: ${event.payload.payment?.entity.order_id}`);
        break;

      case 'refund.processed':
        this.logger.log(`Refund Processed: ${event.payload.refund?.entity.id}`);
        break;

      default:
        this.logger.log(`Unhandled webhook event: ${event.event}`);
    }

    return { status: 'processed', event: event.event };
  }
}
