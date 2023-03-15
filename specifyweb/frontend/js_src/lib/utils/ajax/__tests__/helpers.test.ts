import { theories } from '../../../tests/utils';
import { formData, isExternalUrl, toLocalUrl } from '../helpers';

theories(isExternalUrl, [
  { in: ['blob:https://localhost/'], out: true },
  { in: ['http://localhost/'], out: false },
  { in: ['http://google.com/'], out: true },
  { in: ['/page'], out: false },
  { in: [''], out: false },
  { in: ['/'], out: false },
  { in: ['  /  '], out: false },
  { in: ['  @#$ @#%^ '], out: false },
]);

theories(toLocalUrl, [
  { in: ['http://localhost/page?bar=#hash'], out: '/page?bar=#hash' },
  { in: ['/page?bar=#hash'], out: '/page?bar=#hash' },
  { in: ['https://google.com/page?bar=#hash'], out: undefined },
]);

describe('can convert object to formData', () => {
  test('simple case', () => {
    const object = new FormData();
    object.append('foo', 'bar');
    expect(formData({ foo: 'bar' })).toEqual(object);
  });
  test('array case', () => {
    const object = new FormData();
    object.append('a', '["a",4]');
    expect(formData({ a: ['a', 4] })).toEqual(object);
  });
});
