import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { treeText } from '../../localization/tree';
import { formData } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import type { GetSet, RA, RR } from '../../utils/types';
import { toLowerCase } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema, AnyTree } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables } from '../DataModel/tables';
import { DeleteButton } from '../Forms/DeleteButton';
import { getPref } from '../InitialContext/remotePrefs';
import { Dialog } from '../Molecules/Dialog';
import { ResourceLink } from '../Molecules/ResourceLink';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import type { Row } from './helpers';
import { checkMoveViolatesEnforced } from './helpers';

const treeActions = [
  'add',
  'bulkMove',
  'desynonymize',
  'edit',
  'merge',
  'move',
  'synonymize',
] as const;

type Action = typeof treeActions[number];

export function TreeViewActions<SCHEMA extends AnyTree>({
  tableName,
  focusRef,
  focusedRow,
  ranks,
  actionRow,
  onChange: handleChange,
  onRefresh: handleRefresh,
  focusPath: [focusPath, setFocusPath],
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly focusRef: React.MutableRefObject<HTMLAnchorElement | null>;
  readonly focusedRow: Row | undefined;
  readonly ranks: RA<number>;
  readonly actionRow: Row | undefined;
  readonly onChange: (row: Row | undefined) => void;
  readonly onRefresh: () => void;
  readonly focusPath: GetSet<RA<number>>;
}): JSX.Element {
  const isRoot = ranks[0] === focusedRow?.rankId;

  const [currentAction, setCurrentAction] = React.useState<Action | undefined>(
    undefined
  );

  function setAction(action: Action | undefined): void {
    handleChange(typeof action === 'string' ? focusedRow : undefined);
    setCurrentAction(action);
  }

  const resourceName = `/tree/edit/${toLowerCase(tableName)}` as const;
  const isSynonym = typeof focusedRow?.acceptedId === 'number';

  const doExpandSynonymActionsPref = getPref(
    `sp7.allow_adding_child_to_synonymized_parent.${tableName}`
  );

  const disableButtons =
    focusedRow === undefined || typeof currentAction === 'string';

  return currentAction === undefined ||
    actionRow === undefined ||
    focusedRow === undefined ||
    currentAction === 'add' ||
    currentAction === 'edit' ? (
    <menu className="contents">
      {hasPermission('/querybuilder/query', 'execute') && (
        <li className="contents">
          {typeof focusedRow === 'object' ? (
            isRoot ? (
              <Button.Icon
                icon="search"
                title={queryText.query()}
                onClick={undefined}
              />
            ) : (
              <Link.Icon
                forwardRef={focusRef}
                href={`/specify/query/fromtree/${tableName.toLowerCase()}/${
                  focusedRow.nodeId
                }/`}
                icon="search"
                target="_blank"
                title={queryText.query()}
              />
            )
          ) : (
            <Button.Icon
              icon="search"
              title={queryText.query()}
              onClick={undefined}
            />
          )}
        </li>
      )}
      <li className="contents">
        <EditRecordDialog<SCHEMA>
          addNew={false}
          disabled={focusedRow === undefined}
          isRoot={isRoot}
          label={
            hasTablePermission(tableName, 'update')
              ? commonText.edit()
              : commonText.view()
          }
          nodeId={focusedRow?.nodeId}
          tableName={tableName}
          onRefresh={handleRefresh}
        />
      </li>
      {hasTablePermission(tableName, 'delete') ? (
        <li className="contents">
          <NodeDeleteButton
            disabled={disableButtons}
            nodeId={focusedRow?.nodeId}
            tableName={tableName}
            onDeleted={() => {
              handleRefresh();
              setFocusPath(focusPath?.slice(0, -1));
            }}
          />
        </li>
      ) : undefined}
      {hasTablePermission(tableName, 'create') && (
        <li className="contents">
          <EditRecordDialog<SCHEMA>
            addNew
            disabled={
              focusedRow === undefined ||
              (doExpandSynonymActionsPref ? false : isSynonym) ||
              // Forbid adding children to the lowest rank
              ranks.at(-1) === focusedRow.rankId
            }
            isRoot={false}
            label={treeText.addChild()}
            nodeId={focusedRow?.nodeId}
            tableName={tableName}
            onRefresh={handleRefresh}
          />
        </li>
      )}
      {hasPermission(resourceName, 'move') && (
        <li className="contents">
          <Button.Icon
            disabled={disableButtons || isRoot}
            icon="arrowsMove"
            title={treeText.move()}
            onClick={(): void => setAction('move')}
          />
        </li>
      )}
      {tableName === 'Storage' &&
      hasPermission(resourceName as '/tree/edit/storage', 'bulk_move') ? (
        <li className="contents">
          <Button.Icon
            disabled={disableButtons}
            icon="truck"
            title={treeText.moveItems()}
            onClick={(): void => setAction('bulkMove')}
          />
        </li>
      ) : null}
      {hasPermission(resourceName, 'merge') && (
        <li className="contents">
          <Button.Icon
            disabled={disableButtons || isRoot}
            icon="merge"
            title={treeText.merge()}
            onClick={(): void => setAction('merge')}
          />
        </li>
      )}
      {hasPermission(
        resourceName,
        isSynonym ? 'desynonymize' : 'synonymize'
      ) && (
        <li className="contents">
          <Button.Icon
            disabled={
              disableButtons ||
              isRoot ||
              (doExpandSynonymActionsPref
                ? false
                : !isSynonym && focusedRow.children > 0)
            }
            icon={isSynonym ? 'undoSynonym' : 'synonym'}
            title={isSynonym ? treeText.undoSynonymy() : treeText.synonymize()}
            onClick={(): void =>
              setAction(isSynonym ? 'desynonymize' : 'synonymize')
            }
          />
        </li>
      )}
    </menu>
  ) : (
    <ActiveAction<SCHEMA>
      actionRow={actionRow}
      focusedRow={focusedRow}
      focusRef={focusRef}
      tableName={tableName}
      type={currentAction}
      onCancelAction={(): void => setAction(undefined)}
      onCompleteAction={(): void => {
        setAction(undefined);
        handleRefresh();
      }}
    />
  );
}

function EditRecordDialog<SCHEMA extends AnyTree>({
  nodeId,
  disabled,
  addNew,
  tableName,
  label,
  isRoot,
  onRefresh: handleRefresh,
}: {
  readonly nodeId: number | undefined;
  readonly disabled: boolean;
  readonly addNew: boolean;
  readonly tableName: SCHEMA['tableName'];
  readonly label: LocalizedString;
  readonly isRoot: boolean;
  readonly onRefresh: () => void;
}): JSX.Element | null {
  const [resource, setResource] = useLiveState<
    SpecifyResource<AnySchema> | undefined
  >(
    React.useCallback(() => {
      const table = genericTables[tableName] as SpecifyTable<AnyTree>;
      const parentNode = new table.Resource({ id: nodeId });
      let node = parentNode;
      if (addNew) {
        node = new table.Resource();
        node.set('parent', parentNode.url());
      }
      return node;
    }, [nodeId, tableName, addNew])
  );

  const isViewMode = !hasTablePermission(tableName, 'update');

  return (
    <>
      {disabled ? (
        <Button.Icon
          icon={addNew ? 'plus' : 'pencil'}
          title={label}
          onClick={undefined}
        />
      ) : (
        <ResourceLink
          autoClose={false}
          component={Link.Icon}
          props={{
            'aria-disabled': disabled,
            icon: isViewMode ? 'eye' : addNew ? 'plus' : 'pencil',
            title: label,
          }}
          resource={resource}
          resourceView={{
            dialog: 'nonModal',
            onAdd: isRoot ? undefined : ([resource]) => setResource(resource),
            onDeleted: handleRefresh,
            onSaved: handleRefresh,
          }}
        />
      )}
    </>
  );
}

const frontendToBackendMappingActions: RR<Action, string> = {
  ...Object.fromEntries(treeActions.map((action) => [action, action])),
  bulkMove: 'bulk_move',
};
function ActiveAction<SCHEMA extends AnyTree>({
  tableName,
  actionRow,
  type,
  focusRef,
  focusedRow,
  onCancelAction: handleCancelAction,
  onCompleteAction: handleCompleteAction,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly actionRow: Row;
  readonly type: Exclude<Action, 'add' | 'edit'>;
  readonly focusRef: React.MutableRefObject<HTMLElement | null>;
  readonly focusedRow: Row;
  readonly onCancelAction: () => void;
  readonly onCompleteAction: () => void;
}): JSX.Element {
  if (!treeActions.includes(type)) throw new Error('Invalid action type');

  const table = genericTables[tableName] as SpecifyTable<AnyTree>;
  const treeName = table.label;

  const [showPrompt, setShowPrompt] = React.useState(type === 'desynonymize');
  const loading = React.useContext(LoadingContext);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const action = async (): Promise<number> =>
    ping(
      `/api/specify_tree/${tableName.toLowerCase()}/${actionRow.nodeId}/${
        frontendToBackendMappingActions[type]
      }/`,
      {
        method: 'POST',
        body:
          type === 'desynonymize'
            ? undefined
            : formData({ target: focusedRow.nodeId }),
      }
    );
  const isSynonym = typeof focusedRow.acceptedId === 'number';
  const isSameRecord = focusedRow.nodeId === actionRow.nodeId;
  const title =
    type === 'move'
      ? treeText.nodeMoveHintMessage({ nodeName: actionRow.fullName })
      : type === 'merge'
      ? treeText.mergeNodeHintMessage({ nodeName: actionRow.fullName })
      : type === 'bulkMove'
      ? treeText.bulkMoveNodeHintMessage({ nodeName: actionRow.fullName })
      : type === 'synonymize'
      ? treeText.synonymizeNodeHintMessage({ nodeName: actionRow.fullName })
      : treeText.desynonymizeNodeMessage({
          nodeName: actionRow.fullName,
          synonymName: focusedRow.fullName,
        });
  let disabled: string | false = false;
  if (type === 'move') {
    if (isSameRecord) disabled = title;
    else if (
      focusedRow.rankId >= actionRow.rankId ||
      checkMoveViolatesEnforced(tableName, focusedRow.rankId, actionRow.rankId)
    )
      disabled = treeText.cantMoveHere();
    else if (isSynonym) disabled = treeText.cantMoveToSynonym();
  } else if (type === 'bulkMove') {
    if (isSameRecord) disabled = title;
  } else if (type === 'merge') {
    if (isSameRecord) disabled = title;
    else if (focusedRow.rankId > actionRow.rankId)
      disabled = treeText.cantMergeHere();
    else if (isSynonym) disabled = treeText.cantMergeIntoSynonym();
  } else if (type === 'synonymize') {
    if (isSameRecord) disabled = title;
    else if (isSynonym) disabled = treeText.cantSynonymizeSynonym();
  }
  return (
    <menu className="contents">
      <Button.Small
        className="normal-case"
        disabled={disabled !== false}
        forwardRef={(element): void => {
          focusRef.current = element;
        }}
        title={title}
        onClick={(): void => setShowPrompt(true)}
      >
        {typeof disabled === 'string'
          ? disabled
          : type === 'move'
          ? treeText.moveNodeHere({ nodeName: actionRow.fullName })
          : type === 'bulkMove'
          ? treeText.moveNodePreparationsHere({ nodeName: actionRow.fullName })
          : type === 'merge'
          ? treeText.mergeNodeHere({ nodeName: actionRow.fullName })
          : type === 'synonymize'
          ? treeText.makeSynonym({
              nodeName: actionRow.fullName,
              synonymName: focusedRow.fullName,
            })
          : treeText.desynonymizeNode()}
      </Button.Small>
      <Button.Small onClick={handleCancelAction}>
        {commonText.cancel()}
      </Button.Small>
      {typeof error === 'object' ? (
        <Dialog
          buttons={commonText.close()}
          header={treeText.actionFailed()}
          onClose={handleCancelAction}
        >
          {treeText.actionFailedDescription()}
          <br />
          {error}
        </Dialog>
      ) : showPrompt ? (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Info
                onClick={(): void =>
                  loading(
                    action()
                      .then(handleCompleteAction)
                      .catch((error: Error) => setError(error.toString()))
                  )
                }
              >
                {type === 'move'
                  ? treeText.moveNode()
                  : type === 'bulkMove'
                  ? treeText.moveItems()
                  : type === 'merge'
                  ? treeText.mergeNode()
                  : type === 'synonymize'
                  ? treeText.synonymizeNode()
                  : treeText.desynonymizeNode()}
              </Button.Info>
            </>
          }
          header={
            type === 'move'
              ? treeText.moveNode()
              : type === 'bulkMove'
              ? treeText.moveItems()
              : type === 'merge'
              ? treeText.mergeNode()
              : type === 'synonymize'
              ? treeText.synonymizeNode()
              : treeText.desynonymizeNode()
          }
          onClose={handleCancelAction}
        >
          {type === 'move'
            ? treeText.nodeMoveMessage({
                treeName,
                nodeName: actionRow.fullName,
                parentName: focusedRow.fullName,
              })
            : type === 'bulkMove'
            ? treeText.nodeBulkMoveMessage({
                treeName,
                nodeName: actionRow.fullName,
                parentName: focusedRow.fullName,
              })
            : type === 'merge'
            ? treeText.mergeNodeMessage({
                treeName,
                nodeName: actionRow.fullName,
                parentName: focusedRow.fullName,
              })
            : type === 'synonymize'
            ? treeText.synonymizeMessage({
                treeName,
                nodeName: actionRow.fullName,
                synonymName: focusedRow.fullName,
              })
            : treeText.desynonymizeNodeMessage({
                nodeName: actionRow.fullName,
                synonymName: focusedRow.fullName,
              })}
        </Dialog>
      ) : undefined}
    </menu>
  );
}

function NodeDeleteButton({
  disabled,
  tableName,
  nodeId,
  onDeleted: handleDeleted,
}: {
  readonly disabled: boolean;
  readonly tableName: AnyTree['tableName'];
  readonly nodeId: number | undefined;
  readonly onDeleted: () => void;
}): JSX.Element {
  const resource = React.useMemo(
    () =>
      typeof nodeId === 'number'
        ? new genericTables[tableName].Resource({ id: nodeId })
        : undefined,
    [tableName, nodeId]
  );

  return disabled || resource === undefined ? (
    <Button.Icon icon="trash" title={commonText.delete()} onClick={undefined} />
  ) : (
    <DeleteButton
      component={Button.Small}
      deferred
      isIcon
      resource={resource}
      onDeleted={handleDeleted}
    />
  );
}
