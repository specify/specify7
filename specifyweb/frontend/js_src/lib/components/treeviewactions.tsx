import React from 'react';

import { formData, ping } from '../ajax';
import type { AnySchema, AnyTree } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import treeText from '../localization/tree';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import type { Row } from '../treeviewutils';
import type { RA } from '../types';
import { userInformation } from '../userinfo';
import { Button, Link } from './basic';
import { useBooleanState, useLiveState } from './hooks';
import { Dialog } from './modaldialog';
import { getDefaultFormMode, ResourceView } from './resourceview';
import { LoadingContext } from './contexts';

type Action = 'add' | 'edit' | 'merge' | 'move' | 'synonymize' | 'unsynonymize';

export function TreeViewActions<SCHEMA extends AnyTree>({
  tableName,
  focusRef,
  onRefresh: handleRefresh,
  focusedRow,
  ranks,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly focusRef: React.MutableRefObject<HTMLButtonElement | null>;
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

  const disableButtons =
    typeof focusedRow === 'undefined' || typeof currentAction === 'string';
  return typeof currentAction === 'undefined' ||
    typeof actionRow === 'undefined' ||
    typeof focusedRow === 'undefined' ||
    currentAction === 'add' ||
    currentAction === 'edit' ? (
    <menu className="contents">
      <li className="contents">
        {typeof focusedRow === 'object' ? (
          <Link.LikeButton
            href={`/specify/query/fromtree/${tableName.toLowerCase()}/${
              focusedRow.nodeId
            }/`}
            target="_blank"
          >
            {commonText('query')}
          </Link.LikeButton>
        ) : (
          <Button.Simple disabled>{commonText('query')}</Button.Simple>
        )}
      </li>
      <li className="contents">
        <EditRecord<SCHEMA>
          nodeId={focusedRow?.nodeId}
          tableName={tableName}
          onRefresh={handleRefresh}
          disabled={typeof focusedRow === 'undefined'}
        />
      </li>
      <li className="contents">
        <AddChild<SCHEMA>
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
      <li className="contents">
        <Button.Simple
          disabled={disableButtons}
          onClick={disableButtons ? undefined : (): void => setAction('move')}
        >
          {commonText('move')}
        </Button.Simple>
      </li>
      <li className="contents">
        <Button.Simple
          disabled={disableButtons}
          onClick={disableButtons ? undefined : (): void => setAction('merge')}
        >
          {treeText('merge')}
        </Button.Simple>
      </li>
      <li className="contents">
        <Button.Simple
          disabled={
            disableButtons ||
            (typeof focusedRow.acceptedId === 'undefined' &&
              focusedRow.children > 0)
          }
          forwardRef={focusRef}
          onClick={
            disableButtons ||
            (typeof focusedRow.acceptedId === 'undefined' &&
              focusedRow.children > 0)
              ? undefined
              : (): void =>
                  setAction(
                    typeof focusedRow?.acceptedId === 'number'
                      ? 'unsynonymize'
                      : 'synonymize'
                  )
          }
        >
          {typeof focusedRow?.acceptedId === 'number'
            ? treeText('undoSynonymy')
            : treeText('synonymize')}
        </Button.Simple>
      </li>
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

function EditRecord<SCHEMA extends AnyTree>({
  nodeId,
  tableName,
  onRefresh: handleRefresh,
  disabled,
}: {
  readonly nodeId: number | undefined;
  readonly tableName: SCHEMA['tableName'];
  readonly onRefresh: () => void;
  readonly disabled: boolean;
}): JSX.Element {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();

  return (
    <>
      <Button.Simple
        disabled={disabled || typeof nodeId === 'undefined'}
        onClick={handleToggle}
        aria-pressed={isOpen}
      >
        {userInformation.isReadOnly ? commonText('view') : commonText('edit')}
      </Button.Simple>
      {isOpen && typeof nodeId === 'number' && (
        <EditRecordDialog<SCHEMA>
          id={nodeId}
          addNew={false}
          tableName={tableName}
          onClose={handleClose}
          onDeleted={handleRefresh}
          onSaved={handleRefresh}
        />
      )}
    </>
  );
}

function AddChild<SCHEMA extends AnyTree>({
  nodeId,
  tableName,
  onRefresh: handleRefresh,
  disabled,
}: {
  readonly nodeId: number | undefined;
  readonly tableName: SCHEMA['tableName'];
  readonly onRefresh: () => void;
  readonly disabled: boolean;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose, handleToggle] = useBooleanState();
  const hasChanged = React.useRef(false);

  return (
    <>
      <Button.Simple
        disabled={typeof nodeId === 'undefined' || disabled}
        onClick={handleToggle}
        aria-pressed={isOpen}
      >
        {commonText('addChild')}
      </Button.Simple>
      {isOpen && typeof nodeId === 'number' && (
        <EditRecordDialog<SCHEMA>
          id={nodeId}
          addNew={true}
          tableName={tableName}
          onClose={(): void =>
            hasChanged.current ? handleRefresh() : handleClose()
          }
          onDeleted={handleRefresh}
          onSaved={(addAnother): void => {
            if (addAnother) {
              handleClose();
              // TODO: simplify this
              setTimeout(handleOpen, 0);
              hasChanged.current = true;
            } else handleRefresh();
          }}
        />
      )}
    </>
  );
}

function EditRecordDialog<SCHEMA extends AnyTree>({
  id,
  addNew,
  tableName,
  onClose: handleClose,
  onDeleted: handleDeleted,
  onSaved: handleSaved,
}: {
  readonly id: number;
  readonly addNew: boolean;
  readonly tableName: SCHEMA['tableName'];
  readonly onClose: () => void;
  readonly onSaved: (addAnother: boolean) => void;
  readonly onDeleted: () => void;
}): JSX.Element | null {
  const [resource] = useLiveState<SpecifyResource<AnySchema>>(
    React.useCallback(() => {
      const model = schema.models[tableName] as SpecifyModel<AnyTree>;
      const parentNode = new model.Resource({ id });
      let node = parentNode;
      if (addNew) {
        node = new model.Resource();
        node.set('parent', parentNode.url());
      }
      return node;
    }, [id, tableName, addNew])
  );

  return (
    <ResourceView
      resource={resource}
      dialog="modal"
      onSaved={({ addAnother }): void => {
        handleClose();
        handleSaved(addAnother);
      }}
      canAddAnother={true}
      onClose={handleClose}
      mode={getDefaultFormMode()}
      onDeleted={handleDeleted}
      isSubForm={false}
    />
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
  readonly focusRef: React.MutableRefObject<HTMLButtonElement | null>;
  readonly focusedRow: Row;
  readonly onCancelAction: () => void;
  readonly onCompleteAction: () => void;
}): JSX.Element {
  if (!['move', 'merge', 'synonymize', 'unsynonymize'].includes(type))
    throw new Error('Invalid action type');

  const model = schema.models[tableName] as SpecifyModel<AnyTree>;
  const treeName = model.label;

  const [showPrompt, setShowPrompt] = React.useState(false);
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
          type === 'unsynonymize'
            ? undefined
            : formData({ target: focusedRow.nodeId.toString() }),
      }
    );
  const isSynonym = typeof focusedRow.acceptedId === 'number';
  const isSameRecord = focusedRow.nodeId === actionRow.nodeId;
  const disabled =
    type === 'move'
      ? focusedRow.rankId >= actionRow.rankId || isSynonym
      : type === 'merge'
      ? isSameRecord || focusedRow.rankId > actionRow.rankId || isSynonym
      : type === 'synonymize'
      ? isSameRecord || isSynonym
      : false;
  return (
    <menu className="contents">
      <Button.Simple
        forwardRef={focusRef}
        disabled={disabled}
        onClick={disabled ? undefined : (): void => setShowPrompt(true)}
        title={
          type === 'move'
            ? treeText('nodeMoveHintMessage')(actionRow.fullName)
            : type === 'merge'
            ? treeText('mergeNodeHintMessage')(actionRow.fullName)
            : type === 'synonymize'
            ? treeText('synonymizeNodeHintMessage')(actionRow.fullName)
            : treeText('unsynonymizeNodeMessage')(
                treeName,
                actionRow.fullName,
                focusedRow.fullName
              )
        }
      >
        {type === 'move'
          ? treeText('moveNodeHere')(actionRow.fullName)
          : type === 'merge'
          ? treeText('mergeNodeHere')(actionRow.fullName)
          : type === 'synonymize'
          ? treeText('makeSynonym')(actionRow.fullName, focusedRow.fullName)
          : treeText('unsynonymizeNode')}
      </Button.Simple>
      <Button.Simple onClick={handleCancelAction}>
        {commonText('cancel')}
      </Button.Simple>
      {typeof error === 'object' ? (
        <Dialog
          title={treeText('actionFailedDialogTitle')}
          header={treeText('actionFailedDialogHeader')}
          onClose={handleCancelAction}
          buttons={commonText('close')}
        >
          {treeText('actionFailedDialogMessage')}
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
              : treeText('unsynonymizeNode')
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
                  : treeText('unsynonymizeNode')}
              </Button.Blue>
            </>
          }
        >
          {type === 'move'
            ? treeText('nodeMoveMessage')(
                treeName,
                actionRow.fullName,
                focusedRow.fullName
              )
            : type === 'merge'
            ? treeText('mergeNodeMessage')(
                treeName,
                actionRow.fullName,
                focusedRow.fullName
              )
            : type === 'synonymize'
            ? treeText('synonymizeMessage')(
                treeName,
                actionRow.fullName,
                focusedRow.fullName
              )
            : treeText('unsynonymizeNodeMessage')(
                treeName,
                actionRow.fullName,
                focusedRow.fullName
              )}
        </Dialog>
      ) : undefined}
    </menu>
  );
}
