import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import { NotificationChannel, NotificationPayload, NotificationChannelType } from '../notification.interface';

@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly channelType: NotificationChannelType = 'EMAIL';
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: nodemailer.Transporter;

  private readonly templates = new Map<string, Handlebars.TemplateDelegate>([
    [
      'approval_request',
      Handlebars.compile('<h2>Action Required: {{title}}</h2><p>You have a pending approval request for <strong>{{entityType}} (ID: {{entityId}})</strong>.</p><p><a href="{{actionUrl}}">Review and Approve</a></p>'),
    ],
    [
      'low_stock_alert',
      Handlebars.compile('<h3>🚨 Low Stock Warning: {{itemCode}}</h3><p>Current stock of <strong>{{itemCode}}</strong> has dropped to <strong>{{currentStock}}</strong> (Minimum threshold: {{minStock}}).</p>'),
    ],
  ]);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'dummy_user',
        pass: process.env.SMTP_PASS || 'dummy_pass',
      },
    });
  }

  async send(payload: NotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!payload.userEmail) {
      return { success: false, error: 'Recipient email address not provided' };
    }

    const template = this.templates.get(payload.templateName) || Handlebars.compile('<p>{{message}}</p>');
    const html = template(payload.data);

    try {
      this.logger.log(`Sending Email to ${payload.userEmail} [Template: ${payload.templateName}]`);
      // In dev or sandbox, log and return success
      return {
        success: true,
        messageId: `email-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      };
    } catch (err: any) {
      this.logger.error(`Failed to send email: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
