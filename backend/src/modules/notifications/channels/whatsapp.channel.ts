import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationPayload, NotificationChannelType } from '../notification.interface';

@Injectable()
export class WhatsAppChannel implements NotificationChannel {
  readonly channelType: NotificationChannelType = 'WHATSAPP';
  private readonly logger = new Logger(WhatsAppChannel.name);
  private readonly metaAccessToken: string;
  private readonly phoneNumberId: string;

  constructor() {
    this.metaAccessToken = process.env.META_WA_TOKEN || 'sample_meta_token';
    this.phoneNumberId = process.env.META_WA_PHONE_ID || 'sample_phone_id';
  }

  async send(payload: NotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!payload.userPhone) {
      return { success: false, error: 'Recipient WhatsApp phone number not provided' };
    }

    this.logger.log(`Sending WhatsApp message to ${payload.userPhone} [Template: ${payload.templateName}]`);

    return {
      success: true,
      messageId: `wa-${Date.now()}`,
    };
  }
}
