export type HierarchyNodeKind =
  | 'collection'
  | 'discipline'
  | 'division'
  | 'institution';

export const colorByKind: Record<HierarchyNodeKind, string> = {
  institution: '#b72f2f',
  division: '#598137',
  discipline: '#0074B5',
  collection: '#8a4b00',
};
