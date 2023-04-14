/**
 * Tree repair dialog
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useSearchParameter } from '../../hooks/navigation';
import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { treeText } from '../../localization/tree';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import { toLowerCase } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { TaxonTreeDef } from '../DataModel/types';
import {
  getDisciplineTrees,
  treeRanksPromise,
} from '../InitialContext/treeRanks';
import { Dialog } from '../Molecules/Dialog';
import { ResourceEdit } from '../Molecules/ResourceLink';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission, hasTreeAccess } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
import { OverlayContext } from '../Router/Router';

export function TreeSelectOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return (
    <TreeSelectDialog
      getLink={(tree): string => `/specify/tree/${tree.toLowerCase()}/`}
      permissionName="read"
      title={treeText.trees()}
      onClick={undefined}
      onClose={handleClose}
    />
  );
}

export function TreeSelectDialog({
  onClose: handleClose,
  onClick: handleClick,
  title,
  getLink,
  permissionName,
  confirmationMessage,
}: {
  readonly onClose: () => void;
  readonly onClick: ((tree: string) => Promise<void> | void) | undefined;
  readonly title: LocalizedString;
  readonly confirmationMessage?: LocalizedString;
  readonly getLink: (tree: string) => string;
  readonly permissionName: 'read' | 'repair';
}): JSX.Element | null {
  const loading = React.useContext(LoadingContext);
  const [treeRanks] = usePromise(treeRanksPromise, true);
  const [isFinished, setIsFinished] = useBooleanState();

  return typeof treeRanks === 'object' ? (
    <Dialog
      buttons={
        <Button.Gray onClick={handleClose}>
          {isFinished ? commonText.close() : commonText.cancel()}
        </Button.Gray>
      }
      header={title}
      icon={<span className="text-blue-500">{icons.tree}</span>}
      onClose={handleClose}
    >
      {isFinished ? (
        confirmationMessage
      ) : (
        <nav>
          <Ul className="flex flex-col gap-1">
            {getDisciplineTrees()
              .filter((treeName) =>
                permissionName === 'repair'
                  ? hasPermission(
                      `/tree/edit/${toLowerCase(treeName)}`,
                      'repair'
                    )
                  : hasTreeAccess(treeName, 'read')
              )
              .map((treeName) => {
                const treeDefinition = treeRanks[treeName]?.definition as
                  | SpecifyResource<TaxonTreeDef>
                  | undefined;
                return (
                  <li className="contents" key={treeName}>
                    <div className="flex gap-2">
                      <Link.Default
                        className="flex-1"
                        href={getLink(treeName)}
                        title={treeDefinition?.get('remarks') ?? undefined}
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
                      >
                        <TableIcon label={false} name={treeName} />
                        {treeDefinition?.get('name') ?? tables[treeName].label}
                      </Link.Default>
                      {typeof treeDefinition === 'object' && (
                        <ResourceEdit
                          resource={treeDefinition}
                          onSaved={(): void => globalThis.location.reload()}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
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

export function TreeRepairOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const loading = React.useContext(LoadingContext);

  const [tree, setTree] = useSearchParameter('tree');
  React.useEffect(
    () =>
      tree === undefined
        ? undefined
        : loading(handleClick(tree).then(handleClose)),
    [loading, handleClose, tree]
  );

  return (
    <TreeSelectDialog
      confirmationMessage={headerText.treeRepairComplete()}
      getLink={(tree): string =>
        formatUrl('/specify/task/repair-tree/', { tree: tree.toLowerCase() })
      }
      permissionName="repair"
      title={headerText.repairTree()}
      onClick={setTree}
      onClose={handleClose}
    />
  );
}
