import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery } from '../DataModel/types';

export type QuerySelection = {
  readonly mode: 'include' | 'exclude';
  readonly ids: ReadonlySet<number>;
};

export type ExecutedQuery = SerializedResource<SpQuery> & {
  readonly collectionId?: number;
  readonly recordSetId?: number;
};

export type SelectedQuery = {
  readonly query: ExecutedQuery;
  readonly selection: QuerySelection;
};

export const maxSelectionIds = 10_000;
export const maxMapSelectionRows = 10_000;

export const emptySelection = (): QuerySelection => ({
  mode: 'include',
  ids: new Set(),
});

export const isSelectionEmpty = ({ mode, ids }: QuerySelection): boolean =>
  mode === 'include' && ids.size === 0;

export const isSelected = (
  { mode, ids }: QuerySelection,
  id: number
): boolean => (mode === 'include' ? ids.has(id) : !ids.has(id));

export const allSelection = (): QuerySelection => ({
  mode: 'exclude',
  ids: new Set(),
});

export function selectRecords(
  selection: QuerySelection,
  records: readonly number[],
  selected: boolean
): QuerySelection {
  const ids = new Set(selection.ids);
  records.forEach((id) =>
    selected === (selection.mode === 'include') ? ids.add(id) : ids.delete(id)
  );
  return { ...selection, ids };
}

export const selectionPayload = ({ mode, ids }: QuerySelection) => ({
  mode,
  ids: Array.from(ids),
});
