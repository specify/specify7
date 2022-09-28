import { theories } from '../../tests/utils';
import { f } from '../functools';
import {
  camelToHuman,
  camelToKebab,
  capitalize,
  caseInsensitiveHash,
  clamp,
  escapeRegExp,
  findArrayDivergencePoint,
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
  group,
  index,
  insertItem,
  lowerToHuman,
  mappedFind,
  removeItem,
  removeKey,
  replaceItem,
  replaceKey,
  sortFunction,
  spanNumber,
  split,
  takeBetween,
  toggleItem,
  toLowerCase,
  unCapitalize,
  upperToKebab,
} from '../utils';

theories(capitalize, {
  'simple case': { in: ['capitalize'], out: 'Capitalize' },
  'works with non-ascii characters': { in: ['çA'], out: 'ÇA' },
  'does not break emojis': { in: ['❤️'], out: '❤️' },
});

theories(unCapitalize, {
  'simple case': { in: ['UnCAPITALIZE'], out: 'unCAPITALIZE' },
  'works with non-ascii characters': { in: ['ÇA'], out: 'çA' },
  'does not break emojis': { in: ['❤️'], out: '❤️' },
});

theories(upperToKebab, [{ in: ['UPPER_CASE'], out: 'upper-case' }]);

theories(lowerToHuman, [{ in: ['lower_case'], out: 'Lower Case' }]);

theories(camelToKebab, [{ in: ['camelCase'], out: 'camel-case' }]);

theories(camelToHuman, [{ in: ['camelCase'], out: 'Camel Case' }]);

theories(toLowerCase, [{ in: ['AB'], out: 'ab' }]);

theories(findArrayDivergencePoint, {
  'empty Array': { in: [[], []], out: 0 },
  'empty Search Array': { in: [['a'], []], out: 0 },
  'empty Source Array': { in: [[], ['a']], out: -1 },
  'identical arrays': {
    in: [
      ['a', 'b'],
      ['a', 'b'],
    ],
    out: 1,
  },
  'divergent arrays': {
    in: [
      ['a', 'b', 'c'],
      ['a', 'b', 'd'],
    ],
    out: -1,
  },
  'sub-array': {
    in: [
      ['a', 'b', 'c'],
      ['a', 'b'],
    ],
    out: 2,
  },
});

describe('spanNumber', () => {
  test('Color Hue case', () => {
    expect(spanNumber(0, 32, 0, 360)(5)).toBe(56.25);
  });
  test('Month case', () => {
    expect(spanNumber(0, 100, 0, 31)(9)).toBe(2.79);
  });
});

const source = {
  PascalCase: 'a',
  camelCase: 'b',
  lowercase: 'c',
};
theories(caseInsensitiveHash, [
  { in: [source, 'PASCALCASE' as keyof typeof source], out: 'a' },
  { in: [source, 'camelcase' as keyof typeof source], out: 'b' },
  { in: [source, 'Lowercase' as keyof typeof source], out: 'c' },
]);

describe('sortFunction', () => {
  test('Numbers', () => {
    expect([10, 100, 1, 66, 5, 8, 2].sort(sortFunction(f.id))).toEqual([
      1, 2, 5, 8, 10, 66, 100,
    ]);
  });
  test('Strings', () => {
    expect(['a', '6', 'bb', 'aba', '_a'].sort(sortFunction(f.id))).toEqual([
      '_a',
      '6',
      'a',
      'aba',
      'bb',
    ]);
  });
  test('Custom function for Numbers', () => {
    expect(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(
        sortFunction((value) => Math.abs(5 - value))
      )
    ).toEqual([5, 4, 6, 3, 7, 2, 8, 1, 9, 10]);
  });
  test('Custom function for Numbers (reversed)', () => {
    expect(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(
        sortFunction((value) => Math.abs(5 - value), true)
      )
    ).toEqual([10, 1, 9, 2, 8, 3, 7, 4, 6, 5]);
  });
});

theories(split, [
  {
    in: [[1, 2, 3, 4, 5, 6, 7, 8], (value: number) => value % 2 === 0],
    out: [
      [1, 3, 5, 7],
      [2, 4, 6, 8],
    ],
  },
]);

theories(group, [
  {
    in: [
      [
        ['a', 1],
        ['a', 2],
        ['b', 3],
        ['c', 4],
        ['a', 5],
      ],
    ],
    out: [
      ['a', [1, 2, 5]],
      ['b', [3]],
      ['c', [4]],
    ],
  },
]);

describe('mappedFind', () => {
  test('Found value', () => {
    expect(
      mappedFind([undefined, 1, 2, 3, 4, 5], (value) =>
        typeof value === 'number' ? value * 2 : undefined
      )
    ).toBe(2);
  });
  test('Not found a value', () => {
    expect(mappedFind([undefined, undefined, undefined], f.id)).toBe(undefined);
  });
});

theories(removeKey, {
  'removing a key that is present': [[{ a: 'b', c: 'd' }, 'c'], { a: 'b' }],
  'removing a key that is not present': [[{ a: 'b' }, 'c' as 'a'], { a: 'b' }],
});

theories(clamp, {
  'clamp a number in range': { in: [1, 5, 10], out: 5 },
  'clamp a number below the range': { in: [1, -5, 10], out: 1 },
  'clamp a number above the range': { in: [1, 15, 10], out: 10 },
});

theories(insertItem, {
  'insert at the beginning': { in: [[2, 3, 4], 0, 1], out: [1, 2, 3, 4] },
  'insert in the middle': { in: [[1, 3, 4], 1, 2], out: [1, 2, 3, 4] },
  'insert at the end': { in: [[1, 2, 3], 3, 4], out: [1, 2, 3, 4] },
  // Not sure if "-1" should insert into last or pre last position
  'insert from the end': { in: [[1, 2, 4], -1, 3], out: [1, 2, 3, 4] },
  'insert in the middle from the end': {
    in: [[1, 3, 4], -2, 2],
    out: [1, 2, 3, 4],
  },
  'insert after the end': { in: [[1, 2, 3], 99, 4], out: [1, 2, 3, 4] },
});

theories(replaceItem, {
  'replace at the beginning': { in: [[0, 2, 3, 4], 0, 1], out: [1, 2, 3, 4] },
  'replace in the middle': { in: [[1, 0, 3, 4], 1, 2], out: [1, 2, 3, 4] },
  'replace at the end': { in: [[1, 2, 3, 0], 3, 4], out: [1, 2, 3, 4] },
  'replace from the end': { in: [[1, 2, 3, 0], -1, 4], out: [1, 2, 3, 4] },
  'replace after the end': { in: [[1, 2, 3], 99, 4], out: [1, 2, 3, 4] },
});

theories(removeItem, {
  'remove from the beginning': { in: [[0, 1, 2, 3, 4], 0], out: [1, 2, 3, 4] },
  'remove in the middle': { in: [[1, 0, 2, 3, 4], 1], out: [1, 2, 3, 4] },
  'remove at the end': { in: [[1, 2, 3, 4, 0], 4], out: [1, 2, 3, 4] },
  'remove from the end': { in: [[1, 2, 3, 0, 4], -1], out: [1, 2, 3, 4] },
  'remove after the end': { in: [[1, 2, 3, 4], 99], out: [1, 2, 3, 4] },
});

theories(toggleItem, {
  'add an item that is not present': { in: [[1, 2, 3], 4], out: [1, 2, 3, 4] },
  'remove an item that is present': { in: [[1, 2, 3, 4], 4], out: [1, 2, 3] },
  'remove duplicate item': { in: [[1, 2, 3, 1], 1], out: [2, 3] },
});

theories(replaceKey, {
  'replacing existing key': {
    in: [{ a: 'a', b: 'b' }, 'a', 'c'],
    out: {
      a: 'c',
      b: 'b',
    },
  },
  'replacing non-existed key': {
    in: [{ a: 'a', b: 'b' }, 'c' as 'a', 'c'],
    out: {
      a: 'a',
      b: 'b',
      c: 'c',
    },
  },
});

theories(index, [
  {
    in: [
      [
        { id: 1, title: 'Abc' },
        { id: 3, title: 'Bac' },
      ],
    ],
    out: {
      1: { id: 1, title: 'Abc' },
      3: { id: 3, title: 'Bac' },
    },
  },
]);

theories(escapeRegExp, [
  {
    in: ['/^[a]{1,4}.a?b+$/'],
    out: '/\\^\\[a\\]\\{1,4\\}\\.a\\?b\\+\\$/',
  },
]);

describe('getAttribute', () => {
  test('Get existing attribute', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', '1');
    expect(getAttribute(input, 'data-someAttribute')).toEqual('1');
  });
  test('Get non-existent attribute', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', '1');
    expect(getAttribute(input, 'data-attr')).toEqual(undefined);
  });
});

describe('getParsedAttribute', () => {
  test('Get existing attribute', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', '1');
    expect(getParsedAttribute(input, 'data-someAttribute')).toEqual('1');
  });
  test('Trim attribute', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', '  1  ');
    expect(getParsedAttribute(input, 'data-someAttribute')).toEqual('1');
  });
  test('Ignore blank attributes', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', '');
    expect(getParsedAttribute(input, 'data-someAttribute')).toEqual(undefined);
  });
  test('Ignore whitespace-only attributes', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', '    ');
    expect(getParsedAttribute(input, 'data-someAttribute')).toEqual(undefined);
  });
  test('Get non-existent attribute', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', '1');
    expect(getParsedAttribute(input, 'data-attr')).toEqual(undefined);
  });
});

describe('getBooleanAttribute', () => {
  test('Get existing true attribute', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', 'TRUE');
    expect(getBooleanAttribute(input, 'data-someAttribute')).toEqual(true);
  });
  test('Get existing false attribute', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', 'faLse');
    expect(getBooleanAttribute(input, 'data-someAttribute')).toEqual(false);
  });
  test('Get existing false attribute with whitespace', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', '\tfalSe\n');
    expect(getBooleanAttribute(input, 'data-someAttribute')).toEqual(false);
  });
  test('Treat all non-boolean as false', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', '\tAbc\n');
    expect(getBooleanAttribute(input, 'data-someAttribute')).toEqual(false);
  });
  test('Get non-existent attribute', () => {
    const input = document.createElement('input');
    input.setAttribute('data-someattribute', '1');
    expect(getBooleanAttribute(input, 'data-attr')).toEqual(undefined);
  });
});

theories(takeBetween, [
  { in: [[], '', ''], out: [] },
  { in: [['a'], '', ''], out: [] },
  { in: [['a', 'b', 'c'], 'a', 'b'], out: ['b'] },
  { in: [['a', 'b', 'c'], 'a', 'c'], out: ['b', 'c'] },
  { in: [['a', 'b', 'c'], 'a', 'd'], out: [] },
]);
