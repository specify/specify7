import Splitter from 'm-react-splitters';
import React from 'react';
import { useParams } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState, usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import type { GetOrSet, GetSet, RA } from '../../utils/types';
import { caseInsensitiveHash } from '../../utils/utils';
import { Container, H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import type {
  AnySchema,
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModel, schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { useMenuItem } from '../Header/useMenuItem';
import { getPref } from '../InitialContext/remotePrefs';
import { isTreeModel, treeRanksPromise } from '../InitialContext/treeRanks';
import { useTitle } from '../Molecules/AppTitle';
import { TableIcon } from '../Molecules/TableIcon';
import { ProtectedTree } from '../Permissions/PermissionDenied';
import { NotFoundView } from '../Router/NotFoundView';
import { formatUrl } from '../Router/queryString';
import { EditTreeDefinition } from '../Toolbar/TreeRepair';
import { TreeViewActions } from './Actions';
import type { Row } from './helpers';
import {
  deserializeConformation,
  fetchRows,
  serializeConformation,
} from './helpers';
import { TreeViewSearch } from './Search';
import { Tree } from './Tree';

const defaultConformation: RA<never> = [];

type TreeType = 'first' | 'second';

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

  const [urlConformation, setUrlConformation] =
    useSearchParameter('conformation');

  const [conformation = defaultConformation, setConformation] = useCachedState(
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

  useTitle(treeText.treeViewTitle({ treeName: table.label }));

  // Node sort order
  const sortField = getPref(`${tableName as 'Geography'}.treeview_sort_field`);

  const includeAuthor = getPref(`TaxonTreeEditor.DisplayAuthor`);

  const baseUrl = `/api/specify_tree/${tableName.toLowerCase()}/${
    treeDefinition.id
  }`;

  const getRows = React.useCallback(
    async (parentId: number | 'null') =>
      fetchRows(
        formatUrl(`${baseUrl}/${parentId}/${sortField}/`, {
          includeAuthor: includeAuthor.toString(),
        })
      ),
    [baseUrl, sortField]
  );

  const [rows, setRows] = useAsyncState<RA<Row>>(
    React.useCallback(async () => getRows('null'), [getRows]),
    true
  );

  // FEATURE: synchronize focus path with the URL
  const states = {
    first: useStates(tableName),
    second: useStates(tableName),
  };

  const [lastFocusedTree, setLastFocusedTree] =
    React.useState<TreeType>('first');
  const currentStates = states[lastFocusedTree];

  const [actionRow, setActionRow] = React.useState<Row | undefined>(undefined);

  const searchBoxRef = React.useRef<HTMLInputElement | null>(null);
  const toolbarButtonRef = React.useRef<HTMLAnchorElement | null>(null);
  const [isEditingRanks, _, __, handleToggleEditingRanks] = useBooleanState();

  const [isSplit = false, setIsSplit] = useCachedState('tree', 'isSplit');
  const [isHorizontal = true, setIsHorizontal] = useCachedState(
    'tree',
    'isHorizontal'
  );

  const treeContainer = (type: TreeType) =>
    rows === undefined ? null : (
      <Tree
        actionRow={actionRow}
        baseUrl={baseUrl}
        conformation={[conformation, setConformation]}
        focusPath={states[type].focusPath}
        focusRef={toolbarButtonRef}
        getRows={getRows}
        handleToggleEditingRanks={handleToggleEditingRanks}
        isEditingRanks={isEditingRanks}
        ranks={rankIds}
        rows={rows}
        searchBoxRef={searchBoxRef}
        setFocusedRow={states[type].focusedRow[1]}
        setLastFocusedTree={() => setLastFocusedTree(type)}
        tableName={tableName}
        treeDefinitionItems={treeDefinitionItems}
      />
    );

  // Used to force dimensions of panes to go back to default between orientations changes
  const [splitterKey, setSplitterKey] = React.useState(1);
  const resetDimensions = () => {
    setSplitterKey(splitterKey + 1);
  };

  return rows === undefined ? null : (
    <Container.Full>
      <header className="flex items-center gap-2 overflow-x-auto sm:flex-wrap sm:overflow-x-visible">
        <TableIcon label name={table.name} />
        <H2 title={treeDefinition.get('remarks') ?? undefined}>
          {treeDefinition.get('name')}
        </H2>
        <EditTreeDefinition treeDefinition={treeDefinition} />
        <Button.Icon
          disabled={conformation.length === 0}
          icon="chevronDoubleLeft"
          title={commonText.collapseAll()}
          onClick={(): void => {
            currentStates.focusPath[1]([0]);
            setConformation([]);
          }}
        />
        <TreeViewSearch<SCHEMA>
          forwardRef={searchBoxRef}
          tableName={tableName}
          treeDefinitionItems={treeDefinitionItems}
          onFocusPath={currentStates.focusPath[1]}
        />
        <Button.Icon
          aria-pressed={isSplit}
          icon="template"
          title={treeText.splitView()}
          onClick={() => setIsSplit(!isSplit)}
        />
        <Button.Icon
          disabled={!isSplit}
          icon={isHorizontal ? 'switchVertical' : 'switchHorizontal'}
          title={isHorizontal ? treeText.vertical() : treeText.horizontal()}
          onClick={() => {
            setIsHorizontal(!isHorizontal);
            if (!isHorizontal) resetDimensions();
          }}
        />
        <span className="-ml-2 flex-1" />
        <ErrorBoundary dismissible>
          <TreeViewActions<SCHEMA>
            actionRow={actionRow}
            focusedRow={currentStates.focusedRow[0]}
            focusPath={currentStates.focusPath}
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
      {isSplit ? (
        <div className="h-full w-full rounded overflow-auto">
          <Splitter
            className="flex flex-1 overflow-auto"
            key={splitterKey}
            position={isHorizontal ? 'horizontal' : 'vertical'}
            primaryPaneHeight="40%"
            primaryPaneMaxHeight="80%"
            primaryPaneMaxWidth="80%"
            primaryPaneMinHeight={1}
            primaryPaneMinWidth={1}
            primaryPaneWidth="50%"
          >
            {treeContainer('first')}
            {treeContainer('second')}
          </Splitter>
        </div>
      ) : (
        treeContainer('first')
      )}
    </Container.Full>
  );
}

export function TreeViewWrapper(): JSX.Element | null {
  useMenuItem('trees');
  const { tableName = '' } = useParams();
  const treeName = getModel(tableName)?.name;
  const [treeDefinitions] = usePromise(treeRanksPromise, true);
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
          treeDefinition={treeDefinition.definition}
          treeDefinitionItems={treeDefinition.ranks}
          tableName={treeName}
          /**
           * We're casting this as a generic Specify Resource because
           * Typescript complains that the get method for each member of the
           * union type of AnyTree is not compatible
           *
           */
          key={(treeDefinition.definition as SpecifyResource<AnySchema>).get(
            'resource_uri'
          )}
        />
      ) : null}
    </ProtectedTree>
  );
}

function useStates<SCHEMA extends AnyTree>(
  tableName: SCHEMA['tableName']
): {
  readonly focusedRow: GetOrSet<Row | undefined>;
  readonly focusPath: GetSet<RA<number>>;
} {
  const [cachedFocusedPath = [], setCachedFocusPath] = useCachedState(
    'tree',
    `focusPath${tableName}`
  );

  const [focusPath = [], setFocusPath] =
    React.useState<RA<number>>(cachedFocusedPath);

  const setFocusAndCachePath = React.useCallback(
    (newFocusPath: RA<number>) => {
      setFocusPath(newFocusPath);
      setCachedFocusPath(newFocusPath);
    },
    [setFocusPath, setCachedFocusPath]
  );

  return {
    focusedRow: React.useState<Row | undefined>(undefined),
    focusPath: [focusPath, setFocusAndCachePath],
  };
}
