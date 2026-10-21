import { renderHook } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { useEditorTabs } from '../Tabs';
import { staticAppResources } from './staticAppResources';

requireContext();

describe('useEditorTabs', () => {
  test('xml editor', () => {
    const { result } = renderHook(() =>
      useEditorTabs(staticAppResources.viewSets[0])
    );
    expect(result.current.map(({ label }) => label)).toEqual([
      'Visual Editor',
      'XML Editor',
    ]);
  });

  test('text editor', () => {
    const { result } = renderHook(() =>
      useEditorTabs(staticAppResources.appResources[1])
    );
    expect(result.current.map(({ label }) => label)).toEqual(['Text Editor']);
  });

  test('user preferences editor', () => {
    const { result } = renderHook(() =>
      useEditorTabs(
        addMissingFields('SpAppResource', {
          name: 'UserPreferences',
          mimeType: 'application/json',
        })
      )
    );

    expect(result.current.map(({ label }) => label)).toEqual([
      'Visual Editor',
      'JSON Editor',
    ]);
  });
});
