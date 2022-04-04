import React from 'react';

import { ajax } from '../ajax';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../datamodelutils';
import { caseInsensitiveHash, sortObjectsByKey, toggleItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import treeText from '../localization/tree';
import * as navigation from '../navigation';
import { NotFoundView } from '../notfoundview';
import { hasTreeAccess } from '../permissions';
import * as querystring from '../querystring';
import { getIntPref, getPref } from '../remoteprefs';
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
import { Button, Container, H2, Input } from './basic';
import { TableIcon } from './common';
import { useAsyncState, useId, useTitle } from './hooks';
import { PermissionDenied } from './permissiondenied';
import createBackboneView from './reactbackboneextend';
import { useCachedState } from './stateCache';
import { TreeViewActions } from './treeviewactions';
import { TreeRow } from './treeviewrow';

const defaultCacheValue = [] as const;

function TreeView<SCHEMA extends AnyTree>({
  tableName,
  treeDefinitionId,
  treeDefinitionItems,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly treeDefinitionId: number;
  readonly treeDefinitionItems: RA<
    SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>
  >;
}): JSX.Element | null {
  const table = schema.models[tableName] as SpecifyModel<AnyTree>;
  const rankIds = treeDefinitionItems.map(({ rankId }) => rankId);
  const [collapsedRanks, setCollapsedRanks] = useCachedState({
    bucketName: 'tree',
    cacheName: `collapsedRanks${tableName}`,
    bucketType: 'localStorage',
    defaultValue: defaultCacheValue,
    staleWhileRefresh: false,
  });

  const [rawConformation, setConformation] = useCachedState({
    bucketName: 'tree',
    cacheName: `conformation${tableName}`,
    bucketType: 'localStorage',
    defaultValue: undefined,
    staleWhileRefresh: false,
  });
  const conformation = deserializeConformation(rawConformation);

  function updateConformation(value: Conformations | undefined): void {
    if (typeof value === 'object') {
      const encoded = serializeConformation(value);
      navigation.push(
        querystring.format(window.location.href, { conformation: encoded })
      );
      setConformation(encoded);
    } else setConformation('');
  }

  React.useEffect(() => {
    const { conformation } = querystring.parse();
    if (typeof conformation === 'string' && conformation.length > 0)
      updateConformation(deserializeConformation(conformation));
  }, []);

  useTitle(treeText('treeViewTitle')(table.label));

  // Node sort order
  const sortOrderFieldName = `${tableName}.treeview_sort_field`;
  const sortField = getPref(sortOrderFieldName, 'name');
  const baseUrl = `/api/specify_tree/${tableName.toLowerCase()}/${treeDefinitionId}`;
  const getRows = React.useCallback(
    async (parentId: number | 'null') =>
      fetchRows(`${baseUrl}/${parentId}/${sortField}`),
    [baseUrl, sortField]
  );

  const statsThreshold = getIntPref(`TreeEditor.Rank.Threshold.${tableName}`);
  const getStats = React.useCallback(
    async (nodeId: number | 'null', rankId: number): Promise<Stats> =>
      typeof statsThreshold === 'undefined' || statsThreshold > rankId
        ? Promise.resolve({})
        : fetchStats(`${baseUrl}/${nodeId}/stats/`),
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
  const toolbarButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const [searchValue, setSearchValue] = React.useState<string>('');

  return typeof rows === 'undefined' ? null : (
    <Container.Full>
      <header className="flex flex-wrap items-center gap-2">
        <TableIcon name={table.name} />
        <H2>{table.label}</H2>
        {/* A react component that is also a TypeScript generic */}
        <Autocomplete<SpecifyResource<SCHEMA>>
          value={searchValue}
          source={async (value) => {
            const collection = new table.LazyCollection({
              filters: { name__istartswith: value, orderby: 'name' },
              domainfilter: true,
            });
            return collection.fetchPromise().then(({ models }) =>
              models.map((node) => {
                const rankDefinition = treeDefinitionItems.find(
                  ({ rankId }) => rankId === node.get('rankId')
                );
                const rankName = rankDefinition?.title ?? rankDefinition?.name;
                return {
                  label: node.get('fullName'),
                  searchValue: node.get('name'),
                  subLabel: rankName,
                  data: node as SpecifyResource<SCHEMA>,
                };
              })
            );
          }}
          onChange={({ label, data }): void => {
            setSearchValue(label);
            ajax<IR<{ readonly rankid: number; readonly id: number } | string>>(
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
                  sticky bg-gray-100/60 dark:bg-neutral-900/60 p-2
                  backdrop-blur-sm ${index === 0 ? '-ml-2 pl-4 rounded-bl' : ''}
                  ${index + 1 === length ? 'pr-4 -mr-2 rounded-br' : ''}`}
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
                    rank.title ?? rank.name,
                    collapsedRanks?.includes(rank.rankId) ?? false,
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
            />
          ))}
        </ul>
      </div>
    </Container.Full>
  );
}

function TreeViewWrapper({
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
        treeDefinitionId={treeDefinition.definition.id}
        treeDefinitionItems={treeDefinition.ranks}
      />
    ) : null;
}

export default createBackboneView(TreeViewWrapper);
