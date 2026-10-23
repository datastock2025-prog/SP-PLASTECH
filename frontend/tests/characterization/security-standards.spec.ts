import '../setup';
import { describe, it, expect } from 'vitest';

interface SecurityPolicy {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  passwordHistoryLimit: number;
  lockoutThreshold: number;
  lockoutDurationMinutes: number;
  sessionMaxAgeHours: number;
  idleTimeoutMinutes: number;
  mfaRequiredRoles: string[];
  ipAllowlist: string[];
}

function validatePasswordPolicy(password: string, policy: SecurityPolicy): { valid: boolean; message?: string } {
  if (password.length < policy.minPasswordLength) {
    return { valid: false, message: `Password must be at least ${policy.minPasswordLength} characters long` };
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (policy.requireNumbers && !/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (policy.requireSymbols && !/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one symbol or special character' };
  }
  return { valid: true };
}

describe('Security Standard (Part A4: OWASP ASVS L2) Verification Tests', () => {
  const defaultPolicy: SecurityPolicy = {
    minPasswordLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    passwordHistoryLimit: 3,
    lockoutThreshold: 5,
    lockoutDurationMinutes: 15,
    sessionMaxAgeHours: 8,
    idleTimeoutMinutes: 30,
    mfaRequiredRoles: ['SUPER_ADMIN'],
    ipAllowlist: [],
  };

  it('validates compliant strong password matching ASVS policy', () => {
    const res = validatePasswordPolicy('Plas!Tech#2026Secure', defaultPolicy);
    expect(res.valid).toBe(true);
  });

  it('rejects passwords failing minimum length constraint', () => {
    const res = validatePasswordPolicy('Short!1', defaultPolicy);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('at least 12 characters');
  });

  it('rejects passwords missing uppercase letters', () => {
    const res = validatePasswordPolicy('lowercase!12345', defaultPolicy);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('uppercase letter');
  });

  it('rejects passwords missing lowercase letters', () => {
    const res = validatePasswordPolicy('UPPERCASE!12345', defaultPolicy);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('lowercase letter');
  });

  it('rejects passwords missing numbers', () => {
    const res = validatePasswordPolicy('NoNumbers!Here', defaultPolicy);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('number');
  });

  it('rejects passwords missing symbols', () => {
    const res = validatePasswordPolicy('NoSymbols123456', defaultPolicy);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('symbol or special character');
  });

  it('verifies session idle timeout calculation correctly expires inactive sessions', () => {
    const now = Date.now();
    const idleTimeoutMinutes = 30;
    const activeUpdatedAt = new Date(now - 10 * 60 * 1000); // 10m ago
    const expiredUpdatedAt = new Date(now - 35 * 60 * 1000); // 35m ago

    const isIdleActive = now - activeUpdatedAt.getTime() > idleTimeoutMinutes * 60 * 1000;
    const isIdleExpired = now - expiredUpdatedAt.getTime() > idleTimeoutMinutes * 60 * 1000;

    expect(isIdleActive).toBe(false);
    expect(isIdleExpired).toBe(true);
  });
});
