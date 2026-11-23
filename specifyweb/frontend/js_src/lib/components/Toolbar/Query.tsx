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
import { Input, Label, Select } from '../Atoms/Form';
import { iconClassName, icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import {
  createResource,
  deleteResource,
  idFromUrl,
  resourceEvents,
  saveResource,
} from '../DataModel/resource';
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
import {
  fetchCollections,
  fetchDisciplines,
  fetchVisibleQueryFolders,
  getFolderScopePayload,
  isSharedFolder,
  parseResourceId,
} from '../QueryBuilder/queryFolders';
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
  children: FolderNode[];
};

function buildFolderTree(
  folders: RA<SerializedResource<SpQueryFolder>>
): RA<FolderNode> {
  const map = new Map<number, FolderNode>();
  const roots: FolderNode[] = [];

  for (const folder of folders) {
    map.set(folder.id, { folder, children: [] });
  }
  for (const folder of folders) {
    const node = map.get(folder.id)!;
    const parentId = parseResourceId(folder.parent);
    if (parentId !== null && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
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
  onEdit,
}: {
  readonly node: FolderNode;
  readonly depth: number;
  readonly selectedFolderId: number | null;
  readonly onSelect: (id: number | null) => void;
  readonly onEdit?: (folder: SerializedResource<SpQueryFolder>) => void;
}): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedFolderId === node.folder.id;

  return (
    <div>
      <Button.LikeLink
        className={`flex w-full items-center gap-1 rounded px-1 py-0.5 text-left group relative ${
          isSelected ? 'bg-brand-100 dark:bg-brand-400 dark:text-white font-bold dark:hover:text-white' : ''
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
        {isSharedFolder(node.folder)
          ? icons.globe
          : isOpen
            ? icons.folderOpen
            : icons.folder}
        <span className="truncate flex-1">{node.folder.name}</span>
        {typeof onEdit === 'function' && (
        <span
          className="absolute right-0 top-0 bottom-0 invisible group-hover:visible bg-[color:var(--form-foreground)] flex items-center pr-1 pl-2"
          onClick={(e): void => {
            e.stopPropagation();
            onEdit(node.folder);
          }}
          role="button"
          aria-label={commonText.edit()}
          tabIndex={0}
        >
          <span className={`${iconClassName} !text-orange-400`} aria-hidden="true">
            {icons.pencil}
          </span>
        </span>
        )}
      </Button.LikeLink>
      {isOpen &&
        node.children.map((child) => (
          <FolderTreeItem
            depth={depth + 1}
            key={child.folder.id}
            node={child}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            onEdit={onEdit}
          />
        ))}
    </div>
  );
}

function EditFolderDialog({
  folder,
  onClose: handleClose,
  onDeleted,
}: {
  readonly folder: SerializedResource<SpQueryFolder>;
  readonly onClose: () => void;
  readonly onDeleted: () => void;
}): JSX.Element {
  const [name, setName] = React.useState(folder.name);
  const [scopeType, setScopeType] = React.useState(folder.scopeType ?? '');
  const [collectionId, setCollectionId] = React.useState<number | null>(
    parseResourceId(folder.collection)
  );
  const [disciplineId, setDisciplineId] = React.useState<number | null>(
    parseResourceId(folder.discipline)
  );

  const [collections] = useAsyncState(
    React.useCallback(() => fetchCollections(), []),
    false
  );
  const [disciplines] = useAsyncState(
    React.useCallback(() => fetchDisciplines(), []),
    false
  );

  const loading = React.useContext(LoadingContext);

  const handleDelete = (): void => {
    loading(
      deleteResource('SpQueryFolder', folder.id).then(() => {
        handleClose();
        onDeleted();
      })
    );
  };

  return (
    <Dialog
      buttons={
        <>
          <Button.Danger onClick={handleDelete}>
            {commonText.delete()}
          </Button.Danger>
          <span className="flex-1" />
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Save
            disabled={name.trim() === ''}
            form="editFolderForm"
          >
            {commonText.save()}
          </Submit.Save>
        </>
      }
      icon={icons.folder}
      header={queryText.editFolder()}
      onClose={handleClose}
    >
      <form
        className="flex flex-col gap-4"
        id="editFolderForm"
        onSubmit={(e): void => {
          e.preventDefault();
          const payload: Record<string, unknown> = {
            ...(removeKey(folder, '_tableName') as Record<string, unknown>),
            name: name.trim(),
            ...getFolderScopePayload(scopeType, collectionId, disciplineId),
          };

          loading(
            saveResource(
              'SpQueryFolder',
              folder.id,
              payload as Partial<SerializedResource<SpQueryFolder>>
            ).then(() => {
              handleClose();
              onDeleted();
            })
          );
        }}
      >
        <Label.Block>
          {queryText.folderName()}
          <Input.Text
            autoFocus
            required
            maxLength={256}
            value={name}
            onValueChange={setName}
          />
        </Label.Block>
        <Label.Block>
          {queryText.scope()}
          <Select value={scopeType} onValueChange={setScopeType}>
            <option value="">{queryText.personal()}</option>
            <option value="Collection">Collection</option>
            <option value="Discipline">Discipline</option>
            <option value="Database">Database</option>
          </Select>
        </Label.Block>
        {scopeType === 'Collection' && Array.isArray(collections) && (
          <Label.Block>
            Collection
            <Select
              value={collectionId ?? ''}
              onValueChange={(value): void =>
                setCollectionId(value === '' ? null : Number(value))
              }
            >
              <option value="">— Select —</option>
              {collections.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.collectionName ?? `Collection ${c.id}`}
                </option>
              ))}
            </Select>
          </Label.Block>
        )}
        {scopeType === 'Discipline' && Array.isArray(disciplines) && (
          <Label.Block>
            Discipline
            <Select
              value={disciplineId ?? ''}
              onValueChange={(value): void =>
                setDisciplineId(value === '' ? null : Number(value))
              }
            >
              <option value="">— Select —</option>
              {disciplines.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name ?? `Discipline ${d.id}`}
                </option>
              ))}
            </Select>
          </Label.Block>
        )}
      </form>
    </Dialog>
  );
}

function MoveToFolderDialog({
  folderTree,
  folders,
  query,
  onClose: handleClose,
  onMove,
}: {
  readonly folderTree: RA<FolderNode>;
  readonly folders: RA<SerializedResource<SpQueryFolder>>;
  readonly query: SerializedResource<SpQuery>;
  readonly onClose: () => void;
  readonly onMove: (folderId: number | null) => void;
}): JSX.Element {
  const currentFolderId = parseResourceId(
    query.spQueryFolder as unknown as string | null
  );
  const currentFolderName =
    currentFolderId !== null
      ? folders.find((f) => f.id === currentFolderId)?.name ?? null
      : null;
  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.cancel()}</Button.DialogClose>}
      header={queryText.moveToFolder()}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-1">
        {currentFolderName !== null ? (
          <>
            <div className="flex items-center gap-1 rounded px-2 py-1 font-bold">
              {icons.folder}
              {currentFolderName}
              {' '}
              <span className="font-normal text-gray-500">
                ({queryText.currentFolder()})
              </span>
            </div>
            <hr className="my-1" />
          </>
        ) : undefined}
        <Button.LikeLink
          className="w-full rounded px-2 py-1 text-left flex items-center gap-1"
          onClick={(): void => onMove(null)}
        >
          {icons.folder}
          {queryText.all()}
        </Button.LikeLink>
        {folderTree.map((node) => (
          <FolderTreeItem
            depth={0}
            key={node.folder.id}
            node={node}
            selectedFolderId={null}
            onSelect={(id): void => onMove(id)}
          />
        ))}
      </div>
    </Dialog>
  );
}

function CreateFolderDialog({
  folders,
  parentFolderId,
  onClose: handleClose,
  onCreated,
}: {
  readonly folders: RA<SerializedResource<SpQueryFolder>>;
  readonly parentFolderId: number | null;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}): JSX.Element {
  const [name, setName] = React.useState('');
  const [selectedParentId, setSelectedParentId] = React.useState<
    string | undefined
  >(parentFolderId !== null ? String(parentFolderId) : undefined);
  const [scopeType, setScopeType] = React.useState('');
  const [collectionId, setCollectionId] = React.useState<number | null>(null);
  const [disciplineId, setDisciplineId] = React.useState<number | null>(null);
  const loading = React.useContext(LoadingContext);

  const [collections] = useAsyncState(
    React.useCallback(() => fetchCollections(), []),
    false
  );
  const [disciplines] = useAsyncState(
    React.useCallback(() => fetchDisciplines(), []),
    false
  );

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
      icon={icons.folder}
      onClose={handleClose}
    >
      <form
        className="flex flex-col gap-4"
        id="createFolderForm"
        onSubmit={(e): void => {
          e.preventDefault();
          const payload: Record<string, unknown> = {
            name: name.trim(),
            ...getFolderScopePayload(scopeType, collectionId, disciplineId),
          };

          if (selectedParentId !== undefined) {
            payload.parent = `/api/specify/spqueryfolder/${selectedParentId}/`;
          }

          loading(
            createResource(
              'SpQueryFolder',
              payload as Partial<SerializedResource<SpQueryFolder>>
            ).then(() => {
              handleClose();
              onCreated();
            })
          );
        }}
      >
        <Label.Block>
          {queryText.folderName()}
          <Input.Text
            autoFocus
            required
            maxLength={256}
            value={name}
            onValueChange={setName}
          />
        </Label.Block>
        <Label.Block>
          {queryText.parentFolder()}
          <Select
            value={selectedParentId ?? ''}
            onValueChange={(value): void =>
              setSelectedParentId(value === '' ? undefined : value)
            }
          >
            <option value="">{queryText.all()}</option>
            {folders.map((folder) => (
              <option key={folder.id} value={String(folder.id)}>
                {folder.name}
              </option>
            ))}
          </Select>
        </Label.Block>
        <Label.Block>
          {queryText.scope()}
          <Select value={scopeType} onValueChange={setScopeType}>
            <option value="">{queryText.personal()}</option>
            <option value="Collection">Collection</option>
            <option value="Discipline">Discipline</option>
            <option value="Database">Database</option>
          </Select>
        </Label.Block>
        {scopeType === 'Collection' && Array.isArray(collections) && (
          <Label.Block>
            Collection
            <Select
              value={collectionId ?? ''}
              onValueChange={(value): void =>
                setCollectionId(value === '' ? null : Number(value))
              }
            >
              <option value="">— Select —</option>
              {collections.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.collectionName ?? `Collection ${c.id}`}
                </option>
              ))}
            </Select>
          </Label.Block>
        )}
        {scopeType === 'Discipline' && Array.isArray(disciplines) && (
          <Label.Block>
            Discipline
            <Select
              value={disciplineId ?? ''}
              onValueChange={(value): void =>
                setDisciplineId(value === '' ? null : Number(value))
              }
            >
              <option value="">— Select —</option>
              {disciplines.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name ?? `Discipline ${d.id}`}
                </option>
              ))}
            </Select>
          </Label.Block>
        )}
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
    number | 'favorites' | 'archive' | 'shared' | null
  >(null);
  const [folderRefreshKey, setFolderRefreshKey] = React.useState(0);
  const [isCreateFolderOpen, handleOpenCreateFolder, handleCloseCreateFolder] =
    useBooleanState();

  // Resizable folder panel
  const [folderPanelWidth, setFolderPanelWidth] = React.useState(208);
  const isResizing = React.useRef(false);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (!isResizing.current) return;
      const newWidth = Math.max(150, Math.min(400, e.clientX - 100));
      setFolderPanelWidth(newWidth);
    };
    const handleMouseUp = (): void => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch folders visible to this user (own personal + shared)
  const [folders] = useAsyncState(
    React.useCallback(async () => fetchVisibleQueryFolders(), [folderRefreshKey]),
    false
  );

  const folderTree = React.useMemo(
    () => buildFolderTree(folders ?? []),
    [folders]
  );

  const [sortConfig, handleSort] = useSortConfig(
    'listOfQueries',
    'name',
    false
  );

  const { paginator, limit, offset, currentPage } = usePaginator('queryBuilder');
  const [, setCurrentPage] = currentPage;

  // Reset to page 0 when filters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [selectedFolderId, debouncedSearch]);

  // Favorites-first sorting: prepend -isFavorite to user's sort choice
  const orderBy = `-isFavorite,${sortConfig.ascending ? '' : '-'}${
    sortConfig.sortField
  }`;

  const collectionFilters: Record<string, unknown> = {
    limit,
    domainFilter: false,
    // When viewing a specific folder or shared queries, show all queries
    // (shared folders contain queries from multiple users).
    // When viewing "Your Queries", show only the current user's queries.
    ...(typeof selectedFolderId === 'number' || selectedFolderId === 'shared'
      ? {}
      : filters ?? { specifyUser: userInformation.id }),
    offset,
    orderBy,
  };

  const advancedFilters: Record<string, string> = {};
  if (selectedFolderId === 'shared') {
    advancedFilters['spqueryfolder__scopetype__isnull'] = 'false';
  }

  // Folder filter
  if (selectedFolderId === 'favorites') {
    collectionFilters['isFavorite'] = true;
    collectionFilters['isArchived'] = false;
  } else if (selectedFolderId === 'archive') {
    collectionFilters['isArchived'] = true;
  } else if (typeof selectedFolderId === 'number') {
    collectionFilters['isArchived'] = false;
    collectionFilters['spqueryfolder'] = selectedFolderId;
  } else if (selectedFolderId === 'shared') {
    collectionFilters['isArchived'] = false;
  } else {
    collectionFilters['isArchived'] = false;
  }

  // Search filter
  if (debouncedSearch.trim() !== '') {
    collectionFilters['name__icontains'] = debouncedSearch.trim();
  }

  const searchFilter = debouncedSearch.trim();

  const [data, setData] = useAsyncState(
    React.useCallback(
      async () => fetchCollection('SpQuery', collectionFilters, advancedFilters),
      [
        filters,
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
        if (resource.specifyTable.name !== 'SpQuery' || data === undefined)
          return;
        // Reconcile against searchFilter rather than current-page membership, since totalCount spans all pages
        const name = (resource.get('name') as string | undefined) ?? '';
        const matchesSearch =
          searchFilter === '' ||
          name.toLowerCase().includes(searchFilter.toLowerCase());
        // Mirror every collection filter fetchCollection was called with,
        // so an out-of-scope deletion doesn't decrement an unrelated count
        const appliesUserFilters =
          typeof selectedFolderId !== 'number' && selectedFolderId !== 'shared';
        const activeFilters = filters ?? { specifyUser: userInformation.id };
        const specifyUserId = idFromUrl(
          (resource.get('specifyUser') as string | null) ?? ''
        );
        const matchesSpecifyUser =
          !appliesUserFilters || specifyUserId === activeFilters.specifyUser;
        const matchesContextTableId =
          !appliesUserFilters ||
          !('contextTableId' in activeFilters) ||
          resource.get('contextTableId') === activeFilters.contextTableId;
        const queryFolderId = idFromUrl(
          (resource.get('spQueryFolder') as string | null) ?? ''
        );
        const matchesFolder =
          typeof selectedFolderId !== 'number' ||
          queryFolderId === selectedFolderId;
        const matchesFavorite =
          selectedFolderId !== 'favorites' || resource.get('isFavorite') === true;
        const matchesArchive =
          selectedFolderId === 'archive'
            ? resource.get('isArchived') === true
            : selectedFolderId === 'favorites' ||
                typeof selectedFolderId === 'number' ||
                selectedFolderId === 'shared' ||
                selectedFolderId === null
              ? resource.get('isArchived') !== true
              : true;
        const sharedFolderIds = (folders ?? [])
          .filter(isSharedFolder)
          .map(({ id }) => id);
        const matchesShared =
          selectedFolderId !== 'shared' ||
          (queryFolderId !== null && sharedFolderIds.includes(queryFolderId));
        if (
          !matchesSearch ||
          !matchesSpecifyUser ||
          !matchesContextTableId ||
          !matchesFolder ||
          !matchesFavorite ||
          !matchesArchive ||
          !matchesShared
        )
          return;
        const newTotalCount = Math.max(0, data.totalCount - 1);
        currentPage[1](
          Math.min(
            currentPage[0],
            Math.max(0, Math.ceil(newTotalCount / limit) - 1)
          )
        );
        setData({
          records: data.records.filter((query) => query.id !== resource.id),
          totalCount: newTotalCount,
        });
      }),
    [
      currentPage,
      data,
      filters,
      folders,
      limit,
      searchFilter,
      selectedFolderId,
      setData,
    ]
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

  const [editingFolder, setEditingFolder] = React.useState<
    SerializedResource<SpQueryFolder> | undefined
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
        <div className="flex items-center">
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
          <div
            className="flex-shrink-0 flex flex-col border-r pr-2 relative"
            style={{ width: folderPanelWidth }}
          >
            {/* Resize handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-300 z-10"
              onMouseDown={(e): void => {
                e.preventDefault();
                isResizing.current = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
              }}
            />
            <div className="flex-1 overflow-y-auto relative z-0">
            {/* Top section: Your Queries + Shared Queries */}
            <div className="flex-shrink-0 border-b pb-1 mb-1">
            <Button.LikeLink
              className={`w-full rounded px-1 py-0.5 text-left flex items-center gap-1 ${
                selectedFolderId === null ? 'bg-brand-100 dark:bg-brand-400 dark:text-white dark:hover:text-white font-bold' : ''
              }`}
              onClick={(): void => setSelectedFolderId(null)}
            >
              {icons.folder}
              {queryText.yourQueries()}
            </Button.LikeLink>
            <Button.LikeLink
              className={`w-full rounded px-1 py-0.5 text-left flex items-center gap-1 ${
                selectedFolderId === 'shared' ? 'bg-brand-100 dark:bg-brand-400 dark:text-white dark:hover:text-white font-bold' : ''
              }`}
              onClick={(): void => setSelectedFolderId('shared')}
            >
              {icons.globe}
              {queryText.sharedQueries()}
            </Button.LikeLink>
            </div>
            {/* Folder tree */}
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
            {folderTree.map((node) => (
              <FolderTreeItem
                depth={0}
                key={node.folder.id}
                node={node}
                selectedFolderId={typeof selectedFolderId === 'number' ? selectedFolderId : null}
                onSelect={(id): void => setSelectedFolderId(id)}
                onEdit={setEditingFolder}
              />
            ))}
            </div>
            {/* Fixed Favorites and Archive at bottom */}
            <div className="flex-shrink-0 border-t pt-1">
            <Button.LikeLink
              className={`w-full rounded px-1 py-0.5 text-left flex items-center gap-1 ${
                selectedFolderId === 'favorites' ? 'bg-brand-100 dark:bg-brand-400 dark:text-white dark:hover:text-white font-bold' : ''
              }`}
              onClick={(): void => setSelectedFolderId('favorites')}
            >
              {icons.star}
              {queryText.favorites()}
            </Button.LikeLink>
            <Button.LikeLink
              className={`w-full rounded px-1 py-0.5 text-left flex items-center gap-1 ${
                selectedFolderId === 'archive' ? 'bg-brand-100 dark:bg-brand-400 dark:text-white dark:hover:text-white font-bold' : ''
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
                folders={folders ?? []}
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
        {moveTarget !== undefined && (
          <MoveToFolderDialog
            folderTree={folderTree}
            folders={folders ?? []}
            query={moveTarget}
            onClose={(): void => setMoveTarget(undefined)}
            onMove={handleMoveToFolder}
          />
        )}
        {editingFolder !== undefined && (
          <EditFolderDialog
            folder={editingFolder}
            onClose={(): void => setEditingFolder(undefined)}
            onDeleted={handleRefresh}
          />
        )}
      </>
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
              value={searchQuery}
              onValueChange={(value): void => {
                setSearchQuery(value);
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
          container: `${dialogClassNames.narrowContainer}
            h-[min(40rem)] w-[min(45rem)]`,
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
}

export function QueryList({
  query,
  getQuerySelectCallback,
  isReadOnly,
  onFavoriteToggle,
  onArchiveToggle,
  onMoveClick,
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

  const queryOwnerId = parseResourceId(query.specifyUser);
  const isOwnQuery = queryOwnerId === userInformation.id;

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
                !isOwnQuery
                  ? '!text-gray-300'
                  : query.isFavorite
                    ? '!text-yellow-500 hover:!text-yellow-400'
                    : ' hover:!text-yellow-400'
              }
              disabled={!isOwnQuery}
              icon="star"
              title={
                query.isFavorite
                  ? queryText.unfavorite()
                  : queryText.favorite()
              }
              onClick={
                isOwnQuery
                  ? (): void => onFavoriteToggle(query)
                  : undefined
              }
            />
            <Button.Icon
              className={!isOwnQuery ? '!text-gray-300' : undefined}
              disabled={!isOwnQuery}
              icon="folder"
              title={queryText.moveToFolder()}
              onClick={
                isOwnQuery
                  ? (): void => onMoveClick(query)
                  : undefined
              }
            />
            <Button.Icon
              className={!isOwnQuery ? '!text-gray-300' : undefined}
              disabled={!isOwnQuery}
              icon="archive"
              title={
                query.isArchived
                  ? queryText.unarchiveQuery()
                  : queryText.archiveQuery()
              }
              onClick={
                isOwnQuery
                  ? (): void => onArchiveToggle(query)
                  : undefined
              }
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
