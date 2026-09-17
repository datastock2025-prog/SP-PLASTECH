import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(private readonly db: DatabaseService) {}

  public async setupMfa(userId: string, userEmail: string) {
    const secret = generateSecret();
    const appName = 'Reboot ERP (Manufacturing)';
    const otpAuthUrl = generateURI({
      issuer: appName,
      label: userEmail,
      secret,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Generate 8 backup recovery codes
    const plainRecoveryCodes: string[] = [];
    const hashedRecoveryCodes: string[] = [];

    for (let i = 0; i < 8; i++) {
      const code = `${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      plainRecoveryCodes.push(code);
      hashedRecoveryCodes.push(await bcrypt.hash(code, 10));
    }

    // Save secret and recovery codes to DB
    await this.db.query(
      `INSERT INTO user_mfa_credentials (user_id, is_mfa_enabled, totp_secret, recovery_codes)
       VALUES ($1, false, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET totp_secret = $2, recovery_codes = $3, is_mfa_enabled = false`,
      [userId, secret, JSON.stringify(hashedRecoveryCodes)]
    );

    return {
      secret,
      qrCodeDataUrl,
      recoveryCodes: plainRecoveryCodes,
    };
  }

  public async verifySetup(userId: string, code: string): Promise<boolean> {
    const credRes = await this.db.query(
      `SELECT totp_secret FROM user_mfa_credentials WHERE user_id = $1`,
      [userId]
    );

    if (credRes.rows.length === 0 || !credRes.rows[0].totp_secret) {
      throw new BadRequestException('MFA setup has not been initiated.');
    }

    const secret = credRes.rows[0].totp_secret;
    const verifyResult = verifySync({ token: code, secret });
    const isValid = verifyResult.valid;

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code.');
    }

    // Activate MFA
    await this.db.query(
      `UPDATE user_mfa_credentials SET is_mfa_enabled = true, last_verified_at = NOW() WHERE user_id = $1`,
      [userId]
    );
    await this.db.query(`UPDATE auth_users SET mfa_enabled = true WHERE id = $1`, [userId]);

    return true;
  }

  public async createChallenge(userId: string, actionContext = 'CRITICAL_ACTION') {
    const challengeId = `CHAL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.db.query(
      `INSERT INTO user_mfa_challenges (challenge_id, user_id, required_method, action_context, is_completed, expires_at)
       VALUES ($1, $2, 'TOTP', $3, false, $4)`,
      [challengeId, userId, actionContext, expiresAt]
    );

    return {
      challengeId,
      expiresAt: expiresAt.getTime(),
      actionContext,
    };
  }

  public async verifyChallenge(
    userId: string,
    challengeId: string,
    code: string,
    mode: 'TOTP' | 'SMS' | 'RECOVERY' = 'TOTP'
  ): Promise<{ elevatedToken: string; expiresIn: number }> {
    const chalRes = await this.db.query(
      `SELECT * FROM user_mfa_challenges WHERE challenge_id = $1 AND user_id = $2 AND is_completed = false AND expires_at > NOW()`,
      [challengeId, userId]
    );

    if (chalRes.rows.length === 0) {
      throw new UnauthorizedException({
        code: 'CHALLENGE_EXPIRED_OR_INVALID',
        message: 'Step-up challenge is invalid or has expired.',
      });
    }

    let isVerified = false;

    if (mode === 'TOTP') {
      const credRes = await this.db.query(
        `SELECT totp_secret FROM user_mfa_credentials WHERE user_id = $1`,
        [userId]
      );
      if (credRes.rows.length > 0 && credRes.rows[0].totp_secret) {
        const verifyRes = verifySync({ token: code, secret: credRes.rows[0].totp_secret });
        isVerified = verifyRes.valid;
      }
    } else if (mode === 'RECOVERY') {
      const credRes = await this.db.query(
        `SELECT recovery_codes FROM user_mfa_credentials WHERE user_id = $1`,
        [userId]
      );
      if (credRes.rows.length > 0) {
        const hashes: string[] = typeof credRes.rows[0].recovery_codes === 'string'
          ? JSON.parse(credRes.rows[0].recovery_codes)
          : credRes.rows[0].recovery_codes;

        for (const h of hashes) {
          if (await bcrypt.compare(code, h)) {
            isVerified = true;
            // Burn used recovery code
            const remaining = hashes.filter((item) => item !== h);
            await this.db.query(
              `UPDATE user_mfa_credentials SET recovery_codes = $1 WHERE user_id = $2`,
              [JSON.stringify(remaining), userId]
            );
            break;
          }
        }
      }
    }

    if (!isVerified) {
      throw new UnauthorizedException('Authentication code verification failed.');
    }

    // Mark challenge completed
    await this.db.query(
      `UPDATE user_mfa_challenges SET is_completed = true WHERE challenge_id = $1`,
      [challengeId]
    );

    // Issue short-lived elevated token with `isMfaElevated: true` (valid for 5 mins)
    const elevatedToken = jwt.sign(
      {
        id: userId,
        challengeId,
        isMfaElevated: true,
      },
      JWT_SECRET,
      { expiresIn: 300 }
    );

    return {
      elevatedToken,
      expiresIn: 300,
    };
  }
}
