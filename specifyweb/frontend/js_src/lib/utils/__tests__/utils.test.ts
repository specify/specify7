import { theories } from '../../tests/utils';
import { f } from '../functools';
import {
  camelToHuman,
  camelToKebab,
  capitalize,
  caseInsensitiveHash,
  chunk,
  clamp,
  escapeRegExp,
  findArrayDivergencePoint,
  group,
  index,
  insertItem,
  lowerToHuman,
  mappedFind,
  moveItem,
  multiSortFunction,
  removeItem,
  removeKey,
  replaceItem,
  replaceKey,
  sortFunction,
  spanNumber,
  split,
  stripFileExtension,
  stripLastOccurrence,
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

test('multiSortFunction', () => {
  expect(
    [
      { type: 'c', priority: 3 },
      { type: 'd', priority: 4 },
      { type: 'd', priority: 3 },
      { type: 'c', priority: 4 },
    ].sort(
      multiSortFunction(
        ({ type }) => type,
        ({ priority }) => priority,
        true
      )
    )
  ).toEqual([
    { type: 'c', priority: 4 },
    { type: 'c', priority: 3 },
    { type: 'd', priority: 4 },
    { type: 'd', priority: 3 },
  ]);
});

theories(split, [
  {
    in: [[1, 2, 3, 4, 5, 6, 7, 8], (value: number): boolean => value % 2 === 0],
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
  test('Found value', () =>
    expect(
      mappedFind([undefined, 1, 2, 3, 4, 5], (value) =>
        typeof value === 'number' ? value * 2 : undefined
      )
    ).toBe(2));
  test('Not found a value', () =>
    expect(
      mappedFind([undefined, undefined, undefined], f.id)
    ).toBeUndefined());
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
  'if empty array, inserts new item': { in: [[], 4, 'a'], out: ['a'] },
  'if empty array, inserts new item, even for negative index': {
    in: [[], -2, 'a'],
    out: ['a'],
  },
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

theories(moveItem, {
  'move up': { in: [[1, 2, 3], 1, 'up'], out: [2, 1, 3] },
  'move down': { in: [[1, 2, 3], 1, 'down'], out: [1, 3, 2] },
  'move up outside bounds': { in: [[1, 2, 3], 0, 'up'], out: [1, 2, 3] },
  'move down outside bounds': { in: [[1, 2, 3], 2, 'down'], out: [1, 2, 3] },
}),
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

theories(takeBetween, [
  { in: [[], '', ''], out: [] },
  { in: [['a'], '', ''], out: [] },
  { in: [['a', 'b', 'c'], 'a', 'b'], out: ['b'] },
  { in: [['a', 'b', 'c'], 'a', 'c'], out: ['b', 'c'] },
  { in: [['a', 'b', 'c'], 'a', 'd'], out: [] },
]);

theories(chunk, [
  { in: [[], 4], out: [] },
  {
    in: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4],
    out: [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10],
    ],
  },
]);

theories(stripLastOccurrence, [
  { in: ["test", ":"], out: "test"},
  { in: ["test:second", ":"], out: "test"},
  { in: ["test:second:third", ":"], out: "test:second" },
  { in: ["someText", ""], out: "someTex" },
  { in: [" ", ":"], out: " " },
  { in: [" ", ""], out: "" }
]);

theories(stripFileExtension, [
  { in: ["test"], out: "test"},
  { in: ["test.second"], out: "test"},
  { in: ["test.second.jpg"], out: "test.second" },
  { in: [" "], out: " " }
]);