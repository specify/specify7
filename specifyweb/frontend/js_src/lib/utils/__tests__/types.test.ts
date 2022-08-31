import { theories } from '../../tests/utils';
import { f } from '../functools';
import { defined, filterArray, isFunction } from '../types';

describe('defined', () => {
  test('undefined', () =>
    expect(() => defined(undefined)).toThrow('Value is not defined'));
  test('null', () => expect(defined(null)).toBeNull());
  test('false', () => expect(defined(false)).toBe(false));
});

theories(filterArray, [
  [[[]], []],
  [[[undefined]], []],
  [[[1, undefined, null, 3]], [1, null, 3]],
]);

theories(isFunction, [
  [[f.true], true],
  [['a'], false],
]);
