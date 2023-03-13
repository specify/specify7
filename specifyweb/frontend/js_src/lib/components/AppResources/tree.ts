import type { LocalizedString } from 'typesafe-i18n';

import { resourcesText } from '../../localization/resources';
import { userText } from '../../localization/user';
import type { RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { addMissingFields } from '../DataModel/addMissingFields';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getResourceApiUrl } from '../DataModel/resource';
import type {
  Collection,
  Discipline,
  SpAppResource,
  SpAppResourceDir,
  SpViewSetObj,
} from '../DataModel/types';
import { userTypes } from '../PickLists/definitions';
import type { AppResources, AppResourcesTree } from './hooks';

export const getAppResourceTree = (
  resources: AppResources
): AppResourcesTree => [
  {
    label: resourcesText.globalResources(),
    key: 'globalResources',
    ...getGlobalAllResources(resources),
    subCategories: [],
  },
  {
    label: resourcesText.disciplineResources(),
    key: 'disciplineResources',
    directory: undefined,
    appResources: [],
    viewSets: [],
    subCategories: sortTree(getScopedAppResources(resources)),
  },
];

const sortTree = (tree: AppResourcesTree): AppResourcesTree =>
  Array.from(tree)
    .sort(sortFunction(({ label }) => label))
    .map(({ subCategories, ...rest }) => ({
      ...rest,
      subCategories: sortTree(subCategories),
    }));

function getGlobalAllResources(resources: AppResources): {
  readonly directory: SerializedResource<SpAppResourceDir>;
  readonly appResources: RA<SerializedResource<SpAppResource>>;
  readonly viewSets: RA<SerializedResource<SpViewSetObj>>;
} {
  const globalDirectories = resources.directories.filter(
    ({ discipline, collection }) => discipline === null && collection === null
  );
  if (globalDirectories.length === 0)
    globalDirectories.push(
      addMissingFields('SpAppResourceDir', {
        userType: 'Common',
        collection: undefined,
        discipline: undefined,
      })
    );
  /**
   * Even though there are several global directories, for consistency, all
   * global resources are added to the one that has userType==='Common'
   */
  const mainDirectory =
    globalDirectories.find(({ userType }) => userType === 'Common') ??
    globalDirectories[0];
  /**
   * Resources from all global directories are visually merged into a single
   * one. This is because there is currently no use case for separate
   * global resource dirs, while having them separated in the UI would
   * suggest the opposite.
   */
  const { appResources, viewSets } = mergeDirectories(
    globalDirectories,
    resources
  );
  return {
    directory: mainDirectory,
    appResources: disambiguateGlobalPrefs(appResources, globalDirectories),
    viewSets,
  };
}

const prefResource = 'preferences';
const globalUserType = 'Global Prefs'.toLowerCase();
const remoteUserType = 'Prefs'.toLowerCase();

const disambiguateGlobalPrefs = (
  appResources: RA<SerializedResource<SpAppResource>>,
  directories: RA<SerializedResource<SpAppResourceDir>>
): RA<SerializedResource<SpAppResource>> =>
  appResources.map((resource) => {
    if (resource.name !== prefResource) return resource;
    const directory = directories.find(
      ({ id }) =>
        getResourceApiUrl('SpAppResourceDir', id) === resource.spAppResourceDir
    );
    if (!directory) return resource;
    const userType = directory.userType?.toLowerCase();
    if (userType === globalUserType)
      return { ...resource, name: resourcesText.globalPreferences() };
    else if (userType === remoteUserType)
      return { ...resource, name: resourcesText.remotePreferences() };
    else return resource;
  });

/**
 * Merge resources from several directories into a single one.
 * There can be several global directories. Those are merged for the purposes
 * of UI to simplify things.
 * Additionally, if user's UserType was changed, they would have several
 * personal directories in a given collection.
 * There may be other cases too. That is why the code always assumes that
 * more than one directory may be returned and merges them all together.
 */
const mergeDirectories = (
  directories: RA<SerializedResource<SpAppResourceDir>>,
  resources: AppResources
): DirectoryChildren =>
  directories
    .map((directory) => getDirectoryChildren(directory, resources))
    .reduce<DirectoryChildren>(
      (combined, { appResources, viewSets }) => ({
        appResources: [...combined.appResources, ...appResources],
        viewSets: [...combined.viewSets, ...viewSets],
      }),
      { appResources: [], viewSets: [] }
    );

type DirectoryChildren = {
  readonly appResources: RA<SerializedResource<SpAppResource>>;
  readonly viewSets: RA<SerializedResource<SpViewSetObj>>;
};

const getDirectoryChildren = (
  directory: SerializedResource<SpAppResourceDir>,
  resources: AppResources
): DirectoryChildren => ({
  appResources: resources.appResources.filter(
    ({ spAppResourceDir }) => spAppResourceDir === directory.resource_uri
  ),
  viewSets: resources.viewSets.filter(
    ({ spAppResourceDir }) => spAppResourceDir === directory.resource_uri
  ),
});

export const getScopedAppResources = (
  resources: AppResources
): AppResourcesTree =>
  resources.disciplines.map((discipline) => {
    const directories = resources.directories.filter(
      (directory) =>
        directory.discipline === discipline.resource_uri &&
        directory.collection === null
    );
    const directory =
      directories[0] ??
      addMissingFields('SpAppResourceDir', {
        discipline: discipline.resource_uri,
        collection: undefined,
      });
    return {
      label: (discipline.name as LocalizedString) ?? '',
      key: `discipline_${discipline.id}`,
      directory,
      ...mergeDirectories(directories, resources),
      subCategories: sortTree(getDisciplineAppResources(discipline, resources)),
    };
  });

const getDisciplineAppResources = (
  discipline: SerializedResource<Discipline>,
  resources: AppResources
): AppResourcesTree =>
  resources.collections
    .filter((collection) => collection.discipline === discipline.resource_uri)
    .map((collection) => {
      const directories = resources.directories.filter(
        (directory) =>
          directory.collection === collection.resource_uri &&
          directory.userType === null &&
          !directory.isPersonal
      );
      const directory =
        directories[0] ??
        addMissingFields('SpAppResourceDir', {
          collection: collection.resource_uri,
          discipline: collection.discipline,
        });
      return {
        label: (collection.collectionName as LocalizedString) ?? '',
        key: `collection_${collection.id}`,
        directory,
        ...mergeDirectories(directories, resources),
        subCategories: sortTree(getCollectionResources(collection, resources)),
      };
    });

const getCollectionResources = (
  collection: SerializedResource<Collection>,
  resources: AppResources
): AppResourcesTree => [
  {
    label: resourcesText.userTypes(),
    key: 'userTypes',
    directory: undefined,
    appResources: [],
    viewSets: [],
    subCategories: sortTree(getUserTypeResources(collection, resources)),
  },
  {
    label: userText.users(),
    key: 'users',
    directory: undefined,
    appResources: [],
    viewSets: [],
    subCategories: sortTree(getUserResources(collection, resources)),
  },
];

const getUserTypeResources = (
  collection: SerializedResource<Collection>,
  resources: AppResources
): AppResourcesTree =>
  userTypes.map((userType) => {
    const directories = resources.directories.filter(
      (directory) =>
        directory.collection === collection.resource_uri &&
        directory.userType?.toLowerCase() === userType.toLowerCase() &&
        !directory.isPersonal
    );
    const directory =
      directories[0] ??
      addMissingFields('SpAppResourceDir', {
        collection: collection.resource_uri,
        discipline: collection.discipline,
        userType: userType.toLowerCase(),
      });
    return {
      label: userType as LocalizedString,
      key: `collection_${collection.id}_userType_${userType}`,
      directory,
      ...mergeDirectories(directories, resources),
      subCategories: [],
    };
  });

const getUserResources = (
  collection: SerializedResource<Collection>,
  resources: AppResources
): AppResourcesTree =>
  resources.users
    .map((user) => {
      const directories = resources.directories.filter(
        (directory) =>
          directory.collection === collection.resource_uri &&
          directory.specifyUser === user.resource_uri &&
          directory.isPersonal
      );
      const directory =
        directories[0] ??
        addMissingFields('SpAppResourceDir', {
          collection: collection.resource_uri,
          discipline: collection.discipline,
          specifyUser: user.resource_uri,
          isPersonal: true,
        });

      return {
        label: user.name as LocalizedString,
        key: `collection_${collection.id}_user_${user.id}`,
        directory,
        ...mergeDirectories(directories, resources),
        subCategories: [],
      };
    })
    .sort(sortFunction(({ label }) => label));
