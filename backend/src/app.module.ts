import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ObservabilityService } from './observability/observability.service';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';

@Module({
  imports: [AiChatModule],
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
