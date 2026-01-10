/**
 * Utilities for tree rebuild and repair operations
 */

export type RebuildChanged = {
  readonly accepted: number;
  readonly synonyms: number;
  readonly total: number;
};

type RebuildResponse = {
  readonly success?: boolean;
  readonly rebuild_synonyms?: boolean;
  readonly changed?: Partial<RebuildChanged> | null;
};

/**
 * Parse a rebuild response from the API into a standardized RebuildChanged object.
 * Handles various response formats including wrapped responses with a 'data' field,
 * JSON string payloads, and invalid/missing data.
 */
export const parseRebuildResponse = (raw: unknown): RebuildChanged => {
  let payload: unknown = raw;

  // Unwrap response if it has a 'data' field
  if (payload && typeof payload === 'object' && 'data' in (payload as any)) {
    payload = (payload as any).data;
  }

  // Parse if it's a JSON string
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return { accepted: 0, synonyms: 0, total: 0 };
    }
  }

  // Validate it's an object
  if (!payload || typeof payload !== 'object') {
    return { accepted: 0, synonyms: 0, total: 0 };
  }

  // Extract changed data with type-safe access
  const changed = (payload as RebuildResponse).changed || undefined;
  const accepted = typeof changed?.accepted === 'number' ? changed.accepted : 0;
  const synonyms = typeof changed?.synonyms === 'number' ? changed.synonyms : 0;
  const total =
    typeof changed?.total === 'number' ? changed.total : accepted + synonyms;

  return { accepted, synonyms, total };
};
