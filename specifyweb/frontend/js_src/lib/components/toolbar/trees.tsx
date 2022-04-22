/**
 * List of trees
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { useTitle } from '../hooks';
import { icons } from '../icons';
import type { MenuItem } from '../main';
import { createBackboneView } from '../reactbackboneextend';
import { TreeSelectDialog } from './treerepair';
import { getUserPref } from '../../preferencesutils';

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

const View = createBackboneView(RepairTree);

export const menuItem: MenuItem = {
  task: 'tree',
  title: commonText('trees'),
  icon: icons.tree,
  isOverlay: true,
  enabled: () => getUserPref('header', 'menu', 'showTrees'),
  view: ({ onClose }) => new View({ onClose }),
};
