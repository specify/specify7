import React from 'react';

import commonText from '../../localization/common';
import * as navigation from '../../navigation';
import type { MenuItem } from '../main';
import createBackboneView from '../reactbackboneextend';
import { TreeSelectDialog } from './treerepair';

function RepairTree({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <TreeSelectDialog
      onClose={handleClose}
      onClick={async (tree): Promise<void> =>
        Promise.resolve(void navigation.go(`/specify/tree/${tree}/`))
      }
      title={commonText('treesDialogTitle')}
      getLink={(tree): string => `/specify/tree/${tree}/`}
    />
  );
}

const View = createBackboneView({
  moduleName: 'RepairTree',
  component: RepairTree,
});

const menuItem: MenuItem = {
  task: 'tree',
  path: '/specify/tree',
  title: commonText('trees'),
  icon: '/static/img/trees.png',
  view: ({ onClose }) => new View({ onClose }),
};

export default menuItem;
