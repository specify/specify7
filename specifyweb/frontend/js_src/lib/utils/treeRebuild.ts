export type RebuildResponse = {
  readonly success?: boolean;
  readonly rebuild_synonyms?: boolean;
  readonly changed?: {
    readonly accepted?: number;
    readonly synonyms?: number;
    readonly total?: number;
  };
};

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const parseRebuildResponse = (
  response: unknown
): { readonly accepted: number; readonly synonyms: number; readonly total: number } => {
  if (typeof response !== 'object' || response === null) {
    return { accepted: 0, synonyms: 0, total: 0 };
  }

  const changed = (response as RebuildResponse).changed;

  const accepted = isNumber(changed?.accepted) ? changed!.accepted : 0;
  const synonyms = isNumber(changed?.synonyms) ? changed!.synonyms : 0;
  const total = isNumber(changed?.total)
    ? changed!.total
    : accepted + synonyms;

  return { accepted, synonyms, total };
};
