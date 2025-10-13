import { renderHook } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { useEditorTabs } from '../Tabs';
import { staticAppResources } from './staticAppResources';

requireContext();

describe('useEditorTabs', () => {
  test('xml editor', () => {
    const { result } = renderHook(() =>
      useEditorTabs(staticAppResources.viewSets[0], undefined)
    );
    expect(result.current.map(({ label }) => label)).toEqual([
      'Visual Editor',
      'XML Editor',
    ]);
  });

  test('global preferences editor', () => {
    const { result } = renderHook(() =>
      useEditorTabs(
        staticAppResources.appResources[1],
        staticAppResources.directories[0]
      )
    );
    expect(result.current.map(({ label }) => label)).toEqual([
      'Visual Editor',
      'JSON Editor',
    ]);
  });

  test('remote preferences editor falls back to text', () => {
    const { result } = renderHook(() =>
      useEditorTabs(
        addMissingFields('SpAppResource', {
          name: 'preferences',
          mimeType: 'text/x-java-properties',
        }),
        addMissingFields('SpAppResourceDir', {
          userType: 'Prefs',
        })
      )
    );

    expect(result.current.map(({ label }) => label)).toEqual(['Text Editor']);
  });

  test('user preferences editor', () => {
    const { result } = renderHook(() =>
      useEditorTabs(
        addMissingFields('SpAppResource', {
          name: 'UserPreferences',
          mimeType: 'application/json',
        }),
        undefined
      )
    );

    expect(result.current.map(({ label }) => label)).toEqual([
      'Visual Editor',
      'JSON Editor',
    ]);
  });
});
