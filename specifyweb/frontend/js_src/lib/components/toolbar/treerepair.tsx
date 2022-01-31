import React from 'react';

import { ping } from '../../ajax';
import type { AnyTree } from '../../datamodelutils';
import commonText from '../../localization/common';
import * as querystring from '../../querystring';
import { getModel } from '../../schema';
import type { SpecifyModel } from '../../specifymodel';
import { disciplineTrees } from '../../treedefinitions';
import { defined } from '../../types';
import { Button, Link, Ul } from '../basic';
import { TableIcon } from '../common';
import { useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog, LoadingScreen } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';
import { crash } from '../errorboundary';
import { userInformation } from '../../userinfo';

export function TreeSelectDialog({
  onClose: handleClose,
  onClick: handleClick,
  title,
  getLink,
}: {
  readonly onClose: () => void;
  readonly onClick: (tree: string) => Promise<void> | void;
  readonly title: string;
  readonly getLink: (tree: string) => string;
}): JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const trees = Object.fromEntries(
    disciplineTrees.map((tree) => [
      tree,
      defined(getModel(tree)) as unknown as SpecifyModel<AnyTree>,
    ])
  );

  return isLoading ? (
    <LoadingScreen />
  ) : (
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
          {Object.entries(trees).map(([tree, model]) => (
            <li key={tree}>
              <Link.Default
                href={getLink(tree)}
                onClick={(event): void => {
                  event.preventDefault();
                  setIsLoading(true);
                  Promise.resolve(handleClick(tree))
                    .then(handleClose)
                    .catch(crash);
                }}
              >
                <TableIcon tableName={tree} tableLabel="false" />
                {model.getLocalizedName()}
              </Link.Default>
            </li>
          ))}
        </Ul>
      </nav>
    </Dialog>
  );
}

const handleClick = async (tree: string): Promise<void> =>
  ping(`/api/specify_tree/${tree}/repair/`, {
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
    const { tree } = querystring.parse();
    if (typeof tree === 'undefined') return;
    setIsLoading(true);
    handleClick(tree).then(handleClose).catch(crash);
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
  enabled: () => userInformation.isadmin,
};

export default userTool;
