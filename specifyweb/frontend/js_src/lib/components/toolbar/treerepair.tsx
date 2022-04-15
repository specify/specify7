/**
 * Tree repair dialog
 */

import React from 'react';

import { ping } from '../../ajax';
import type { TaxonTreeDef } from '../../datamodel';
import type { FilterTablesByEndsWith } from '../../datamodelutils';
import { f } from '../../functools';
import type { SpecifyResource } from '../../legacytypes';
import commonText from '../../localization/common';
import { hasTreeAccess } from '../../permissions';
import {
  getDisciplineTrees,
  treeDefinitions,
  treeRanksPromise,
} from '../../treedefinitions';
import { Button, className, DataEntry, Link, Ul } from '../basic';
import { TableIcon } from '../common';
import { LoadingContext } from '../contexts';
import { useAsyncState, useBooleanState, useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';
import { ResourceView } from '../resourceview';
import { parseUrl } from '../../querystring';

export function TreeSelectDialog({
  onClose: handleClose,
  onClick: handleClick,
  title,
  getLink,
}: {
  readonly onClose: () => void;
  readonly onClick: undefined | ((tree: string) => Promise<void> | void);
  readonly title: string;
  readonly getLink: (tree: string) => string;
}): JSX.Element | null {
  const loading = React.useContext(LoadingContext);
  const [treeRanks] = useAsyncState(
    React.useCallback(async () => treeRanksPromise, []),
    true
  );

  return typeof treeRanks === 'object' ? (
    <Dialog
      header={title}
      onClose={handleClose}
      buttons={
        <Button.Transparent onClick={handleClose}>
          {commonText('cancel')}
        </Button.Transparent>
      }
    >
      <nav>
        <Ul>
          {getDisciplineTrees()
            .filter((treeName) => hasTreeAccess(treeName, 'update'))
            .map((treeName) =>
              f.var(
                treeDefinitions[treeName]
                  .definition as SpecifyResource<TaxonTreeDef>,
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
                          if (typeof handleClick === 'undefined') return;
                          event.preventDefault();
                          loading(
                            Promise.resolve(handleClick(treeName)).then(
                              handleClose
                            )
                          );
                        }}
                        title={treeDefinition.get('remarks') ?? undefined}
                      >
                        <TableIcon name={treeName} tableLabel={false} />
                        {treeDefinition.get('name')}
                      </Link.Default>
                      <EditTreeDefinition treeDefinition={treeDefinition} />
                    </div>
                  </li>
                )
              )
            )}
        </Ul>
      </nav>
    </Dialog>
  ) : null;
}

const handleClick = async (tree: string): Promise<void> =>
  ping(`/api/specify_tree/${tree}/repair/`, {
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
    if (typeof tree === 'undefined') return;
    loading(handleClick(tree).then(handleClose));
  }, [loading, handleClose]);
  return (
    <TreeSelectDialog
      onClose={handleClose}
      onClick={handleClick}
      title={commonText('repairTree')}
      // TODO: handle this sort of thing though the routing library
      getLink={(tree): string =>
        `/specify/task/repair-tree/?tree=${tree.toLowerCase()}`
      }
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
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen && (
        <ResourceView
          resource={treeDefinition}
          mode="edit"
          canAddAnother={false}
          dialog="modal"
          onClose={handleClose}
          onSaved={(): void => window.location.reload()}
          onDeleted={undefined}
          isSubForm={false}
        />
      )}
    </>
  );
}

const View = createBackboneView(RepairTree);

const userTool: UserTool = {
  task: 'repair-tree',
  title: commonText('repairTree'),
  isOverlay: true,
  view: ({ onClose }) => new View({ onClose }),
  groupLabel: commonText('administration'),
};

export default userTool;
