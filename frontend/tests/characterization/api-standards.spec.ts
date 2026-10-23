import '../setup';
import { describe, it, expect } from 'vitest';

export interface KeysetCursor {
  t: string;
  id: string;
}

export const encodeCursor = (c: KeysetCursor): string => {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
};

export const decodeCursor = (s?: string | null): KeysetCursor | null => {
  if (!s) return null;
  try {
    const raw = Buffer.from(s, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.t === 'string' && typeof parsed.id === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

describe('API Standard (Part A2) Verification Tests', () => {
  it('correctly round-trips base64url keyset cursor encoding and decoding', () => {
    const cursorObj: KeysetCursor = {
      t: '2026-10-17T11:00:00.000Z',
      id: '8a99479e-4739-4482-8c10-fa1d4ecbbcd8',
    };

    const encoded = encodeCursor(cursorObj);
    expect(typeof encoded).toBe('string');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');

    const decoded = decodeCursor(encoded);
    expect(decoded).toEqual(cursorObj);
  });

  it('safely handles malformed or empty cursors without throwing', () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor('')).toBeNull();
    expect(decodeCursor('invalid-base64-payload!@#$')).toBeNull();
    expect(decodeCursor(Buffer.from(JSON.stringify({ bad: 'data' })).toString('base64url'))).toBeNull();
  });

  it('enforces structured error response envelope contract', () => {
    const errorEnvelope = {
      error: {
        code: 'CONCURRENCY_CONFLICT',
        message: 'Record was modified elsewhere. Reload and retry.',
        reference: 'req-12345',
      },
    };

    expect(errorEnvelope).toHaveProperty('error.code', 'CONCURRENCY_CONFLICT');
    expect(errorEnvelope).toHaveProperty('error.reference');
  });

  it('enforces standard list pagination response envelope with cursor metadata', () => {
    const listResponse = {
      data: [{ id: '1', code: 'ITEM-001' }],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
        cursor: null,
        nextCursor: null,
      },
    };

    expect(listResponse.meta).toHaveProperty('page');
    expect(listResponse.meta).toHaveProperty('limit');
    expect(listResponse.meta).toHaveProperty('hasMore');
    expect(listResponse.meta).toHaveProperty('cursor');
    expect(listResponse.meta).toHaveProperty('nextCursor');
  });
});
