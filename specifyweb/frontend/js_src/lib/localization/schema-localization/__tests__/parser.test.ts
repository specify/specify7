import { theories } from '../../../tests/utils';
import { exportsForTests, trimSchemaKey } from '../parser';

const { pickBetterTranslation } = exportsForTests;

theories(trimSchemaKey, [
  { in: ['ab'], out: 'ab' },
  { in: ['ab23'], out: 'ab' },
  { in: [''], out: '' },
]);

theories(pickBetterTranslation, [
  {
    name: 'Pick a value that is not equal to English (thus is translated)',
    in: ['One', 'Uno', 'One'],
    out: 'Uno',
  },
  { name: 'Shorter is better', in: ['A', 'A.', 'raw'], out: 'A' },
  {
    name: 'Maximize count of non-lowercase characters. i.e., URI is better than Uri',
    in: ['URL', 'Url', 'raw'],
    out: 'URL',
  },
]);
