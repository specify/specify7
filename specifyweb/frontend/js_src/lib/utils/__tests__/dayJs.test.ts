import { theories } from '../../tests/utils';
import { getDateInputValue } from '../dayJs';

theories(getDateInputValue, [
  { in: [new Date('2022-08-31T02:02:53.363Z')], out: '2022-08-30' },
]);
