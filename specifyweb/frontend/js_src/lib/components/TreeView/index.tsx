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
import { listen } from '../../utils/events';
import type { GetSet, RA } from '../../utils/types';
import { caseInsensitiveHash } from '../../utils/utils';
import { Container, H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import type {
  AnySchema,
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables, getTable } from '../DataModel/tables';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { useMenuItem } from '../Header/MenuContext';
import { getPref } from '../InitialContext/remotePrefs';
import { isTreeTable, treeRanksPromise } from '../InitialContext/treeRanks';
import { useTitle } from '../Molecules/AppTitle';
import { ResourceEdit } from '../Molecules/ResourceLink';
import { TableIcon } from '../Molecules/TableIcon';
import { ProtectedTree } from '../Permissions/PermissionDenied';
import { NotFoundView } from '../Router/NotFoundView';
import { formatUrl } from '../Router/queryString';
import { TreeViewActions } from './Actions';
import type { Row } from './helpers';
import {
  deserializeConformation,
  fetchRows,
  serializeConformation,
} from './helpers';
import { TreeViewSearch } from './Search';
import { Tree } from './Tree';

export function TreeViewWrapper(): JSX.Element | null {
  useMenuItem('trees');
  const { tableName = '' } = useParams();
  const treeName = getTable(tableName)?.name;
  const [treeDefinitions] = usePromise(treeRanksPromise, true);
  useErrorContext('treeDefinitions', treeDefinitions);

  const treeDefinition =
    typeof treeDefinitions === 'object' &&
    typeof treeName === 'string' &&
    isTreeTable(treeName)
      ? caseInsensitiveHash(treeDefinitions, treeName)
      : undefined;

  if (treeName === undefined || !isTreeTable(treeName)) return <NotFoundView />;
  return (
    <ProtectedTree action="read" treeName={treeName}>
      {typeof treeDefinition === 'object' ? (
        <TreeView
          tableName={treeName}
          treeDefinition={treeDefinition.definition}
          treeDefinitionItems={treeDefinition.ranks}
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

const defaultConformation: RA<never> = [];
const SMALL_SCREEN_WIDTH = 640;

type TreeType = 'first' | 'second';

// REFACTOR: extract logic into smaller hooks
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
  const table = genericTables[tableName] as SpecifyTable<AnyTree>;

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

  const [lastFocusedRow, setLastFocusedRow] = React.useState<Row | undefined>(
    undefined
  );

  const currentStates = states[lastFocusedTree];

  const [actionRow, setActionRow] = React.useState<Row | undefined>(undefined);

  const searchBoxRef = React.useRef<HTMLInputElement | null>(null);
  const toolbarButtonRef = React.useRef<HTMLAnchorElement | null>(null);
  const [isEditingRanks, _, __, handleToggleEditingRanks] = useBooleanState();

  const [rawIsSplit = false, setRawIsSplit] = useCachedState('tree', 'isSplit');
  const [canSplit, setCanSplit] = React.useState(
    window.innerWidth >= SMALL_SCREEN_WIDTH
  );
  const isSplit = rawIsSplit && canSplit;
  const [isHorizontal = true, setIsHorizontal] = useCachedState(
    'tree',
    'isHorizontal'
  );

  const [hideEmptyNodes = false, setHideEmptyNodes] = useCachedState(
    'tree',
    'hideEmptyNodes'
  );
  React.useEffect(() => {
    const handleResize = () => {
      window.innerWidth < SMALL_SCREEN_WIDTH
        ? setCanSplit(false)
        : setCanSplit(true);
    };

    handleResize();

    return listen(window, 'resize', handleResize);
  }, []);

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
        hideEmptyNodes={hideEmptyNodes}
        isEditingRanks={isEditingRanks}
        ranks={rankIds}
        rows={rows}
        searchBoxRef={searchBoxRef}
        setFocusedRow={type === lastFocusedTree ? setLastFocusedRow : undefined}
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
        <ResourceEdit
          resource={treeDefinition}
          onSaved={(): void => globalThis.location.reload()}
        />
        <Button.Icon
          disabled={conformation.length === 0 || isSplit}
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
          disabled={!canSplit}
          icon="template"
          title={treeText.splitView()}
          onClick={() => setRawIsSplit(!rawIsSplit)}
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
        <Button.Icon
          disabled={!isSplit}
          icon="synchronize"
          title={treeText.synchronize()}
          onClick={() => {
            lastFocusedTree === 'first'
              ? states.second.focusPath[1](states[lastFocusedTree].focusPath[0])
              : states.first.focusPath[1](states[lastFocusedTree].focusPath[0]);
          }}
        />
        <span className="-ml-2 flex-1" />
        <ErrorBoundary dismissible>
          <TreeViewActions<SCHEMA>
            actionRow={actionRow}
            focusedRow={lastFocusedRow}
            focusPath={currentStates.focusPath}
            focusRef={toolbarButtonRef}
            ranks={rankIds}
            tableName={tableName}
            onChange={setActionRow}
            onRefresh={(): void => {
              // Force re-load
              setRows(undefined);
              globalThis.setTimeout(() => {
                setLastFocusedRow(undefined);
                setRows(rows);
              }, 0);
            }}
          />
        </ErrorBoundary>
      </header>
      {isSplit ? (
        <div className="h-full w-full overflow-auto rounded">
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
      <Label.Inline>
        <Input.Checkbox
          checked={hideEmptyNodes}
          onValueChange={setHideEmptyNodes}
        />
        {treeText.associatedNodesOnly()}
      </Label.Inline>
    </Container.Full>
  );
}

function useStates<SCHEMA extends AnyTree>(
  tableName: SCHEMA['tableName']
): {
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
    focusPath: [focusPath, setFocusAndCachePath],
  };
}
