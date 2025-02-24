import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { treeText } from '../../localization/tree';
import { ping } from '../../utils/ajax/ping';
import type { GetSet, RA } from '../../utils/types';
import { toggleItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { idFromUrl } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import { softError } from '../Errors/assert';
import { ResourceView } from '../Forms/ResourceView';
import { getPref } from '../InitialContext/remotePrefs';
import { hasTablePermission } from '../Permissions/helpers';
import { useHighContrast } from '../Preferences/Hooks';
import { userPreferences } from '../Preferences/userPreferences';
import { AddRank } from './AddRank';
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

  const statsThreshold = getPref(
    `TreeEditor.Rank.Threshold.${tableName as 'Geography'}`
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
        `/api/specify_tree/${tableName.toLowerCase()}/${treeDefId}/add_root/`,
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
      // First role is for screen readers. Second is for styling
      style={
        {
          '--cols': treeDefinitionItems.length,
          '--middle-color': `${treeAccentColor}33`,
          '--edge-color': `${treeAccentColor}00`,
        } as React.CSSProperties
      }
      tabIndex={0}
      // When tree viewer is focused, move focus to last focused node
      onFocus={(event): void => {
        // Don't handle bubbled events
        if (event.currentTarget !== event.target) return;
        // If user wants to edit tree ranks, allow tree ranks to receive focus
        if (isEditingRanks) return;
        event.preventDefault();
        // Unset and set focus path to trigger a useEffect hook in <TreeNode>
        setFocusPath([-1]);
        globalThis.setTimeout(
          () => setFocusPath(focusPath.length > 0 ? focusPath : [0]),
          0
        );
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
      {rows.length === 0 ? (
        <Button.Icon
          icon="plus"
          title={treeText.addRootNode()}
          onClick={createRootNode}
        />
      ) : undefined}
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
