import { theories } from '../../tests/utils';
import { getUniqueName } from '../uniquifyName';

theories(getUniqueName, [
  { in: ['a', []], out: 'a' },
  { in: ['a', ['a']], out: 'a (2)' },
  { in: ['a', ['a', 'a (2)']], out: 'a (3)' },
  // With length limit
  { in: ['abcdef', ['abcdef'], 6], out: 'ab' },
  // Unused name is still truncated to maxLength
  { in: ['abcdef', [], 4], out: 'abcd' },
  // Name that collides with a used name after truncation is made unique
  { in: ['abcdefghij', ['abcdefgh'], 8], out: 'abcd' },
  // Truncation does not split surrogate pairs
  { in: ['😀😀', [], 3], out: '😀' },
  { in: ['😀😀', [], 4], out: '😀😀' },
  { in: ['abcdef', ['abcdef', 'ab'], 6], out: 'ab (2)' },
  { in: ['abcdef', ['abcdef', 'abcd'], 6, 'name'], out: 'abcd_2' },
  // With different format
  { in: ['abc', [], 6, 'name'], out: 'abc' },
  { in: ['abc', ['abc', 'ab'], 6, 'name'], out: 'abc_2' },
  { in: ['abc', ['abc', 'abc_2', 'ab'], 6, 'name'], out: 'abc_3' },
  /*
   * Suffix can't fit and the empty candidate is already used - falls back to
   * a truncated suffix-only name instead of recursing indefinitely
   */
  { in: ['a', ['a', ''], 1], out: ' ' },
  { in: ['a', ['a', ''], 1, 'name'], out: '_' },
  // A bounded unique name with a lower index exists and is found
  { in: ['', ['', ' (99)'], 4], out: ' (2)' },
  // No unique name within maxLength exists - still terminates
  { in: ['a', [''], 0], out: '' },
]);
