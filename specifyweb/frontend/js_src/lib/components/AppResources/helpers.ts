import type { AppResourcesConformation } from './Aside';
import type {
  AppResources,
  AppResourcesTree,
} from './hooks';
import type {
  SpAppResource,
  SpViewSetObj as SpViewSetObject,
} from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { RA } from '../../utils/types';

export const getAppResource = (
  resources: AppResources,
  model: SpecifyModel<SpAppResource | SpViewSetObject>,
  resourceId: number | undefined
): SerializedResource<SpAppResource | SpViewSetObject> | false | undefined =>
  typeof resourceId === 'number'
    ? (
        (model.name === 'SpAppResource'
          ? resources.appResources
          : resources.viewSets) as RA<SerializedResource<SpAppResource>>
      ).find(({ id }) => id === resourceId) ?? false
    : undefined;

export type AppResourceMode = 'appResources' | 'viewSets';

export const getAppResourceMode = (
  resource: SerializedResource<SpAppResource | SpViewSetObject>
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
