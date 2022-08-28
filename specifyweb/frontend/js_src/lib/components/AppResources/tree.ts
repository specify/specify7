import type {
  AppResources,
  AppResourcesTree,
} from './hooks';
import type {
  Collection,
  Discipline,
  SpAppResource,
  SpAppResourceDir,
  SpViewSetObj as SpViewSetObject,
} from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { addMissingFields } from '../DataModel/helpers';
import { sortFunction } from '../../utils/utils';
import { adminText } from '../../localization/admin';
import { userTypes } from '../PickLists/definitions';
import type { RA } from '../../utils/types';

export const getAppResourceTree = (
  resources: AppResources
): AppResourcesTree => [
  {
    label: adminText('globalResources'),
    key: 'globalResources',
    ...getGlobalAllResources(resources),
    subCategories: [],
  },
  {
    label: adminText('disciplineResources'),
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
  readonly viewSets: RA<SerializedResource<SpViewSetObject>>;
} {
  const globalDirectories = resources.directories.filter(
    ({ discipline, collection }) => discipline === null && collection === null
  );
  if (globalDirectories.length === 0)
    globalDirectories.push(
      addMissingFields('SpAppResourceDir', {
        userType: 'Common',
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
  return {
    directory: mainDirectory,
    ...mergeDirectories(globalDirectories, resources),
  };
}

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
  readonly viewSets: RA<SerializedResource<SpViewSetObject>>;
};

const getDirectoryChildren = (
  directory: SerializedResource<SpAppResourceDir>,
  resources: AppResources
): DirectoryChildren => ({
  appResources: resources.appResources
    .filter(
      ({ spAppResourceDir }) => spAppResourceDir === directory.resource_uri
    )
    .sort(sortFunction(({ name }) => name)),
  viewSets: resources.viewSets
    .filter(
      ({ spAppResourceDir }) => spAppResourceDir === directory.resource_uri
    )
    .sort(sortFunction(({ name }) => name)),
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
      });
    return {
      label: discipline.name ?? '',
      key: `discipline_${discipline.id}`,
      directory,
      ...mergeDirectories(directories, resources),
      subCategories: getDisciplineAppResources(discipline, resources),
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
          directory.specifyUser === null
      );
      const directory =
        directories[0] ??
        addMissingFields('SpAppResourceDir', {
          collection: collection.resource_uri,
        });
      return {
        label: collection.collectionName ?? '',
        key: `collection_${collection.id}`,
        directory,
        ...mergeDirectories(directories, resources),
        subCategories: getCollectionResources(collection, resources),
      };
    });

const getCollectionResources = (
  collection: SerializedResource<Collection>,
  resources: AppResources
): AppResourcesTree => [
  {
    label: adminText('userTypes'),
    key: 'userTypes',
    directory: undefined,
    appResources: [],
    viewSets: [],
    subCategories: getUserTypeResources(collection, resources),
  },
  {
    label: adminText('users'),
    key: 'users',
    directory: undefined,
    appResources: [],
    viewSets: [],
    subCategories: getUserResources(collection, resources),
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
        directory.specifyUser === null
    );
    const directory =
      directories[0] ??
      addMissingFields('SpAppResourceDir', {
        collection: collection.resource_uri,
        userType,
      });
    return {
      label: userType,
      key: `userType_${userType}`,
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
          directory.specifyUser === user.resource_uri
      );
      const directory =
        directories[0] ??
        addMissingFields('SpAppResourceDir', {
          collection: collection.resource_uri,
          specifyUser: user.resource_uri,
          isPersonal: true,
        });

      return {
        label: user.name,
        key: `user_${user.id}`,
        directory,
        ...mergeDirectories(directories, resources),
        subCategories: [],
      };
    })
    .sort(sortFunction(({ label }) => label));
