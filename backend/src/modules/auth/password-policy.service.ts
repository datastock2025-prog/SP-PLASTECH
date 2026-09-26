import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventHistoryCount: number;
}

@Injectable()
export class PasswordPolicyService {
  private readonly defaultConfig: PasswordPolicyConfig = {
    minLength: 10,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventHistoryCount: 5,
  };

  private readonly commonBreachedPasswords = new Set([
    'password', 'password123', 'admin123', '12345678', 'welcome123', 'qwerty123',
    'spplastech', 'plastic123', 'factory123', 'operator123', 'superadmin',
  ]);

  /**
   * Validate new password against policy rules, history, and common breached list
   */
  validatePassword(
    password: string,
    passwordHistoryHashes: string[] = [],
    customConfig?: Partial<PasswordPolicyConfig>,
  ): { valid: boolean; errors: string[] } {
    const config = { ...this.defaultConfig, ...customConfig };
    const errors: string[] = [];

    if (!password || password.length < config.minLength) {
      errors.push(`Password must be at least ${config.minLength} characters long.`);
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter.');
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter.');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one numeric digit.');
    }

    if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character.');
    }

    if (this.commonBreachedPasswords.has(password.toLowerCase())) {
      errors.push('This password is commonly breached and is not allowed.');
    }

    // Check against history of previous password hashes
    const currentHash = crypto.createHash('sha256').update(password).digest('hex');
    const recentHashes = passwordHistoryHashes.slice(-config.preventHistoryCount);
    if (recentHashes.includes(currentHash)) {
      errors.push(`Password cannot be one of your last ${config.preventHistoryCount} previous passwords.`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
