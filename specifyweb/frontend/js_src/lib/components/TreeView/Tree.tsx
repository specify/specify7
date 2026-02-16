import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { setupToolText } from '../../localization/setupTool';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import type { GetSet, RA } from '../../utils/types';
import { toggleItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { idFromUrl } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import { softError } from '../Errors/assert';
import { ResourceView } from '../Forms/ResourceView';
import { hasTablePermission } from '../Permissions/helpers';
import { useHighContrast } from '../Preferences/Hooks';
import { userPreferences } from '../Preferences/userPreferences';
import { AddRank } from './AddRank';
import type { TreeCreationProgressInfo } from './CreateTree';
import { ImportTree } from './CreateTree';
import type { Conformations, Row, Stats } from './helpers';
import { fetchStats } from './helpers';
import { TreeRow } from './Row';

const treeToPref = {
  Geography: 'geography',
  Taxon: 'taxon',
  Storage: 'storage',
  GeologicTimePeriod: 'geologicTimePeriod',
  LithoStrat: 'lithoStrat',
  TectonicUnit: 'tectonicUnit',
} as const;

const busyStates = new Set(['RUNNING', 'STARTED']);

export function Tree<
  SCHEMA extends AnyTree,
  TREE_NAME extends SCHEMA['tableName'],
>({
  treeDefinitionItems,
  tableName,
  isEditingRanks,
  hideEmptyNodes,
  focusPath: [focusPath, setFocusPath],
  rows,
  actionRow,
  conformation: [conformation, setConformation],
  getRows,
  ranks,
  setFocusedRow,
  focusRef,
  searchBoxRef,
  baseUrl,
  setLastFocusedTree,
  onToggleEditingRanks: handleToggleEditingRanks,
}: {
  readonly treeDefinitionItems: RA<
    SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>
  >;
  readonly tableName: TREE_NAME;
  readonly isEditingRanks: boolean;
  readonly hideEmptyNodes: boolean;
  readonly focusPath: GetSet<RA<number>>;
  readonly rows: RA<Row>;
  readonly actionRow: Row | undefined;
  readonly conformation: GetSet<Conformations | undefined>;
  readonly getRows: (parentId: number | 'null') => Promise<RA<Row>>;
  readonly ranks: RA<number>;
  readonly setFocusedRow?: (row: Row) => void;
  readonly focusRef: React.MutableRefObject<HTMLAnchorElement | null>;
  readonly searchBoxRef: React.RefObject<HTMLInputElement | null>;
  readonly baseUrl: string;
  readonly setLastFocusedTree: () => void;
  readonly onToggleEditingRanks: () => void;
}): JSX.Element {
  const highContrast = useHighContrast();

  const [treeAccentColor] = userPreferences.use(
    'treeEditor',
    treeToPref[tableName],
    'treeAccentColor'
  );

  const id = useId('tree-view');

  const [collapsedRanks, setCollapsedRanks] = useCachedState(
    'tree',
    `collapsedRanks${tableName}`
  );

  const [synonymColor] = userPreferences.use(
    'treeEditor',
    treeToPref[tableName],
    'synonymColor'
  );

  const [statsThreshold] = userPreferences.use(
    'treeEditor',
    treeToPref[tableName],
    'rankThreshold'
  );

  const getStats = React.useCallback(
    async (nodeId: number | 'null', rankId: number): Promise<Stats> =>
      rankId >= statsThreshold
        ? fetchStats(`${baseUrl}/${nodeId}/stats/`)
        : Promise.resolve({}),
    [baseUrl, statsThreshold]
  );

  const treeDefinition = treeDefinitionItems[0].treeDef;
  const treeDefId = idFromUrl(treeDefinition);
  const createRootNode = async (): Promise<void> => {
    if (treeDefId === undefined) {
      softError('treeDefId is undefined');
    } else {
      await ping(
        `/trees/specify_tree/${tableName.toLowerCase()}/${treeDefId}/add_root/`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
        }
      )
        .then(() => {
          globalThis.location.reload();
        })
        .catch((error) => {
          softError('Error creating root node:', error);
        });
    }
  };

  // Add a cookie or local storage (browser storage), if not busy than never call this again
  const [treeCreationProgress, setTreeCreationProgress] = React.useState<
    TreeCreationProgressInfo | undefined
  >(undefined);
  const treeCreationProgressRef = React.useRef(treeCreationProgress);
  React.useEffect(() => {
    treeCreationProgressRef.current = treeCreationProgress;
  }, [treeCreationProgress]);

  const fetchTreeProgress = (stop: () => void) => {
    ajax<TreeCreationProgressInfo>(
      `/trees/create_default_tree/status/create_default_tree_${tableName.toLowerCase()}_${treeDefId}/`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        errorMode: 'silent',
      }
    )
      .then(({ data }) => {
        const oldTreeCreationProgress = treeCreationProgressRef.current;
        if (
          oldTreeCreationProgress &&
          oldTreeCreationProgress.active &&
          !data.active
        ) {
          // Tree was in progress, and it just finished
          stop();
          globalThis.location.reload();
          return;
        } else if (
          oldTreeCreationProgress === undefined &&
          !data.active
        ) {
          // Tree was already complete
          stop();
        }
        setTreeCreationProgress(data);
      })
      .catch((error) => {
        console.error('Failed to fetch setup progress:', error);
      });
  };

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    fetchTreeProgress(stopInterval);

    intervalId = setInterval(() => {
      fetchTreeProgress(stopInterval);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={`
        grid-table h-full flex-1 grid-cols-[repeat(var(--cols),auto)] 
        content-start overflow-auto rounded border border-2
        border-[var(--edge-color)] from-[var(--edge-color)] via-[var(--middle-color)] to-[var(--edge-color)]
        p-1 pt-0 outline-none
        ${highContrast ? 'border dark:border-white' : 'bg-gradient-to-bl'}
      `}
      role="none table"
      style={
        {
          '--cols': treeDefinitionItems.length,
          '--middle-color': `${treeAccentColor}33`,
          '--edge-color': `${treeAccentColor}00`,
        } as React.CSSProperties
      }
      tabIndex={0}
      onFocus={(event): void => {
        if (event.currentTarget !== event.target) return;
        if (isEditingRanks) return;
        event.preventDefault();
      }}
    >
      <div role="none rowgroup">
        <div role="none row">
          {treeDefinitionItems.map((rank, index, { length }) => {
            const rankName = rank.title || rank.name;
            return (
              <div
                className={`dark:brightness-125" sticky top-0 mt-1
                  flex gap-1 whitespace-nowrap 
                  border border-transparent border-b-[color:var(--accent-color-300)] 
                  bg-[color:var(--background)] p-2 p-2 brightness-95
                  ${index === 0 ? 'rounded-tl-md' : ''}
                  ${index + 1 === length ? 'rounded-tr-md' : ''}
              `}
                key={index}
                role="columnheader"
              >
                {index === 0 ? (
                  <>
                    <Button.Icon
                      aria-pressed={isEditingRanks}
                      icon="pencil"
                      title={treeText.editRanks()}
                      onClick={handleToggleEditingRanks}
                    />
                    {isEditingRanks &&
                    hasTablePermission(
                      treeDefinitionItems[0]._tableName,
                      'create'
                    ) ? (
                      <AddRank treeDefinitionItems={treeDefinitionItems} />
                    ) : null}
                  </>
                ) : null}
                <Button.LikeLink
                  id={id(rank.rankId.toString())}
                  onClick={(): void =>
                    setCollapsedRanks(
                      toggleItem(collapsedRanks ?? [], rank.rankId)
                    )
                  }
                >
                  {
                    ((collapsedRanks?.includes(rank.rankId) ?? false)
                      ? rankName[0]
                      : rankName) as LocalizedString
                  }
                </Button.LikeLink>
                {isEditingRanks &&
                collapsedRanks?.includes(rank.rankId) !== true ? (
                  <EditTreeRank rank={rank} />
                ) : undefined}
              </div>
            );
          })}
        </div>
      </div>
      {treeCreationProgress?.active ? (
        <>
          <div className="flex flex-col gap-2 p-2 text-left text-lg font-medium">
            {treeText.defaultTreeCreationLoadingMessage()}
          </div>
        </>
      ) : (
        <>
          {rows.length === 0 ? (
            <div className="flex flex-col gap-2 p-2">
              <Button.LikeLink
                aria-label={treeText.initializeEmptyTree()}
                className="flex items-center gap-2 text-left"
                title={treeText.initializeEmptyTree()}
                onClick={createRootNode}
              >
                {icons.plus}
                <span>{treeText.initializeEmptyTree()}</span>
              </Button.LikeLink>
              {treeDefId ? (
                <ImportTree
                  buttonClassName="text-left"
                  buttonLabel={setupToolText.preloadTree()}
                  tableName={tableName}
                  treeDefId={treeDefId}
                  treeDefinitionItems={treeDefinitionItems}
                />
              ) : null}
            </div>
          ) : null}
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
                  (focusPath[0] === 0 && index === 0) || focusPath[0] === row.nodeId
                    ? focusPath.slice(1)
                    : undefined
                }
                getRows={getRows}
                getStats={getStats}
                hideEmptyNodes={hideEmptyNodes}
                key={row.nodeId}
                nodeStats={undefined}
                path={[]}
                rankNameId={id}
                ranks={ranks}
                row={row}
                setFocusedRow={setFocusedRow}
                synonymColor={synonymColor}
                treeName={tableName}
                onAction={(action): void => {
                  if (action === 'next')
                    if (rows[index + 1] === undefined) return undefined;
                    else setFocusPath([rows[index + 1].nodeId]);
                  else if (action === 'previous' && index > 0)
                    setFocusPath([rows[index - 1].nodeId]);
                  else if (action === 'previous' || action === 'parent')
                    setFocusPath([]);
                  else if (action === 'focusPrevious') focusRef.current?.focus();
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
                onFocusNode={(newFocusPath): void => {
                  setFocusPath([row.nodeId, ...newFocusPath]);
                  setLastFocusedTree();
                }}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function EditTreeRank({
  rank,
}: {
  readonly rank: SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const resource = React.useMemo(() => deserializeResource(rank), [rank]);
  return (
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen ? (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          resource={resource}
          onAdd={undefined}
          onClose={handleClose}
          onDeleted={(): void => globalThis.location.reload()}
          onSaved={(): void => globalThis.location.reload()}
        />
      ) : null}
    </>
  );
}
