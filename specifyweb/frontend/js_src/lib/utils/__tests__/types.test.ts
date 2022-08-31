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
  { in: [[]], out: [] },
  { in: [[undefined]], out: [] },
  { in: [[1, undefined, null, 3]], out: [1, null, 3] },
]);

theories(isFunction, [
  { in: [f.true], out: true },
  { in: ['a'], out: false },
]);
