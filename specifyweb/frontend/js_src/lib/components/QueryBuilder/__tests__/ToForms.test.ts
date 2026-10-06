import { getSelectedResults, hasFetchableRecordIds } from '../ToForms';

test('only exposes results with fetchable record IDs to the form view', () => {
  expect(hasFetchableRecordIds([[101, 'First'], undefined])).toBe(true);
  expect(hasFetchableRecordIds([])).toBe(false);
  expect(hasFetchableRecordIds([undefined, ['not an ID']])).toBe(false);
  expect(hasFetchableRecordIds([[Number.NaN, 'Invalid ID']])).toBe(false);
});

test('empty selection represents all query results, including unloaded pages', () => {
  expect(
    getSelectedResults(
      [
        [101, 'First'],
        [102, 'Second'],
      ],
      new Set(),
      true,
      4
    )
  ).toEqual([101, 102, undefined, undefined]);
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
