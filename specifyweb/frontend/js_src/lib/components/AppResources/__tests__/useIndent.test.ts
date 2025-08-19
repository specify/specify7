import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { userPreferences } from '../../Preferences/userPreferences';
import { useIndent } from '../EditorComponents';

describe('useIndent', () => {
  test('simple render', () => {
    const { result } = renderHook(useIndent);
    expect(result.current).toMatchInlineSnapshot(`"  "`);
  });

  test('changes on updates', async () => {
    userPreferences.set('appResources', 'behavior', 'indentSize', 4);
    userPreferences.set('appResources', 'behavior', 'indentWithTab', false);

    const { result } = renderHook(useIndent);
    const initialValue = result.current;

    await act(() => {
      userPreferences.set('appResources', 'behavior', 'indentSize', 5);
    });

    const laterValue = result.current;
    expect(initialValue).not.toBe(laterValue);

    expect(laterValue).toMatchInlineSnapshot(`"     "`);
  });
});
