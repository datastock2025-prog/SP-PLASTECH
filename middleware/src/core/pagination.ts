/**
 * Keyset pagination helpers for large ledgers, audits, and high-volume grids (Part A1 specification)
 */
export interface KeysetCursor {
  t: string; // ISO timestamp or sort value
  id: string; // secondary unique identifier
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

export type PaginationMeta =
  | {
      mode: 'offset';
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    }
  | {
      mode: 'cursor';
      limit: number;
      hasMore: boolean;
      nextCursor: string | null;
      total?: number;
    };

