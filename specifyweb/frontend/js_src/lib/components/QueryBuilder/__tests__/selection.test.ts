import {
  emptySelection,
  allSelection,
  isSelected,
  isSelectionEmpty,
  selectRecords,
  selectionPayload,
} from '../selection';

test('select all stores exceptions rather than the result membership', () => {
  const none = emptySelection();
  const all = allSelection();
  expect(isSelectionEmpty(none)).toBe(true);
  expect(all.mode).toBe('exclude');
  expect(all.ids.size).toBe(0);
  expect(isSelected(all, 1_000_000)).toBe(true);
  expect(selectionPayload(all)).toEqual({ mode: 'exclude', ids: [] });
});

test('unchecking and rechecking records in all mode changes only exceptions', () => {
  const all = allSelection();
  const exceptTwo = selectRecords(all, [2, 3], false);
  expect(selectionPayload(exceptTwo)).toEqual({ mode: 'exclude', ids: [2, 3] });
  expect(isSelected(exceptTwo, 1)).toBe(true);
  expect(isSelected(exceptTwo, 2)).toBe(false);
  expect(selectionPayload(selectRecords(exceptTwo, [2], true))).toEqual({
    mode: 'exclude',
    ids: [3],
  });
  expect(all.ids.size).toBe(0);
});

test('individual selection deduplicates IDs and returns to empty when unchecked', () => {
  const some = selectRecords(emptySelection(), [1, 1, 4], true);
  expect(selectionPayload(some)).toEqual({ mode: 'include', ids: [1, 4] });
  expect(isSelected(some, 1)).toBe(true);
  expect(isSelected(some, 2)).toBe(false);
  expect(selectRecords(some, [1, 4], false)).toEqual(emptySelection());
});
