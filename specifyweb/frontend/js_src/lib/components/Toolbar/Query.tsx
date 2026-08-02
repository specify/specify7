/**
 * Display a list of queries with folders, search, favorites, and archiving
 */

import React from 'react';
import { useOutletContext } from 'react-router';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { createResource, resourceEvents, saveResource } from '../DataModel/resource';
import { getTableById, tables } from '../DataModel/tables';
import type { SpQuery, SpQueryFolder } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { loadingGif } from '../Molecules';
import { DateElement } from '../Molecules/DateElement';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { usePaginator } from '../Molecules/Paginator';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission, hasToolPermission } from '../Permissions/helpers';
import { QueryEditButton } from '../QueryBuilder/Edit';
import { OverlayContext } from '../Router/Router';
import { SafeOutlet } from '../Router/RouterUtils';
import { DialogListSkeleton } from '../SkeletonLoaders/DialogList';
import { QueryTablesWrapper } from './QueryTablesWrapper';

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

// Folder tree node type
type FolderNode = {
  readonly folder: SerializedResource<SpQueryFolder>;
  readonly children: RA<FolderNode>;
};

function buildFolderTree(
  folders: RA<SerializedResource<SpQueryFolder>>
): RA<FolderNode> {
  const map = new Map<number, FolderNode>();
  const roots: RA<FolderNode> = [];

  for (const folder of folders) {
    map.set(folder.id, { folder, children: [] });
  }
  for (const folder of folders) {
    const node = map.get(folder.id)!;
    const parentId = folder.parent;
    if (parentId !== null && map.has(parentId)) {
      map.get(parentId)!.children = [...map.get(parentId)!.children, node];
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function FolderTreeItem({
  node,
  depth,
  selectedFolderId,
  onSelect,
}: {
  readonly node: FolderNode;
  readonly depth: number;
  readonly selectedFolderId: number | null;
  readonly onSelect: (id: number | null) => void;
}): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedFolderId === node.folder.id;

  return (
    <div>
      <Button.LikeLink
        className={`flex w-full items-center gap-1 rounded px-1 py-0.5 text-left ${
          isSelected ? 'bg-brand-100 dark:bg-brand-700 font-bold' : ''
        }`}
        style={{ paddingLeft: `${depth * 1.25 + 0.25}rem` }}
        onClick={(): void => onSelect(node.folder.id)}
      >
        {hasChildren ? (
          <span
            className="flex-shrink-0 cursor-pointer"
            onClick={(e): void => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {isOpen ? icons.chevronDown : icons.chevronRight}
          </span>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}
        {isOpen ? icons.folderOpen : icons.folder}
        <span className="truncate">{node.folder.name}</span>
      </Button.LikeLink>
      {isOpen &&
        node.children.map((child) => (
          <FolderTreeItem
            depth={depth + 1}
            key={child.folder.id}
            node={child}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function MoveToFolderDialog({
  folders,
  query,
  onClose: handleClose,
  onMove,
}: {
  readonly folders: RA<SerializedResource<SpQueryFolder>>;
  readonly query: SerializedResource<SpQuery>;
  readonly onClose: () => void;
  readonly onMove: (folderId: number | null) => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.cancel()}</Button.DialogClose>}
      header={queryText.moveToFolder()}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-1">
        <Button.LikeLink
          className="w-full rounded px-2 py-1 text-left"
          onClick={(): void => onMove(null)}
        >
          {queryText.all()}
        </Button.LikeLink>
        {folders.map((folder) => (
          <Button.LikeLink
            className="w-full rounded px-2 py-1 text-left"
            key={folder.id}
            onClick={(): void => onMove(folder.id)}
          >
            {folder.name}
          </Button.LikeLink>
        ))}
      </div>
    </Dialog>
  );
}

function CreateFolderDialog({
  parentFolderId,
  onClose: handleClose,
  onCreated,
}: {
  readonly parentFolderId: number | null;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}): JSX.Element {
  const [name, setName] = React.useState('');
  const loading = React.useContext(LoadingContext);

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Save
            disabled={name.trim() === ''}
            form="createFolderForm"
          >
            {commonText.create()}
          </Submit.Save>
        </>
      }
      header={queryText.createFolder()}
      onClose={handleClose}
    >
      <form
        className="flex flex-col gap-4"
        id="createFolderForm"
        onSubmit={(e): void => {
          e.preventDefault();
          loading(
            createResource('SpQueryFolder', {
              name: name.trim(),
              specifyUser: userInformation.resource_uri,
              parent:
                parentFolderId !== null
                  ? `/api/specify/spqueryfolder/${parentFolderId}/`
                  : undefined,
            } as Partial<SerializedResource<SpQueryFolder>>).then(() => {
              handleClose();
              onCreated();
            })
          );
        }}
      >
        <Input.Text
          autoFocus
          required
          maxLength={256}
          placeholder={queryText.folderName()}
          value={name}
          onValueChange={setName}
        />
      </form>
    </Dialog>
  );
}

export function QueryListDialog({
  newQueryUrl,
  onClose: handleClose,
  getQuerySelectCallback,
  children = defaultChildren,
  filters,
}: QueryListContextType): JSX.Element {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [selectedFolderId, setSelectedFolderId] = React.useState<
    number | 'archive' | null
  >(null);
  const [folderRefreshKey, setFolderRefreshKey] = React.useState(0);
  const [isCreateFolderOpen, handleOpenCreateFolder, handleCloseCreateFolder] =
    useBooleanState();

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch folders
  const [folders] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('SpQueryFolder', {
          limit: 0,
          domainFilter: false,
          specifyUser: userInformation.id,
          orderBy: 'ordinal',
        }),
      [folderRefreshKey]
    ),
    false
  );

  const folderTree = React.useMemo(
    () => (folders ? buildFolderTree(folders.records) : []),
    [folders]
  );

  const [sortConfig, handleSort] = useSortConfig(
    'listOfQueries',
    'name',
    false
  );

  const { paginator, limit, offset } = usePaginator('queryBuilder');

  // Favorites-first sorting: prepend -isFavorite to user's sort choice
  const orderBy = `-isFavorite,${sortConfig.ascending ? '' : '-'}${
    sortConfig.sortField
  }`;

  const collectionFilters: Record<string, unknown> = {
    limit,
    domainFilter: false,
    ...(filters ?? { specifyUser: userInformation.id }),
    offset,
    orderBy,
  };

  // Folder filter: 'archive' means archived view, null means all, number means specific folder
  if (selectedFolderId === 'archive') {
    collectionFilters['isArchived'] = true;
  } else {
    collectionFilters['isArchived'] = false;
    if (selectedFolderId !== null) {
      collectionFilters['spqueryfolder'] = selectedFolderId;
    }
  }

  // Search filter
  if (debouncedSearch.trim() !== '') {
    collectionFilters['name__icontains'] = debouncedSearch.trim();
  }

  const [data, setData] = useAsyncState(
    React.useCallback(
      async () => fetchCollection('SpQuery', collectionFilters),
      [
        limit,
        offset,
        orderBy,
        selectedFolderId,
        debouncedSearch,
        folderRefreshKey,
      ]
    ),
    false
  );

  // Keep previous data visible during loading to avoid flicker
  const prevDataRef = React.useRef(data);
  React.useEffect(() => {
    if (data !== undefined) prevDataRef.current = data;
  }, [data]);
  const displayData = data ?? prevDataRef.current;

  React.useEffect(
    () =>
      resourceEvents.on('deleted', (resource) => {
        if (resource.specifyTable.name === 'SpQuery')
          setData(
            data === undefined
              ? undefined
              : {
                  records: data.records.filter(
                    (query) => query.id !== resource.id
                  ),
                  totalCount: data.totalCount - 1,
                }
          );
      }),
    [data, setData]
  );

  const totalCountRef = React.useRef<number | undefined>(undefined);
  totalCountRef.current = data?.totalCount ?? totalCountRef.current;
  const totalCount = totalCountRef.current;

  const isReadOnly = React.useContext(ReadOnlyContext);

  const handleRefresh = (): void => setFolderRefreshKey((k) => k + 1);

  const handleToggleFavorite = async (
    query: SerializedResource<SpQuery>
  ): Promise<void> => {
    const newValue = !query.isFavorite;
    await saveResource('SpQuery', query.id, {
      ...removeKey(query, '_tableName'),
      isFavorite: newValue,
    });
    handleRefresh();
  };

  const handleToggleArchive = async (
    query: SerializedResource<SpQuery>
  ): Promise<void> => {
    const newValue = !query.isArchived;
    await saveResource('SpQuery', query.id, {
      ...removeKey(query, '_tableName'),
      isArchived: newValue,
    });
    handleRefresh();
  };

  const [moveTarget, setMoveTarget] = React.useState<
    SerializedResource<SpQuery> | undefined
  >(undefined);

  const handleMoveToFolder = async (
    folderId: number | null
  ): Promise<void> => {
    if (moveTarget === undefined) return;
    await saveResource('SpQuery', moveTarget.id, {
      ...removeKey(moveTarget, '_tableName'),
      spQueryFolder:
        folderId !== null
          ? `/api/specify/spqueryfolder/${folderId}/`
          : null,
    });
    setMoveTarget(undefined);
    handleRefresh();
  };

  return children({
    totalCount: displayData?.totalCount ?? totalCount,
    records: displayData?.records,
    children: (
      <>
        <div className="flex items-center gap-2 border-b pb-2">
          <span className="flex-1" />
          <Input.Text
            className="w-48"
            placeholder={queryText.searchQueries()}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        </div>
        <div className="flex gap-2 flex-1 overflow-hidden">
          {/* Folder tree sidebar */}
          <div className="w-52 flex-shrink-0 flex flex-col border-r pr-2">
            <div className="flex-1 overflow-y-auto">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-bold">{queryText.folders()}</span>
              <Button.Small
                aria-label={queryText.newFolder()}
                title={queryText.newFolder()}
                onClick={handleOpenCreateFolder}
              >
                {icons.plus}
              </Button.Small>
            </div>
            <Button.LikeLink
              className={`mb-1 w-full rounded px-1 py-0.5 text-left flex items-center gap-1 ${
                selectedFolderId === null ? 'bg-brand-100 dark:bg-brand-700 font-bold' : ''
              }`}
              onClick={(): void => setSelectedFolderId(null)}
            >
              {icons.folder}
              {queryText.all()}
            </Button.LikeLink>
            {folderTree.map((node) => (
              <FolderTreeItem
                depth={0}
                key={node.folder.id}
                node={node}
                selectedFolderId={typeof selectedFolderId === 'number' ? selectedFolderId : null}
                onSelect={(id): void => setSelectedFolderId(id)}
              />
            ))}
            </div>
            {/* Fixed Archive item at bottom */}
            <div className="flex-shrink-0 border-t pt-1">
            <Button.LikeLink
              className={`w-full rounded px-1 py-0.5 text-left flex items-center gap-1 ${
                selectedFolderId === 'archive' ? 'bg-brand-100 dark:bg-brand-700 font-bold' : ''
              }`}
              onClick={(): void => setSelectedFolderId('archive')}
            >
              {icons.archive}
              {queryText.archived()}
            </Button.LikeLink>
            </div>
            {/* Add folder to root */}
            {isCreateFolderOpen && (
              <CreateFolderDialog
                parentFolderId={null}
                onClose={handleCloseCreateFolder}
                onCreated={handleRefresh}
              />
            )}
          </div>

          {/* Query table */}
          <div className="min-w-0 flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto">
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
                {displayData?.records.map((query) => (
                  <QueryList
                    getQuerySelectCallback={getQuerySelectCallback}
                    isReadOnly={isReadOnly}
                    key={query.id}
                    query={query}
                    onArchiveToggle={handleToggleArchive}
                    onFavoriteToggle={handleToggleFavorite}
                    onMoveClick={setMoveTarget}
                  />
                ))}
              </tbody>
            </table>
            </div>
            <div className="flex flex-shrink-0 items-center border-t pt-2">
            <span className="-ml-2 flex-1" />
            {data === undefined && loadingGif}
            {displayData !== undefined && displayData.records.length > 0
              ? paginator(displayData?.totalCount)
              : null}
            </div>
          </div>
        </div>
      </>
    ),
    dialog: (children) => (
      <Dialog
        buttons={
          <>
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            {(hasToolPermission('queryBuilder', 'create') ||
              hasPermission('/querybuilder/query', 'execute')) && (
              <Link.Info href={newQueryUrl}>{commonText.new()}</Link.Info>
            )}
          </>
        }
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
        {moveTarget !== undefined && (
          <MoveToFolderDialog
            folders={folders?.records ?? []}
            query={moveTarget}
            onClose={(): void => setMoveTarget(undefined)}
            onMove={handleMoveToFolder}
          />
        )}
      </Dialog>
    ),
  });
}

export function QueryList({
  query,
  getQuerySelectCallback,
  isReadOnly,
  onFavoriteToggle,
  onArchiveToggle,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly getQuerySelectCallback?: (
    query: SerializedResource<SpQuery>
  ) => string | (() => void);
  readonly isReadOnly: boolean;
  readonly onFavoriteToggle: (query: SerializedResource<SpQuery>) => void;
  readonly onArchiveToggle: (query: SerializedResource<SpQuery>) => void;
  readonly onMoveClick: (query: SerializedResource<SpQuery>) => void;
}): JSX.Element {
  const callBack =
    getQuerySelectCallback?.(query) ?? `/specify/query/${query.id}/`;
  const text = (
    <>
      <TableIcon label name={getTableById(query.contextTableId).name} />
      {query.name}
    </>
  );
  return (
    <tr title={query.remarks ?? undefined}>
      <td>
        {typeof callBack === 'string' ? (
          <Link.Default
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
      </td>
      <td>
        <DateElement date={query.timestampCreated} />
      </td>
      <td>
        {typeof query.timestampModified === 'string' && (
          <DateElement date={query.timestampModified} />
        )}
      </td>
      <td className="flex justify-end gap-1">
        {!isReadOnly && (
          <>
            <Button.Icon
              className={
                query.isFavorite ? 'text-yellow-400' : 'text-gray-400'
              }
              icon={icons.star}
              title={
                query.isFavorite
                  ? queryText.unfavorite()
                  : queryText.favorite()
              }
              onClick={(): void => onFavoriteToggle(query)}
            />
            <Button.Icon
              icon={icons.switchHorizontal}
              title={queryText.moveToFolder()}
              onClick={(): void => onMoveClick(query)}
            />
            <Button.Icon
              icon={icons.archive}
              title={
                query.isArchived
                  ? queryText.unarchiveQuery()
                  : queryText.archiveQuery()
              }
              onClick={(): void => onArchiveToggle(query)}
            />
            <QueryEditButton query={query} />
          </>
        )}
      </td>
    </tr>
  );
}

export function NewQuery(): JSX.Element {
  const { onClose: handleClose } = useOutletContext<QueryListContextType>();
  return <QueryTablesWrapper onClick={undefined} onClose={handleClose} />;
}
