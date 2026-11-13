import {
  canMoveField,
  isReadOnlyFieldIndex,
  wouldMoveReadOnlyField,
} from '../Fields';
import type { QueryField } from '../helpers';

const fields: readonly QueryField[] = [0, 1, 2].map((id) => ({
  id,
  mappingPath: [],
  sortType: undefined,
  isDisplay: true,
  filters: [],
}));
const isFieldReadOnly = (_field: QueryField, line: number): boolean =>
  line === 1;

describe('canMoveField', () => {
  test('prevents moving a field across a read-only neighbor', () => {
    expect(canMoveField(fields, 0, 'down', isFieldReadOnly)).toBe(false);
    expect(canMoveField(fields, 2, 'up', isFieldReadOnly)).toBe(false);
  });

  test('prevents moving a read-only field', () => {
    expect(canMoveField(fields, 1, 'up', isFieldReadOnly)).toBe(false);
    expect(canMoveField(fields, 1, 'down', isFieldReadOnly)).toBe(false);
  });

  test('allows in-bounds moves between editable fields', () => {
    expect(canMoveField(fields, 0, 'down', undefined)).toBe(true);
    expect(canMoveField(fields, 2, 'up', undefined)).toBe(true);
  });

  test('prevents moves past collection boundaries', () => {
    expect(canMoveField(fields, 0, 'up', undefined)).toBe(false);
    expect(canMoveField(fields, 2, 'down', undefined)).toBe(false);
  });
});

describe('isReadOnlyFieldIndex', () => {
  test('identifies valid read-only target indexes', () => {
    expect(isReadOnlyFieldIndex(fields, 1, isFieldReadOnly)).toBe(true);
    expect(isReadOnlyFieldIndex(fields, 0, isFieldReadOnly)).toBe(false);
  });

  test('rejects indexes outside the field collection', () => {
    expect(isReadOnlyFieldIndex(fields, -1, isFieldReadOnly)).toBe(false);
    expect(isReadOnlyFieldIndex(fields, fields.length, isFieldReadOnly)).toBe(
      false
    );
  });
});

describe('wouldMoveReadOnlyField', () => {
  const sortableFields = [0, 1, 2, 3].map((id) => ({
    ...fields[0]!,
    id,
  }));

  test('detects moves across or from a read-only position', () => {
    expect(wouldMoveReadOnlyField(sortableFields, 0, 2, isFieldReadOnly)).toBe(
      true
    );
    expect(wouldMoveReadOnlyField(sortableFields, 1, 0, isFieldReadOnly)).toBe(
      true
    );
  });

  test('allows moves that leave read-only positions unchanged', () => {
    expect(wouldMoveReadOnlyField(sortableFields, 2, 3, isFieldReadOnly)).toBe(
      false
    );
    expect(wouldMoveReadOnlyField(sortableFields, 2, 2, isFieldReadOnly)).toBe(
      false
    );
  });
});
