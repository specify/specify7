import { localized } from '../../../utils/types';
import { deduplicateQueryComboBoxResults } from '../helpers';

test('deduplicates results returned by multiple search fields', () => {
  const firstLabel = localized('First result');
  const duplicateLabel = localized('Duplicate result');
  const secondLabel = localized('Second result');

  expect(
    deduplicateQueryComboBoxResults([
      [
        [1, firstLabel],
        [2, secondLabel],
      ],
      [[1, duplicateLabel]],
    ])
  ).toEqual([
    [1, firstLabel],
    [2, secondLabel],
  ]);
});
