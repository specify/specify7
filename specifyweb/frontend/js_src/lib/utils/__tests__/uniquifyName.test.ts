import { theories } from '../../tests/utils';
import { getUniqueName } from '../uniquifyName';

theories(getUniqueName, [
  [['a', []], 'a'],
  [['a', ['a']], 'a (2)'],
  [['a', ['a', 'a (2)']], 'a (3)'],
  // With length limit
  [['abcdef', ['abcdef'], 6], 'ab'],
  [['abcdef', ['abcdef', 'ab'], 6], 'ab (2)'],
]);
