import { Module } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { SessionService } from './session.service';
import { PasswordPolicyService } from './password-policy.service';
import { ApiKeyService } from './api-key.service';
import { MfaGuard } from './guards/mfa.guard';
import { SessionGuard } from './guards/session.guard';
import { IpWhitelistGuard } from './guards/ip-whitelist.guard';

@Module({
  providers: [
    MfaService,
    SessionService,
    PasswordPolicyService,
    ApiKeyService,
    MfaGuard,
    SessionGuard,
    IpWhitelistGuard,
  ],
  exports: [
    MfaService,
    SessionService,
    PasswordPolicyService,
    ApiKeyService,
    MfaGuard,
    SessionGuard,
    IpWhitelistGuard,
  ],
})
export class AuthModule {}
