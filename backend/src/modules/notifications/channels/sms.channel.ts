import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { NotificationChannel, NotificationPayload, NotificationChannelType } from '../notification.interface';

@Injectable()
export class SmsChannel implements NotificationChannel {
  readonly channelType: NotificationChannelType = 'SMS';
  private readonly logger = new Logger(SmsChannel.name);
  private readonly authKey: string;

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY || 'sample_msg91_key';
  }

  async send(payload: NotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!payload.userPhone) {
      return { success: false, error: 'Recipient phone number not provided' };
    }

    this.logger.log(`Sending SMS to ${payload.userPhone} [Template: ${payload.templateName}]`);

    return {
      success: true,
      messageId: `sms-${Date.now()}`,
    };
  }
}
