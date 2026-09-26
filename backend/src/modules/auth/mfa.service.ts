import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface MfaSetupResult {
  secret: string;
  qrCodeUri: string;
  backupCodes: string[];
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  /**
   * Generate Base32 TOTP secret, QR code URI, and single-use backup recovery codes
   */
  generateMfaSecret(userEmail: string, issuer: string = 'SP-PLASTECH ERP'): MfaSetupResult {
    // Generate 20-byte random secret encoded as Base32
    const buffer = crypto.randomBytes(20);
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < buffer.length; i++) {
      secret += base32Chars[buffer[i] % 32];
    }

    const encodedIssuer = encodeURIComponent(issuer);
    const encodedUser = encodeURIComponent(userEmail);
    const qrCodeUri = `otpauth://totp/${encodedIssuer}:${encodedUser}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

    // Generate 8 cryptographically secure 8-character backup recovery codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    return {
      secret,
      qrCodeUri,
      backupCodes,
    };
  }

  /**
   * Verify TOTP 6-digit code against secret with time window tolerance
   */
  verifyTotpToken(secret: string, token: string, windowSteps: number = 1): boolean {
    if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
      return false;
    }

    const epoch = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(epoch / 30);

    for (let i = -windowSteps; i <= windowSteps; i++) {
      const step = currentStep + i;
      const expectedToken = this.computeTotpCode(secret, step);
      if (expectedToken === token) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verify and consume a one-time backup recovery code
   */
  verifyAndConsumeBackupCode(
    providedCode: string,
    hashedBackupCodes: string[],
  ): { valid: boolean; remainingHashedCodes: string[] } {
    const cleanProvided = providedCode.trim().toUpperCase();
    const providedHash = crypto.createHash('sha256').update(cleanProvided).digest('hex');

    const index = hashedBackupCodes.indexOf(providedHash);
    if (index !== -1) {
      const remaining = [...hashedBackupCodes];
      remaining.splice(index, 1);
      return { valid: true, remainingHashedCodes: remaining };
    }

    return { valid: false, remainingHashedCodes: hashedBackupCodes };
  }

  /**
   * Internal RFC 6238 TOTP computation
   */
  private computeTotpCode(secretBase32: string, step: number): string {
    const key = this.base32ToBuffer(secretBase32);
    const msg = Buffer.alloc(8);
    msg.writeBigInt64BE(BigInt(step));

    const hmac = crypto.createHmac('sha1', key).update(msg).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = (code % 1000000).toString().padStart(6, '0');
    return otp;
  }

  private base32ToBuffer(base32: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (let i = 0; i < base32.length; i++) {
      const idx = alphabet.indexOf(base32[i].toUpperCase());
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }
}
