/**
 * List of trees
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { hasTreeAccess } from '../../permissions';
import { getUserPref } from '../../preferencesutils';
import { getDisciplineTrees } from '../../treedefinitions';
import { useTitle } from '../hooks';
import { icons } from '../icons';
import type { MenuItem } from '../main';
import { TreeSelectDialog } from './treerepair';

function RepairTree({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('trees'));

  return (
    <TreeSelectDialog
      onClose={handleClose}
      onClick={undefined}
      title={commonText('treesDialogTitle')}
      getLink={(tree): string => `/specify/tree/${tree.toLowerCase()}/`}
    />
  );
}

export const menuItem: MenuItem = {
  task: 'tree',
  title: commonText('trees'),
  icon: icons.tree,
  isOverlay: true,
  enabled: () =>
    getUserPref('header', 'menu', 'showTrees') &&
    getDisciplineTrees().some((treeName) => hasTreeAccess(treeName, 'read')),
  view: ({ onClose: handleClose }) => <RepairTree onClose={handleClose} />,
};
