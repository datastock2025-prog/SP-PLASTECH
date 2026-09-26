import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationPayload,
  NotificationChannel,
  NotificationChannelType,
  UserNotificationPreference,
} from './notification.interface';
import { EmailChannel } from './channels/email.channel';
import { SmsChannel } from './channels/sms.channel';
import { WhatsAppChannel } from './channels/whatsapp.channel';
import { InAppChannel } from './channels/in-app.channel';

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);
  private readonly channels = new Map<NotificationChannelType, NotificationChannel>();

  constructor(
    private readonly emailChannel: EmailChannel,
    private readonly smsChannel: SmsChannel,
    private readonly whatsAppChannel: WhatsAppChannel,
    private readonly inAppChannel: InAppChannel,
  ) {
    this.channels.set('EMAIL', this.emailChannel);
    this.channels.set('SMS', this.smsChannel);
    this.channels.set('WHATSAPP', this.whatsAppChannel);
    this.channels.set('IN_APP', this.inAppChannel);
  }

  /**
   * Dispatch notification asynchronously across user-allowed channels
   */
  async dispatch(
    payload: NotificationPayload,
    userPreferences?: UserNotificationPreference,
  ): Promise<Record<NotificationChannelType, boolean>> {
    const results: Record<string, boolean> = {};

    const targetChannels: NotificationChannelType[] = payload.channels || ['EMAIL', 'IN_APP'];

    for (const chType of targetChannels) {
      // Check user preferences if supplied
      if (userPreferences) {
        if (chType === 'EMAIL' && !userPreferences.emailEnabled) continue;
        if (chType === 'SMS' && !userPreferences.smsEnabled) continue;
        if (chType === 'WHATSAPP' && !userPreferences.whatsappEnabled) continue;
        if (chType === 'IN_APP' && !userPreferences.inAppEnabled) continue;
      }

      const channel = this.channels.get(chType);
      if (channel) {
        // Execute dispatch non-blocking
        try {
          const res = await channel.send(payload);
          results[chType] = res.success;
        } catch (err: any) {
          this.logger.error(`Channel ${chType} failed: ${err.message}`);
          results[chType] = false;
        }
      }
    }

    return results as Record<NotificationChannelType, boolean>;
  }
}
