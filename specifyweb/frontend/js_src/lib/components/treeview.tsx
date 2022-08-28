import React from 'react';
import { useParams } from 'react-router-dom';

import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../datamodelutils';
import { useErrorContext } from '../errorcontext';
import { f } from '../functools';
import { caseInsensitiveHash, toggleItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { treeText } from '../localization/tree';
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
import type { RA } from '../types.js';
import { Button, Container, DataEntry, H2 } from './basic';
import { TableIcon } from './common';
import { ErrorBoundary } from './errorboundary';
import { useMenuItem } from './header';
import { useAsyncState, useBooleanState, useId, useTitle } from './hooks';
import { supportsBackdropBlur } from './modaldialog';
import { useSearchParam as useSearchParameter } from './navigation';
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
import { TreeViewSearch } from './treeviewsearch';

const treeToPref = {
    Geography: 'geography',
    Taxon: 'taxon',
    Storage: 'storage',
    GeologicTimePeriod: 'geologicTimePeriod',
    LithoStrat: 'lithoStrat',
  } as const,
  defaultConformation: RA<never> = [];

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
  const table = schema.models[tableName] as SpecifyModel<AnyTree>,
    rankIds = treeDefinitionItems.map(({ rankId }) => rankId),
    [collapsedRanks, setCollapsedRanks] = useCachedState(
      'tree',
      `collapsedRanks${tableName}`
    ),
    [urlConformation, setUrlConformation] = useSearchParameter('conformation'),
    [conformation = defaultConformation, setConformation] = useCachedState(
      'tree',
      `conformations${tableName}`
    );

  React.useEffect(
    () => setUrlConformation(serializeConformation(conformation)),
    [conformation, setUrlConformation]
  );
  React.useEffect(() => {
    if (typeof urlConformation !== 'string') return;
    const parsed = deserializeConformation(urlConformation);
    setConformation(parsed);
  }, [setConformation]);

  useTitle(treeText('treeViewTitle', table.label));

  // Node sort order
  const sortField = getPref(`${tableName as 'Geography'}.treeview_sort_field`),
    baseUrl = `/api/specify_tree/${tableName.toLowerCase()}/${
      treeDefinition.id
    }`,
    getRows = React.useCallback(
      async (parentId: number | 'null') =>
        fetchRows(`${baseUrl}/${parentId}/${sortField}`),
      [baseUrl, sortField]
    ),
    statsThreshold = getPref(
      `TreeEditor.Rank.Threshold.${tableName as 'Geography'}`
    ),
    getStats = React.useCallback(
      async (nodeId: number | 'null', rankId: number): Promise<Stats> =>
        rankId >= statsThreshold
          ? fetchStats(`${baseUrl}/${nodeId}/stats/`)
          : Promise.resolve({}),
      [baseUrl, statsThreshold]
    ),
    [rows, setRows] = useAsyncState<RA<Row>>(
      React.useCallback(async () => getRows('null'), [getRows]),
      true
    ),
    id = useId('tree-view'),
    // FEATURE: synchronize focus path with the URL
    [focusPath = [], setFocusPath] = useCachedState(
      'tree',
      `focusPath${tableName}`
    ),
    [focusedRow, setFocusedRow] = React.useState<Row | undefined>(undefined),
    [actionRow, setActionRow] = React.useState<Row | undefined>(undefined),
    searchBoxRef = React.useRef<HTMLInputElement | null>(null),
    toolbarButtonRef = React.useRef<HTMLAnchorElement | null>(null),
    [isEditingRanks, _, __, handleToggleEditingRanks] = useBooleanState(),
    reduceTransparency = useReducedTransparency(),
    highContrast = useHighContrast(),
    [treeAccentColor] = usePref(
      'treeEditor',
      treeToPref[tableName],
      'treeAccentColor'
    ),
    [synonymColor] = usePref(
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
        <TreeViewSearch<SCHEMA>
          forwardRef={searchBoxRef}
          tableName={tableName}
          treeDefinitionItems={treeDefinitionItems}
          onFocusPath={setFocusPath}
        />
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
                setConformation([
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
  const [isOpen, handleOpen, handleClose] = useBooleanState(),
    resource = React.useMemo(() => deserializeResource(rank), [rank]);
  return (
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen ? (
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
      ) : null}
    </>
  );
}

const fetchTreeRanks = async (): typeof treeRanksPromise => treeRanksPromise;

export function TreeViewWrapper(): JSX.Element | null {
  useMenuItem('trees');
  const { tableName = '' } = useParams(),
    treeName = getModel(tableName)?.name,
    [treeDefinitions] = useAsyncState(fetchTreeRanks, true);
  useErrorContext('treeDefinitions', treeDefinitions);

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
