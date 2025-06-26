import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { KEY, sortFunction } from '../../utils/utils';
import { toResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpAppResource, SpViewSetObj } from '../DataModel/types';
import type { AppResources } from './hooks';
import { appResourceSubTypes } from './types';

export const allAppResources = Array.from(
  Object.keys(appResourceSubTypes)
).sort(sortFunction(f.id));

export const defaultAppResourceFilters = {
  appResources: allAppResources,
  viewSets: true,
};

export type AppResourceFilters = {
  readonly appResources: RA<keyof typeof appResourceSubTypes>;
  readonly viewSets: boolean;
};

/**
 * Determine if all app resource types are visible
 */
export const isAllAppResourceTypes = (
  appResources: RA<keyof typeof appResourceSubTypes>
): boolean =>
  JSON.stringify(Array.from(appResources).sort(sortFunction(f.id))) ===
  JSON.stringify(allAppResources);

export function countAppResources(
  resources: AppResources,
  filters: AppResourceFilters
): number {
  const filtered = filterAppResources(resources, filters);
  return filtered.appResources.length + filtered.viewSets.length;
}

export const filterAppResources = (
  resources: AppResources,
  filters: AppResourceFilters
): AppResources => ({
  ...resources,
  viewSets: filters.viewSets ? resources.viewSets : [],
  appResources:
    filters.appResources.length === 0
      ? []
      : isAllAppResourceTypes(filters.appResources)
        ? resources.appResources
        : resources.appResources.filter((resource) =>
            filters.appResources.includes(getAppResourceType(resource))
          ),
});

export const getResourceType = (
  resource: SerializedResource<SpAppResource | SpViewSetObj>
): keyof typeof appResourceSubTypes | 'viewSet' =>
  f.maybe(toResource(resource, 'SpAppResource'), getAppResourceType) ??
  'viewSet';

export const getAppResourceType = (
  resource: SerializedResource<SpAppResource>
): keyof typeof appResourceSubTypes =>
  resource.name === 'preferences' && (resource.mimeType ?? '') === ''
    ? 'otherPropertiesResource'
    : (Object.entries(appResourceSubTypes).find(([_key, { name, mimeType }]) =>
        name === undefined
          ? mimeType === resource.mimeType
          : name === resource.name
      )?.[KEY] ?? 'otherAppResources');
