import React from 'react';

import { ping } from '../../utils/ajax/ping';
import { formData } from '../../utils/ajax/helpers';
import { toLowerCase } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Row } from './helpers';
import { checkMoveViolatesEnforced } from './helpers';
import type { RA } from '../../utils/types';
import { LoadingContext } from '../Core/Contexts';
import { DeleteButton } from '../Forms/DeleteButton';
import { Dialog } from '../Molecules/Dialog';
import { ResourceView } from '../Forms/ResourceView';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { useLiveState } from '../../hooks/useLiveState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { AnySchema, AnyTree } from '../DataModel/helperTypes';
import { LocalizedString } from 'typesafe-i18n';
import { queryText } from '../../localization/query';
import { getPref } from '../InitialContext/remotePrefs';

type Action = 'add' | 'desynonymize' | 'edit' | 'merge' | 'move' | 'synonymize';

export function TreeViewActions<SCHEMA extends AnyTree>({
  tableName,
  focusRef,
  focusedRow,
  ranks,
  actionRow,
  onChange: handleChange,
  onRefresh: handleRefresh,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly focusRef: React.MutableRefObject<HTMLAnchorElement | null>;
  readonly focusedRow: Row | undefined;
  readonly ranks: RA<number>;
  readonly actionRow: Row | undefined;
  readonly onChange: (row: Row | undefined) => void;
  readonly onRefresh: () => void;
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
    `sp7.allow_adding_child_to_synonymized_parent.${
      tableName as AnyTree['tableName']
    }`
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
            <Link.Small
              forwardRef={focusRef}
              href={`/specify/query/fromtree/${tableName.toLowerCase()}/${
                focusedRow.nodeId
              }/`}
              target="_blank"
            >
              {queryText.query()}
            </Link.Small>
          ) : (
            <Button.Small onClick={undefined}>{queryText.query()}</Button.Small>
          )}
        </li>
      )}
      <li className="contents">
        <EditRecordDialog<SCHEMA>
          addNew={false}
          isRoot={isRoot}
          disabled={focusedRow === undefined}
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
            onDeleted={handleRefresh}
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
          <Button.Small
            disabled={disableButtons || isRoot}
            onClick={(): void => setAction('move')}
          >
            {treeText.move()}
          </Button.Small>
        </li>
      )}
      {hasPermission(resourceName, 'merge') && (
        <li className="contents">
          <Button.Small
            disabled={disableButtons || isRoot}
            onClick={(): void => setAction('merge')}
          >
            {treeText.merge()}
          </Button.Small>
        </li>
      )}
      {hasPermission(
        resourceName,
        isSynonym ? 'desynonymize' : 'synonymize'
      ) && (
        <li className="contents">
          <Button.Small
            disabled={
              disableButtons ||
              isRoot ||
              (doExpandSynonymActionsPref
                ? false
                : !isSynonym && focusedRow.children > 0)
            }
            onClick={(): void =>
              setAction(isSynonym ? 'desynonymize' : 'synonymize')
            }
          >
            {isSynonym ? treeText.undoSynonymy() : treeText.synonymize()}
          </Button.Small>
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
        setAction(currentAction);
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
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();

  const [resource, setResource] = useLiveState<
    SpecifyResource<AnySchema> | undefined
  >(
    React.useCallback(() => {
      if (!isOpen) return undefined;
      const model = schema.models[tableName] as SpecifyModel<AnyTree>;
      const parentNode = new model.Resource({ id: nodeId });
      let node = parentNode;
      if (addNew) {
        node = new model.Resource();
        node.set('parent', parentNode.url());
      }
      return node;
    }, [isOpen, nodeId, tableName, addNew])
  );

  return (
    <>
      <Button.Small
        aria-pressed={isOpen}
        disabled={nodeId === undefined || disabled}
        onClick={handleToggle}
      >
        {label}
      </Button.Small>
      {isOpen && typeof resource === 'object' && (
        <ResourceView
          dialog="nonModal"
          isDependent={false}
          isSubForm={false}
          mode="edit"
          resource={resource}
          onAdd={isRoot ? undefined : setResource}
          onClose={handleClose}
          onDeleted={handleRefresh}
          onSaved={handleRefresh}
        />
      )}
    </>
  );
}

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
  if (!['move', 'merge', 'synonymize', 'desynonymize'].includes(type))
    throw new Error('Invalid action type');

  const model = schema.models[tableName] as SpecifyModel<AnyTree>;
  const treeName = model.label;

  const [showPrompt, setShowPrompt] = React.useState(type === 'desynonymize');
  const loading = React.useContext(LoadingContext);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const action = async (): Promise<number> =>
    ping(
      `/api/specify_tree/${tableName.toLowerCase()}/${
        actionRow.nodeId
      }/${type}/`,
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
              <Button.Blue
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
                  : type === 'merge'
                  ? treeText.mergeNode()
                  : type === 'synonymize'
                  ? treeText.synonymizeNode()
                  : treeText.desynonymizeNode()}
              </Button.Blue>
            </>
          }
          header={
            type === 'move'
              ? treeText.moveNode()
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
        ? new schema.models[tableName].Resource({ id: nodeId })
        : undefined,
    [tableName, nodeId]
  );

  return disabled || resource === undefined ? (
    <Button.Small onClick={undefined}>{commonText.delete()}</Button.Small>
  ) : (
    <DeleteButton
      component={Button.Small}
      deferred
      resource={resource}
      onDeleted={handleDeleted}
    />
  );
}
