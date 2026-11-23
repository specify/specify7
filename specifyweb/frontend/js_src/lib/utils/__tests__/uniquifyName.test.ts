import { theories } from '../../tests/utils';
import { getUniqueName } from '../uniquifyName';

theories(getUniqueName, [
  { in: ['a', []], out: 'a' },
  { in: ['a', ['a']], out: 'a (2)' },
  { in: ['a', ['a', 'a (2)']], out: 'a (3)' },
  // With length limit
  { in: ['abcdef', ['abcdef'], 6], out: 'ab' },
  // Unused name is still truncated to maxLength
  { in: ['abcdef', [], 4], out: 'abcd' },
  // Name that collides with a used name after truncation is made unique
  { in: ['abcdefghij', ['abcdefgh'], 8], out: 'abcd' },
  // Truncation does not split surrogate pairs
  { in: ['😀😀', [], 3], out: '😀' },
  { in: ['😀😀', [], 4], out: '😀😀' },
  { in: ['abcdef', ['abcdef', 'ab'], 6], out: 'ab (2)' },
  { in: ['abcdef', ['abcdef', 'abcd'], 6, 'name'], out: 'abcd_2' },
  // With different format
  { in: ['abc', [], 6, 'name'], out: 'abc' },
  { in: ['abc', ['abc', 'ab'], 6, 'name'], out: 'abc_2' },
  { in: ['abc', ['abc', 'abc_2', 'ab'], 6, 'name'], out: 'abc_3' },
  /*
   * Suffix can't fit and the empty candidate is already used - falls back to
   * a truncated suffix-only name instead of recursing indefinitely
   */
  { in: ['a', ['a', ''], 1], out: ' ' },
  { in: ['a', ['a', ''], 1, 'name'], out: '_' },
  // A bounded unique name with a lower index exists and is found
  { in: ['', ['', ' (99)'], 4], out: ' (2)' },
  { in: ['a', ['a', '', ' '], 1], out: 'b' },
  { in: ['a', ['a', '', '_'], 1, 'name'], out: 'b' },
  { in: ['a', [], 0], out: '' },
]);

test('reports when no unique name fits', () => {
  expect(() => getUniqueName('a', [''], 0)).toThrow(RangeError);
});

test('uses longer names after exhausting well-formed single-unit names', () => {
  const singleUnitNames = Array.from({ length: 0x1_00_00 }, (_, codeUnit) =>
    codeUnit < 0xd8_00 || codeUnit > 0xdf_ff
      ? String.fromCharCode(codeUnit)
      : undefined
  ).filter((name): name is string => name !== undefined);
  const usedNames = ['', ' (', ...singleUnitNames];

  expect(getUniqueName('a', usedNames, 2)).toBe('aa');
  expect(() => getUniqueName('a', usedNames, 1)).toThrow(RangeError);
});
