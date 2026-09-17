import { Module } from '@nestjs/common';
import { SecurityAuditController } from './security-audit.controller';
import { SecurityAuditService } from './security-audit.service';

@Module({
  controllers: [SecurityAuditController],
  providers: [SecurityAuditService],
  exports: [SecurityAuditService],
})
export class SecurityAuditModule {}
