import { theories } from '../../../tests/utils';
import { formatCacheKey, parseCacheKey } from '../index';

theories(formatCacheKey, [[['aBc', 'bCd'], 'specify7-aBc-bCd']]);

theories(parseCacheKey, [
  [['specify7-aBc-bCd'], ['aBc', 'bCd']],
  [['specify7-aBc-bCd-eFg'], undefined],
]);
