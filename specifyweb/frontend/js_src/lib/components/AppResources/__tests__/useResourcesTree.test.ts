import { renderHook } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import { getAppResourceCount } from '../helpers';
import type { AppResourcesTree } from '../hooks';
import { useResourcesTree } from '../hooks';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

requireContext();

const { setAppResourceDir, testDisciplines } = utilsForTests;

describe('useResourcesTree', () => {
  const getResourceCountTree = (result: AppResourcesTree) =>
    result.reduce(
      (count, resource) => count + getAppResourceCount(resource),
      0
    );

  /*
   * Const getResourceCountStatic = (resources: AppResources) => {
   *     const allAppResources = [
   *         ...resources.appResources.map(({resource_uri})=>resource_uri),
   *         ...resources.viewSets.map(({resource_uri})=>resource_uri)
   *     ]
   *     return allAppResources.length;
   * }
   */

  const resources = {
    ...staticAppResources,
    disciplines: testDisciplines,
  };

  test('missing appresource dir', () => {
    const { result } = renderHook(() => useResourcesTree(resources));

    expect(result.current).toMatchSnapshot();

    // There is only 1 resource with the matching spappresourcedir.
    expect(getResourceCountTree(result.current)).toBe(1);
  });

  test('all appresource dir', () => {
    const appResourceSet = resources.appResources.reduce(
      (resources, _, index) =>
        setAppResourceDir(resources, 'appResources', index, 4),
      resources
    );

    const viewSet = setAppResourceDir(appResourceSet, 'viewSets', 0, 4);

    const { result } = renderHook(() => useResourcesTree(viewSet));

    expect(result.current).toMatchSnapshot();

    expect(getResourceCountTree(result.current)).toBe(4);
  });
});
