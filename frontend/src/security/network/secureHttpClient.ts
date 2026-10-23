/**
 * Enterprise Secure HTTP Client
 * Powered by unified fetch standard (shared/api/http.ts)
 * Cookie-only auth (OWASP ASVS L2), CSRF protection, and error handling.
 */

import { createHttpClient, type HttpClient } from '../../shared/api/http';

export const secureHttpClient: HttpClient = createHttpClient('/api/v1');
