import React from 'react';

import { ajax } from '../ajax';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../collection';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../datamodelutils';
import { f } from '../functools';
import { caseInsensitiveHash, sortFunction, toggleItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { treeText } from '../localization/tree';
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
  serializeConformation,
} from '../treeviewutils';
import type { IR, RA } from '../types';
import { Autocomplete } from './autocomplete';
import { Button, Container, DataEntry, H2, Input } from './basic';
import { TableIcon } from './common';
import { ErrorBoundary, softFail } from './errorboundary';
import { useAsyncState, useBooleanState, useId, useTitle } from './hooks';
import { supportsBackdropBlur } from './modaldialog';
import { pushUrl } from './navigation';
import { NotFoundView } from './notfoundview';
import { ProtectedTree } from './permissiondenied';
import {
  useHighContrast,
  usePref,
  useReducedTransparency,
} from './preferenceshooks';
import { deserializeResource } from './resource';
import { ResourceView } from './resourceview';
import { useCachedState } from './statecache';
import { EditTreeDefinition } from './toolbar/treerepair';
import { TreeViewActions } from './treeviewactions';
import { TreeRow } from './treeviewrow';

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
  const [collapsedRanks, setCollapsedRanks] = useCachedState(
    'tree',
    `collapsedRanks${tableName}`
  );

  const [rawConformation = '', setConformation] = useCachedState(
    'tree',
    `conformation${tableName}`
  );
  const conformation = deserializeConformation(rawConformation);

  // FEATURE: update query string in URL on initial load if has cached conformation
  function updateConformation(value: Conformations | undefined): void {
    if (typeof value === 'object') {
      const encoded = serializeConformation(value);
      pushUrl(formatUrl(globalThis.location.href, { conformation: encoded }));
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

  // FEATURE: synchronize focus path with the URL
  const [focusPath = [], setFocusPath] = useCachedState(
    'tree',
    `focusPath${tableName}`
  );
  const [focusedRow, setFocusedRow] = React.useState<Row | undefined>(
    undefined
  );
  const [actionRow, setActionRow] = React.useState<Row | undefined>(undefined);

  const searchBoxRef = React.useRef<HTMLInputElement | null>(null);
  const toolbarButtonRef = React.useRef<HTMLElement | null>(null);
  const [searchValue, setSearchValue] = React.useState<string>('');

  const [isEditingRanks, _, __, handleToggleEditingRanks] = useBooleanState();

  const reduceTransparency = useReducedTransparency();
  const highContrast = useHighContrast();
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

  return rows === undefined ? null : (
    <Container.Full>
      <header className="flex flex-wrap items-center gap-2">
        <TableIcon label name={table.name} />
        <H2 title={treeDefinition.get('remarks') ?? undefined}>
          {treeDefinition.get('name')}
        </H2>
        <EditTreeDefinition treeDefinition={treeDefinition} />
        <div>
          {/* A React component that is also a TypeScript generic */}
          <Autocomplete<SerializedResource<SCHEMA>>
            aria-label={treeText('searchTreePlaceholder')}
            filterItems={false}
            forwardRef={searchBoxRef}
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
            value={searchValue}
            onChange={({ label, data }): void => {
              setSearchValue(label as string);
              ajax<
                IR<string | { readonly rankid: number; readonly id: number }>
              >(
                `/api/specify_tree/${tableName.toLowerCase()}/${data.id}/path/`,
                {
                  headers: { Accept: 'application/json' },
                }
              )
                .then(({ data }) =>
                  setFocusPath(
                    Object.values(data)
                      .filter(
                        (
                          node
                        ): node is {
                          readonly rankid: number;
                          readonly id: number;
                        } => typeof node === 'object'
                      )
                      .sort(sortFunction(({ rankid }) => rankid))
                      .map(({ id }) => id)
                  )
                )
                .catch(softFail);
            }}
            onCleared={(): void => setSearchValue('')}
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
          aria-pressed={isEditingRanks}
          onClick={handleToggleEditingRanks}
        >
          {treeText('editRanks')}
        </Button.Small>
        <span className="-ml-2 flex-1" />
        <ErrorBoundary dismissable>
          <TreeViewActions<SCHEMA>
            actionRow={actionRow}
            focusedRow={focusedRow}
            focusRef={toolbarButtonRef}
            ranks={rankIds}
            tableName={tableName}
            onChange={setActionRow}
            onRefresh={(): void => {
              // Force re-load
              setRows(undefined);
              globalThis.setTimeout(() => setRows(rows), 0);
            }}
          />
        </ErrorBoundary>
      </header>
      <div
        className={`
          grid-table flex-1 grid-cols-[repeat(var(--cols),auto)]
          content-start overflow-auto rounded from-[var(--edge-color)] via-[var(--middle-color)] to-[var(--edge-color)] p-2
          pt-0
          shadow-md shadow-gray-500 outline-none
          ${highContrast ? 'border dark:border-white' : 'bg-gradient-to-bl'}
        `}
        role="none table"
        // First role is for screen readers. Second is for styling
        style={
          {
            '--cols': treeDefinitionItems.length,
            '--middle-color': `${treeAccentColor}33`,
            '--edge-color': `${treeAccentColor}00`,
          } as React.CSSProperties
        }
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
          globalThis.setTimeout(
            () => setFocusPath(focusPath.length > 0 ? focusPath : [0]),
            0
          );
        }}
      >
        <div role="none rowgroup">
          <div role="none row">
            {treeDefinitionItems.map((rank, index, { length }) => (
              <div
                className={`
                  sticky top-0 whitespace-nowrap border border-transparent p-2
                  ${index === 0 ? '-ml-2 rounded-bl pl-4' : ''}
                  ${index + 1 === length ? '-mr-2 rounded-br pr-4' : ''}
                  ${
                    reduceTransparency || !supportsBackdropBlur
                      ? 'bg-gray-100 dark:bg-neutral-900'
                      : 'bg-gray-100/60 backdrop-blur-sm dark:bg-neutral-900/60'
                  }
                `}
                key={index}
                role="columnheader"
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
                  {f.var(rank.title || rank.name, (rankName) =>
                    collapsedRanks?.includes(rank.rankId) ?? false
                      ? rankName[0]
                      : rankName
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
              actionRow={actionRow}
              collapsedRanks={collapsedRanks ?? []}
              conformation={
                conformation
                  ?.find(([id]) => id === row.nodeId)
                  ?.slice(1) as Conformations
              }
              focusPath={
                (focusPath[0] === 0 && index === 0) ||
                focusPath[0] === row.nodeId
                  ? focusPath.slice(1)
                  : undefined
              }
              getRows={getRows}
              getStats={getStats}
              key={row.nodeId}
              nodeStats={undefined}
              path={[]}
              rankNameId={id}
              ranks={rankIds}
              row={row}
              setFocusedRow={setFocusedRow}
              synonymColor={synonymColor}
              onAction={(action): void => {
                if (action === 'next')
                  if (rows[index + 1] === undefined) return undefined;
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
              onChangeConformation={(newConformation): void =>
                updateConformation([
                  ...(conformation?.filter(([id]) => id !== row.nodeId) ?? []),
                  ...(typeof newConformation === 'object'
                    ? ([[row.nodeId, ...newConformation]] as const)
                    : []),
                ])
              }
              onFocusNode={(newFocusPath): void =>
                setFocusPath([row.nodeId, ...newFocusPath])
              }
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
          canAddAnother={false}
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          mode="edit"
          resource={resource}
          onClose={handleClose}
          onDeleted={undefined}
          onSaved={(): void => globalThis.location.reload()}
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

  const treeName = getModel(table)?.name;
  const treeDefinition =
    typeof treeDefinitions === 'object' &&
    typeof treeName === 'string' &&
    isTreeModel(treeName)
      ? caseInsensitiveHash(treeDefinitions, treeName)
      : undefined;

  if (treeName === undefined || !isTreeModel(treeName)) return <NotFoundView />;
  return (
    <ProtectedTree action="read" treeName={treeName}>
      {typeof treeDefinition === 'object' ? (
        <TreeView
          tableName={treeName}
          treeDefinition={treeDefinition.definition}
          treeDefinitionItems={treeDefinition.ranks}
        />
      ) : null}
    </ProtectedTree>
  );
}
