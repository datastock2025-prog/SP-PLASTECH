import { Module } from '@nestjs/common';
import { AiGatewayController } from './ai-gateway.controller';
import { AiGatewayService } from './ai-gateway.service';
import { AiAuditService } from './ai-audit.service';
import { M2mApiKeyGuard } from './guards/m2m-api-key.guard';
import { TenantContextInterceptor } from './interceptors/tenant-context.interceptor';
import { AiChatModule } from '../ai-chat/ai-chat.module';

@Module({
  imports: [AiChatModule],
  controllers: [AiGatewayController],
  providers: [
    AiGatewayService,
    AiAuditService,
    M2mApiKeyGuard,
    TenantContextInterceptor,
  ],
  exports: [AiGatewayService, AiAuditService, M2mApiKeyGuard],
})
export class AiGatewayModule {}
