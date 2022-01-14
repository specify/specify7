import * as React from 'react';

import { formData, ping } from '../ajax';
import type Backbone from '../backbone';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import treeText from '../localization/tree';
import populateForm from '../populateform';
import ResourceView from '../resourceview';
import { getModel } from '../schema';
import type { Row } from '../treeviewutils';
import type { RA } from '../types';
import { defined } from '../types';
import userInfo from '../userinfo';
import { Button, Link } from './basic';
import { Dialog, dialogClassNames, LoadingScreen } from './modaldialog';

type Action = 'add' | 'edit' | 'merge' | 'move' | 'synonymize' | 'unsynonymize';

export function TreeViewActions({
  tableName,
  focusRef,
  onRefresh: handleRefresh,
  focusedRow,
  ranks,
}: {
  readonly tableName: string;
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
        {typeof focusedRow === 'undefined' ? (
          <Button.Simple disabled>{commonText('query')}</Button.Simple>
        ) : (
          <Link.LikeButton
            href={`/specify/query/fromtree/${tableName}/${focusedRow.nodeId}/`}
            target="_blank"
          >
            {commonText('query')}
          </Link.LikeButton>
        )}
      </li>
      <li className="contents">
        <EditRecord
          nodeId={focusedRow?.nodeId}
          tableName={tableName}
          onRefresh={handleRefresh}
          disabled={typeof focusedRow === 'undefined'}
        />
      </li>
      <li className="contents">
        <AddChild
          nodeId={focusedRow?.nodeId}
          tableName={tableName}
          onRefresh={handleRefresh}
          disabled={
            typeof focusedRow === 'undefined' ||
            typeof focusedRow.acceptedId !== 'undefined' ||
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
                    typeof focusedRow?.acceptedId === 'undefined'
                      ? 'synonymize'
                      : 'unsynonymize'
                  )
          }
        >
          {typeof focusedRow?.acceptedId === 'undefined'
            ? treeText('synonymize')
            : treeText('undoSynonymy')}
        </Button.Simple>
      </li>
    </menu>
  ) : (
    <ActiveAction
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

function EditRecord({
  nodeId,
  tableName,
  onRefresh: handleRefresh,
  disabled,
}: {
  readonly nodeId: number | undefined;
  readonly tableName: string;
  readonly onRefresh: () => void;
  readonly disabled: boolean;
}): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button.Simple
        disabled={disabled || typeof nodeId === 'undefined'}
        onClick={(): void => setIsOpen((state) => !state)}
        aria-pressed={isOpen}
      >
        {userInfo.isReadOnly ? commonText('view') : commonText('edit')}
      </Button.Simple>
      {isOpen && typeof nodeId !== 'undefined' && (
        <EditRecordDialog
          id={nodeId}
          addNew={false}
          tableName={tableName}
          onClose={(): void => setIsOpen(false)}
          onSaved={handleRefresh}
        />
      )}
    </>
  );
}

function AddChild({
  nodeId,
  tableName,
  onRefresh: handleRefresh,
  disabled,
}: {
  readonly nodeId: number | undefined;
  readonly tableName: string;
  readonly onRefresh: () => void;
  readonly disabled: boolean;
}): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasChanged = React.useRef(false);

  return (
    <>
      <Button.Simple
        disabled={typeof nodeId === 'undefined' || disabled}
        onClick={(): void => setIsOpen((state) => !state)}
        aria-pressed={isOpen}
      >
        {commonText('addChild')}
      </Button.Simple>
      {isOpen && typeof nodeId === 'number' && (
        <EditRecordDialog
          id={nodeId}
          addNew={true}
          tableName={tableName}
          onClose={(): void => {
            setIsOpen(false);
            if (hasChanged.current) handleRefresh();
          }}
          onSaved={(addAnother): void => {
            if (addAnother) {
              setIsOpen(false);
              setTimeout(() => setIsOpen(true), 0);
              hasChanged.current = true;
            } else handleRefresh();
          }}
        />
      )}
    </>
  );
}

function EditRecordDialog({
  id,
  addNew,
  tableName,
  onClose: handleClose,
  onSaved: handleSaved,
}: {
  readonly id: number;
  readonly addNew: boolean;
  readonly tableName: string;
  readonly onClose: () => void;
  readonly onSaved: (addAnother: boolean) => void;
}): JSX.Element {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (content === null) return undefined;

    const model = defined(getModel(tableName));
    const parentNode = new model.Resource({ id });
    let node = parentNode;
    if (addNew) {
      node = new model.Resource();
      node.set('parent', parentNode.url());
    }

    // TODO: redo this to react
    let view: Backbone.View | undefined = new ResourceView({
      populateForm,
      el: content,
      model: node,
      mode: 'edit',
      noHeader: true,
    })
      .render()
      .on(
        'saved',
        (
          _model: SpecifyResource,
          { addAnother }: { readonly addAnother: boolean }
        ) => {
          handleClose();
          handleSaved(addAnother);
          view?.remove();
          view = undefined;
        }
      )
      .on('deleted', () => {
        handleClose();
        view?.remove();
        view = undefined;
      })
      .on('changetitle', (_resource: SpecifyResource, title: string) =>
        setTitle(title)
      );

    return (): void => {
      view?.remove();
      view = undefined;
    };
  }, [content, tableName, addNew]);

  return (
    <Dialog
      header={title}
      onClose={handleClose}
      buttons={undefined}
      className={{ container: dialogClassNames.wideContainer }}
    >
      <div ref={setContent} />
    </Dialog>
  );
}

function ActiveAction({
  tableName,
  actionRow,
  type,
  focusRef,
  focusedRow,
  onCancelAction: handleCancelAction,
  onCompleteAction: handleCompleteAction,
}: {
  readonly tableName: string;
  readonly actionRow: Row;
  readonly type: Exclude<Action, 'add' | 'edit'>;
  readonly focusRef: React.MutableRefObject<HTMLButtonElement | null>;
  readonly focusedRow: Row;
  readonly onCancelAction: () => void;
  readonly onCompleteAction: () => void;
}): JSX.Element {
  if (!['move', 'merge', 'synonymize', 'unsynonymize'].includes(type))
    throw new Error('Invalid action type');

  const model = defined(getModel(tableName));
  const treeName = model.getLocalizedName().toLowerCase();

  const [showPrompt, setShowPrompt] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<undefined | string>(undefined);

  const action = async (): Promise<number> =>
    ping(`/api/specify_tree/${tableName}/${actionRow.nodeId}/${type}/`, {
      method: 'POST',
      body:
        type === 'unsynonymize'
          ? undefined
          : formData({ target: focusedRow.nodeId.toString() }),
    });
  const isSynonym = typeof focusedRow.acceptedId !== 'undefined';
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
      ) : isLoading ? (
        <LoadingScreen />
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
                onClick={(): void => {
                  setIsLoading(true);
                  action()
                    .then(handleCompleteAction)
                    .catch((error: Error) => setError(error.toString()));
                }}
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
