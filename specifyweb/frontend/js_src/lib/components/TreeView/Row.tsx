import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { hijackBackboneAjax } from '../../utils/ajax/backboneAjax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import type { AnySchema, AnyTree } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables } from '../DataModel/tables';
import { getPref } from '../InitialContext/remotePrefs';
import { userPreferences } from '../Preferences/userPreferences';
import { unsafeTriggerNotFound } from '../Router/Router';
import type { Conformations, KeyAction, Row, Stats } from './helpers';
import { formatTreeStats, mapKey, scrollIntoView } from './helpers';

export function TreeRow<SCHEMA extends AnyTree>({
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
  treeName,
  hideEmptyNodes,
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
  readonly onAction: (action: Exclude<KeyAction, 'child' | 'toggle'>) => void;
  readonly setFocusedRow?: (row: Row) => void;
  readonly synonymColor: string;
  readonly treeName: SCHEMA['tableName'];
  readonly hideEmptyNodes: boolean;
}): JSX.Element | null {
  const [rows, setRows] = React.useState<RA<Row> | undefined>(undefined);
  const [childStats, setChildStats] = React.useState<Stats | undefined>(
    undefined
  );
  const previousConformation = React.useRef<Conformations | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (Array.isArray(focusPath) && focusPath.length === 0)
      setFocusedRow?.(row);
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
  const parentRankId = path.at(-1)?.rankId;
  const id = useId('tree-node');
  const isAction = actionRow === row;

  const doIncludeAuthorPref = getPref(`TaxonTreeEditor.DisplayAuthor`);

  const handleRef = React.useCallback(
    (element: HTMLButtonElement | null): void => {
      if (element === null) return;
      element.focus();
      if (userPreferences.get('treeEditor', 'behavior', 'autoScroll'))
        scrollIntoView(element);
    },
    []
  );

  const hasNoChildrenNodes =
    nodeStats?.directCount === 0 && nodeStats.childCount === 0;

  const [resource] = useLiveState<SpecifyResource<AnySchema> | undefined>(
    React.useCallback(() => {
      const table = genericTables[treeName] as SpecifyTable<AnyTree>;
      return new table.Resource({ id: row.nodeId });
    }, [row.nodeId, treeName])
  );

  const [loadedResource] = useAsyncState(
    React.useCallback(async () => {
      if (resource === undefined) return;
      return hijackBackboneAjax(
        [Http.NOT_FOUND],
        async () => resource.fetch(),
        (status) =>
          status === Http.NOT_FOUND ? unsafeTriggerNotFound() : undefined
      );
    }, [resource]),
    false
  );

  const acceptedChildren = loadedResource?.get('acceptedChildren') || '';

  const fetchedChildren = async (): Promise<any> => {
    if (acceptedChildren.length === 0) {
      return;
    }

    return ajax(acceptedChildren, {
      headers: { Accept: 'application/json' },
      expectedErrors: [Http.NOT_FOUND],
    });
  };

  const [fetchedChildrenName, setFetchedChildrenName] =
    React.useState<RA<string>>();

  React.useEffect(() => {
    fetchedChildren().then(({ data: objects }) => {
      const synonymsNames = objects.objects.map((node: Row) => node.name);
      setFetchedChildrenName(synonymsNames);
    });
  }, [acceptedChildren]);

  return hideEmptyNodes && hasNoChildrenNodes ? null : (
    <li role="treeitem row">
      {ranks.map((rankId) => {
        if (row.rankId === rankId) {
          const stats =
            typeof nodeStats === 'object' &&
            formatTreeStats(nodeStats, row.children === 0);
          return (
            <Button.LikeLink
              aria-controls={displayChildren ? id('children') : undefined}
              /*
               * Shift all node labels using margin and padding to align nicely
               * with borders of <span> cells
               */
              aria-describedby={rankNameId(rankId.toString())}
              aria-pressed={isLoading ? 'mixed' : displayChildren}
              className={`
                -mb-[12px] -ml-[5px] mt-2
                whitespace-nowrap rounded border border-transparent
                ${className.ariaHandled}
                ${
                  isAction
                    ? 'outline outline-1 outline-red-500'
                    : isFocused
                    ? 'outline outline-1 outline-blue-500'
                    : ''
                }
                ${hideEmptyNodes && isLoadingStats ? 'opacity-50' : ''}
              `}
              forwardRef={isFocused ? handleRef : undefined}
              key={rankId}
              style={{
                color:
                  typeof row.acceptedId === 'number' ? synonymColor : undefined,
              }}
              onClick={({ metaKey, shiftKey }): void =>
                metaKey || shiftKey ? handleFocusNode([]) : handleToggle(false)
              }
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
            >
              <span className="-mr-2">
                <span className="sr-only">
                  {isFocused
                    ? isLoading
                      ? commonText.loading()
                      : row.children === 0
                      ? treeText.leafNode()
                      : displayChildren
                      ? treeText.opened()
                      : treeText.closed()
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
                      ? treeText.acceptedName({
                          name: row.acceptedName ?? row.acceptedId.toString(),
                        })
                      : fetchedChildrenName === undefined
                      ? undefined
                      : treeText.synonyms({
                          names: fetchedChildrenName.join(', '),
                        })
                  }
                >
                  {doIncludeAuthorPref &&
                  treeName === 'Taxon' &&
                  typeof row.author === 'string'
                    ? `${row.name} ${row.author}`
                    : row.name}
                  {typeof row.acceptedId === 'number' && (
                    <span className="sr-only">
                      <br />
                      {treeText.acceptedName({
                        name: row.acceptedName ?? row.acceptedId.toString(),
                      })}
                    </span>
                  )}
                </span>
                {typeof stats === 'object' && (
                  <span className="text-gray-500" title={stats.title}>
                    {stats.text}
                  </span>
                )}
              </span>
            </Button.LikeLink>
          );
        } else {
          const indexOfAncestor = path.findIndex(
            (node) => node.rankId === rankId
          );
          const currentNode = path[indexOfAncestor + 1];
          return (
            <span
              aria-hidden="true"
              className={`
                pointer-events-none whitespace-nowrap border
                border-dotted border-transparent
                ${
                  // Add left border for empty cell before tree node
                  indexOfAncestor !== -1 &&
                  !(typeof currentNode === 'object' && currentNode.isLastChild)
                    ? 'border-l-gray-500'
                    : ''
                }
                ${
                  // Add a line from parent till child
                  typeof parentRankId === 'number' &&
                  parentRankId <= rankId &&
                  rankId < row.rankId
                    ? 'border-b-gray-500'
                    : ''
                }
              `}
              key={rankId}
            />
          );
        }
      })}
      {displayChildren ? (
        <ul id={id('children')} role="group row">
          {rows.map((childRow, index) => (
            <TreeRow
              actionRow={actionRow}
              collapsedRanks={collapsedRanks}
              conformation={
                conformation
                  ?.find(([id]) => id === childRow.nodeId)
                  ?.slice(1) as Conformations
              }
              focusPath={
                (focusPath?.[0] === 0 && index === 0) ||
                focusPath?.[0] === childRow.nodeId
                  ? focusPath.slice(1)
                  : undefined
              }
              getRows={getRows}
              getStats={getStats}
              hideEmptyNodes={hideEmptyNodes}
              key={childRow.nodeId}
              nodeStats={childStats?.[childRow.nodeId]}
              path={[...path, row]}
              rankNameId={rankNameId}
              ranks={ranks}
              row={childRow}
              setFocusedRow={setFocusedRow}
              synonymColor={synonymColor}
              treeName={treeName}
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
              onChangeConformation={(newConformation): void =>
                handleChangeConformation([
                  ...conformation.filter(([id]) => id !== childRow.nodeId),
                  ...(typeof newConformation === 'object'
                    ? ([[childRow.nodeId, ...newConformation]] as const)
                    : []),
                ])
              }
              onFocusNode={(newFocusedNode): void =>
                handleFocusNode([childRow.nodeId, ...newFocusedNode])
              }
            />
          ))}
        </ul>
      ) : undefined}
    </li>
  );
}
