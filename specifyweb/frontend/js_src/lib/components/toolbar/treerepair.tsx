/**
 * Tree repair dialog
 */

import React from 'react';

import { ping } from '../../ajax';
import type { TaxonTreeDef } from '../../datamodel';
import type { FilterTablesByEndsWith } from '../../datamodelutils';
import { f } from '../../functools';
import { toLowerCase } from '../../helpers';
import type { SpecifyResource } from '../../legacytypes';
import { commonText } from '../../localization/common';
import { hasPermission, hasTreeAccess } from '../../permissionutils';
import { formatUrl, parseUrl } from '../../querystring';
import { schema } from '../../schema';
import { getDisciplineTrees, treeRanksPromise } from '../../treedefinitions';
import { Button, className, DataEntry, Link, Ul } from '../basic';
import { TableIcon } from '../common';
import { LoadingContext } from '../contexts';
import { useAsyncState, useBooleanState, useTitle } from '../hooks';
import { icons } from '../icons';
import type { UserTool } from '../main';
import { Dialog } from '../modaldialog';
import { ResourceView } from '../resourceview';
import { ErrorBoundary } from '../errorboundary';

export function TreeSelectDialog({
  onClose: handleClose,
  onClick: handleClick,
  title,
  getLink,
  permissionName,
  confirmationMessage,
}: {
  readonly onClose: () => void;
  readonly onClick: undefined | ((tree: string) => Promise<void> | void);
  readonly title: string;
  readonly confirmationMessage?: string;
  readonly getLink: (tree: string) => string;
  readonly permissionName: 'read' | 'repair';
}): JSX.Element | null {
  const loading = React.useContext(LoadingContext);
  const [treeRanks] = useAsyncState(
    React.useCallback(async () => treeRanksPromise, []),
    true
  );
  const [isFinished, setIsFinished] = useBooleanState();

  return typeof treeRanks === 'object' ? (
    <Dialog
      icon={<span className="text-blue-500">{icons.tree}</span>}
      header={title}
      onClose={handleClose}
      buttons={
        <Button.Gray onClick={handleClose}>
          {isFinished ? commonText('close') : commonText('cancel')}
        </Button.Gray>
      }
    >
      {isFinished ? (
        confirmationMessage
      ) : (
        <nav>
          <Ul>
            {getDisciplineTrees()
              .filter((treeName) =>
                permissionName === 'repair'
                  ? hasPermission(
                      `/tree/edit/${toLowerCase(treeName)}`,
                      'repair'
                    )
                  : hasTreeAccess(treeName, 'read')
              )
              .map((treeName) =>
                f.var(
                  treeRanks[treeName]?.definition as
                    | SpecifyResource<TaxonTreeDef>
                    | undefined,
                  (treeDefinition) => (
                    <li key={treeName}>
                      <div className="flex gap-2">
                        <Link.Default
                          href={getLink(treeName)}
                          className={`flex-1 ${
                            typeof handleClick === 'function'
                              ? className.navigationHandled
                              : undefined
                          }`}
                          onClick={(event): void => {
                            if (handleClick === undefined) return;
                            event.preventDefault();
                            loading(
                              Promise.resolve(handleClick(treeName)).then(() =>
                                typeof confirmationMessage === 'string'
                                  ? setIsFinished()
                                  : handleClose()
                              )
                            );
                          }}
                          title={treeDefinition?.get('remarks') ?? undefined}
                        >
                          <TableIcon name={treeName} label={false} />
                          {treeDefinition?.get('name') ??
                            schema.models[treeName].label}
                        </Link.Default>
                        {typeof treeDefinition === 'object' && (
                          <EditTreeDefinition treeDefinition={treeDefinition} />
                        )}
                      </div>
                    </li>
                  )
                )
              )}
          </Ul>
        </nav>
      )}
    </Dialog>
  ) : null;
}

const handleClick = async (tree: string): Promise<void> =>
  ping(`/api/specify_tree/${tree.toLowerCase()}/repair/`, {
    method: 'POST',
  }).then(f.void);

function RepairTree({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('repairTree'));

  const loading = React.useContext(LoadingContext);
  React.useEffect(() => {
    const { tree } = parseUrl();
    if (tree === undefined) return;
    loading(handleClick(tree).then(handleClose));
  }, [loading, handleClose]);
  return (
    <TreeSelectDialog
      onClose={handleClose}
      onClick={handleClick}
      title={commonText('repairTree')}
      confirmationMessage={commonText('treeRepairComplete')}
      // REFACTOR: handle this sort of thing though the routing library
      getLink={(tree): string =>
        formatUrl('/specify/task/repair-tree/', { tree: tree.toLowerCase() })
      }
      permissionName="repair"
    />
  );
}

export function EditTreeDefinition({
  treeDefinition,
}: {
  readonly treeDefinition: SpecifyResource<FilterTablesByEndsWith<'TreeDef'>>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <ErrorBoundary dismissable>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen && (
        <ResourceView
          resource={treeDefinition}
          mode="edit"
          canAddAnother={false}
          dialog="modal"
          onClose={handleClose}
          onSaved={(): void => globalThis.location.reload()}
          onDeleted={undefined}
          isSubForm={false}
          isDependent={false}
        />
      )}
    </ErrorBoundary>
  );
}

export const userTool: UserTool = {
  task: 'repair-tree',
  title: commonText('repairTree'),
  isOverlay: true,
  enabled: () =>
    getDisciplineTrees().some((treeName) =>
      hasPermission(`/tree/edit/${toLowerCase(treeName)}`, 'repair')
    ),
  view: ({ onClose: handleClose }) => <RepairTree onClose={handleClose} />,
  groupLabel: commonText('administration'),
};
