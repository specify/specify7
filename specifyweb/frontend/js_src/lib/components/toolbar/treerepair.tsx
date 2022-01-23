import React from 'react';

import { ping } from '../../ajax';
import type { AnyTree } from '../../datamodelutils';
import { getDomainResource } from '../../domain';
import commonText from '../../localization/common';
import * as querystring from '../../querystring';
import { getModel } from '../../schema';
import type SpecifyModel from '../../specifymodel';
import type { IR } from '../../types';
import { defined } from '../../types';
import userInfo from '../../userinfo';
import { Button, Link, Ul } from '../basic';
import { TableIcon } from '../common';
import { useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog, LoadingScreen } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

const commonTrees = new Set(['geography', 'storage', 'taxon']);
const treesForPaleo = new Set(['geologictimeperiod', 'lithostrat']);
export const allTrees = new Set([...commonTrees, ...commonTrees]);
const paleoDiscs = new Set(['paleobotany', 'invertpaleo', 'vertpaleo']);

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
  const [trees, setTrees] = React.useState<
    IR<SpecifyModel<AnyTree>> | undefined
  >(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    Promise.resolve(defined(getDomainResource('discipline')).get('type'))
      .then((type) => [
        ...commonTrees,
        ...(paleoDiscs.has(type) ? treesForPaleo : []),
      ])
      .then((trees) =>
        Object.fromEntries(
          trees.map((tree) => [
            tree,
            defined(getModel(tree)) as unknown as SpecifyModel<AnyTree>,
          ])
        )
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
                    .catch(console.error);
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
    handleClick(tree).then(handleClose).catch(console.error);
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
