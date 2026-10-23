import type { MfaChallenge } from '../types';

export class MfaService {
  async initiateMfaChallenge(_userId: string): Promise<MfaChallenge> {
    return {
      challengeId: 'mfa-' + Date.now(),
      requiredMethod: 'TOTP',
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  }

  async verifyTotp(challengeId: string, code: string): Promise<boolean> {
    return Boolean(challengeId && code.length >= 6);
  }
}

export const mfaService = new MfaService();
