import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpAppResource, SpViewSetObj } from '../DataModel/types';
import type { AppResourcesConformation } from './Aside';
import type { AppResourcesTree } from './hooks';

export type AppResourceMode = 'appResources' | 'viewSets';

export const getAppResourceMode = (
  resource: SerializedResource<SpAppResource | SpViewSetObj>
): AppResourceMode =>
  resource._tableName === 'SpAppResource' ? 'appResources' : 'viewSets';

export const getAppResourceCount = (
  resourcesTree: AppResourcesTree[number]
): number =>
  resourcesTree.appResources.length +
  resourcesTree.viewSets.length +
  f.sum(resourcesTree.subCategories.map(getAppResourceCount));

export const buildAppResourceConformation = (
  resourcesTree: AppResourcesTree
): RA<AppResourcesConformation> =>
  resourcesTree
    .filter(
      ({ subCategories, appResources, viewSets }) =>
        subCategories.length > 0 ||
        appResources.length > 0 ||
        viewSets.length > 0
    )
    .map(({ key, subCategories }) => ({
      key,
      children: buildAppResourceConformation(subCategories),
    }));
