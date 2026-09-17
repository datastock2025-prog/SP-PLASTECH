import { z } from 'zod';
import { SecurityEventLogger } from '../logging/SecurityEventLogger';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodError<T>['issues'];
}

/**
 * Validate incoming API response data against a strict Zod schema at runtime.
 * Throws or returns safe fallback to prevent prototype poisoning or unexpected injections.
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  endpointName = 'API_ENDPOINT'
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    SecurityEventLogger.log('API_VALIDATION_FAILURE', {
      endpoint: endpointName,
      issues: result.error.issues,
    });
    console.error(`[Security API Validator] Schema mismatch for ${endpointName}:`, result.error.format());
    throw new Error(`Data validation failed for ${endpointName}. Unsafe or malformed payload detected.`);
  }
  return result.data;
}

/**
 * Safe parser that doesn't throw, returning a result object.
 */
export function safeValidateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  endpointName = 'API_ENDPOINT'
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    SecurityEventLogger.log('API_VALIDATION_FAILURE', {
      endpoint: endpointName,
      issues: result.error.issues,
    });
    return {
      success: false,
      errors: result.error.issues,
    };
  }
  return {
    success: true,
    data: result.data,
  };
}
