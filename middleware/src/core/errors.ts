import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface StructuredErrorResponse {
  status: number;
  headers?: Record<string, string>;
  body: {
    error: {
      code: string;
      message: string;
      details?: unknown;
      requestId: string;
    };
  };
}

/**
 * Enterprise PG and Application Error Mapper (Part A3 Specification)
 */
export function mapErrorToResponse(err: any, requestId: string): StructuredErrorResponse {
  // 1. Domain / AppError
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId,
        },
      },
    };
  }

  // 2. Zod validation failure
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          requestId,
        },
      },
    };
  }

  // 3. PostgreSQL Error Codes Mapping (A3 Standard)
  const pgCode = err?.code ?? err?.cause?.code ?? err?.originalError?.code;
  const pgConstraint = err?.constraint ?? err?.cause?.constraint;
  const pgDetail = err?.detail ?? err?.cause?.detail;

  if (typeof pgCode === 'string') {
    switch (pgCode) {
      case '23505': // Unique violation
        return {
          status: 409,
          body: {
            error: {
              code: 'DUPLICATE',
              message: 'A record with the same unique value already exists',
              details: { constraint: pgConstraint, detail: pgDetail },
              requestId,
            },
          },
        };

      case '23503': // Foreign key violation
        return {
          status: 409,
          body: {
            error: {
              code: 'REFERENCED',
              message: err.detail?.includes('is still referenced')
                ? 'This record cannot be deleted because it is in use by other resources'
                : 'Referenced record was not found or is invalid',
              details: { constraint: err.constraint, detail: err.detail },
              requestId,
            },
          },
        };

      case '23514': // Check constraint violation
      case '22P02': // Invalid text representation
      case '23502': // Not null violation
        return {
          status: 422,
          body: {
            error: {
              code: 'CONSTRAINT_VIOLATION',
              message: 'The submitted data violates a database integrity rule',
              details: { constraint: err.constraint, column: err.column, detail: err.detail, message: err.message },
              requestId,
            },
          },
        };

      case '40001': // Serialization failure
      case '40P01': // Deadlock detected
        return {
          status: 503,
          headers: { 'Retry-After': '1' },
          body: {
            error: {
              code: 'RETRYABLE',
              message: 'Transaction collision occurred. Please retry your request.',
              requestId,
            },
          },
        };

      case '57014': // Query cancelled (statement timeout)
        return {
          status: 504,
          body: {
            error: {
              code: 'QUERY_TIMEOUT',
              message: 'The requested operation exceeded the time limit. Please narrow your filters.',
              requestId,
            },
          },
        };

      case '55P03': // Lock not available
        return {
          status: 409,
          body: {
            error: {
              code: 'LOCKED',
              message: 'This record is currently being edited by another process. Please try again.',
              requestId,
            },
          },
        };

      case '42501': // Insufficient privilege / RLS violation
        return {
          status: 403,
          body: {
            error: {
              code: 'FORBIDDEN',
              message: 'Access to this resource is denied by tenant security policies',
              requestId,
            },
          },
        };
    }
  }

  // 4. Fallback unhandled server error (Never leak internal stack trace)
  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unexpected server error',
        requestId,
      },
    },
  };
}
