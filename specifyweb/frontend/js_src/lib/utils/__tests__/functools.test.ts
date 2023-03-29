import { f } from '../functools';

jest.mock('../../components/Errors/assert', () => ({
  ...jest.requireActual('../../components/Errors/assert'),
  breakpoint: jest.fn(),
}));

test('f.void', () => expect(f.void()).toBeUndefined());

test('f.undefined', () => expect(f.undefined()).toBeUndefined());

test('f.array', () => expect(f.array()).toEqual([]));

test('f.unary', () => {
  // Force typescript to accept an invalid number of arguments
  const args = ['a', 'b'] as unknown as readonly [string];
  const callback = jest.fn((...args) => args);
  const unary = f.unary(callback);
  expect(unary(...args)).toEqual(['a']);
});

test('f.zero', () => {
  // Force typescript to accept an invalid number of arguments
  const args = ['a'] as unknown as readonly [];
  const callback = jest.fn((...args) => args);
  expect(f.zero(callback)(...args)).toEqual([]);
});

test('f.id', () => {
  const id = {};
  expect(f.id(id)).toBe(id);
});

test('f.trim', () => expect(f.trim('  \ta\n  ')).toBe('a'));

test('f.error', async () => {
  const consoleError = jest.fn();
  jest.spyOn(console, 'error').mockImplementation(consoleError);

  f.error('Console', 'error');
  expect(consoleError).toHaveBeenCalledWith('Console', 'error');
});

test('f.log', () => {
  const consoleLog = jest.fn();
  jest.spyOn(console, 'log').mockImplementation(consoleLog);

  f.log('Console', 'log');
  expect(consoleLog).toHaveBeenCalledWith('Console', 'log');
});

test('f.all', async () => {
  await expect(
    f.all({
      a: Promise.resolve('a1'),
      b: 'b1',
    })
  ).resolves.toEqual({ a: 'a1', b: 'b1' });
});

describe('f.sum', () => {
  test('empty case', () => expect(f.sum([])).toBe(0));
  test('simple case', () => expect(f.sum([1, 2, 3])).toBe(6));
});

test('f.never', () => expect(f.never).toThrow('This should never get called'));

test('f.equal', () => {
  expect(f.equal('a')('a')).toBe(true);
  expect(f.equal('a')('b')).toBe(false);
});

test('f.notEqual', () => {
  expect(f.notEqual('a')('a')).toBe(false);
  expect(f.notEqual('a')('b')).toBe(true);
});

describe('f.maybe', () => {
  test('undefined case', () =>
    expect(f.maybe(undefined, f.true)).toBeUndefined());
  test('null case', () => expect(f.maybe(null, f.true)).toBe(true));
  test('simple case', () => expect(f.maybe('a', (a) => `${a}${a}`)).toBe('aa'));
});

describe('f.includes', () => {
  test('positive case', () => expect(f.includes([1, 2, 3], 1)).toBe(true));
  test('negative case', () => expect(f.includes([1, 2, 3], 4)).toBe(false));
  test('empty case', () => expect(f.includes([], 1)).toBe(false));
});

describe('f.has', () => {
  test('positive case', () => expect(f.has(new Set([1, 2, 3]), 1)).toBe(true));
  test('negative case', () => expect(f.has(new Set([1, 2, 3]), 4)).toBe(false));
  test('empty case', () => expect(f.has(new Set(), 1)).toBe(false));
});

test('f.tap', () => {
  const callback = jest.fn(
    (a: string, b: string) => `${b}${a}` as unknown as undefined
  );
  const tapped = f.tap(callback, (a: string, b: string) => `${a}${b}`);
  expect(tapped('a', 'b')).toBe('ab');
  expect(callback).toHaveBeenCalledWith('a', 'b');
});

test('f.call', () => {
  const callback = jest.fn(() => 'a');
  expect(f.call(callback)).toBe('a');
  expect(callback).toHaveBeenLastCalledWith();
});

test('f.store', () => {
  const id = {};
  const callback = jest.fn(() => id);
  const memoized = f.store(callback);
  expect(memoized()).toBe(id);
  expect(memoized()).toBe(id);
  expect(callback).toHaveBeenCalledTimes(1);
});

describe('f.unique', () => {
  test('empty case', () => expect(f.unique([])).toEqual([]));
  test('unique case', () => expect(f.unique([1, 2, 3])).toEqual([1, 2, 3]));
  test('duplicate case', () =>
    expect(f.unique([1, 2, 3, 1])).toEqual([1, 2, 3]));
});

describe('f.parseInt', () => {
  test('simple case', () => expect(f.parseInt('1')).toBe(1));
  test('float case', () => expect(f.parseInt('-1.4')).toBe(-1));
  test('invalid case', () => expect(f.parseInt('a-1.4')).toBeUndefined());
});

describe('f.parseFloat', () => {
  test('simple case', () => expect(f.parseFloat('1')).toBe(1));
  test('float case', () => expect(f.parseFloat('-1.4')).toBe(-1.4));
  test('invalid case', () => expect(f.parseFloat('a-1.4')).toBeUndefined());
});

describe('f.round', () => {
  test('simple case', () => expect(f.round(1.4, 1)).toBe(1));
  test('even case', () => expect(f.round(2.1, 2)).toBe(2));
  test('float case', () => expect(f.round(0.0123, 0.01)).toBe(0.01));
  test('negative float case', () => expect(f.round(-0.0123, 0.01)).toBe(-0.01));
});

test('f.true', () => expect(f.true()).toBe(true));

test('f.flat', () => expect(f.flat([[1]])).toEqual([1]));

describe('f.toString', () => {
  test('undefined', () => expect(f.toString(undefined)).toBe(''));
  test('null', () => expect(f.toString(null)).toBe(''));
  test('false', () => expect(f.toString(false)).toBe('false'));
  test('a', () => expect(f.toString('a')).toBe('a'));
  test('4', () => expect(f.toString(4)).toBe('4'));
});

describe('f.min', () => {
  test('empty case', () => expect(f.min()).toBeUndefined());
  test('undefined case', () => expect(f.min(undefined)).toBeUndefined());
  test('simple case', () => expect(f.min(2, 1)).toBe(1));
  test('undefined and defined case', () =>
    expect(f.min(undefined, 3, 1)).toBe(1));
  test('duplicate case', () => expect(f.min(3, 1, 2, 1)).toBe(1));
});

describe('f.max', () => {
  test('empty case', () => expect(f.max()).toBeUndefined());
  test('undefined case', () => expect(f.max(undefined)).toBeUndefined());
  test('simple case', () => expect(f.max(2, 1)).toBe(2));
  test('undefined and defined case', () =>
    expect(f.max(undefined, 3, 1)).toBe(3));
  test('duplicate case', () => expect(f.max(3, 1, 2, 3)).toBe(3));
});
