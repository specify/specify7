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
import type { RA } from '../../utils/types';
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
  const [_focusedPath = [], setFocusPath] = useCachedState(
    'tree',
    `focusPath${tableName}`
  );
  const [focusPath1 = [], setFocusPath1] = React.useState<RA<number>>();
  const [focusPath2 = [], setFocusPath2] = React.useState<RA<number>>();

  const [focusedRow1, setFocusedRow1] = React.useState<Row | undefined>(
    undefined
  );
  const [focusedRow2, setFocusedRow2] = React.useState<Row | undefined>(
    undefined
  );

  const [lastFocusedTree, setLastFocusedTree] = React.useState<boolean>(true);

  const focusedRow = lastFocusedTree ? focusedRow1 : focusedRow2;

  const [actionRow, setActionRow] = React.useState<Row | undefined>(undefined);

  const searchBoxRef = React.useRef<HTMLInputElement | null>(null);
  const toolbarButtonRef = React.useRef<HTMLAnchorElement | null>(null);
  const [isEditingRanks, _, __, handleToggleEditingRanks] = useBooleanState();

  const [isSplit, setIsSplit] = React.useState(false);

  const treeContainer = (isFirst: boolean) =>
    rows === undefined ? null : (
      <Tree
        actionRow={actionRow}
        baseUrl={baseUrl}
        conformation={[conformation, setConformation]}
        focusPath={
          isFirst ? [focusPath1, setFocusPath1] : [focusPath2, setFocusPath2]
        }
        focusRef={toolbarButtonRef}
        getRows={getRows}
        isEditingRanks={isEditingRanks}
        ranks={rankIds}
        rows={rows}
        searchBoxRef={searchBoxRef}
        setFocusedRow={isFirst ? setFocusedRow1 : setFocusedRow2}
        setLastFocusedTree={() => setLastFocusedTree(isFirst)}
        tableName={tableName}
        treeDefinitionItems={treeDefinitionItems}
      />
    );

  return rows === undefined ? null : (
    <Container.Full>
      <header className="flex items-center gap-2 overflow-x-auto sm:flex-wrap sm:overflow-x-visible">
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
          {treeText.editRanks()}
        </Button.Small>
        <Button.Small
          disabled={conformation.length === 0}
          onClick={(): void => {
            setFocusPath([0]);
            setConformation([]);
          }}
        >
          {commonText.collapseAll()}
        </Button.Small>
        <Button.Small
          aria-pressed={isSplit}
          onClick={() => setIsSplit(!isSplit)}
        >
          {treeText.splitView()}
        </Button.Small>
        <span className="-ml-2 flex-1" />
        <ErrorBoundary dismissible>
          <TreeViewActions<SCHEMA>
            actionRow={actionRow}
            focusedRow={focusedRow}
            focusRef={toolbarButtonRef}
            ranks={rankIds}
            setFocusPath={setFocusPath}
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
        <div className="h-full w-full">
          <Splitter
            position="horizontal"
            primaryPaneHeight="400px"
            primaryPaneMaxHeight="80%"
            primaryPaneMinHeight={0}
          >
            {treeContainer(true)}
            {treeContainer(false)}
          </Splitter>
        </div>
      ) : (
        treeContainer(true)
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
