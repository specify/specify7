import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import type { GetOrSet, IR, RA } from '../../utils/types';
import { addMissingFields } from '../DataModel/addMissingFields';
import { fetchCollection } from '../DataModel/collection';
import type { SerializedResource } from '../DataModel/helperTypes';
import type {
  Collection,
  Discipline,
  SpAppResource,
  SpAppResourceData,
  SpecifyUser,
  SpViewSetObj,
} from '../DataModel/types';
import { userPreferences } from '../Preferences/userPreferences';
import { getAppResourceType } from './filtersHelpers';
import { getAppResourceCount, getAppResourceMode } from './helpers';
import { getAppResourceTree, getScope } from './tree';
import type { ScopedAppResourceDir } from './types';
import { appResourceSubTypes } from './types';

export type AppResources = {
  readonly directories: RA<ScopedAppResourceDir>;
  readonly disciplines: RA<SerializedResource<Discipline>>;
  readonly collections: RA<SerializedResource<Collection>>;
  readonly users: RA<SerializedResource<SpecifyUser>>;
  readonly appResources: RA<SerializedResource<SpAppResource>>;
  readonly viewSets: RA<SerializedResource<SpViewSetObj>>;
};

export function useAppResources(
  loadingScreen: boolean = true
): GetOrSet<AppResources | undefined> {
  return useAsyncState(
    React.useCallback(
      async () =>
        f.all({
          directories: fetchCollection('SpAppResourceDir', {
            limit: 0,
            domainFilter: false,
          }).then<AppResources['directories']>(({ records }) =>
            records.map((record) => ({ ...record, scope: getScope(record) }))
          ),
          disciplines: fetchCollection('Discipline', {
            limit: 0,
            domainFilter: false,
          }).then(({ records }) => records),
          collections: fetchCollection('Collection', {
            limit: 0,
            domainFilter: false,
          }).then(({ records }) => records),
          users: fetchCollection('SpecifyUser', {
            limit: 0,
            domainFilter: false,
          }).then(({ records }) => records),
          appResources: fetchCollection('SpAppResource', {
            limit: 0,
            domainFilter: false,
          }).then(({ records }) => records),
          viewSets: fetchCollection('SpViewSetObj', {
            limit: 0,
            domainFilter: false,
          }).then(({ records }) => records),
        }),
      []
    ),
    loadingScreen
  );
}

export type AppResourcesTree = RA<{
  readonly label: LocalizedString;
  /*
   * A string that would be stable thought the lifecycle of an object.
   * Used to identify a tree node when storing conformation it in localStorage.
   *
   * Directory key is created instead of using id, because app resource
   * needs a way to identify directories that don't yet have IDs (i.e, when
   * creating an app resource for a collection that didn't have any app resources
   * before, the collection won't have any SpAppResourceDir record, thus not
   * directory ID).
   */
  readonly key: string;
  readonly directory: ScopedAppResourceDir | undefined;
  readonly appResources: RA<
    SerializedResource<SpAppResource> & {
      readonly label?: LocalizedString;
    }
  >;
  readonly viewSets: RA<SerializedResource<SpViewSetObj>>;
  readonly subCategories: AppResourcesTree;
}>;

export function useResourcesTree(resources: AppResources): AppResourcesTree {
  const [localize] = userPreferences.use(
    'appResources',
    'appearance',
    'localizeResourceNames'
  );
  return React.useMemo<AppResourcesTree>(() => {
    const tree = getAppResourceTree(resources);
    return localize ? localizeTree(tree) : tree;
  }, [resources, localize]);
}

const localizeTree = (tree: AppResourcesTree): AppResourcesTree =>
  tree.map(({ appResources, subCategories, ...rest }) => ({
    ...rest,
    appResources: appResources.map(localizeResource),
    subCategories: localizeTree(subCategories),
  }));

function localizeResource(
  resource: SerializedResource<SpAppResource> & {
    readonly label?: LocalizedString;
  }
): SerializedResource<SpAppResource> & { readonly label?: LocalizedString } {
  const type = appResourceSubTypes[getAppResourceType(resource)];
  // Check that resource of this type can only have one specific name
  return typeof type.name === 'string'
    ? {
        ...resource,
        // Then replace the name with a localized label unless it's already set
        label: resource.label ?? type.label,
      }
    : resource;
}

export function useAppResourceCount(
  resourcesTree: AppResourcesTree[number]
): number {
  return React.useMemo(
    () => getAppResourceCount(resourcesTree),
    [resourcesTree]
  );
}

/**
 * Fetch resource contents
 */
export function useAppResourceData(
  resource: SerializedResource<SpAppResource | SpViewSetObj>,
  initialData: string | undefined
): {
  readonly resourceData: GetOrSet<
    SerializedResource<SpAppResourceData> | undefined
  >;
  readonly isChanged: boolean;
} {
  const initialValue = React.useRef<string>('');
  const [resourceData, setResourceData] = useAsyncState<
    SerializedResource<SpAppResourceData>
  >(
    React.useCallback(async () => {
      const relationshipName =
        getAppResourceMode(resource) === 'appResources'
          ? 'spAppResource'
          : 'spViewSetObj';
      const newResource = addMissingFields('SpAppResourceData', {
        [relationshipName]: resource.id,
        data: initialData,
      });
      const dataResource =
        typeof resource.id === 'number'
          ? await fetchCollection('SpAppResourceData', {
              limit: 1,
              [relationshipName]: resource.id,
              domainFilter: false,
            }).then(
              ({ records }) =>
                /*
                 * For some reason, app resource can have multiple app resource
                 * datas (but it never does in practice)
                 */
                records[0] ?? newResource
            )
          : newResource;
      const newData = fixLineBreaks(dataResource.data ?? '');
      initialValue.current = newData;
      return { ...dataResource, data: newData };
    }, [resource, initialData]),
    true
  );
  return {
    resourceData: [resourceData, setResourceData],
    isChanged: initialValue.current !== resourceData?.data,
  };
}

const fixLineBreaks = (string: string): string =>
  string.replaceAll(/[\n\r]+/gu, '\n');

export const getAppResourceExtension = (
  resource: SerializedResource<SpAppResource | SpViewSetObj>
): string =>
  resource._tableName === 'SpViewSetObj'
    ? 'xml'
    : getResourceExtension(resource as SerializedResource<SpAppResource>);

function getResourceExtension(
  resource: SerializedResource<SpAppResource>
): 'jrxml' | 'json' | 'properties' | 'txt' | 'xml' {
  const type = appResourceSubTypes[getAppResourceType(resource)];
  const mimeType = resource.mimeType?.toLowerCase() ?? type?.mimeType ?? '';
  if (mimeType in mimeMapper) return mimeMapper[mimeType];
  else if (mimeType.startsWith('jrxml')) return 'jrxml';
  else if (
    resource.name === 'preferences' &&
    mimeType === appResourceSubTypes.otherPropertiesResource.mimeType
  )
    return 'properties';
  else return 'txt';
}

const mimeMapper: IR<'json' | 'properties' | 'txt' | 'xml'> = {
  'application/json': 'json',
  'text/xml': 'xml',
  'text/plain': 'txt',
};
