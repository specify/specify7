import { renderHook } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import type { SerializedResource } from '../../DataModel/helperTypes';
import type { Discipline } from '../../DataModel/types';
import { getAppResourceCount } from '../helpers';
import type { AppResourcesTree } from '../hooks';
import { useResourcesTree } from '../hooks';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

requireContext();

const {setAppResourceDir} = utilsForTests;

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
    disciplines: [
      {
        id: 3,
        isPaleoContextEmbedded: true,
        name: 'Ichthyology',
        paleoContextChildTable: 'collectionobject',
        regNumber: '1344636812.54',
        timestampCreated: '2012-08-09T12:23:29',
        timestampModified: '2012-08-09T12:23:29',
        type: 'fish',
        version: 11,
        createdByAgent: '/api/specify/agent/1/',
        dataType: '/api/specify/datatype/1/',
        division: '/api/specify/division/2/',
        geographyTreeDef: '/api/specify/geographytreedef/1/',
        taxonTreeDef: '/api/specify/taxontreedef/1/',
        geologicTimePeriodTreeDef: '/api/specify/geologictimeperiodtreedef/1/',
        lithoStratTreeDef: '/api/specify/lithostrattreedef/1/',
        tectonicUnitTreeDef: '/api/specify/tectonicunittreedef/1/',
        modifiedByAgent: '/api/specify/agent/2/',
        attributeDefs: '/api/specify/attributedef/?discipline=3',
        collections: '/api/specify/collection/?discipline=3',
        spExportSchemas: '/api/specify/spexportschema/?discipline=3',
        spLocaleContainers: '/api/specify/splocalecontainer/?discipline=3',
        resource_uri: '/api/specify/discipline/3/',
        userGroups: '/api/specify/SpPrincipal?scope=3',
        _tableName: 'Discipline',
      },
    ] as unknown as RA<SerializedResource<Discipline>>,
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

    // The user type resources are added for each specify user....
    expect(getResourceCountTree(result.current)).toBe(8);
  });
});
