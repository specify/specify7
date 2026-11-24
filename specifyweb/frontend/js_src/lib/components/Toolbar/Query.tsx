/**
 * Display a list of queries
 */

import React from 'react';
import { useOutletContext } from 'react-router';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { ajax } from '../../utils/ajax';
import { raise } from '../Errors/Crash';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { DataEntry } from '../Atoms/DataEntry';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import type { SerializedCollection } from '../DataModel/collection';
import { backendFilter, getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { idFromUrl, resourceEvents } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import { getTableById, tables } from '../DataModel/tables';
import type { SpQuery } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { loadingGif } from '../Molecules';
import { DateElement } from '../Molecules/DateElement';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { usePaginator } from '../Molecules/Paginator';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
} from '../Permissions/helpers';
import { QueryEditButton } from '../QueryBuilder/Edit';
import { cloneSharedQuery } from '../QueryBuilder/Save';
import { useQueryRefresh } from '../QueryBuilder/useQueryRefresh';
import { OverlayContext } from '../Router/Router';
import { SafeOutlet } from '../Router/RouterUtils';
import { DialogListSkeleton } from '../SkeletonLoaders/DialogList';
import { QueryTablesWrapper } from './QueryTablesWrapper';
import { interactionsText } from '../../localization/interactions';

export function QueriesOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return (
    <SafeOutlet<QueryListContextType>
      getQuerySelectCallback={undefined}
      newQueryUrl="/specify/overlay/queries/new/"
      onClose={handleClose}
    />
  );
}

export type QueryListContextType = {
  readonly newQueryUrl: string;
  readonly onClose: () => void;
  readonly getQuerySelectCallback?: (
    query: SerializedResource<SpQuery>
  ) => string | (() => void);
  readonly children?: (props: {
    readonly totalCount: number | undefined;
    readonly records: RA<SerializedResource<SpQuery>> | undefined;
    readonly children: JSX.Element;
    readonly dialog: (children: JSX.Element) => JSX.Element;
  }) => JSX.Element;
  readonly filters?: {
    readonly specifyUser: number;
    readonly contextTableId: number;
  };
};

export function QueryListOutlet(): JSX.Element {
  const props = useOutletContext<QueryListContextType>();
  return <QueryListDialog {...props} />;
}

const defaultChildren: Exclude<QueryListContextType['children'], undefined> = ({
  children,
  dialog,
}): JSX.Element =>
  children === undefined ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText.cancel()}</Button.DialogClose>}
      header={queryText.queries()}
      icon={icons.documentSearch}
      onClose={f.never()}
    >
      <DialogListSkeleton />
    </Dialog>
  ) : (
    dialog(children)
  );

type CloneState = {
  readonly confirmClone: boolean;
  readonly clonePending: boolean;
};

const defaultCloneState: CloneState = {
  confirmClone: false,
  clonePending: false,
};

type QuerySection = 'personal' | 'shared' | 'sharing';

const selectedQueryNavigationClassName =
  'aria-handled bg-gray-800 font-semibold text-white enabled:hover:text-white dark:bg-gray-200 dark:text-gray-900 dark:enabled:hover:text-gray-900';

type QueryFolder = {
  readonly id: number;
  readonly name: string;
  readonly parentId: number | null;
  readonly section: QuerySection;
};

type QueryFolderNode = QueryFolder & {
  readonly children: RA<QueryFolderNode>;
};

type QueryFolderOption = {
  readonly folder: QueryFolder;
  readonly depth: number;
};

function organizeQueryFolders(
  folders: RA<QueryFolder>,
  parentId: number | null = null
): RA<QueryFolderNode> {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((folder) => ({
      ...folder,
      children: organizeQueryFolders(folders, folder.id),
    }));
}

function flattenQueryFolders(
  folders: RA<QueryFolderNode>,
  depth = 0
): RA<QueryFolderOption> {
  return folders.flatMap((folder) => [
    { folder, depth },
    ...flattenQueryFolders(folder.children, depth + 1),
  ]);
}

function QueryFolderTree({
  folders,
  selectedFolderId,
  onSelect,
}: {
  readonly folders: RA<QueryFolderNode>;
  readonly selectedFolderId: number | null;
  readonly onSelect: (folderId: number) => void;
}): JSX.Element {
  const [collapsedFolders, setCollapsedFolders] = React.useState<RA<number>>(
    []
  );
  const id = React.useId();

  return folders.length === 0 ? (
    <p className="py-2 text-sm text-gray-500">{queryText.noFolders()}</p>
  ) : (
    <ul className="mt-1 flex flex-col gap-1">
      {folders.map((folder) => (
        <li key={folder.id}>
          <div className="flex items-center gap-1 py-1 text-sm">
            {folder.children.length > 0 ? (
              <Button.Icon
                aria-controls={`${id}-${folder.id}`}
                aria-expanded={!collapsedFolders.includes(folder.id)}
                aria-label={
                  collapsedFolders.includes(folder.id)
                    ? commonText.expand()
                    : commonText.collapse()
                }
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded p-0.5"
                icon={
                  collapsedFolders.includes(folder.id)
                    ? 'chevronRight'
                    : 'chevronDown'
                }
                title={
                  collapsedFolders.includes(folder.id)
                    ? commonText.expand()
                    : commonText.collapse()
                }
                onClick={(): void =>
                  setCollapsedFolders((current) =>
                    current.includes(folder.id)
                      ? current.filter((folderId) => folderId !== folder.id)
                      : [...current, folder.id]
                  )
                }
              />
            ) : (
              <span aria-hidden className="h-7 w-7 shrink-0" />
            )}
            <Button.LikeLink
              aria-current={selectedFolderId === folder.id ? 'page' : undefined}
              className={`flex min-w-0 flex-1 items-center gap-1 rounded px-2 text-left ${
                selectedFolderId === folder.id
                  ? selectedQueryNavigationClassName
                  : ''
              }`}
              onClick={(): void => onSelect(folder.id)}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {icons.folder}
              </span>
              <span>{folder.name}</span>
            </Button.LikeLink>
          </div>
          {folder.children.length > 0 && (
            <div
              className="ml-3 border-l border-gray-200 pl-2 dark:border-neutral-700"
              hidden={collapsedFolders.includes(folder.id)}
              id={`${id}-${folder.id}`}
            >
              <QueryFolderTree
                folders={folder.children}
                selectedFolderId={selectedFolderId}
                onSelect={onSelect}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function QueryListDialog({
  newQueryUrl,
  onClose: handleClose,
  getQuerySelectCallback,
  children = defaultChildren,
  filters,
}: QueryListContextType): JSX.Element {
  const [sortConfig, handleSort] = useSortConfig(
    'listOfQueries',
    'name',
    false
  );

  const { paginator, limit, offset, currentPage } =
    usePaginator('queryBuilder');

  const orderBy = `${sortConfig.ascending ? '' : '-'}${
    sortConfig.sortField
  }` as const;

  const [search, setSearch] = React.useState('');
  const searchFilter = search.trim();
  const [section, setSection] = React.useState<QuerySection>('personal');
  const [showFavorites, setShowFavorites] = React.useState(false);
  const [showArchive, setShowArchive] = React.useState(false);
  const [archivePendingIds, setArchivePendingIds] = React.useState<RA<number>>(
    []
  );
  const [favoriteIds, setFavoriteIds] = React.useState<
    RA<number> | undefined
  >();
  const [favoritePendingIds, setFavoritePendingIds] = React.useState<
    RA<number>
  >([]);
  const [selectedFolderId, setSelectedFolderId] = React.useState<number | null>(
    null
  );
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [cloneStates, setCloneStates] = React.useState<
    Readonly<Record<number, CloneState>>
  >({});
  const [folders, setFolders] = React.useState<RA<QueryFolder> | undefined>();
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [movingQuery, setMovingQuery] = React.useState<
    SerializedResource<SpQuery> | undefined
  >();
  const [movePending, setMovePending] = React.useState(false);
  const ownerId = filters?.specifyUser ?? userInformation.id;
  const fetchQueries = React.useCallback(
    async (waitForPendingGet = false) =>
      fetchCollection(
        'SpQuery',
        {
          limit,
          domainFilter: false,
          ...(showArchive || showFavorites || section === 'shared'
            ? { contextTableId: filters?.contextTableId }
            : { ...filters, specifyUser: ownerId }),
          offset,
          orderBy,
        },
        {
          query_archive: showArchive ? 'true' : 'false',
          ...(showArchive
            ? {}
            : showFavorites
              ? { query_favorites: 'true' }
              : {
                  query_folder_section: section,
                  ...(selectedFolderId === null
                    ? {}
                    : { query_folder_id: selectedFolderId }),
                  ...(section === 'shared'
                    ? { share_grants__recipient: userInformation.id }
                    : {
                        share_grants__isnull:
                          section === 'personal' ? 'true' : 'false',
                      }),
                }),
          ...(searchFilter === ''
            ? {}
            : backendFilter('name').caseInsensitiveContains(searchFilter)),
        },
        { waitForPendingGet }
      ),
    [
      filters,
      ownerId,
      limit,
      offset,
      orderBy,
      searchFilter,
      section,
      selectedFolderId,
      showFavorites,
      showArchive,
    ]
  );
  const [data, setData] = React.useState<
    SerializedCollection<SpQuery> | undefined
  >(undefined);
  const lastFetchQueries = React.useRef(fetchQueries);
  const lastRefreshToken = React.useRef(refreshToken);
  React.useLayoutEffect(() => {
    const isRefresh = lastRefreshToken.current !== refreshToken;
    lastRefreshToken.current = refreshToken;
    if (lastFetchQueries.current !== fetchQueries) {
      lastFetchQueries.current = fetchQueries;
      setData(undefined);
    }

    let isCurrent = true;
    void fetchQueries(isRefresh)
      .then((newData) => {
        if (isCurrent) setData(newData);
      })
      .catch(raise);
    return (): void => {
      isCurrent = false;
    };
  }, [fetchQueries, refreshToken]);

  React.useEffect(
    () =>
      resourceEvents.on('deleted', (resource) => {
        if (resource.specifyTable.name !== 'SpQuery' || data === undefined)
          return;
        setRefreshToken((token) => token + 1);
      }),
    [data]
  );

  React.useEffect(() => {
    const handleFocus = (): void => setRefreshToken((token) => token + 1);
    window.addEventListener('focus', handleFocus);
    const interval =
      showFavorites || section === 'shared' || section === 'sharing'
        ? window.setInterval(handleFocus, 30_000)
        : undefined;
    return () => {
      if (interval !== undefined) window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [section, showFavorites]);

  React.useEffect(() => {
    let isCurrent = true;
    void ajax<{ readonly queryIds: RA<number> }>('/stored_query/favorites/', {
      headers: { Accept: 'application/json' },
    })
      .then(({ data: { queryIds } }) => {
        if (isCurrent) setFavoriteIds(queryIds);
      })
      .catch(raise);
    return (): void => {
      isCurrent = false;
    };
  }, []);

  React.useEffect(() => {
    let isCurrent = true;
    void ajax<{ readonly folders: RA<QueryFolder> }>('/stored_query/folders/', {
      headers: { Accept: 'application/json' },
    })
      .then(({ data: { folders: fetchedFolders } }) => {
        if (isCurrent) setFolders(fetchedFolders);
      })
      .catch(raise);
    return (): void => {
      isCurrent = false;
    };
  }, []);

  React.useEffect(() => {
    if (data === undefined) return;
    const lastPage = Math.max(0, Math.ceil(data.totalCount / limit) - 1);
    if (currentPage[0] > lastPage) currentPage[1](lastPage);
  }, [data, limit, currentPage]);
  const totalCountRef = React.useRef<number | undefined>(undefined);
  totalCountRef.current = data?.totalCount ?? totalCountRef.current;
  const totalCount = totalCountRef.current;

  const isReadOnly = React.useContext(ReadOnlyContext);
  const loading = React.useContext(LoadingContext);
  const folderTree = React.useMemo(
    () =>
      organizeQueryFolders(
        folders?.filter((folder) => folder.section === section) ?? []
      ),
    [folders, section]
  );
  const folderOptions = React.useMemo(
    () => flattenQueryFolders(folderTree),
    [folderTree]
  );
  const handleCreateFolder = (name: string, parentId: number | null): void => {
    loading(
      ajax<QueryFolder>('/stored_query/folders/', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: { name, parentId, section },
      }).then(({ data }) => {
        setFolders((current) =>
          current === undefined ? [data] : [...current, data]
        );
        setIsCreatingFolder(false);
      })
    );
  };
  const handleMoveQuery = (folderId: number): void => {
    if (movingQuery === undefined || movePending) return;
    setMovePending(true);
    loading(
      ajax(`/stored_query/query/${movingQuery.id}/folder/`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: { folderId },
      })
        .then(() => {
          setMovingQuery(undefined);
          setData(undefined);
          setRefreshToken((token) => token + 1);
        })
        .finally(() => setMovePending(false))
    );
  };
  const handleFavoriteQuery = (
    queryId: number,
    action: 'favorite' | 'unfavorite'
  ): void => {
    setFavoritePendingIds((current) => [...current, queryId]);
    loading(
      ajax(`/stored_query/query/${queryId}/${action}/`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      })
        .then(() => {
          setFavoriteIds((current) =>
            action === 'favorite'
              ? [...new Set([...(current ?? []), queryId])]
              : current?.filter((id) => id !== queryId)
          );
          if (action === 'unfavorite') {
            setData(undefined);
            setRefreshToken((token) => token + 1);
          }
        })
        .finally(() =>
          setFavoritePendingIds((current) =>
            current.filter((id) => id !== queryId)
          )
        )
    );
  };
  const handleArchiveAction = (
    queryId: number,
    action: 'archive' | 'restore'
  ): void => {
    setArchivePendingIds((current) => [...current, queryId]);
    loading(
      ajax(`/stored_query/query/${queryId}/${action}/`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      })
        .then(() => {
          setFavoriteIds((current) => current?.filter((id) => id !== queryId));
          setData(undefined);
          setRefreshToken((token) => token + 1);
        })
        .finally(() =>
          setArchivePendingIds((current) =>
            current.filter((id) => id !== queryId)
          )
        )
    );
  };

  const content = children({
    totalCount,
    records: data?.records,
    children: (
      <div className="flex min-h-0 min-w-0 flex-1 gap-4 overflow-hidden">
        <nav
          aria-label={queryText.queries()}
          className="flex w-44 shrink-0 flex-col gap-1 border-r border-gray-200 pr-3 dark:border-neutral-700"
        >
          {(
            [
              ['personal', queryText.yourQueries(), icons.folder],
              ['sharing', queryText.queriesIShare(), icons.documentSearch],
              ['shared', queryText.sharedQueries(), icons.globe],
            ] as const
          ).map(([value, label, icon]) => (
            <Button.LikeLink
              aria-current={
                !showFavorites &&
                !showArchive &&
                section === value &&
                selectedFolderId === null
                  ? 'page'
                  : undefined
              }
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${
                !showFavorites && !showArchive && section === value
                  ? selectedQueryNavigationClassName
                  : 'hover:bg-brand-50 dark:hover:bg-neutral-700'
              }`}
              key={value}
              onClick={(): void => {
                currentPage[1](0);
                setIsCreatingFolder(false);
                setMovingQuery(undefined);
                setSelectedFolderId(null);
                setSection(value);
                setShowFavorites(false);
                setShowArchive(false);
              }}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {icon}
              </span>
              <span>{label}</span>
            </Button.LikeLink>
          ))}
          <hr className="my-2 w-full border-gray-200 dark:border-neutral-700" />
          <section
            aria-label={queryText.folders()}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {queryText.folders()}
              </h2>
              <Button.Icon
                aria-label={queryText.addFolder()}
                className="shrink-0 rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-neutral-700"
                disabled={
                  isReadOnly ||
                  folders === undefined ||
                  !hasTablePermission('SpQuery', 'create')
                }
                icon="plus"
                title={queryText.addFolder()}
                onClick={(): void => setIsCreatingFolder(true)}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {folders !== undefined && (
                <QueryFolderTree
                  folders={folderTree}
                  selectedFolderId={selectedFolderId}
                  onSelect={(folderId): void => {
                    currentPage[1](0);
                    setSelectedFolderId(folderId);
                    setShowFavorites(false);
                    setShowArchive(false);
                  }}
                />
              )}
            </div>
          </section>
          <hr className="my-2 w-full border-gray-200 dark:border-neutral-700" />
          <section className="flex shrink-0 flex-col gap-1">
            <h2 className="text-sm font-semibold">
              <Button.LikeLink
                aria-current={showFavorites ? 'page' : undefined}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 ${
                  showFavorites ? selectedQueryNavigationClassName : ''
                }`}
                onClick={(): void => {
                  currentPage[1](0);
                  setSelectedFolderId(null);
                  setShowFavorites(true);
                  setShowArchive(false);
                  setIsCreatingFolder(false);
                  setMovingQuery(undefined);
                }}
              >
                {icons.star}
                {queryText.favorites()}
              </Button.LikeLink>
            </h2>
            <h2 className="text-sm font-semibold">
              <Button.LikeLink
                aria-current={showArchive ? 'page' : undefined}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 ${
                  showArchive ? selectedQueryNavigationClassName : ''
                }`}
                onClick={(): void => {
                  currentPage[1](0);
                  setSelectedFolderId(null);
                  setShowArchive(true);
                  setShowFavorites(false);
                  setIsCreatingFolder(false);
                  setMovingQuery(undefined);
                }}
              >
                {icons.archive}
                {queryText.archive()}
              </Button.LikeLink>
            </h2>
          </section>
        </nav>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {selectedFolderId !== null && (
            <h2 className="pb-2 text-sm font-semibold">
              {folders?.find((folder) => folder.id === selectedFolderId)?.name}
            </h2>
          )}
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="grid-table grid-cols-[repeat(3,auto)_min-content] gap-2">
              <thead>
                <tr>
                  <th
                    className="pl-[calc(theme(spacing.table-icon)_+_theme(spacing.2))]"
                    scope="col"
                  >
                    <Button.LikeLink onClick={(): void => handleSort('name')}>
                      {getField(tables.SpQuery, 'name').label}
                      <SortIndicator fieldName="name" sortConfig={sortConfig} />
                    </Button.LikeLink>
                  </th>
                  <th scope="col">
                    <Button.LikeLink
                      onClick={(): void => handleSort('timestampCreated')}
                    >
                      {getField(tables.SpQuery, 'timestampCreated').label}
                      <SortIndicator
                        fieldName="timestampCreated"
                        sortConfig={sortConfig}
                      />
                    </Button.LikeLink>
                  </th>
                  <th scope="col">
                    <Button.LikeLink
                      onClick={(): void => handleSort('timestampModified')}
                    >
                      {getField(tables.SpQuery, 'timestampModified').label}
                      <SortIndicator
                        fieldName="timestampModified"
                        sortConfig={sortConfig}
                      />
                    </Button.LikeLink>
                  </th>
                  <td />
                </tr>
              </thead>
              <tbody>
                {data?.records.map((query) => (
                  <QueryList
                    getQuerySelectCallback={getQuerySelectCallback}
                    isReadOnly={
                      isReadOnly ||
                      idFromUrl(query.specifyUser) !== userInformation.id
                    }
                    canClone={
                      !showArchive &&
                      (showFavorites
                        ? idFromUrl(query.specifyUser) !== userInformation.id
                        : section === 'shared') &&
                      !isReadOnly &&
                      hasToolPermission('queryBuilder', 'create')
                    }
                    key={query.id}
                    query={query}
                    cloneState={cloneStates[query.id] ?? defaultCloneState}
                    onCloneStateChange={(state): void =>
                      setCloneStates((states) => ({
                        ...states,
                        [query.id]: {
                          ...(states[query.id] ?? defaultCloneState),
                          ...state,
                        },
                      }))
                    }
                    onMoveToFolder={
                      showArchive ||
                      showFavorites ||
                      isReadOnly ||
                      folders === undefined
                        ? undefined
                        : (): void => setMovingQuery(query)
                    }
                    isFavorite={
                      showFavorites ||
                      (!showArchive && favoriteIds?.includes(query.id) === true)
                    }
                    canRemoveFavorite={showFavorites}
                    favoritePending={favoritePendingIds.includes(query.id)}
                    onFavorite={
                      showArchive ||
                      isReadOnly ||
                      favoriteIds === undefined ||
                      archivePendingIds.includes(query.id)
                        ? undefined
                        : (): void =>
                            handleFavoriteQuery(
                              query.id,
                              showFavorites ? 'unfavorite' : 'favorite'
                            )
                    }
                    archivePending={
                      archivePendingIds.includes(query.id) ||
                      favoritePendingIds.includes(query.id)
                    }
                    onArchive={
                      isReadOnly ||
                      (!showArchive &&
                        (showFavorites || section !== 'personal')) ||
                      idFromUrl(query.specifyUser) !== userInformation.id
                        ? undefined
                        : (): void =>
                            handleArchiveAction(
                              query.id,
                              showArchive ? 'restore' : 'archive'
                            )
                    }
                    isArchived={showArchive}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-shrink-0 items-center pt-2">
            <span className="-ml-2 flex-1" />
            {data === undefined && loadingGif}
            {data !== undefined && data.records.length > 0
              ? paginator(data?.totalCount)
              : null}
          </div>
        </div>
      </div>
    ),
    dialog: (children) => (
      <Dialog
        buttons={
          <>
            <Input.Text
              aria-label={commonText.searchFor({
                resource: queryText.queries(),
              })}
              className="min-w-0 max-w-sm flex-1"
              placeholder={commonText.searchFor({
                resource: queryText.queries(),
              })}
              value={search}
              onValueChange={(value): void => {
                setSearch(value);
                currentPage[1](0);
              }}
            />
            <span className="flex-1" />
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            {(hasToolPermission('queryBuilder', 'create') ||
              hasPermission('/querybuilder/query', 'execute')) && (
              <Link.Info href={newQueryUrl}>{commonText.new()}</Link.Info>
            )}
          </>
        }
        className={{
          container: `${dialogClassNames.normalContainer}
            h-[min(40rem)] w-[min(55rem,90vw)]`,
        }}
        header={
          totalCount === undefined
            ? queryText.queries()
            : commonText.countLine({
                resource: queryText.queries(),
                count: totalCount,
              })
        }
        icon={icons.documentSearch}
        onClose={handleClose}
      >
        {children}
      </Dialog>
    ),
  });
  return (
    <>
      {content}
      {isCreatingFolder && folders !== undefined && (
        <CreateQueryFolderDialog
          folders={folderOptions}
          onClose={(): void => setIsCreatingFolder(false)}
          onCreate={handleCreateFolder}
        />
      )}
      {movingQuery !== undefined && (
        <MoveQueryToFolderDialog
          folders={folderOptions}
          queryName={movingQuery.name}
          pending={movePending}
          onClose={(): void => setMovingQuery(undefined)}
          onMove={handleMoveQuery}
        />
      )}
    </>
  );
}

function MoveQueryToFolderDialog({
  folders,
  queryName,
  pending,
  onClose,
  onMove,
}: {
  readonly folders: RA<QueryFolderOption>;
  readonly queryName: string;
  readonly pending: boolean;
  readonly onClose: () => void;
  readonly onMove: (folderId: number) => void;
}): JSX.Element {
  const [folderId, setFolderId] = React.useState('');
  return (
    <Dialog
      header={queryText.moveQueryToFolder({ queryName })}
      icon={icons.folder}
      onClose={onClose}
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Info
            disabled={folderId === '' || pending}
            onClick={(): void => onMove(Number(folderId))}
          >
            {queryText.move()}
          </Button.Info>
        </>
      }
    >
      {folders.length === 0 ? (
        <p>{queryText.noFolders()}</p>
      ) : (
        <Label.Block>
          {queryText.folders()}
          <select
            className="w-full rounded border border-gray-300 bg-white p-2 dark:border-neutral-600 dark:bg-neutral-800"
            value={folderId}
            disabled={pending}
            onChange={(event): void => setFolderId(event.target.value)}
          >
            <option value="">{queryText.chooseFolder()}</option>
            {folders.map(({ folder, depth }) => (
              <option key={folder.id} value={folder.id}>
                {`${'-- '.repeat(depth)}${folder.name}`}
              </option>
            ))}
          </select>
        </Label.Block>
      )}
    </Dialog>
  );
}

function CreateQueryFolderDialog({
  folders,
  onClose,
  onCreate,
}: {
  readonly folders: RA<QueryFolderOption>;
  readonly onClose: () => void;
  readonly onCreate: (name: string, parentId: number | null) => void;
}): JSX.Element {
  const [name, setName] = React.useState('');
  const [parentId, setParentId] = React.useState('');
  const trimmedName = name.trim();

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Info
            disabled={trimmedName.length === 0}
            onClick={(): void =>
              onCreate(trimmedName, parentId === '' ? null : Number(parentId))
            }
          >
            {commonText.save()}
          </Button.Info>
        </>
      }
      header={queryText.newFolder()}
      icon={icons.folder}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <Label.Block>
          {queryText.folderName()}
          <Input.Text
            autoFocus
            maxLength={256}
            required
            value={name}
            onValueChange={setName}
          />
        </Label.Block>
        <Label.Block>
          {queryText.parentFolder()}
          <select
            aria-label={queryText.parentFolder()}
            className="w-full rounded border border-gray-300 bg-white p-2 dark:border-neutral-600 dark:bg-neutral-800"
            value={parentId}
            onChange={(event): void => setParentId(event.target.value)}
          >
            <option value="">{queryText.topLevelFolder()}</option>
            {folders.map(({ folder, depth }) => (
              <option key={folder.id} value={folder.id}>
                {`${'-- '.repeat(depth)}${folder.name}`}
              </option>
            ))}
          </select>
        </Label.Block>
      </div>
    </Dialog>
  );
}

export function QueryList({
  query,
  getQuerySelectCallback,
  isReadOnly,
  canClone = false,
  cloneState: { confirmClone, clonePending },
  onCloneStateChange: handleCloneStateChange,
  onMoveToFolder,
  isFavorite = false,
  favoritePending = false,
  onFavorite,
  canRemoveFavorite = false,
  archivePending = false,
  onArchive,
  isArchived = false,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly getQuerySelectCallback?: (
    query: SerializedResource<SpQuery>
  ) => string | (() => void);
  readonly isReadOnly: boolean;
  readonly canClone?: boolean;
  readonly cloneState: CloneState;
  readonly onCloneStateChange: (state: Partial<CloneState>) => void;
  readonly onMoveToFolder?: () => void;
  readonly isFavorite?: boolean;
  readonly favoritePending?: boolean;
  readonly onFavorite?: () => void;
  readonly canRemoveFavorite?: boolean;
  readonly archivePending?: boolean;
  readonly onArchive?: () => void;
  readonly isArchived?: boolean;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const queryResource = React.useMemo(
    () => deserializeResource(query),
    [query]
  );
  const { refreshQuery, conflictDialog } = useQueryRefresh(queryResource);
  const callBack =
    getQuerySelectCallback?.(query) ?? `/specify/query/${query.id}/`;
  const text = (
    <>
      <TableIcon label name={getTableById(query.contextTableId).name} />
      {query.name}
    </>
  );
  return (
    <>
      <tr title={query.remarks ?? undefined}>
        <td>
          <div className="flex items-center gap-2">
            {typeof callBack === 'string' ? (
              <Link.Default
                /*
                 * BUG: consider applying these styles everywhere
                 * className="max-w-full overflow-auto"
                 */
                className="overflow-x-auto"
                href={callBack}
              >
                {text}
              </Link.Default>
            ) : (
              <Button.LikeLink className="overflow-x-auto" onClick={callBack}>
                {text}
              </Button.LikeLink>
            )}
            {canClone && (
              <DataEntry.Clone
                aria-label={queryText.cloneSharedQuery()}
                onClick={(): void =>
                  handleCloneStateChange({ confirmClone: true })
                }
              />
            )}
          </div>
        </td>
        <td>
          <DateElement date={query.timestampCreated} />
        </td>
        <td>
          {typeof query.timestampModified === 'string' && (
            <DateElement date={query.timestampModified} />
          )}
        </td>
        <td className="items-center justify-end gap-2">
          {!isReadOnly && (
            <QueryEditButton
              queryResource={queryResource}
              onRefresh={refreshQuery}
            />
          )}
          <Button.Icon
            icon="folder"
            title={queryText.moveQueryToFolder({ queryName: query.name })}
            onClick={onMoveToFolder}
          />
          <Button.Icon
            aria-pressed={isFavorite}
            className={`aria-handled ${
              isFavorite
                ? '!text-amber-700 enabled:hover:!text-amber-700 disabled:!text-amber-700 dark:!text-yellow-300 dark:enabled:hover:!text-yellow-300 dark:disabled:!text-yellow-300'
                : ''
            }`}
            disabled={(isFavorite && !canRemoveFavorite) || favoritePending}
            icon="star"
            title={
              isFavorite && canRemoveFavorite
                ? queryText.removeFavoriteQuery({ queryName: query.name })
                : isFavorite
                  ? queryText.favoritedQuery({ queryName: query.name })
                  : queryText.favoriteQuery({ queryName: query.name })
            }
            onClick={onFavorite}
          />
          <Button.Icon
            disabled={archivePending}
            icon={isArchived ? 'restore' : 'archive'}
            title={
              isArchived
                ? queryText.restoreQuery({ queryName: query.name })
                : queryText.archiveQuery({ queryName: query.name })
            }
            onClick={onArchive}
          />
        </td>
      </tr>
      {conflictDialog}
      {confirmClone && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Success
                disabled={clonePending}
                onClick={(): void => {
                  handleCloneStateChange({ clonePending: true });
                  loading(
                    cloneSharedQuery(deserializeResource(query))
                      .then(() =>
                        handleCloneStateChange({ confirmClone: false })
                      )
                      .finally(() =>
                        handleCloneStateChange({ clonePending: false })
                      )
                  );
                }}
              >
                {interactionsText.continue()}
              </Button.Success>
            </>
          }
          header={queryText.cloneSharedQuery()}
          onClose={(): void => handleCloneStateChange({ confirmClone: false })}
        >
          <p>{queryText.confirmCloneSharedQuery({ queryName: query.name })}</p>
        </Dialog>
      )}
    </>
  );
}

export function NewQuery(): JSX.Element {
  const { onClose: handleClose } = useOutletContext<QueryListContextType>();
  return <QueryTablesWrapper onClick={undefined} onClose={handleClose} />;
}
