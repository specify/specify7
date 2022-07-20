import type { AppResourcesConformation } from './components/appresourcesaside';
import type {
  AppResources,
  AppResourcesTree,
} from './components/appresourceshooks';
import type {
  SpAppResource,
  SpViewSetObj as SpViewSetObject,
} from './datamodel';
import type { SerializedResource } from './datamodelutils';
import { f } from './functools';
import { tableFromUrl } from './resource';
import type { SpecifyModel } from './specifymodel';
import type { RA } from './types';

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
  tableFromUrl(resource.resource_uri) === 'SpAppResource'
    ? 'appResources'
    : 'viewSets';

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
