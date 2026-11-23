import type { RA } from '../../utils/types';
import { fetchCollection } from '../DataModel/collection';
import type { SerializedResource } from '../DataModel/helperTypes';
import { parseResourceUrl } from '../DataModel/resource';
import type { Collection, Discipline, SpQueryFolder } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';

/**
 * Extract the id from a resource API URL (e.g. `/api/specify/spqueryfolder/5/`).
 * Returns null if the URL is absent or does not end in a numeric id.
 */
export const parseResourceId = (
  uri: string | null | undefined
): number | null =>
  uri === null || uri === undefined
    ? null
    : (parseResourceUrl(uri)?.[1] ?? null);

/**
 * Whether a query folder is shared (has a non-empty scope) rather than
 * personal to a single user.
 */
export const isSharedFolder = (
  folder: SerializedResource<SpQueryFolder>
): boolean => folder.scopeType !== null && folder.scopeType !== '';

/**
 * Fetch the query folders the current user can see: the user's own personal
 * folders plus folders shared at any scope. Sorted alphabetically by name.
 */
export const fetchVisibleQueryFolders = async (): Promise<
  RA<SerializedResource<SpQueryFolder>>
> =>
  fetchCollection('SpQueryFolder', {
    limit: 0,
    domainFilter: true,
    orderBy: 'name',
  }).then(({ records }) =>
    records.filter(
      (folder) =>
        isSharedFolder(folder) ||
        parseResourceId(folder.specifyUser) === userInformation.id
    )
  );

/** Fetch the list of collections for the folder scope picker */
export const fetchCollections = async (): Promise<
  RA<SerializedResource<Collection>>
> =>
  fetchCollection('Collection', {
    limit: 0,
    domainFilter: false,
  }).then(({ records }) => records);

/** Fetch the list of disciplines for the folder scope picker */
export const fetchDisciplines = async (): Promise<
  RA<SerializedResource<Discipline>>
> =>
  fetchCollection('Discipline', {
    limit: 0,
    domainFilter: false,
  }).then(({ records }) => records);

export const getFolderScopePayload = (
  scopeType: string,
  collectionId: number | null,
  disciplineId: number | null
): {
  readonly scopeType: string | null;
  readonly collection: string | null;
  readonly discipline: string | null;
  readonly specifyUser: string | null;
} => {
  const collection =
    collectionId !== null ? `/api/specify/collection/${collectionId}/` : null;
  const discipline =
    disciplineId !== null ? `/api/specify/discipline/${disciplineId}/` : null;
  switch (scopeType) {
    case 'Collection':
      return { scopeType, collection, discipline: null, specifyUser: null };
    case 'Discipline':
      return { scopeType, collection: null, discipline, specifyUser: null };
    case 'Database':
      return {
        scopeType,
        collection: null,
        discipline: null,
        specifyUser: null,
      };
    default:
      return {
        scopeType: null,
        collection: null,
        discipline: null,
        specifyUser: userInformation.resource_uri,
      };
  }
};
