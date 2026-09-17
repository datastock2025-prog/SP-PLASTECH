import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { MfaModule } from './modules/mfa/mfa.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { SecurityAuditModule } from './modules/security-audit/security-audit.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { BusinessModule } from './modules/business/business.module';
import { AdminModule } from './modules/admin/admin.module';
import { CsrfDoubleSubmitMiddleware } from './common/middleware/csrf.middleware';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MfaModule,
    RbacModule,
    SecurityAuditModule,
    ComplianceModule,
    WebSocketModule,
    BusinessModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfDoubleSubmitMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
