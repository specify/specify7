import { renderHook } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import { getResourceApiUrl } from '../../DataModel/resource';
import { exportsForTests } from '../EditorWrapper';
import type { AppResources } from '../hooks';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

requireContext();

const { simpleTree } = utilsForTests;

const { useDirectory } = exportsForTests;

describe('useDirectory', () => {
  test('case: undefined key and resource', () => {
    const { result } = renderHook(() =>
      useDirectory(
        undefined,
        simpleTree(),
        undefined,
        staticAppResources as unknown as AppResources
      )
    );

    expect(result.current).toBeUndefined();
  });

  test('case: valid directoryUrl in resource', () => {
    const resource = staticAppResources.appResources[1];
    const expectedDirectory = staticAppResources.directories[0];

    const { result } = renderHook(() =>
      useDirectory(
        undefined,
        simpleTree(),
        resource,
        staticAppResources as unknown as AppResources
      )
    );

    expect(result.current).toEqual(expectedDirectory);
  });

  test('case: valid directoryKey (invalid dir url)', () => {
    const invalidDirectoryUrl = getResourceApiUrl('SpAppResourceDir', 999);
    const rawResource = staticAppResources.appResources[1];
    const resource = { ...rawResource, spAppResourceDir: invalidDirectoryUrl };

    const tree = simpleTree();

    const { result } = renderHook(() =>
      useDirectory(
        tree[3].key,
        tree,
        resource,
        staticAppResources as unknown as AppResources
      )
    );

    expect(result.current).toEqual(tree[3].directory);
  });

  test('case: valid directoryKey (undefined dir url)', () => {
    const tree = simpleTree();

    const { result } = renderHook(() =>
      useDirectory(
        tree[3].key,
        tree,
        undefined,
        staticAppResources as unknown as AppResources
      )
    );

    expect(result.current).toEqual(tree[3].directory);
  });
});
