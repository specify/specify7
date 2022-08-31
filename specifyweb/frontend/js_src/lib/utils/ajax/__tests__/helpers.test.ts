import { theories } from '../../../tests/utils';
import { formData, isExternalUrl, toRelativeUrl } from '../helpers';

theories(isExternalUrl, [
  [['blob:https://localhost/'], true],
  [['http://localhost/'], false],
  [['http://google.com/'], true],
  [['/page'], false],
]);

theories(toRelativeUrl, [
  [['http://google.com/page?bar=#hash'], '/page?bar=#hash'],
  [['/page?bar=#hash'], '/page?bar=#hash'],
  [['http://google.com/page?bar=#hash'], undefined],
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
