import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { treeText } from '../../localization/tree';
import { formData } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import type { GetSet, RA, RR } from '../../utils/types';
import { localized } from '../../utils/types';
import { toLowerCase } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema, AnyTree } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables } from '../DataModel/tables';
import { DeleteButton } from '../Forms/DeleteButton';
import { getPref } from '../InitialContext/remotePrefs';
import { Dialog } from '../Molecules/Dialog';
import { ResourceLink } from '../Molecules/ResourceLink';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
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

type Action = (typeof treeActions)[number];

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

  const isReadOnly = React.useContext(ReadOnlyContext);

  const displayButtons =
    currentAction === undefined ||
    actionRow === undefined ||
    focusedRow === undefined ||
    currentAction === 'add' ||
    currentAction === 'edit';

  return displayButtons ? (
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
              <QueryButton
                focusedRow={focusedRow}
                focusRef={focusRef}
                tableName={tableName}
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
          label={isReadOnly ? commonText.view() : commonText.edit()}
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
            onDeleted={(): void => {
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
          <MoveButton
            onClick={
              disableButtons || isRoot || isReadOnly
                ? undefined
                : (): void => setAction('move')
            }
          />
        </li>
      )}
      {tableName === 'Storage' &&
      hasPermission(resourceName as '/tree/edit/storage', 'bulk_move') ? (
        <li className="contents">
          <BulkMoveButton
            onClick={
              disableButtons || isReadOnly
                ? undefined
                : (): void => setAction('bulkMove')
            }
          />
        </li>
      ) : null}
      {hasPermission(resourceName, 'merge') && (
        <li className="contents">
          <MergeButton
            onClick={
              disableButtons || isRoot || isReadOnly
                ? undefined
                : (): void => setAction('merge')
            }
          />
        </li>
      )}
      {hasPermission(
        resourceName,
        isSynonym ? 'desynonymize' : 'synonymize'
      ) && (
        <li className="contents">
          <SynonymizeButton
            isSynonym={isSynonym}
            onClick={
              disableButtons ||
              isReadOnly ||
              isRoot ||
              (doExpandSynonymActionsPref
                ? false
                : !isSynonym && focusedRow.children > 0)
                ? undefined
                : (): void =>
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

function QueryButton({
  focusRef,
  focusedRow,
  tableName,
}: {
  readonly focusRef: React.MutableRefObject<HTMLAnchorElement | null>;
  readonly focusedRow: Row;
  readonly tableName: AnyTree['tableName'];
}): JSX.Element {
  const keyboardShortcut = userPreferences.useKeyboardShortcut(
    'treeEditor',
    'actions',
    'query',
    () => window.open(href, '_blank')
  );

  const href = `/specify/query/fromtree/${tableName.toLowerCase()}/${
    focusedRow.nodeId
  }/`;

  return (
    <Link.Icon
      forwardRef={focusRef}
      href={href}
      icon="search"
      target="_blank"
      title={localized(`${queryText.query()}${keyboardShortcut}`)}
    />
  );
}

function MoveButton({
  onClick: handleClick,
}: {
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const keyboardShortcut = userPreferences.useKeyboardShortcut(
    'treeEditor',
    'actions',
    'move',
    handleClick
  );
  return (
    <Button.Icon
      icon="arrowsMove"
      title={localized(`${treeText.move()}${keyboardShortcut}`)}
      onClick={handleClick}
    />
  );
}

function BulkMoveButton({
  onClick: handleClick,
}: {
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const keyboardShortcut = userPreferences.useKeyboardShortcut(
    'treeEditor',
    'actions',
    'bulkMove',
    handleClick
  );
  return (
    <Button.Icon
      icon="truck"
      title={localized(`${treeText.moveItems()}${keyboardShortcut}`)}
      onClick={handleClick}
    />
  );
}

function MergeButton({
  onClick: handleClick,
}: {
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const keyboardShortcut = userPreferences.useKeyboardShortcut(
    'treeEditor',
    'actions',
    'merge',
    handleClick
  );
  return (
    <Button.Icon
      icon="merge"
      title={localized(`${treeText.merge()}${keyboardShortcut}`)}
      onClick={handleClick}
    />
  );
}

function SynonymizeButton({
  isSynonym,
  onClick: handleClick,
}: {
  readonly isSynonym: boolean;
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const keyboardShortcut = userPreferences.useKeyboardShortcut(
    'treeEditor',
    'actions',
    'synonymize',
    handleClick
  );
  return (
    <Button.Icon
      icon={isSynonym ? 'undoSynonym' : 'synonym'}
      title={localized(
        `${
          isSynonym ? treeText.undoSynonymy() : treeText.synonymize()
        }${keyboardShortcut}`
      )}
      onClick={handleClick}
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
    }, [nodeId, addNew])
  );

  const isViewMode = !hasTablePermission(tableName, 'update');

  const toggleRef = React.useRef<() => void>();
  const keyboardShortcut = userPreferences.useKeyboardShortcut(
    'treeEditor',
    'actions',
    addNew ? 'add' : 'edit',
    disabled ? undefined : (): void => toggleRef.current?.()
  );

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
            title: localized(`${label}${keyboardShortcut}`),
          }}
          resource={resource}
          resourceView={{
            dialog: 'nonModal',
            onAdd: isRoot
              ? undefined
              : ([resource]): void => setResource(resource),
            onDeleted: handleRefresh,
            onSaved: handleRefresh,
          }}
          toggleRef={toggleRef}
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
            ? treeText.synonymizeNodeHintMessage({
                nodeName: actionRow.fullName,
              })
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

  const handleClick =
    disabled === false ? (): void => setShowPrompt(true) : undefined;
  const keyboardShortcut = userPreferences.useKeyboardShortcut(
    'treeEditor',
    'actions',
    type === 'desynonymize' ? 'synonymize' : type,
    handleClick
  );

  return (
    <menu className="contents">
      <Button.Small
        className="normal-case"
        forwardRef={(element): void => {
          focusRef.current = element;
        }}
        title={`${title}${keyboardShortcut}`}
        onClick={handleClick}
      >
        {typeof disabled === 'string'
          ? disabled
          : type === 'move'
            ? treeText.moveNodeHere({ nodeName: actionRow.fullName })
            : type === 'bulkMove'
              ? treeText.moveNodePreparationsHere({
                  nodeName: actionRow.fullName,
                })
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
                      synonymName: focusedRow.acceptedName!,
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
