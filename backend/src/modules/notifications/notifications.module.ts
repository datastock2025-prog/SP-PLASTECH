import { Module } from '@nestjs/common';
import { EmailChannel } from './channels/email.channel';
import { SmsChannel } from './channels/sms.channel';
import { WhatsAppChannel } from './channels/whatsapp.channel';
import { InAppChannel } from './channels/in-app.channel';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RedisPubSubService } from '../../events/redis-pubsub.service';

@Module({
  providers: [
    EmailChannel,
    SmsChannel,
    WhatsAppChannel,
    InAppChannel,
    NotificationDispatcherService,
    RealtimeGateway,
    RedisPubSubService,
  ],
  exports: [NotificationDispatcherService, RealtimeGateway, RedisPubSubService],
})
export class NotificationsModule {}
