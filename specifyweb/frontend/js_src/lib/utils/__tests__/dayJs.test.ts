import { theories } from '../../tests/utils';
import { getDateInputValue } from '../dayJs';

theories(getDateInputValue, [
  [[new Date('2022-08-31T02:02:53.363Z')], '2022-08-30'],
]);
