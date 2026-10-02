import { getSelectedResults } from '../ToForms';

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
