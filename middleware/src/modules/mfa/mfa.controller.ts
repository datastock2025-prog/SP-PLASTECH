import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/auth.decorators';

@UseGuards(JwtAuthGuard)
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  async setupMfa(@CurrentUser() user: any) {
    const data = await this.mfaService.setupMfa(user.id, user.email);
    return {
      success: true,
      ...data,
    };
  }

  @Post('verify-setup')
  async verifySetup(
    @CurrentUser('id') userId: string,
    @Body('code') code: string
  ) {
    const success = await this.mfaService.verifySetup(userId, code);
    return {
      success,
      message: 'MFA successfully enabled.',
    };
  }

  @Post('create-challenge')
  async createChallenge(
    @CurrentUser('id') userId: string,
    @Body('actionContext') actionContext?: string
  ) {
    const challenge = await this.mfaService.createChallenge(userId, actionContext);
    return {
      success: true,
      ...challenge,
    };
  }

  @Post('verify-challenge')
  async verifyChallenge(
    @CurrentUser('id') userId: string,
    @Body('challengeId') challengeId: string,
    @Body('code') code: string,
    @Body('mode') mode: 'TOTP' | 'SMS' | 'RECOVERY' = 'TOTP'
  ) {
    const result = await this.mfaService.verifyChallenge(userId, challengeId, code, mode);
    return {
      success: true,
      ...result,
    };
  }
}
