import { CookieConsent } from '../types';
import { SecurityEventLogger } from '../logging/SecurityEventLogger';

const COOKIE_CONSENT_KEY = 'erp_cookie_consent_v1';

export class GdprService {
  /**
   * Export all personal user profile, telemetry, and audit trail data in JSON format for GDPR Article 20.
   */
  public static exportUserData(userId: string, profileData: Record<string, unknown>): void {
    const gdprPackage = {
      exportTimestamp: new Date().toISOString(),
      complianceStandard: 'GDPR_ARTICLE_20_PORTABILITY',
      userId,
      userProfile: profileData,
      clientTelemetry: SecurityEventLogger.getRecentLogs(500).filter(
        (log) => log.actorId === userId
      ),
    };

    const blob = new Blob([JSON.stringify(gdprPackage, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gdpr_data_export_${userId}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    SecurityEventLogger.log('GDPR_DATA_EXPORT_REQUESTED', { userId }, 'WARN', userId);
  }

  /**
   * Submit an account anonymization / deletion request under GDPR Article 17 ("Right to be Forgotten").
   */
  public static async requestAccountAnonymization(
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; trackingNumber: string }> {
    const trackingNumber = `RTBF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    SecurityEventLogger.log(
      'GDPR_RIGHT_TO_BE_FORGOTTEN_SUBMITTED',
      { userId, trackingNumber, reason },
      'CRITICAL',
      userId
    );

    // In production, dispatch to backend API /api/v1/compliance/anonymize
    return {
      success: true,
      trackingNumber,
    };
  }

  /**
   * Get current cookie consent preferences
   */
  public static getConsent(): CookieConsent | null {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Save cookie consent preferences
   */
  public static saveConsent(consent: Omit<CookieConsent, 'timestamp'>): CookieConsent {
    const fullConsent: CookieConsent = {
      ...consent,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(fullConsent));
    SecurityEventLogger.log('COOKIE_CONSENT_UPDATED', { consent: fullConsent });
    return fullConsent;
  }
}
