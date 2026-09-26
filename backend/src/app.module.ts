import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ObservabilityService } from './observability/observability.service';
import { AuthModule } from './modules/auth/auth.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { DmsModule } from './modules/dms/dms.module';
import { MoldModule } from './modules/operations/mold/mold.module';
import { SpcModule } from './modules/quality/spc/spc.module';
import { SustainabilityModule } from './modules/sustainability/sustainability.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { AiGatewayModule } from './modules/ai-gateway/ai-gateway.module';

@Module({
  imports: [
    AuthModule,
    IntegrationsModule,
    NotificationsModule,
    WorkflowModule,
    DmsModule,
    MoldModule,
    SpcModule,
    SustainabilityModule,
    AiChatModule,
    AiGatewayModule,
  ],
  controllers: [],
  providers: [ObservabilityService],
  exports: [ObservabilityService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: () => void) => {
        // Attach request correlation ID
        const correlationId = req.headers['x-correlation-id'] || `req-${Date.now()}`;
        res.setHeader('X-Correlation-ID', correlationId);
        next();
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
