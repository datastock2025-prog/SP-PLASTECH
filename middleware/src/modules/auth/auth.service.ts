import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { LoginDto, LoginDtoSchema, AuthResponse } from './auth.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { JWT_SECRET } from '../../common/guards/jwt-auth.guard';

export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'reboot_erp_refresh_super_secret_2026';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly db: DatabaseService) {}

  public async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent: string
  ): Promise<{ response: AuthResponse; refreshToken: string; csrfToken: string; rememberMe: boolean }> {
    const parseResult = LoginDtoSchema.safeParse(dto);
    if (!parseResult.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        issues: parseResult.error.issues,
      });
    }

    const { email, password, pin, tenantId, rememberMe = false, deviceInfo } = parseResult.data;

    // Fetch user with role and tenant details
    const userRes = await this.db.query(
      `SELECT u.*, r.name as role_name, t.name as tenant_name 
       FROM auth_users u
       JOIN auth_roles r ON u.role_id = r.id
       JOIN tenant_profiles t ON u.tenant_id = t.id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (userRes.rows.length === 0) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const user = userRes.rows[0];

    // Verify Password or PIN
    let isCredentialValid = false;
    if (password) {
      isCredentialValid = await bcrypt.compare(password, user.password_hash);
    } else if (pin && user.pin_hash) {
      isCredentialValid = await bcrypt.compare(pin, user.pin_hash);
    }

    if (!isCredentialValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    // Fetch user permissions
    const permRes = await this.db.query(
      `SELECT permission_key FROM auth_role_permissions WHERE role_id = $1`,
      [user.role_id]
    );
    const permissions = permRes.rows.map((r: any) => r.permission_key);

    // Create Active Session
    const sessionId = `sess_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const deviceName = deviceInfo || userAgent || 'Web Workstation';
    const deviceType = /mobile|iphone|android/i.test(deviceName) ? 'MOBILE' : 'DESKTOP';

    const sessionDurationSec = rememberMe ? 7 * 24 * 3600 : 8 * 3600; // 7 days or 8 hours
    const expiresAt = new Date(Date.now() + sessionDurationSec * 1000);

    const refreshToken = jwt.sign(
      { userId: user.id, sessionId, tenantId: user.tenant_id },
      REFRESH_SECRET,
      { expiresIn: sessionDurationSec }
    );
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.db.query(
      `INSERT INTO auth_active_sessions (session_id, user_id, tenant_id, device_id, device_info, device_type, ip_address, location, refresh_token_hash, is_revoked, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10)`,
      [
        sessionId,
        user.id,
        user.tenant_id,
        crypto.randomBytes(8).toString('hex'),
        deviceName,
        deviceType,
        ipAddress,
        'India (Corporate Network)',
        refreshTokenHash,
        expiresAt,
      ]
    );

    // Update last login
    await this.db.query(
      `UPDATE auth_users SET last_login_at = NOW(), last_login_ip = $1 WHERE id = $2`,
      [ipAddress, user.id]
    );

    // Generate in-memory short-lived Access Token (15 min)
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role_id,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        permissions,
        sessionId,
      },
      JWT_SECRET,
      { expiresIn: 900 } // 15 minutes
    );

    // Generate CSRF validation token
    const csrfToken = crypto.randomBytes(24).toString('hex');

    const authResponse: AuthResponse = {
      success: true,
      accessToken,
      expiresIn: 900,
      mfaRequired: false,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role_id,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        permissions,
        avatarColor: user.avatar_color,
        initials: user.initials,
        mfaEnabled: user.mfa_enabled,
      },
    };

    return {
      response: authResponse,
      refreshToken,
      csrfToken,
      rememberMe,
    };
  }

  public async refreshToken(
    rawRefreshToken: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException({
        code: 'MISSING_REFRESH_TOKEN',
        message: 'No refresh token provided in secure cookie.',
      });
    }

    try {
      const decoded: any = jwt.verify(rawRefreshToken, REFRESH_SECRET);
      const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

      // Verify active session in DB
      const sessionRes = await this.db.query(
        `SELECT s.*, u.email, u.full_name, u.role_id, t.name as tenant_name
         FROM auth_active_sessions s
         JOIN auth_users u ON s.user_id = u.id
         JOIN tenant_profiles t ON s.tenant_id = t.id
         WHERE s.session_id = $1 AND s.is_revoked = false AND s.expires_at > NOW()`,
        [decoded.sessionId]
      );

      if (sessionRes.rows.length === 0) {
        throw new UnauthorizedException({
          code: 'SESSION_REVOKED_OR_EXPIRED',
          message: 'Active session is invalid.',
        });
      }

      const session = sessionRes.rows[0];

      // Update session activity
      await this.db.query(
        `UPDATE auth_active_sessions SET last_active_at = NOW() WHERE session_id = $1`,
        [session.session_id]
      );

      // Fetch permissions
      const permRes = await this.db.query(
        `SELECT permission_key FROM auth_role_permissions WHERE role_id = $1`,
        [session.role_id]
      );
      const permissions = permRes.rows.map((r: any) => r.permission_key);

      const newAccessToken = jwt.sign(
        {
          id: session.user_id,
          email: session.email,
          fullName: session.full_name,
          role: session.role_id,
          tenantId: session.tenant_id,
          tenantName: session.tenant_name,
          permissions,
          sessionId: session.session_id,
        },
        JWT_SECRET,
        { expiresIn: 900 }
      );

      return {
        accessToken: newAccessToken,
        expiresIn: 900,
      };
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is expired or altered.',
      });
    }
  }

  public async logout(sessionId: string): Promise<void> {
    if (sessionId) {
      await this.db.query(
        `UPDATE auth_active_sessions SET is_revoked = true WHERE session_id = $1`,
        [sessionId]
      );
    }
  }

  public async getActiveSessions(userId: string, currentSessionId?: string) {
    const res = await this.db.query(
      `SELECT session_id, device_id, device_info, device_type, ip_address, location, created_at, last_active_at
       FROM auth_active_sessions
       WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW()
       ORDER BY last_active_at DESC`,
      [userId]
    );

    return res.rows.map((r: any) => ({
      sessionId: r.session_id,
      deviceId: r.device_id,
      deviceInfo: r.device_info,
      deviceType: r.device_type,
      ipAddress: r.ip_address,
      location: r.location,
      createdAt: r.created_at,
      lastActiveAt: r.last_active_at,
      isCurrent: r.session_id === currentSessionId,
    }));
  }

  public async revokeSession(userId: string, targetSessionId: string): Promise<boolean> {
    const res = await this.db.query(
      `UPDATE auth_active_sessions SET is_revoked = true WHERE session_id = $1 AND user_id = $2`,
      [targetSessionId, userId]
    );
    return (res.rowCount || 0) > 0;
  }

  public async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await this.db.query(
      `UPDATE auth_active_sessions SET is_revoked = true WHERE user_id = $1 AND session_id != $2`,
      [userId, currentSessionId]
    );
  }
}
