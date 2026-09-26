import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationPayload, NotificationChannelType } from '../notification.interface';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly channelType: NotificationChannelType = 'IN_APP';
  private readonly logger = new Logger(InAppChannel.name);

  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  async send(payload: NotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.realtimeGateway.sendApprovalNotification(payload.userId, {
        approvalId: payload.data.approvalId || 'N/A',
        title: payload.subject || payload.templateName,
        entityType: payload.data.entityType || 'SYSTEM',
      });

      return {
        success: true,
        messageId: `inapp-${Date.now()}`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
