import * as React from 'react';

import ajax from '../ajax';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import treeText from '../localization/tree';
import * as navigation from '../navigation';
import * as querystring from '../querystring';
import { getIntPref, getPref } from '../remoteprefs';
import { getModel } from '../schema';
import type { IR, RA, RR } from '../types';
import { defined } from '../types';
import { capitalize } from '../wbplanviewhelper';
import { Autocomplete } from './autocomplete';
import { Button, className, Input, Link, transitionDuration } from './basic';
import { useId, useTitle } from './hooks';
import icons from './icons';
import { formatNumber } from './internationalization';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { useCachedState } from './stateCache';
import _ from 'underscore';
import userInfo from '../userinfo';

const fetchRows = async (fetchUrl: string) =>
  ajax<
    RA<
      Readonly<
        [
          number,
          string,
          string,
          number,
          number,
          number,
          number | null,
          string | null,
          number
        ]
      >
    >
  >(fetchUrl, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { Accept: 'application/json' },
  }).then(({ data: rows }) =>
    rows.map(
      (
        [
          nodeId,
          name,
          fullName,
          nodeNumber,
          highestNodeNumber,
          rankId,
          acceptedId,
          acceptedName,
          children,
        ],
        index,
        { length }
      ) => ({
        nodeId,
        name,
        fullName,
        nodeNumber,
        highestNodeNumber,
        rankId,
        acceptedId: acceptedId ?? undefined,
        acceptedName: acceptedName ?? undefined,
        children,
        isLastChild: index + 1 === length,
      })
    )
  );

type Stats = RR<
  number,
  {
    readonly directCount: number;
    readonly childCount: number;
  }
>;

const fetchStats = async (url: string): Promise<Stats> =>
  ajax<RA<Readonly<[number, number, number]>>>(url, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { Accept: 'application/json' },
  }).then(({ data }) =>
    Object.fromEntries(
      data.map(([childId, directCount, allCount]) => [
        childId,
        {
          directCount,
          childCount: allCount - directCount,
        },
      ])
    )
  );

type Row = Awaited<ReturnType<typeof fetchRows>>[number];

/**
 * Conditional Pipe. Like Ramda's lenses
 */
const pipe = <T, V>(
  value: T,
  condition: boolean,
  mapper: (value: T) => V
): T | V => (condition ? mapper(value) : value);

/*
 * TODO: hide root rank if it is the only one
 * TODO: replace context menu with an accessible solution
 * TODO: keyboard navigation & focus management
 */

type Conformations = RA<Conformation>;

interface Conformation extends Readonly<[number, ...Conformations]> {}

function deserializeConformation(
  conformation: string | undefined
): Conformations | undefined {
  if (typeof conformation === 'undefined') return undefined;
  const serialized = conformation
    .replace(/([^~])~/g, '$1,~')
    .replaceAll('~', '[')
    .replaceAll('-', ']');
  try {
    return JSON.parse(serialized) as Conformations;
  } catch {
    console.error('bad tree conformation:', serialized);
    return undefined;
  }
}

const throttleRate = 250;
const scrollIntoView = _.throttle(function scrollIntoView(
  element: HTMLElement
): void {
  if (transitionDuration === 0) element.scrollIntoView(false);
  else
    try {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    } catch {
      element.scrollIntoView(false);
    }
},
throttleRate);

/**
 * Replace reserved url characters to avoid percent escaping. Also, commas are
 * superfluous since they precede every open bracket that is not itself preceded
 * by an open bracket by nature of the construction.
 */
const serializeConformation = (
  conformation: Conformations | undefined
): string =>
  JSON.stringify(conformation)
    .replaceAll('[', '~')
    .replaceAll(']', '-')
    .replaceAll(',', '');

function TreeView({
  tableName,
  treeDefinition,
  treeDefinitionItems,
}: {
  readonly tableName: string;
  readonly treeDefinition: SpecifyResource;
  readonly treeDefinitionItems: RA<SpecifyResource>;
}): JSX.Element {
  const table = defined(getModel(tableName));
  const rankIds = treeDefinitionItems.map((rank) => rank.get<number>('rankid'));
  const [collapsedRanks, setCollapsedRanks] = useCachedState({
    bucketName: 'tree',
    cacheName: `collapsedRanks${capitalize(tableName)}`,
    bucketType: 'localStorage',
    defaultValue: [],
  });

  const [rawConformation, setConformation] = useCachedState({
    bucketName: 'tree',
    cacheName: `conformation${capitalize(tableName)}`,
    bucketType: 'localStorage',
    defaultValue: undefined,
  });
  const conformation = deserializeConformation(rawConformation);

  function updateConformation(value: Conformations | undefined): void {
    if (typeof value === 'undefined') setConformation('');
    else {
      const encoded = serializeConformation(value);
      navigation.push(
        querystring.format(window.location.href, { conformation: encoded })
      );
      setConformation(encoded);
    }
  }

  React.useEffect(() => {
    const { conformation } = querystring.parse();
    if (typeof conformation === 'string' && conformation.length > 0)
      updateConformation(deserializeConformation(conformation));
  }, []);

  useTitle(treeText('treeViewTitle')(table.getLocalizedName()));

  // Node sort order
  const sortOrderFieldName = `${capitalize(tableName)}.treeview_sort_field`;
  const sortField = getPref(sortOrderFieldName, 'name');
  const baseUrl = `/api/specify_tree/${tableName}/${treeDefinition.id}`;
  const getRows = React.useCallback(
    async (parentId: number | 'null') =>
      fetchRows(`${baseUrl}/${parentId}/${sortField}`),
    [baseUrl, sortField]
  );

  const statsThreshold = getIntPref(
    `TreeEditor.Rank.Threshold.${capitalize(tableName)}`
  );
  const getStats = React.useCallback(
    async (nodeId: number | 'null', rankId: number): Promise<Stats> =>
      typeof statsThreshold === 'undefined' || statsThreshold > rankId
        ? Promise.resolve({})
        : fetchStats(`${baseUrl}/${nodeId}/stats/`),
    [baseUrl, statsThreshold]
  );

  const [rows, setRows] = React.useState<RA<Row> | undefined>(undefined);

  React.useEffect(() => {
    void getRows('null').then((rows) =>
      destructorCalled ? undefined : setRows(rows)
    );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [getRows]);

  const id = useId('tree-view');

  const [focusPath, setFocusPath] = React.useState<RA<number>>([]);

  const searchBoxRef = React.useRef<HTMLInputElement | null>(null);
  const toolbarButtonRef = React.useRef<HTMLButtonElement | null>(null);

  return typeof rows === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <section className={className.containerFull}>
      <header className="flex flex-wrap items-center gap-2">
        <h2>{table.getLocalizedName()}</h2>
        {/* A react component that is also a TypeScript generic */}
        <Autocomplete<SpecifyResource>
          source={async (value) => {
            const collection = new table.LazyCollection({
              filters: { name__istartswith: value, orderby: 'name' },
              domainfilter: true,
            });
            await collection.fetch();
            return Object.fromEntries(
              collection.models.map((node) => {
                const rankDefinition = treeDefinitionItems.find(
                  (rank) =>
                    rank.get<number>('rankid') === node.get<number>('rankid')
                );
                const rankName =
                  rankDefinition?.get<string | null>('title') ??
                  rankDefinition?.get<string>('name') ??
                  node.get<string>('name');
                return [
                  node.get<string>('fullname'),
                  { label: rankName, data: node },
                ];
              })
            );
          }}
          onChange={(_value, { data }): void => {
            void ajax<
              IR<{ readonly rankid: number; readonly id: number } | string>
            >(`/api/specify_tree/${tableName}/${data.id}/path/`, {
              headers: { Accept: 'application/json' },
            }).then(({ data }) =>
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
                  .sort(({ rankid: left }, { rankid: right }) =>
                    left > right ? 1 : left === right ? 0 : -1
                  )
                  .map(({ id }) => id)
              )
            );
          }}
          renderSearchBox={(inputProps): JSX.Element => (
            <Input
              forwardRef={searchBoxRef}
              className="tree-search"
              placeholder={treeText('searchTreePlaceholder')}
              title={treeText('searchTreePlaceholder')}
              aria-label={treeText('searchTreePlaceholder')}
              {...inputProps}
            />
          )}
        />
        <span className="flex-1 -ml-2" />
        <menu className="contents" tabIndex={-1}>
          {/* TODO: don't forget forwardRef when changing active toolbar */}
          <li className="contents">
            {focusPath.length === 0 ? (
              <Button.Simple disabled>{commonText('query')}</Button.Simple>
            ) : (
              <Link.LikeButton
                href={`/specify/query/fromtree/${tableName}/${
                  focusPath.slice(-1)[0]
                }`}
                target="_blank"
              >
                {commonText('query')}
              </Link.LikeButton>
            )}
          </li>
          <li className="contents">
            <Button.Simple disabled={focusPath.length === 0}>
              {userInfo.isReadOnly ? commonText('view') : commonText('edit')}
            </Button.Simple>
          </li>
          <li className="contents">
            <Button.Simple disabled={focusPath.length === 0}>
              {commonText('addChild')}
            </Button.Simple>
          </li>
          <li className="contents">
            <Button.Simple disabled={focusPath.length === 0}>
              {commonText('move')}
            </Button.Simple>
          </li>
          <li className="contents">
            <Button.Simple disabled={focusPath.length === 0}>
              {treeText('merge')}
            </Button.Simple>
          </li>
          <li className="contents">
            <Button.Simple
              disabled={focusPath.length === 0}
              forwardRef={toolbarButtonRef}
            >
              {treeText('synonymize')}
            </Button.Simple>
          </li>
        </menu>
      </header>
      <div
        className={`grid-table grid-cols-[repeat(var(--cols),auto)] flex-1
          overflow-auto bg-gray-200 shadow-md shadow-gray-500 content-start
          bg-gradient-to-bl from-[hsl(26deg_92%_62%_/_0)] rounded p-2 pt-0
          via-[hsl(26deg_92%_62%_/_20%)] to-[hsl(26deg_92%_62%_/_0)] outline-none`}
        style={{ '--cols': treeDefinitionItems.length } as React.CSSProperties}
        // First role is for screen readers. Second is for styling
        role="none table"
        tabIndex={0}
        // When tree viewer is focused, move focus to last focused node
        onFocus={(event): void => {
          // Don't handle bubbled events
          if (event.currentTarget !== event.target) return;
          event.preventDefault();
          // Unset and set focus to trigger a useEffect hook in <TreeNode>
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
                  sticky bg-gray-100/60 p-2 backdrop-blur-sm
                  ${index === 0 ? '-ml-2 pl-4 rounded-bl' : ''}
                  ${index + 1 === length ? 'pr-4 -mr-2 rounded-br' : ''}`}
              >
                <Button.LikeLink
                  id={id(rank.get<number>('rankId').toString())}
                  onClick={
                    typeof collapsedRanks === 'undefined'
                      ? undefined
                      : (): void =>
                          setCollapsedRanks(
                            collapsedRanks.includes(rank.get<number>('rankId'))
                              ? collapsedRanks.filter(
                                  (rankId) =>
                                    rankId !== rank.get<number>('rankId')
                                )
                              : [...collapsedRanks, rank.get<number>('rankId')]
                          )
                  }
                >
                  {pipe(
                    rank.get<string | null>('title') ??
                      rank.get<string>('name'),
                    collapsedRanks?.includes(rank.get<number>('rankId')) ??
                      false,
                    (name) => name[0]
                  )}
                </Button.LikeLink>
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
                  ...(typeof newConformation === 'undefined'
                    ? []
                    : ([[row.nodeId, ...newConformation]] as const)),
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
                else if (action === 'previous' && index !== 0)
                  setFocusPath([rows[index - 1].nodeId]);
                else if (action === 'previous' || action === 'parent')
                  setFocusPath([]);
                else if (action === 'focusPrevious')
                  toolbarButtonRef.current?.focus();
                else if (action === 'focusNext') searchBoxRef.current?.focus();
                return undefined;
              }}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

type KeyAction =
  | 'toggle'
  | 'next'
  | 'previous'
  | 'parent'
  | 'child'
  | 'focusPrevious'
  | 'focusNext';
const keyMapper = {
  ArrowUp: 'previous',
  ArrowDown: 'next',
  ArrowLeft: 'parent',
  ArrowRight: 'child',
  Enter: 'toggle',
  Tab: 'focus',
} as const;

function mapKey(
  event: React.KeyboardEvent<HTMLButtonElement>
): KeyAction | undefined {
  const action = keyMapper[event.key as keyof typeof keyMapper];
  if (typeof action === 'undefined') return undefined;

  event.preventDefault();
  event.stopPropagation();

  if (action === 'focus') return event.shiftKey ? 'focusPrevious' : 'focusNext';

  return action;
}

function TreeRow({
  row,
  getRows,
  getStats,
  nodeStats,
  path,
  ranks,
  rankNameId,
  collapsedRanks,
  conformation,
  onChangeConformation: handleChangeConformation,
  focusPath,
  onFocusNode: handleFocusNode,
  onAction: handleAction,
}: {
  readonly row: Row;
  readonly getRows: (parentId: number | 'null') => Promise<RA<Row>>;
  readonly getStats: (
    nodeId: number,
    rankId: number
  ) => Promise<Stats | undefined>;
  readonly nodeStats: Stats[number] | undefined;
  readonly path: RA<Row>;
  readonly ranks: RA<number>;
  readonly rankNameId: (suffix: string) => string;
  readonly collapsedRanks: RA<number>;
  readonly conformation: Conformations | undefined;
  readonly onChangeConformation: (
    conformation: Conformations | undefined
  ) => void;
  readonly focusPath: RA<number> | undefined;
  readonly onFocusNode: (newFocusedNode: RA<number>) => void;
  readonly onAction: (action: Exclude<KeyAction, 'toggle' | 'child'>) => void;
}): JSX.Element {
  const [rows, setRows] = React.useState<RA<Row> | undefined>(undefined);
  const [childStats, setChildStats] = React.useState<Stats | undefined>(
    undefined
  );
  const previousConformation = React.useRef<Conformations | undefined>(
    undefined
  );

  // Fetch children
  const isExpanded = typeof conformation !== 'undefined';
  const isLoading = isExpanded && typeof rows === 'undefined';
  const displayChildren = isExpanded && typeof rows?.[0] !== 'undefined';
  React.useEffect(() => {
    if (!isLoading) return undefined;

    void getRows(row.nodeId).then((rows) =>
      destructorCalled ? undefined : setRows(rows)
    );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [isLoading, getRows, row]);

  // Fetch children stats
  const isLoadingStats = displayChildren && typeof childStats === 'undefined';
  React.useEffect(() => {
    if (!isLoadingStats) return undefined;

    void getStats(row.nodeId, row.rankId).then((stats) =>
      destructorCalled || typeof stats === 'undefined'
        ? undefined
        : setChildStats(stats)
    );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [isLoadingStats, getStats, row]);

  // Unfold tree on search
  React.useEffect(() => {
    if (
      typeof conformation === 'undefined' &&
      typeof focusPath?.[0] !== 'undefined'
    )
      handleChangeConformation([[focusPath[0]]]);
  }, [conformation, focusPath, handleChangeConformation]);

  function handleToggle(): void {
    if (row.children === 0) return;
    if (typeof conformation === 'object') {
      previousConformation.current = conformation;
      handleChangeConformation(undefined);
      handleFocusNode([]);
    } else {
      if (typeof previousConformation.current === 'undefined')
        handleChangeConformation([]);
      else handleChangeConformation(previousConformation.current);
      handleFocusNode(
        // "0" is a placeholder for id of first child node
        typeof rows === 'object'
          ? rows.length === 0
            ? []
            : [rows[0].nodeId]
          : [0]
      );
    }
  }

  const isFocused = focusPath?.length === 0;
  const parentRankId = path.slice(-1)[0]?.rankId;
  const id = useId('tree-node');
  return (
    <li role="treeitem row">
      {ranks.map((rankId) => {
        if (row.rankId === rankId)
          return (
            <Button.LikeLink
              key={rankId}
              /*
               * Shift all node labels using margin and padding to align nicely
               * with borders of <span> cells
               */
              className={`border whitespace-nowrap border-transparent aria-handled
              -mb-[12px] -ml-[5px] mt-2 rounded
              ${isFocused ? 'outline outline-blue-500' : ''}
              ${typeof row.acceptedId === 'undefined' ? '' : 'text-red-500'}`}
              forwardRef={
                isFocused
                  ? (element: HTMLButtonElement | null): void => {
                      if (element === null) return;
                      element.focus();
                      scrollIntoView(element);
                    }
                  : undefined
              }
              aria-pressed={isLoading ? 'mixed' : displayChildren}
              title={
                typeof row.acceptedId === 'undefined'
                  ? undefined
                  : `${treeText('acceptedName')} ${
                      row.acceptedName ?? row.acceptedId
                    }`
              }
              aria-controls={id('children')}
              onKeyDown={(event): void => {
                const action = mapKey(event);
                if (typeof action === 'undefined') return undefined;
                else if (action === 'toggle') handleToggle();
                else if (action === 'child')
                  if (row.children === 0 || isLoading) return undefined;
                  else if (typeof rows?.[0] === 'undefined') handleToggle();
                  else handleFocusNode([rows[0].nodeId]);
                else handleAction(action);
                return undefined;
              }}
              onClick={handleToggle}
              aria-describedby={rankNameId(rankId.toString())}
            >
              <span
                className="-mr-2"
                aria-label={
                  isLoading
                    ? commonText('loading')
                    : row.children === 0
                    ? treeText('leafNode')
                    : displayChildren
                    ? treeText('opened')
                    : treeText('closed')
                }
              >
                {isLoading
                  ? icons.clock
                  : row.children === 0
                  ? icons.blank
                  : displayChildren
                  ? icons.chevronDown
                  : icons.chevronRight}
              </span>
              <span
                className={
                  collapsedRanks.includes(rankId) ? 'sr-only' : 'contents'
                }
              >
                {row.name}
                {typeof nodeStats === 'object' && (
                  <span
                    className="text-gray-500"
                    title={`${treeText('directCollectionObjectCount')}: ${
                      nodeStats.directCount
                    }\n${treeText('indirectCollectionObjectCount')}: ${
                      nodeStats.childCount
                    }`}
                    aria-label={`${treeText('directCollectionObjectCount')}: ${
                      nodeStats.directCount
                    }. ${treeText('indirectCollectionObjectCount')}: ${
                      nodeStats.childCount
                    }`}
                  >
                    {`(${formatNumber(nodeStats.directCount)}, ${formatNumber(
                      nodeStats.childCount
                    )})`}
                  </span>
                )}
              </span>
            </Button.LikeLink>
          );
        else {
          const indexOfAncestor = path.findIndex(
            (node) => node.rankId === rankId
          );
          const currentNode = path[indexOfAncestor + 1];
          return (
            <span
              key={rankId}
              aria-hidden="true"
              className={`border border-dotted border-transparent
              pointer-events-none whitespace-nowrap
              ${
                // Add left border for empty cell before tree node
                indexOfAncestor !== -1 &&
                !(typeof currentNode !== 'undefined' && currentNode.isLastChild)
                  ? 'border-l-gray-500'
                  : ''
              }
              ${
                // Add a line from parent till child
                parentRankId <= rankId && rankId < row.rankId
                  ? 'border-b-gray-500'
                  : ''
              }`}
            />
          );
        }
      })}
      {displayChildren ? (
        <ul role="group row" id={id('children')}>
          {rows.map((childRow, index) => (
            <TreeRow
              key={childRow.nodeId}
              row={childRow}
              getRows={getRows}
              getStats={getStats}
              nodeStats={childStats?.[childRow.nodeId]}
              path={[...path, row]}
              ranks={ranks}
              rankNameId={rankNameId}
              collapsedRanks={collapsedRanks}
              conformation={
                conformation
                  ?.find(([id]) => id === childRow.nodeId)
                  ?.slice(1) as Conformations
              }
              onChangeConformation={(newConformation): void =>
                handleChangeConformation([
                  ...conformation.filter(([id]) => id !== childRow.nodeId),
                  ...(typeof newConformation === 'undefined'
                    ? []
                    : ([[childRow.nodeId, ...newConformation]] as const)),
                ])
              }
              focusPath={
                (focusPath?.[0] === 0 && index === 0) ||
                focusPath?.[0] === childRow.nodeId
                  ? focusPath.slice(1)
                  : undefined
              }
              onFocusNode={(newFocusedNode): void =>
                handleFocusNode([childRow.nodeId, ...newFocusedNode])
              }
              onAction={(action): void => {
                if (action === 'next')
                  if (typeof rows[index + 1] === 'undefined') return undefined;
                  else handleFocusNode([rows[index + 1].nodeId]);
                else if (action === 'previous' && index !== 0)
                  handleFocusNode([rows[index - 1].nodeId]);
                else if (action === 'previous' || action === 'parent')
                  handleFocusNode([]);
                else handleAction(action);
                return undefined;
              }}
            />
          ))}
        </ul>
      ) : undefined}
    </li>
  );
}

export default createBackboneView(TreeView);
