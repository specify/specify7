import type { SchemaConfigEditorState } from '../types';
import { isEditorModified } from '../helpers';

const base = {
  container: { id: 1 },
  name: { id: 1, text: 'Name' },
  desc: { id: 2, text: 'Desc' },
  items: [],
  changedItems: [],
  initialContainer: { id: 1 },
  initialName: { id: 1, text: 'Name' },
  initialDesc: { id: 2, text: 'Desc' },
};

const makeState = (
  overrides: Record<string, unknown> = {}
): SchemaConfigEditorState =>
  ({ ...base, ...overrides }) as unknown as SchemaConfigEditorState;

describe('isEditorModified', () => {
  test('returns false for an unmodified editor', () => {
    expect(isEditorModified(makeState())).toBe(false);
  });

  test('returns true when the container changed', () => {
    expect(
      isEditorModified(makeState({ container: { id: 1, isHidden: true } }))
    ).toBe(true);
  });

  test('returns true when the name changed', () => {
    expect(
      isEditorModified(makeState({ name: { id: 1, text: 'Changed' } }))
    ).toBe(true);
  });

  test('returns true when the description changed', () => {
    expect(
      isEditorModified(makeState({ desc: { id: 2, text: 'Changed' } }))
    ).toBe(true);
  });

  test('returns true when any item changed', () => {
    expect(isEditorModified(makeState({ changedItems: [0] }))).toBe(true);
  });
});
