import React from 'react';

import { formData, ping } from '../ajax';
import type { AnySchema, AnyTree } from '../datamodelutils';
import { toLowerCase } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { treeText } from '../localization/tree';
import { hasPermission, hasTablePermission } from '../permissions';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import type { Row } from '../treeviewutils';
import type { RA } from '../types';
import { Button, Link } from './basic';
import { LoadingContext } from './contexts';
import { useBooleanState, useLiveState } from './hooks';
import { Dialog } from './modaldialog';
import { ResourceView } from './resourceview';

type Action = 'add' | 'edit' | 'merge' | 'move' | 'synonymize' | 'desynonymize';

export function TreeViewActions<SCHEMA extends AnyTree>({
  tableName,
  focusRef,
  onRefresh: handleRefresh,
  focusedRow,
  ranks,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly focusRef: React.MutableRefObject<HTMLElement | null>;
  readonly onRefresh: () => void;
  readonly focusedRow: Row | undefined;
  readonly ranks: RA<number>;
}): JSX.Element {
  const [actionRow, setActionRow] = React.useState<Row | undefined>(undefined);
  const [currentAction, setCurrentAction] = React.useState<Action | undefined>(
    undefined
  );

  function setAction(action: Action | undefined): void {
    setActionRow(typeof action === 'string' ? focusedRow : undefined);
    setCurrentAction(action);
  }

  const resourceName = `/tree/edit/${toLowerCase(tableName)}` as const;
  const isSynonym = typeof focusedRow?.acceptedId === 'number';

  const disableButtons =
    typeof focusedRow === 'undefined' || typeof currentAction === 'string';
  return typeof currentAction === 'undefined' ||
    typeof actionRow === 'undefined' ||
    typeof focusedRow === 'undefined' ||
    currentAction === 'add' ||
    currentAction === 'edit' ? (
    <menu className="contents">
      {hasPermission('/querybuilder/query', 'execute') && (
        <li className="contents">
          {typeof focusedRow === 'object' ? (
            <Link.LikeButton
              href={`/specify/query/fromtree/${tableName.toLowerCase()}/${
                focusedRow.nodeId
              }/`}
              target="_blank"
              forwardRef={(element): void => {
                focusRef.current = element;
              }}
            >
              {commonText('query')}
            </Link.LikeButton>
          ) : (
            <Button.Small disabled>{commonText('query')}</Button.Small>
          )}
        </li>
      )}
      <li className="contents">
        <EditRecordDialog<SCHEMA>
          nodeId={focusedRow?.nodeId}
          addNew={false}
          label={
            hasTablePermission(tableName, 'update')
              ? commonText('edit')
              : commonText('view')
          }
          tableName={tableName}
          onRefresh={handleRefresh}
          disabled={typeof focusedRow === 'undefined'}
        />
      </li>
      <li className="contents">
        <EditRecordDialog<SCHEMA>
          addNew={true}
          label={commonText('addChild')}
          nodeId={focusedRow?.nodeId}
          tableName={tableName}
          onRefresh={handleRefresh}
          disabled={
            typeof focusedRow === 'undefined' ||
            typeof focusedRow.acceptedId === 'number' ||
            // Forbid adding children to the lowest rank
            ranks.slice(-1)[0] === focusedRow.rankId
          }
        />
      </li>
      {hasPermission(resourceName, 'move') && (
        <li className="contents">
          <Button.Small
            disabled={disableButtons}
            onClick={disableButtons ? undefined : (): void => setAction('move')}
          >
            {commonText('move')}
          </Button.Small>
        </li>
      )}
      {hasPermission(resourceName, 'merge') && (
        <li className="contents">
          <Button.Small
            disabled={disableButtons}
            onClick={
              disableButtons ? undefined : (): void => setAction('merge')
            }
          >
            {treeText('merge')}
          </Button.Small>
        </li>
      )}
      {hasPermission(
        resourceName,
        isSynonym ? 'desynonymize' : 'synonymize'
      ) && (
        <li className="contents">
          <Button.Small
            disabled={disableButtons || (!isSynonym && focusedRow.children > 0)}
            onClick={
              disableButtons || (!isSynonym && focusedRow.children > 0)
                ? undefined
                : (): void =>
                    setAction(isSynonym ? 'desynonymize' : 'synonymize')
            }
          >
            {isSynonym ? treeText('undoSynonymy') : treeText('synonymize')}
          </Button.Small>
        </li>
      )}
    </menu>
  ) : (
    <ActiveAction<SCHEMA>
      tableName={tableName}
      actionRow={actionRow}
      type={currentAction}
      focusRef={focusRef}
      focusedRow={focusedRow}
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
  onRefresh: handleRefresh,
}: {
  readonly nodeId: number | undefined;
  readonly disabled: boolean;
  readonly addNew: boolean;
  readonly tableName: SCHEMA['tableName'];
  readonly label: string;
  readonly onRefresh: () => void;
}): JSX.Element | null {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();
  const hasChanged = React.useRef(false);

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
        disabled={typeof nodeId === 'undefined' || disabled}
        onClick={handleToggle}
        aria-pressed={isOpen}
      >
        {label}
      </Button.Small>
      {isOpen && typeof resource === 'object' && (
        <ResourceView
          resource={resource}
          dialog="modal"
          onSaved={({ newResource }): void => {
            if (typeof newResource === 'object') {
              setResource(newResource);
              hasChanged.current = true;
            } else handleRefresh();
          }}
          canAddAnother={true}
          onClose={(): void =>
            hasChanged.current ? handleRefresh() : handleClose()
          }
          mode="edit"
          onDeleted={handleRefresh}
          isSubForm={false}
          isDependent={false}
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
  const [error, setError] = React.useState<undefined | string>(undefined);

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
  const disabled =
    type === 'move'
      ? focusedRow.rankId >= actionRow.rankId || isSynonym || isSameRecord
      : type === 'merge'
      ? isSameRecord || focusedRow.rankId > actionRow.rankId || isSynonym
      : type === 'synonymize'
      ? isSameRecord || isSynonym
      : false;
  return (
    <menu className="contents">
      <Button.Small
        forwardRef={(element): void => {
          focusRef.current = element;
        }}
        disabled={disabled}
        onClick={disabled ? undefined : (): void => setShowPrompt(true)}
        title={
          type === 'move'
            ? treeText('nodeMoveHintMessage', actionRow.fullName)
            : type === 'merge'
            ? treeText('mergeNodeHintMessage', actionRow.fullName)
            : type === 'synonymize'
            ? treeText('synonymizeNodeHintMessage', actionRow.fullName)
            : treeText(
                'desynonymizeNodeMessage',
                treeName,
                actionRow.fullName,
                focusedRow.fullName
              )
        }
      >
        {type === 'move'
          ? treeText('moveNodeHere', actionRow.fullName)
          : type === 'merge'
          ? treeText('mergeNodeHere', actionRow.fullName)
          : type === 'synonymize'
          ? treeText('makeSynonym', actionRow.fullName, focusedRow.fullName)
          : treeText('desynonymizeNode')}
      </Button.Small>
      <Button.Small onClick={handleCancelAction}>
        {commonText('cancel')}
      </Button.Small>
      {typeof error === 'object' ? (
        <Dialog
          title={treeText('actionFailedDialogTitle')}
          header={treeText('actionFailedDialogHeader')}
          onClose={handleCancelAction}
          buttons={commonText('close')}
        >
          {treeText('actionFailedDialogText')}
          <br />
          {error}
        </Dialog>
      ) : showPrompt ? (
        <Dialog
          header={
            type === 'move'
              ? treeText('moveNode')
              : type === 'merge'
              ? treeText('mergeNode')
              : type === 'synonymize'
              ? treeText('synonymizeNode')
              : treeText('desynonymizeNode')
          }
          onClose={handleCancelAction}
          buttons={
            <>
              <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
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
                  ? treeText('moveNode')
                  : type === 'merge'
                  ? treeText('mergeNode')
                  : type === 'synonymize'
                  ? treeText('synonymizeNode')
                  : treeText('desynonymizeNode')}
              </Button.Blue>
            </>
          }
        >
          {type === 'move'
            ? treeText(
                'nodeMoveMessage',
                treeName,
                actionRow.fullName,
                focusedRow.fullName
              )
            : type === 'merge'
            ? treeText(
                'mergeNodeMessage',
                treeName,
                actionRow.fullName,
                focusedRow.fullName
              )
            : type === 'synonymize'
            ? treeText(
                'synonymizeMessage',
                treeName,
                actionRow.fullName,
                focusedRow.fullName
              )
            : treeText(
                'desynonymizeNodeMessage',
                treeName,
                actionRow.fullName,
                focusedRow.fullName
              )}
        </Dialog>
      ) : undefined}
    </menu>
  );
}
