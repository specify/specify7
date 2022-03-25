import React from 'react';

import { ping } from '../../ajax';
import commonText from '../../localization/common';
import * as querystring from '../../querystring';
import { getTreeModel } from '../../schema';
import { fetchTreeRanks, getDisciplineTrees } from '../../treedefinitions';
import { defined } from '../../types';
import { Button, className, Link, Ul } from '../basic';
import { TableIcon } from '../common';
import { useAsyncState, useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';
import { LoadingContext } from '../contexts';
import { f } from '../../wbplanviewhelper';
import { hasToolPermission } from '../../permissions';

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
    React.useCallback(async () => fetchTreeRanks, []),
    true
  );

  const trees = Object.fromEntries(
    getDisciplineTrees().map((tree) => [tree, defined(getTreeModel(tree))])
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
          {Object.entries(trees)
            .filter(([_tree, { name }]) => hasToolPermission(name, 'update'))
            .map(([tree, model]) => (
              <li key={tree}>
                <Link.Default
                  href={getLink(tree)}
                  className={
                    typeof handleClick === 'function'
                      ? className.navigationHandled
                      : undefined
                  }
                  onClick={(event): void => {
                    if (typeof handleClick === 'undefined') return;
                    event.preventDefault();
                    loading(
                      Promise.resolve(handleClick(tree)).then(handleClose)
                    );
                  }}
                >
                  <TableIcon name={tree} tableLabel={false} />
                  {model.label}
                </Link.Default>
              </li>
            ))}
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
    const { tree } = querystring.parse();
    if (typeof tree === 'undefined') return;
    loading(handleClick(tree).then(handleClose));
  }, [loading, handleClose]);
  return (
    <TreeSelectDialog
      onClose={handleClose}
      onClick={handleClick}
      title={commonText('repairTree')}
      // TODO: handle this sort of thing though the routing library
      getLink={(tree): string => `/specify/task/repair-tree/?tree=${tree}`}
    />
  );
}

const View = createBackboneView(RepairTree);

const userTool: UserTool = {
  task: 'repair-tree',
  title: commonText('repairTree'),
  isOverlay: true,
  view: ({ onClose }) => new View({ onClose }),
};

export default userTool;
