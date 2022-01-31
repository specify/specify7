import * as React from 'react';

import commonText from '../localization/common';
import treeText from '../localization/tree';
import type { Conformations, KeyAction, Row, Stats } from '../treeviewutils';
import { mapKey, scrollIntoView } from '../treeviewutils';
import type { RA } from '../types';
import { Button } from './basic';
import { useId } from './hooks';
import { icons } from './icons';
import { formatNumber } from './internationalization';

export function TreeRow({
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
  setFocusedRow,
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
  readonly setFocusedRow: (row: Row) => void;
}): JSX.Element {
  const [rows, setRows] = React.useState<RA<Row> | undefined>(undefined);
  const [childStats, setChildStats] = React.useState<Stats | undefined>(
    undefined
  );
  const previousConformation = React.useRef<Conformations | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (typeof focusPath !== 'undefined' && focusPath.length === 0)
      setFocusedRow(row);
  }, [setFocusedRow, focusPath, row]);

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

  function handleToggle(focusChild: boolean): void {
    if (row.children === 0) {
      handleFocusNode([]);
      // If children are later added, the node would expand because of this line
      handleChangeConformation([]);
    } else if (typeof conformation === 'object') {
      previousConformation.current = conformation;
      handleChangeConformation(undefined);
      handleFocusNode([]);
    } else {
      if (typeof previousConformation.current === 'undefined')
        handleChangeConformation([]);
      else handleChangeConformation(previousConformation.current);
      handleFocusNode(
        // "0" is a placeholder for id of first child node
        focusChild ? [rows?.[0].nodeId ?? 0] : []
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
              ${typeof row.acceptedId === 'undefined' ? '' : 'text-red-600'}`}
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
              aria-controls={id('children')}
              onKeyDown={(event): void => {
                const action = mapKey(event);
                if (typeof action === 'undefined') return undefined;
                else if (action === 'toggle') handleToggle(true);
                else if (action === 'child')
                  if (row.children === 0 || isLoading) return undefined;
                  else if (typeof rows?.[0] === 'undefined') handleToggle(true);
                  else handleFocusNode([rows[0].nodeId]);
                else handleAction(action);
                return undefined;
              }}
              onClick={(): void => handleToggle(false)}
              aria-describedby={rankNameId(rankId.toString())}
            >
              <span
                className="-mr-2"
                aria-label={
                  isFocused
                    ? isLoading
                      ? commonText('loading')
                      : row.children === 0
                      ? treeText('leafNode')
                      : displayChildren
                      ? treeText('opened')
                      : treeText('closed')
                    : undefined
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
                <span
                  title={
                    typeof row.acceptedId === 'undefined'
                      ? undefined
                      : `${treeText('acceptedName')} ${
                          row.acceptedName ?? row.acceptedId
                        }`
                  }
                  aria-label={
                    typeof row.acceptedId === 'undefined'
                      ? undefined
                      : `${treeText('acceptedName')} ${
                          row.acceptedName ?? row.acceptedId
                        }`
                  }
                >
                  {row.name}
                </span>
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
              setFocusedRow={setFocusedRow}
            />
          ))}
        </ul>
      ) : undefined}
    </li>
  );
}
