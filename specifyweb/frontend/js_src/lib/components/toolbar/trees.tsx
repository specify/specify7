import React from 'react';

import commonText from '../../localization/common';
import * as navigation from '../../navigation';
import { useTitle } from '../hooks';
import { icons } from '../icons';
import type { MenuItem } from '../main';
import createBackboneView from '../reactbackboneextend';
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
      onClick={(tree): void => navigation.go(`/specify/tree/${tree}/`)}
      title={commonText('treesDialogTitle')}
      getLink={(tree): string => `/specify/tree/${tree}/`}
    />
  );
}

const View = createBackboneView(RepairTree);

const menuItem: MenuItem = {
  task: 'tree',
  title: commonText('trees'),
  icon: icons.tree,
  view: ({ onClose }) => new View({ onClose }),
};

export default menuItem;
