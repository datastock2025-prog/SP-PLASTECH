import { Module } from '@nestjs/common';
import { EInvoiceService } from './gst/einvoice.service';
import { TallySyncService } from './tally/tally-sync.service';
import { RazorpayService } from './payments/razorpay.service';
import { PaymentWebhookController } from './payments/payment-webhook.controller';
import { BankReconciliationService } from './payments/bank-reconciliation.service';

@Module({
  controllers: [PaymentWebhookController],
  providers: [
    EInvoiceService,
    TallySyncService,
    RazorpayService,
    BankReconciliationService,
  ],
  exports: [
    EInvoiceService,
    TallySyncService,
    RazorpayService,
    BankReconciliationService,
  ],
})
export class IntegrationsModule {}
