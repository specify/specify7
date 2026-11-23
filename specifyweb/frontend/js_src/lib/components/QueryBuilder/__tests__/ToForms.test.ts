import { getSelectedResults, hasFetchableRecordIds } from '../ToForms';

test('only exposes results with fetchable record IDs to the form view', () => {
  expect(hasFetchableRecordIds([[101, 'First'], undefined])).toBe(true);
  expect(hasFetchableRecordIds([])).toBe(false);
  expect(hasFetchableRecordIds([undefined, ['not an ID']])).toBe(false);
  expect(hasFetchableRecordIds([[Number.NaN, 'Invalid ID']])).toBe(false);
});

test('empty selection represents all results without allocating unloaded IDs', () => {
  const ids = getSelectedResults(
    [
      [101, 'First'],
      [102, 'Second'],
    ],
    new Set(),
    true,
    1_000_000
  );

  expect(ids).toHaveLength(1_000_000);
  expect(ids.slice(0, 2)).toEqual([101, 102]);
  expect(Object.keys(ids)).toEqual(['0', '1']);
});

test('non-empty selection remains limited to selected records', () => {
  expect(
    getSelectedResults(
      [
        [101, 'First'],
        [102, 'Second'],
      ],
      new Set([102]),
      true,
      4
    )
  ).toEqual([102]);
});
