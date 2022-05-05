import React from 'react';

import { ajax } from '../ajax';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../collection';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../datamodelutils';
import { caseInsensitiveHash, sortObjectsByKey, toggleItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { treeText } from '../localization/tree';
import { hasTreeAccess } from '../permissions';
import { formatUrl, parseUrl } from '../querystring';
import { getPref } from '../remoteprefs';
import { getModel, schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { isTreeModel, treeRanksPromise } from '../treedefinitions';
import type { Conformations, Row, Stats } from '../treeviewutils';
import {
  deserializeConformation,
  fetchRows,
  fetchStats,
  pipe,
  serializeConformation,
} from '../treeviewutils';
import type { IR, RA } from '../types';
import { Autocomplete } from './autocomplete';
import { Button, Container, DataEntry, H2, Input } from './basic';
import { TableIcon } from './common';
import { useAsyncState, useBooleanState, useId, useTitle } from './hooks';
import { pushUrl } from './navigation';
import { NotFoundView } from './notfoundview';
import { PermissionDenied } from './permissiondenied';
import { usePref, useReducedTransparency } from './preferenceshooks';
import { deserializeResource } from './resource';
import { ResourceView } from './resourceview';
import { useCachedState } from './statecache';
import { EditTreeDefinition } from './toolbar/treerepair';
import { TreeViewActions } from './treeviewactions';
import { TreeRow } from './treeviewrow';

const defaultCacheValue = [] as const;

const treeToPref = {
  Geography: 'geography',
  Taxon: 'taxon',
  Storage: 'storage',
  GeologicTimePeriod: 'geologicTimePeriod',
  LithoStrat: 'lithoStrat',
} as const;

function TreeView<SCHEMA extends AnyTree>({
  tableName,
  treeDefinition,
  treeDefinitionItems,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly treeDefinition: SpecifyResource<FilterTablesByEndsWith<'TreeDef'>>;
  readonly treeDefinitionItems: RA<
    SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>
  >;
}): JSX.Element | null {
  const table = schema.models[tableName] as SpecifyModel<AnyTree>;
  const rankIds = treeDefinitionItems.map(({ rankId }) => rankId);
  const [collapsedRanks, setCollapsedRanks] = useCachedState({
    bucketName: 'tree',
    cacheName: `collapsedRanks${tableName}`,
    defaultValue: defaultCacheValue,
    staleWhileRefresh: false,
  });

  const [rawConformation, setConformation] = useCachedState({
    bucketName: 'tree',
    cacheName: `conformation${tableName}`,
    defaultValue: undefined,
    staleWhileRefresh: false,
  });
  const conformation = deserializeConformation(rawConformation);

  // TODO: update query string in URL on initial load if has cached conformation
  function updateConformation(value: Conformations | undefined): void {
    if (typeof value === 'object') {
      const encoded = serializeConformation(value);
      pushUrl(formatUrl(window.location.href, { conformation: encoded }));
      setConformation(encoded);
    } else setConformation('');
  }

  React.useEffect(() => {
    const { conformation } = parseUrl();
    if (typeof conformation === 'string' && conformation.length > 0)
      updateConformation(deserializeConformation(conformation));
  }, []);

  useTitle(treeText('treeViewTitle', table.label));

  // Node sort order
  const sortField = getPref(`${tableName as 'Geography'}.treeview_sort_field`);
  const baseUrl = `/api/specify_tree/${tableName.toLowerCase()}/${
    treeDefinition.id
  }`;
  const getRows = React.useCallback(
    async (parentId: number | 'null') =>
      fetchRows(`${baseUrl}/${parentId}/${sortField}`),
    [baseUrl, sortField]
  );

  const statsThreshold = getPref(
    `TreeEditor.Rank.Threshold.${tableName as 'Geography'}`
  );
  const getStats = React.useCallback(
    async (nodeId: number | 'null', rankId: number): Promise<Stats> =>
      rankId >= statsThreshold
        ? fetchStats(`${baseUrl}/${nodeId}/stats/`)
        : Promise.resolve({}),
    [baseUrl, statsThreshold]
  );

  const [rows, setRows] = useAsyncState<RA<Row>>(
    React.useCallback(async () => getRows('null'), [getRows]),
    true
  );

  const id = useId('tree-view');

  const [focusPath, setFocusPath] = React.useState<RA<number>>([]);
  const [focusedRow, setFocusedRow] = React.useState<Row | undefined>(
    undefined
  );

  const searchBoxRef = React.useRef<HTMLInputElement | null>(null);
  const toolbarButtonRef = React.useRef<HTMLElement | null>(null);
  const [searchValue, setSearchValue] = React.useState<string>('');

  const [isEditingRanks, _, __, handleToggleEditingRanks] = useBooleanState();

  const reduceTransparency = useReducedTransparency();
  const [treeAccentColor] = usePref(
    'treeEditor',
    treeToPref[tableName],
    'treeAccentColor'
  );
  const [synonymColor] = usePref(
    'treeEditor',
    treeToPref[tableName],
    'synonymColor'
  );

  return typeof rows === 'undefined' ? null : (
    <Container.Full>
      <header className="flex flex-wrap items-center gap-2">
        <TableIcon name={table.name} />
        <H2 title={treeDefinition.get('remarks') ?? undefined}>
          {treeDefinition.get('name')}
        </H2>
        <EditTreeDefinition treeDefinition={treeDefinition} />
        <div>
          {/* A React component that is also a TypeScript generic */}
          <Autocomplete<SerializedResource<SCHEMA>>
            filterItems={false}
            value={searchValue}
            source={async (value) =>
              fetchCollection(
                table.name,
                {
                  limit: DEFAULT_FETCH_LIMIT,
                  orderBy: 'name',
                  domainFilter: true,
                },
                {
                  name__iStartsWith: value,
                }
              ).then(({ records }) =>
                records.map((node) => {
                  const rankDefinition = treeDefinitionItems.find(
                    ({ rankId }) => rankId === node.rankId
                  );
                  const rankName =
                    rankDefinition?.title || rankDefinition?.name;
                  return {
                    label: node.fullName ?? node.name,
                    subLabel: rankName,
                    data: node as SerializedResource<SCHEMA>,
                  };
                })
              )
            }
            onCleared={(): void => setSearchValue('')}
            onChange={({ label, data }): void => {
              setSearchValue(label as string);
              ajax<
                IR<{ readonly rankid: number; readonly id: number } | string>
              >(
                `/api/specify_tree/${tableName.toLowerCase()}/${data.id}/path/`,
                {
                  headers: { Accept: 'application/json' },
                }
              )
                .then(({ data }) =>
                  setFocusPath(
                    sortObjectsByKey(
                      Object.values(data).filter(
                        (
                          node
                        ): node is {
                          readonly rankid: number;
                          readonly id: number;
                        } => typeof node === 'object'
                      ),
                      'rankid'
                    ).map(({ id }) => id)
                  )
                )
                .catch(console.error);
            }}
            forwardRef={searchBoxRef}
            aria-label={treeText('searchTreePlaceholder')}
          >
            {(inputProps): JSX.Element => (
              <Input.Generic
                placeholder={treeText('searchTreePlaceholder')}
                title={treeText('searchTreePlaceholder')}
                {...inputProps}
              />
            )}
          </Autocomplete>
        </div>
        <Button.Small
          onClick={handleToggleEditingRanks}
          aria-pressed={isEditingRanks}
        >
          {treeText('editRanks')}
        </Button.Small>
        <span className="flex-1 -ml-2" />
        <TreeViewActions<SCHEMA>
          tableName={tableName}
          focusRef={toolbarButtonRef}
          onRefresh={(): void => {
            // Force re-load
            setRows(undefined);
            setTimeout(() => setRows(rows), 0);
          }}
          focusedRow={focusedRow}
          ranks={rankIds}
        />
      </header>
      <div
        className={`grid-table grid-cols-[repeat(var(--cols),auto)] flex-1
          overflow-auto shadow-md shadow-gray-500 content-start
          bg-gradient-to-bl from-[var(--edgeColor)] rounded p-2 pt-0
          via-[var(--middleColor)] to-[var(--edgeColor)] outline-none`}
        style={
          {
            '--cols': treeDefinitionItems.length,
            '--middleColor': `${treeAccentColor}33`,
            '--edgeColor': `${treeAccentColor}00`,
          } as React.CSSProperties
        }
        // First role is for screen readers. Second is for styling
        role="none table"
        tabIndex={0}
        // When tree viewer is focused, move focus to last focused node
        onFocus={(event): void => {
          // Don't handle bubbled events
          if (event.currentTarget !== event.target) return;
          // If user wants to edit tree ranks, allow tree ranks to receive focus
          if (isEditingRanks) return;
          event.preventDefault();
          // Unset and set focus path to trigger a useEffect hook in <TreeNode>
          setFocusPath([-1]);
          setTimeout(
            () => setFocusPath(focusPath.length > 0 ? focusPath : [0]),
            0
          );
        }}
      >
        <div role="none rowgroup">
          <div role="none row">
            {treeDefinitionItems.map((rank, index, { length }) => (
              <div
                role="columnheader"
                key={index}
                className={`border whitespace-nowrap border-transparent top-0
                  sticky p-2
                  ${index === 0 ? '-ml-2 pl-4 rounded-bl' : ''}
                  ${index + 1 === length ? 'pr-4 -mr-2 rounded-br' : ''}
                  ${
                    reduceTransparency
                      ? 'bg-gray-100 dark:bg-neutral-900'
                      : 'backdrop-blur-sm bg-gray-100/60 dark:bg-neutral-900/60'
                  }
                `}
              >
                <Button.LikeLink
                  id={id(rank.rankId.toString())}
                  onClick={
                    Array.isArray(collapsedRanks)
                      ? (): void =>
                          setCollapsedRanks(
                            toggleItem(collapsedRanks, rank.rankId)
                          )
                      : undefined
                  }
                >
                  {pipe(
                    rank.title || rank.name,
                    collapsedRanks?.includes(rank.rankId) ?? false,
                    (name) => name[0]
                  )}
                </Button.LikeLink>
                {isEditingRanks &&
                collapsedRanks?.includes(rank.rankId) !== true ? (
                  <EditTreeRank rank={rank} />
                ) : undefined}
              </div>
            ))}
          </div>
        </div>
        <ul role="tree rowgroup">
          {rows.map((row, index) => (
            <TreeRow
              key={row.nodeId}
              row={row}
              getRows={getRows}
              getStats={getStats}
              nodeStats={undefined}
              path={[]}
              ranks={rankIds}
              rankNameId={id}
              collapsedRanks={collapsedRanks ?? []}
              conformation={
                conformation
                  ?.find(([id]) => id === row.nodeId)
                  ?.slice(1) as Conformations
              }
              onChangeConformation={(newConformation): void =>
                updateConformation([
                  ...(conformation?.filter(([id]) => id !== row.nodeId) ?? []),
                  ...(typeof newConformation === 'object'
                    ? ([[row.nodeId, ...newConformation]] as const)
                    : []),
                ])
              }
              focusPath={
                (focusPath[0] === 0 && index === 0) ||
                focusPath[0] === row.nodeId
                  ? focusPath.slice(1)
                  : undefined
              }
              onFocusNode={(newFocusPath): void =>
                setFocusPath([row.nodeId, ...newFocusPath])
              }
              onAction={(action): void => {
                if (action === 'next')
                  if (typeof rows[index + 1] === 'undefined') return undefined;
                  else setFocusPath([rows[index + 1].nodeId]);
                else if (action === 'previous' && index > 0)
                  setFocusPath([rows[index - 1].nodeId]);
                else if (action === 'previous' || action === 'parent')
                  setFocusPath([]);
                else if (action === 'focusPrevious')
                  toolbarButtonRef.current?.focus();
                else if (action === 'focusNext') searchBoxRef.current?.focus();
                return undefined;
              }}
              setFocusedRow={setFocusedRow}
              synonymColor={synonymColor}
            />
          ))}
        </ul>
      </div>
    </Container.Full>
  );
}

function EditTreeRank({
  rank,
}: {
  readonly rank: SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const resource = React.useMemo(() => deserializeResource(rank), [rank]);
  return (
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen && (
        <ResourceView
          resource={resource}
          mode="edit"
          canAddAnother={false}
          dialog="modal"
          onClose={handleClose}
          onSaved={(): void => window.location.reload()}
          onDeleted={undefined}
          isSubForm={false}
          isDependent={false}
        />
      )}
    </>
  );
}

export function TreeViewWrapper({
  table,
}: {
  readonly table: string;
}): JSX.Element | null {
  const [treeDefinitions] = useAsyncState(
    React.useCallback(async () => treeRanksPromise, []),
    true
  );

  const tableName = getModel(table)?.name;
  const treeDefinition =
    typeof treeDefinitions === 'object' &&
    typeof tableName === 'string' &&
    isTreeModel(tableName)
      ? caseInsensitiveHash(treeDefinitions, tableName)
      : undefined;

  if (typeof tableName === 'undefined' || !isTreeModel(tableName))
    return <NotFoundView />;
  else if (!hasTreeAccess(tableName, 'read')) return <PermissionDenied />;
  else
    return typeof treeDefinition === 'object' ? (
      <TreeView
        tableName={tableName}
        treeDefinition={treeDefinition.definition}
        treeDefinitionItems={treeDefinition.ranks}
      />
    ) : null;
}
