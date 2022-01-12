import * as React from 'react';

import type { SpecifyResource } from '../legacytypes';
import treeText from '../localization/tree';
import { getIntPref, getPref } from '../remoteprefs';
import { getModel } from '../schema';
import type { RA, RR } from '../types';
import { defined } from '../types';
import { Autocomplete } from './autocomplete';
import { Button, className } from './basic';
import createBackboneView from './reactbackboneextend';
import commonText from '../localization/common';
import { useId, useTitle } from './hooks';
import ajax from '../ajax';
import { LoadingScreen } from './modaldialog';
import icons from './icons';
import { formatNumber } from './internationalization';
import { capitalize } from '../wbplanviewhelper';
import { useCachedState } from './stateCache';

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
 * TODO: "conformation" stuff
 * TODO: hide root rank if it is the only one
 */

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

  return typeof rows === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <section className={className.containerFull}>
      <header className="flex flex-wrap items-center gap-2">
        <h2>{table.getLocalizedName()}</h2>
        <Autocomplete
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
          onChange={(_value, { data }) => {
            // TODO: listen to "onChange"
            console.log(data);
          }}
          inputProps={{
            className: 'tree-search',
            placeholder: treeText('searchTreePlaceholder'),
            title: treeText('searchTreePlaceholder'),
            'aria-label': treeText('searchTreePlaceholder'),
          }}
        />
        <span className="flex-1 -ml-2" />
        <menu className="contents">
          <li className="contents">
            <Button.Simple disabled>{commonText('query')}</Button.Simple>
          </li>
          <li className="contents">
            <Button.Simple disabled>{commonText('edit')}</Button.Simple>
          </li>
          <li className="contents">
            <Button.Simple disabled>{commonText('addChild')}</Button.Simple>
          </li>
          <li className="contents">
            <Button.Simple disabled>{commonText('move')}</Button.Simple>
          </li>
          <li className="contents">
            <Button.Simple disabled>{treeText('merge')}</Button.Simple>
          </li>
          <li className="contents">
            <Button.Simple disabled>{treeText('synonymize')}</Button.Simple>
          </li>
        </menu>
      </header>
      <div
        className={`grid-table grid-cols-[repeat(var(--cols),auto)] flex-1
          overflow-auto bg-gray-200 shadow-md shadow-gray-500 content-start
          bg-gradient-to-bl from-[hsl(26deg_92%_62%_/_0)] rounded p-2 pt-0
          via-[hsl(26deg_92%_62%_/_20%)] to-[hsl(26deg_92%_62%_/_0)]`}
        style={{ '--cols': treeDefinitionItems.length } as React.CSSProperties}
        // First role is for screen readers. Second is for styling
        role="none table"
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
          {rows.map((row) => (
            <TreeRow
              key={row.nodeId}
              row={row}
              getRows={getRows}
              getStats={getStats}
              nodeStats={undefined}
              path={[]}
              ranks={rankIds}
              expanded={false}
              rankNameId={id}
              collapsedRanks={collapsedRanks ?? []}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function TreeRow({
  row,
  getRows,
  getStats,
  nodeStats,
  path,
  ranks,
  expanded,
  rankNameId,
  collapsedRanks,
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
  readonly expanded: boolean;
  readonly rankNameId: (suffix: string) => string;
  readonly collapsedRanks: RA<number>;
}): JSX.Element {
  const [rows, setRows] = React.useState<RA<Row> | undefined>(undefined);
  const [isExpanded, setIsExpanded] = React.useState(expanded);
  const [childStats, setChildStats] = React.useState<Stats | undefined>(
    undefined
  );

  const isLoading = isExpanded && typeof rows === 'undefined';
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

  const isLoadingStats = isExpanded && typeof childStats === 'undefined';
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
              -mb-[12px] -ml-[5px] mt-2
              ${typeof row.acceptedId === 'undefined' ? '' : 'text-red-500'}`}
              aria-pressed={isLoading ? 'mixed' : isExpanded}
              title={
                typeof row.acceptedId === 'undefined'
                  ? undefined
                  : `${treeText('acceptedName')} ${
                      row.acceptedName ?? row.acceptedId
                    }`
              }
              aria-controls={id('children')}
              onClick={(): void => setIsExpanded((state) => !state)}
              aria-describedby={rankNameId(rankId.toString())}
            >
              <span
                className="-mr-2"
                aria-label={
                  isLoading
                    ? commonText('loading')
                    : row.children === 0
                    ? treeText('leafNode')
                    : isExpanded
                    ? treeText('opened')
                    : treeText('closed')
                }
              >
                {isLoading
                  ? icons.clock
                  : row.children === 0
                  ? icons.blank
                  : isExpanded
                  ? icons.chevronDown
                  : icons.chevronRight}
              </span>
              <span
                className={collapsedRanks.includes(rankId) ? 'sr-only' : ''}
              >
                {row.name}
                {typeof nodeStats === 'object' && (
                  <span
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
      {isExpanded && typeof rows !== 'undefined' ? (
        <ul role="group row" id={id('children')}>
          {rows.map((childRow) => (
            <TreeRow
              key={childRow.nodeId}
              row={childRow}
              getRows={getRows}
              getStats={getStats}
              nodeStats={childStats?.[childRow.nodeId]}
              path={[...path, row]}
              ranks={ranks}
              expanded={false}
              rankNameId={rankNameId}
              collapsedRanks={collapsedRanks}
            />
          ))}
        </ul>
      ) : undefined}
    </li>
  );
}

export default createBackboneView(TreeView);
