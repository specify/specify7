import { theories } from '../../../tests/utils';
import { formatCacheKey, parseCacheKey } from '../index';

theories(formatCacheKey, [{ in: ['aBc', 'bCd'], out: 'specify7-aBc-bCd' }]);

theories(parseCacheKey, [
  { in: ['specify7-aBc-bCd'], out: ['aBc', 'bCd'] },
  { in: ['specify7-aBc-bCd-eFg'], out: undefined },
]);
