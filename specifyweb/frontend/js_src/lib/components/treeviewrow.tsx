import React from 'react';

import { f } from '../functools';
import { commonText } from '../localization/common';
import { treeText } from '../localization/tree';
import { getUserPref } from '../preferencesutils';
import type { Conformations, KeyAction, Row, Stats } from '../treeviewutils';
import { formatTreeStats, mapKey, scrollIntoView } from '../treeviewutils';
import type { RA } from '../types';
import { Button } from './basic';
import { useId } from './hooks';
import { icons } from './icons';

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
  actionRow,
  onFocusNode: handleFocusNode,
  onAction: handleAction,
  setFocusedRow,
  synonymColor,
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
  readonly actionRow: Row | undefined;
  readonly onFocusNode: (newFocusedNode: RA<number>) => void;
  readonly onAction: (action: Exclude<KeyAction, 'toggle' | 'child'>) => void;
  readonly setFocusedRow: (row: Row) => void;
  readonly synonymColor: string;
}): JSX.Element {
  const [rows, setRows] = React.useState<RA<Row> | undefined>(undefined);
  const [childStats, setChildStats] = React.useState<Stats | undefined>(
    undefined
  );
  const previousConformation = React.useRef<Conformations | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (Array.isArray(focusPath) && focusPath.length === 0) setFocusedRow(row);
  }, [setFocusedRow, focusPath, row]);

  // Fetch children
  const isExpanded = Array.isArray(conformation);
  const isLoading = isExpanded && !Array.isArray(rows);
  const displayChildren = isExpanded && typeof rows?.[0] === 'object';
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
  const isLoadingStats = displayChildren && childStats === undefined;
  React.useEffect(() => {
    if (!isLoadingStats) return undefined;

    void getStats(row.nodeId, row.rankId).then((stats) =>
      destructorCalled || stats === undefined ? undefined : setChildStats(stats)
    );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [isLoadingStats, getStats, row]);

  // Unfold tree on search
  React.useEffect(() => {
    if (conformation === undefined && typeof focusPath?.[0] === 'number')
      handleChangeConformation([[focusPath[0]]]);
  }, [conformation, focusPath, handleChangeConformation]);

  function handleToggle(focusChild: boolean): void {
    if (row.children === 0) {
      handleFocusNode([]);
      // If children are later added, the node would expand because of this line
      handleChangeConformation([]);
    } else if (Array.isArray(conformation)) {
      previousConformation.current = conformation;
      handleChangeConformation(undefined);
      handleFocusNode([]);
    } else {
      if (typeof previousConformation.current === 'object')
        handleChangeConformation(previousConformation.current);
      else handleChangeConformation([]);
      handleFocusNode(
        // "0" is a placeholder for id of first child node
        focusChild ? [rows?.[0].nodeId ?? 0] : []
      );
    }
  }

  const isFocused = focusPath?.length === 0;
  const parentRankId = path.slice(-1)[0]?.rankId;
  const id = useId('tree-node');
  const isAction = actionRow === row;
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
              ${
                isAction
                  ? 'outline outline-1 outline-red-500'
                  : isFocused
                  ? 'outline outline-1 outline-blue-500'
                  : ''
              }`}
              style={{
                color:
                  typeof row.acceptedId === 'number' ? synonymColor : undefined,
              }}
              forwardRef={
                isFocused
                  ? (element: HTMLButtonElement | null): void => {
                      if (element === null) return;
                      element.focus();
                      if (getUserPref('treeEditor', 'behavior', 'autoScroll'))
                        scrollIntoView(element);
                    }
                  : undefined
              }
              aria-pressed={isLoading ? 'mixed' : displayChildren}
              aria-controls={id('children')}
              onKeyDown={(event): void => {
                const action = mapKey(event);
                if (action === undefined) return undefined;
                else if (action === 'toggle') handleToggle(true);
                else if (action === 'child')
                  if (row.children === 0 || isLoading) return undefined;
                  else if (typeof rows?.[0] === 'object')
                    handleFocusNode([rows[0].nodeId]);
                  else handleToggle(true);
                else handleAction(action);
                return undefined;
              }}
              onClick={({ metaKey, shiftKey }): void =>
                metaKey || shiftKey ? handleFocusNode([]) : handleToggle(false)
              }
              aria-describedby={rankNameId(rankId.toString())}
            >
              <span className="-mr-2">
                <span className="sr-only">
                  {isFocused
                    ? isLoading
                      ? commonText('loading')
                      : row.children === 0
                      ? treeText('leafNode')
                      : displayChildren
                      ? treeText('opened')
                      : treeText('closed')
                    : undefined}
                </span>
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
                    typeof row.acceptedId === 'number'
                      ? `${treeText('acceptedName')} ${
                          row.acceptedName ?? row.acceptedId
                        }`
                      : undefined
                  }
                >
                  {row.name}
                  {typeof row.acceptedId === 'number' && (
                    <span className="sr-only">
                      <br />
                      {`${treeText('acceptedName')} ${
                        row.acceptedName ?? row.acceptedId
                      }`}
                    </span>
                  )}
                </span>
                {typeof nodeStats === 'object' &&
                  f.var(
                    formatTreeStats(nodeStats, row.children === 0),
                    ({ title, text }) => (
                      <span className="text-gray-500" title={title}>
                        {text}
                      </span>
                    )
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
                  !(typeof currentNode === 'object' && currentNode.isLastChild)
                    ? 'border-l-gray-500'
                    : ''
                }
                ${
                  // Add a line from parent till child
                  parentRankId <= rankId && rankId < row.rankId
                    ? 'border-b-gray-500'
                    : ''
                }
              `}
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
                  ...(typeof newConformation === 'object'
                    ? ([[childRow.nodeId, ...newConformation]] as const)
                    : []),
                ])
              }
              actionRow={actionRow}
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
                  if (typeof rows[index + 1] === 'object')
                    handleFocusNode([rows[index + 1].nodeId]);
                  else return undefined;
                else if (action === 'previous' && index > 0)
                  handleFocusNode([rows[index - 1].nodeId]);
                else if (action === 'previous' || action === 'parent')
                  handleFocusNode([]);
                else handleAction(action);
                return undefined;
              }}
              setFocusedRow={setFocusedRow}
              synonymColor={synonymColor}
            />
          ))}
        </ul>
      ) : undefined}
    </li>
  );
}
