import React from 'react';

import ajax from '../../ajax';
import { getDomainResource } from '../../domain';
import commonText from '../../localization/common';
import { getModel } from '../../schema';
import type SpecifyModel from '../../specifymodel';
import type { IR } from '../../types';
import { defined } from '../../types';
import userInfo from '../../userinfo';
import { TableIcon, useTitle } from '../common';
import type { UserTool } from '../main';
import { closeDialog, LoadingScreen, ModalDialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

const treesForAll = new Set(['geography', 'storage', 'taxon']);
const treesForPaleo = new Set(['geologictimeperiod', 'lithostrat']);
const paleoDiscs = new Set(['paleobotany', 'invertpaleo', 'vertpaleo']);

export function TreeSelectDialog({
  onClose: handleClose,
  onClick: handleClick,
  title,
  getLink,
}: {
  readonly onClose: () => void;
  readonly onClick: (tree: string) => Promise<void>;
  readonly title: string;
  readonly getLink: (tree: string) => string;
}): JSX.Element {
  const [trees, setTrees] = React.useState<IR<SpecifyModel> | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    Promise.resolve(defined(getDomainResource('discipline')).rget('type'))
      .then((type: string) => [
        ...treesForAll,
        ...(paleoDiscs.has(type) ? treesForPaleo : []),
      ])
      .then((trees) =>
        Object.fromEntries(trees.map((tree) => [tree, defined(getModel(tree))]))
      )
      .then((trees) => (destructorCalled ? undefined : setTrees(trees)))
      .catch(console.error);

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  return typeof trees === 'undefined' || isLoading ? (
    <LoadingScreen />
  ) : (
    <ModalDialog
      properties={{
        title,
        close: handleClose,
        buttons: [
          {
            text: commonText('cancel'),
            click: closeDialog,
          },
        ],
      }}
    >
      <nav>
        <ul style={{ padding: 0 }}>
          {Object.entries(trees).map(([tree, model]) => (
            <li key={tree}>
              <a
                href={getLink(tree)}
                className="fake-link"
                style={{ fontSize: '0.8rem' }}
                onClick={(event): void => {
                  event.preventDefault();
                  setIsLoading(true);
                  Promise.resolve(handleClick(tree))
                    .then(handleClose)
                    .catch(console.error);
                }}
              >
                <TableIcon tableName={tree} tableLabel="false" />
                {model.getLocalizedName()}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </ModalDialog>
  );
}

const handleClick = async (tree: string): Promise<void> =>
  ajax(`/api/specify_tree/${tree}/repair/`, {
    method: 'POST',
  }).then(() => undefined);

function RepairTree({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('repairTree'));

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  React.useEffect(() => {
    const urlSearchParameters = new URLSearchParams(window.location.search);
    const parameters = Object.fromEntries(urlSearchParameters.entries());
    if (typeof parameters.tree === 'undefined') return;
    setIsLoading(true);
    handleClick(parameters.tree).then(handleClose).catch(console.error);
  }, []);
  return isLoading ? (
    <LoadingScreen />
  ) : (
    <TreeSelectDialog
      onClose={handleClose}
      onClick={handleClick}
      title={commonText('repairTree')}
      getLink={(tree): string => `/specify/task/repair-tree/?tree=${tree}`}
    />
  );
}

const View = createBackboneView(RepairTree);

const userTool: UserTool = {
  task: 'repair-tree',
  title: commonText('repairTree'),
  view: ({ onClose }) => new View({ onClose }),
  enabled: () => userInfo.isadmin,
};

export default userTool;
