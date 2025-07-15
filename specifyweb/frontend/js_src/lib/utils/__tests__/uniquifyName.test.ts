import { theories } from '../../tests/utils';
import { getUniqueName } from '../uniquifyName';

theories(getUniqueName, [
  { in: ['a', []], out: 'a' },
  { in: ['a', ['a']], out: 'a (2)' },
  { in: ['a', ['a', 'a (2)']], out: 'a (3)' },
  // With length limit
  { in: ['abcdef', ['abcdef'], 6], out: 'ab' },
  { in: ['abcdef', ['abcdef', 'ab'], 6], out: 'ab (2)' },
  { in: ['abcdef', ['abcdef', 'abcd'], 6, 'name'], out: 'abcd_2' },
  // With different format
  { in: ['abc', [], 6, 'name'], out: 'abc' },
  { in: ['abc', ['abc', 'ab'], 6, 'name'], out: 'abc_2' },
  { in: ['abc', ['abc', 'abc_2', 'ab'], 6, 'name'], out: 'abc_3' },
]);
