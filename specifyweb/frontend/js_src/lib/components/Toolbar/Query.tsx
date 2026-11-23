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
import { icons } from '../Atoms/Icons';
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
  const disclosureLabel = `${isOpen ? commonText.collapse() : commonText.expand()} ${node.folder.name}`;

  return (
    <div>
      <div className="group relative flex items-center">
        <div
          className="flex min-w-0 flex-1 items-center"
          style={{ paddingLeft: `${depth * 0.85}rem` }}
      >
        {hasChildren ? (
            <Button.Icon
              icon={isOpen ? 'chevronDown' : 'chevronRight'}
              aria-label={disclosureLabel}
              title={disclosureLabel}
              aria-expanded={isOpen}
              className="flex-shrink-0 rounded p-0.5 focus-visible:outline focus-visible:outline-2"
              onClick={(): void => setIsOpen(!isOpen)}
            />
        ) : (
            <span className="w-7 flex-shrink-0" />
        )}
          <Button.LikeLink
            className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-0.5 pr-7 text-left ${
              isSelected
                ? 'bg-brand-100 font-semibold dark:bg-brand-400 dark:text-white dark:hover:text-white'
                : 'hover:bg-brand-50 dark:hover:bg-neutral-700'
            }`}
            onClick={(): void => onSelect(node.folder.id)}
          >
        {isSharedFolder(node.folder)
          ? icons.globe
          : isOpen
            ? icons.folderOpen
            : icons.folder}
        <span className="truncate flex-1">{node.folder.name}</span>
          </Button.LikeLink>
        </div>
        {typeof onEdit === 'function' && (
          <Button.Icon
            icon="pencil"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-orange-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          aria-label={commonText.edit()}
            title={commonText.edit()}
            onClick={(): void => onEdit(node.folder)}
          />
        )}
      </div>
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
  onSaved,
}: {
  readonly folder: SerializedResource<SpQueryFolder>;
  readonly onClose: () => void;
  readonly onDeleted: (folderId: number) => void;
  readonly onSaved: () => void;
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
        onDeleted(folder.id);
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
          <Submit.Save disabled={name.trim() === ''} form="editFolderForm">
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
              onSaved();
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
      ? (folders.find((f) => f.id === currentFolderId)?.name ?? null)
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
              {currentFolderName}{' '}
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
          <Submit.Save disabled={name.trim() === ''} form="createFolderForm">
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
  const [folderPanelWidth, setFolderPanelWidth] = React.useState(280);
  const folderPanelRef = React.useRef<HTMLDivElement>(null);
  const isResizing = React.useRef(false);

  const getFolderPanelWidthLimits = React.useCallback((): {
    readonly minimum: number;
    readonly maximum: number;
  } => {
    const panel = folderPanelRef.current;
    const availableWidth =
      panel?.parentElement?.getBoundingClientRect().width ?? 720;
    const minimumWidth = Math.min(160, Math.max(120, availableWidth * 0.3));
    const maximumWidth = Math.max(
      minimumWidth,
      Math.min(480, availableWidth * 0.62)
    );
    return { minimum: minimumWidth, maximum: maximumWidth };
  }, []);
  const [folderPanelWidthLimits, setFolderPanelWidthLimits] = React.useState(
    getFolderPanelWidthLimits
  );

  const updateFolderPanelWidth = React.useCallback(
    (clientX: number): void => {
      const panel = folderPanelRef.current;
      if (panel === null) return;
      const { minimum, maximum } = getFolderPanelWidthLimits();
      const left = panel.getBoundingClientRect().left;
      setFolderPanelWidth(Math.max(minimum, Math.min(maximum, clientX - left)));
    },
    [getFolderPanelWidthLimits]
  );

  React.useEffect(() => {
    const handlePointerMove = (e: PointerEvent): void => {
      if (!isResizing.current) return;
      updateFolderPanelWidth(e.clientX);
    };
    const handlePointerUp = (): void => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [updateFolderPanelWidth]);

  React.useEffect(() => {
    const container = folderPanelRef.current?.parentElement;
    if (container === null || container === undefined) return;
    const resizeObserver = new ResizeObserver(() => {
      const { minimum, maximum } = getFolderPanelWidthLimits();
      setFolderPanelWidthLimits({ minimum, maximum });
      setFolderPanelWidth((width) =>
        Math.max(minimum, Math.min(maximum, width))
      );
    });
    resizeObserver.observe(container);
    return (): void => resizeObserver.disconnect();
  }, [getFolderPanelWidthLimits]);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch folders visible to this user (own personal + shared)
  const [folders] = useAsyncState(
    React.useCallback(
      async () => fetchVisibleQueryFolders(),
      [folderRefreshKey]
    ),
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

  const { paginator, limit, offset, currentPage } =
    usePaginator('queryBuilder');
  const [, setCurrentPage] = currentPage;
  const currentPageRef = React.useRef(currentPage[0]);
  currentPageRef.current = currentPage[0];
  const selectedFolderIdRef = React.useRef(selectedFolderId);
  selectedFolderIdRef.current = selectedFolderId;

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
    domainFilter: true,
    // When viewing a specific folder or shared queries, show all queries
    // (shared folders contain queries from multiple users).
    // When viewing "Your Queries", show only the current user's queries.
    ...(typeof selectedFolderId === 'number' || selectedFolderId === 'shared'
      ? filters?.contextTableId === undefined
      ? {}
        : { contextTableId: filters.contextTableId }
      : (filters ?? { specifyUser: userInformation.id })),
    offset,
    orderBy,
  };

  const advancedFilters: Record<string, string> = {};
  if (selectedFolderId === 'shared') {
    advancedFilters['spqueryfolder__scopetype__in'] =
      'Collection,Discipline,Database';
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
      async () =>
        fetchCollection('SpQuery', collectionFilters, advancedFilters),
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
          !('contextTableId' in activeFilters) ||
          resource.get('contextTableId') === activeFilters.contextTableId;
        const queryFolderId = idFromUrl(
          (resource.get('spQueryFolder') as string | null) ?? ''
        );
        const matchesFolder =
          typeof selectedFolderId !== 'number' ||
          queryFolderId === selectedFolderId;
        const matchesFavorite =
          selectedFolderId !== 'favorites' ||
          resource.get('isFavorite') === true;
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
          (queryFolderId != null && sharedFolderIds.includes(queryFolderId));
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
  const handleFolderDeleted = (folderId: number): void => {
    if (selectedFolderId === folderId) setSelectedFolderId(null);
    handleRefresh();
  };
  const clampPageAfterRemovingVisibleQuery = (): void => {
    if (data === undefined || data.records.length !== 1) return;
    const newTotalCount = Math.max(0, data.totalCount - 1);
    setCurrentPage(
      Math.min(
        currentPage[0],
        Math.max(0, Math.ceil(newTotalCount / limit) - 1)
      )
    );
  };

  const handleToggleFavorite = async (
    query: SerializedResource<SpQuery>
  ): Promise<void> => {
    const newValue = !query.isFavorite;
    const shouldClampPage = selectedFolderId === 'favorites' && !newValue;
    const pageAtRequestStart = currentPage[0];
    const folderAtRequestStart = selectedFolderId;
    await saveResource('SpQuery', query.id, {
      ...removeKey(query, '_tableName'),
      isFavorite: newValue,
    });
    if (
      shouldClampPage &&
      currentPageRef.current === pageAtRequestStart &&
      selectedFolderIdRef.current === folderAtRequestStart
    )
      clampPageAfterRemovingVisibleQuery();
    handleRefresh();
  };

  const handleToggleArchive = async (
    query: SerializedResource<SpQuery>
  ): Promise<void> => {
    const newValue = !query.isArchived;
    const leavesCurrentView =
      (selectedFolderId === 'archive' && !newValue) ||
      (selectedFolderId !== 'archive' && newValue);
    const pageAtRequestStart = currentPage[0];
    const folderAtRequestStart = selectedFolderId;
    await saveResource('SpQuery', query.id, {
      ...removeKey(query, '_tableName'),
      isArchived: newValue,
    });
    if (
      leavesCurrentView &&
      currentPageRef.current === pageAtRequestStart &&
      selectedFolderIdRef.current === folderAtRequestStart
    )
      clampPageAfterRemovingVisibleQuery();
    handleRefresh();
  };

  const [moveTarget, setMoveTarget] = React.useState<
    SerializedResource<SpQuery> | undefined
  >(undefined);

  const [editingFolder, setEditingFolder] = React.useState<
    SerializedResource<SpQueryFolder> | undefined
  >(undefined);

  const handleMoveToFolder = async (folderId: number | null): Promise<void> => {
    if (moveTarget === undefined) return;
    const oldFolderId = parseResourceId(
      moveTarget.spQueryFolder as unknown as string | null
    );
    const leavesCurrentFolder =
      typeof selectedFolderId === 'number' &&
      selectedFolderId === oldFolderId &&
      selectedFolderId !== folderId;
    const leavesSharedQueries =
      selectedFolderId === 'shared' &&
      !(folders ?? []).some(
        (folder) => folder.id === folderId && isSharedFolder(folder)
      );
    const shouldClampPage = leavesCurrentFolder || leavesSharedQueries;
    const pageAtRequestStart = currentPage[0];
    const folderAtRequestStart = selectedFolderId;
    await saveResource('SpQuery', moveTarget.id, {
      ...removeKey(moveTarget, '_tableName'),
      spQueryFolder:
        folderId !== null ? `/api/specify/spqueryfolder/${folderId}/` : null,
    });
    if (
      shouldClampPage &&
      currentPageRef.current === pageAtRequestStart &&
      selectedFolderIdRef.current === folderAtRequestStart
    )
      clampPageAfterRemovingVisibleQuery();
    setMoveTarget(undefined);
    handleRefresh();
  };

  return children({
    totalCount: displayData?.totalCount ?? totalCount,
    records: displayData?.records,
    children: (
      <>
        <div className="flex min-h-0 min-w-0 flex-1 gap-2 overflow-hidden">
          {/* Folder tree sidebar */}
          <div
            ref={folderPanelRef}
            className="relative flex min-h-0 shrink-0 flex-col border-r border-gray-200 pr-3 dark:border-neutral-700"
            style={{ width: folderPanelWidth }}
          >
            <div
              aria-label={queryText.folders()}
              aria-orientation="vertical"
              aria-valuemax={Math.round(folderPanelWidthLimits.maximum)}
              aria-valuemin={Math.round(folderPanelWidthLimits.minimum)}
              aria-valuenow={Math.round(folderPanelWidth)}
              className="absolute inset-y-0 -right-2 z-20 w-4 touch-none cursor-col-resize before:absolute before:inset-y-2 before:right-1/2 before:w-px before:bg-gray-300 before:content-[''] hover:before:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 dark:before:bg-neutral-600"
              role="separator"
              tabIndex={0}
              title={queryText.folders()}
              onKeyDown={(event): void => {
                if (
                  event.key !== 'ArrowLeft' &&
                  event.key !== 'ArrowRight' &&
                  event.key !== 'Home' &&
                  event.key !== 'End'
                )
                  return;
                event.preventDefault();
                const left =
                  folderPanelRef.current?.getBoundingClientRect().left ?? 0;
                if (event.key === 'Home') {
                  updateFolderPanelWidth(left + folderPanelWidthLimits.minimum);
                } else if (event.key === 'End') {
                  updateFolderPanelWidth(left + folderPanelWidthLimits.maximum);
                } else {
                  updateFolderPanelWidth(
                    left +
                      folderPanelWidth +
                      (event.key === 'ArrowRight' ? 16 : -16)
                  );
                }
              }}
              onPointerDown={(event): void => {
                event.preventDefault();
                isResizing.current = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
              }}
            />
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pb-1 pr-1">
              <nav
                aria-label={queryText.queries()}
                className="space-y-0.5 border-b border-gray-200 pb-2 dark:border-neutral-700"
              >
            <Button.LikeLink
                  className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left ${
                    selectedFolderId === null
                      ? 'bg-brand-100 font-semibold dark:bg-brand-400 dark:text-white dark:hover:text-white'
                      : 'hover:bg-brand-50 dark:hover:bg-neutral-700'
              }`}
              onClick={(): void => setSelectedFolderId(null)}
            >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {icons.folder}
                  </span>
              {queryText.yourQueries()}
            </Button.LikeLink>
            <Button.LikeLink
                  className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left ${
                    selectedFolderId === 'shared'
                      ? 'bg-brand-100 font-semibold dark:bg-brand-400 dark:text-white dark:hover:text-white'
                      : 'hover:bg-brand-50 dark:hover:bg-neutral-700'
              }`}
              onClick={(): void => setSelectedFolderId('shared')}
            >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {icons.globe}
                  </span>
              {queryText.sharedQueries()}
            </Button.LikeLink>
              </nav>
              <section className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2 pb-1">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {queryText.folders()}
                  </h2>
                  <Button.Icon
                    icon="plus"
                  className="shrink-0 rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-neutral-700"
                aria-label={queryText.newFolder()}
                title={queryText.newFolder()}
                onClick={handleOpenCreateFolder}
                  />
            </div>
                <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
            {folderTree.map((node) => (
              <FolderTreeItem
                depth={0}
                key={node.folder.id}
                node={node}
                      selectedFolderId={
                        typeof selectedFolderId === 'number'
                          ? selectedFolderId
                          : null
                      }
                onSelect={(id): void => setSelectedFolderId(id)}
                onEdit={setEditingFolder}
              />
            ))}
            </div>
              </section>
            </div>
            <nav className="space-y-0.5 border-t border-gray-200 pt-2 dark:border-neutral-700">
            <Button.LikeLink
                className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left ${
                  selectedFolderId === 'favorites'
                    ? 'bg-brand-100 font-semibold dark:bg-brand-400 dark:text-white dark:hover:text-white'
                    : 'hover:bg-brand-50 dark:hover:bg-neutral-700'
              }`}
              onClick={(): void => setSelectedFolderId('favorites')}
            >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {icons.star}
                </span>
              {queryText.favorites()}
            </Button.LikeLink>
            <Button.LikeLink
                className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left ${
                  selectedFolderId === 'archive'
                    ? 'bg-brand-100 font-semibold dark:bg-brand-400 dark:text-white dark:hover:text-white'
                    : 'hover:bg-brand-50 dark:hover:bg-neutral-700'
              }`}
              onClick={(): void => setSelectedFolderId('archive')}
            >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {icons.archive}
                </span>
              {queryText.archived()}
            </Button.LikeLink>
            </nav>
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
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="grid-table grid-cols-[repeat(3,auto)_min-content] gap-2">
              <thead>
                <tr>
                  <th
                    className="pl-[calc(theme(spacing.table-icon)_+_theme(spacing.2))]"
                    scope="col"
                  >
                    <Button.LikeLink onClick={(): void => handleSort('name')}>
                      {getField(tables.SpQuery, 'name').label}
                        <SortIndicator
                          fieldName="name"
                          sortConfig={sortConfig}
                        />
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
              {displayData !== undefined &&
              (displayData.records.length > 0 || displayData.totalCount > limit)
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
            onDeleted={handleFolderDeleted}
            onSaved={handleRefresh}
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
          container: `${dialogClassNames.freeContainer}
            max-h-[90vh] min-w-[min(30rem,90%)] w-[min(60rem,90vw)]`,
        }}
        defaultSize={{ width: 960, height: 640 }}
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
          <Link.Default className="overflow-x-auto" href={callBack}>
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
                query.isFavorite ? queryText.unfavorite() : queryText.favorite()
              }
              onClick={
                isOwnQuery ? (): void => onFavoriteToggle(query) : undefined
              }
            />
            <Button.Icon
              className={!isOwnQuery ? '!text-gray-300' : undefined}
              disabled={!isOwnQuery}
              icon="folder"
              title={queryText.moveToFolder()}
              onClick={isOwnQuery ? (): void => onMoveClick(query) : undefined}
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
                isOwnQuery ? (): void => onArchiveToggle(query) : undefined
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
