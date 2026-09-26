export type NotificationChannelType = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';

export interface NotificationPayload {
  tenantId: string;
  userId: string;
  userEmail?: string;
  userPhone?: string;
  templateName: string;
  subject?: string;
  data: Record<string, any>;
  channels?: NotificationChannelType[];
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface UserNotificationPreference {
  userId: string;
  tenantId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  inAppEnabled: boolean;
}

export interface NotificationChannel {
  readonly channelType: NotificationChannelType;
  send(payload: NotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
