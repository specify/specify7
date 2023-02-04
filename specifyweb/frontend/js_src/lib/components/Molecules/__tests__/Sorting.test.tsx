import { toLargeSortConfig, toSmallSortConfig } from '../Sorting';
import { theories } from '../../../tests/utils';

theories(toSmallSortConfig, [
  { in: [{ direction: 'asc', fieldNames: ['a', 'b'] }], out: 'a.b' },
  { in: [{ direction: 'desc', fieldNames: ['a'] }], out: '-a' },
]);

theories(toLargeSortConfig, [
  { in: ['a.b'], out: { direction: 'asc', fieldNames: ['a', 'b'] } },
  { in: ['-a'], out: { direction: 'desc', fieldNames: ['a'] } },
]);
