import { resourcesText } from '../../localization/resources';
import { userText } from '../../localization/user';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
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
import type { AppResourceScope, ScopedAppResourceDir } from './types';

export const globalResourceKey = 'globalResource';

export const getScope = (
  directory: SerializedResource<SpAppResourceDir>
): AppResourceScope => {
  if (directory.discipline === null && directory.collection === null)
    return 'global';
  else if (directory.collection === null) return 'discipline';
  else if (directory.userType === null && !directory.isPersonal)
    return 'collection';
  else if (directory.isPersonal) {
    return 'user';
  } else {
    return 'userType';
  }
};

export const getAppResourceTree = (
  resources: AppResources
): AppResourcesTree => [
  {
    label: resourcesText.globalResources(),
    key: globalResourceKey,
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

export const sortTree = (tree: AppResourcesTree): AppResourcesTree =>
  Array.from(tree)
    .sort(sortFunction(({ label }) => label))
    .map(({ subCategories, ...rest }) => ({
      ...rest,
      subCategories: sortTree(subCategories),
    }));

function getGlobalAllResources(resources: AppResources): {
  readonly directory: ScopedAppResourceDir;
  readonly appResources: RA<SerializedResource<SpAppResource>>;
  readonly viewSets: RA<SerializedResource<SpViewSetObj>>;
} {
  const globalDirectories = resources.directories.filter(
    (directory) => directory.scope === 'global'
  );
  if (globalDirectories.length === 0)
    globalDirectories.push({
      ...addMissingFields('SpAppResourceDir', {
        userType: 'Common',
      }),
      scope: 'global',
    });
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
): AppResourcesTree[number]['appResources'] =>
  appResources.map((resource) => {
    if (resource.name !== prefResource) return resource;
    const directory = directories.find(
      ({ id }) =>
        getResourceApiUrl('SpAppResourceDir', id) === resource.spAppResourceDir
    );
    // Pretty sure this is redundant... that is, directory should always be defined.
    if (!directory) return resource;
    const userType = directory.userType?.toLowerCase();
    if (userType === globalUserType)
      return { ...resource, label: resourcesText.globalPreferences() };
    else if (userType === remoteUserType)
      return { ...resource, label: resourcesText.remotePreferences() };
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
        directory.scope === 'discipline' &&
        directory.discipline === discipline.resource_uri
    );
    const directory =
      directories[0] ??
      addMissingFields('SpAppResourceDir', {
        discipline: discipline.resource_uri,
        collection: undefined,
      });
    return {
      label: localized(discipline.name ?? ''),
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
          directory.scope === 'collection'
      );
      const directory =
        directories[0] ??
        addMissingFields('SpAppResourceDir', {
          collection: collection.resource_uri,
          discipline: collection.discipline,
        });
      return {
        /*
         * REFACTOR: should data coming from the database be considered
         *  localized? It depends... no in the case of agent type, yes in the
         *  case of collection name
         */
        label: localized(collection.collectionName ?? ''),
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
    label: userText.users(),
    key: 'users',
    directory: undefined,
    appResources: [],
    viewSets: [],
    subCategories: sortTree(getUserResources(collection, resources)),
  },
  {
    label: resourcesText.userTypes(),
    key: 'userTypes',
    directory: undefined,
    appResources: [],
    viewSets: [],
    subCategories: sortTree(getUserTypeResources(collection, resources)),
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
        directory.scope === 'userType'
    );
    const directory =
      directories[0] ??
      addMissingFields('SpAppResourceDir', {
        collection: collection.resource_uri,
        discipline: collection.discipline,
        userType: userType.toLowerCase(),
      });
    return {
      label: localized(userType),
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
  resources.users.map((user) => {
    const directories = resources.directories.filter(
      (directory) =>
        directory.collection === collection.resource_uri &&
        directory.specifyUser === user.resource_uri &&
        directory.scope === 'user'
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
      label: localized(user.name),
      key: `collection_${collection.id}_user_${user.id}`,
      directory,
      ...mergeDirectories(directories, resources),
      subCategories: [],
    };
  });

export const exportsForTests = {
  getGlobalAllResources,
  disambiguateGlobalPrefs,
  mergeDirectories,
  getDirectoryChildren,
  getDisciplineAppResources,
  getUserTypeResources,
};
