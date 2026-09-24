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
import { ApprovalWorkflowModule } from './modules/approval-workflow/approval-workflow.module';
import { ScmModule } from './modules/scm/scm.module';
import { MfgQualityModule } from './modules/mfg-quality/mfg-quality.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HealthModule } from './modules/health/health.module';
import { HomeToolsModule } from './modules/home-tools/home-tools.module';
import { FrontOfficeModule } from './modules/front-office/front-office.module';
import { OperationsModule } from './modules/operations/operations.module';
import { PlanningModule } from './modules/planning/planning.module';
import { HrModule } from './modules/hr/hr.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { CsrfDoubleSubmitMiddleware } from './common/middleware/csrf.middleware';

@Module({
  imports: [
    DatabaseModule,
    ObservabilityModule,
    AuthModule,
    MfaModule,
    RbacModule,
    SecurityAuditModule,
    ComplianceModule,
    WebSocketModule,
    BusinessModule,
    AdminModule,
    ApprovalWorkflowModule,
    ScmModule,
    MfgQualityModule,
    FinanceModule,
    HealthModule,
    HomeToolsModule,
    FrontOfficeModule,
    OperationsModule,
    PlanningModule,
    HrModule,
    ProcurementModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfDoubleSubmitMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
