import React from 'react';

import { commonText } from '../../localization/common';
import { getUserPref } from '../../preferencesutils';
import { FormsDialog } from '../formsdialog';
import { icons } from '../icons';
import type { MenuItem } from '../main';

export const menuItem: MenuItem = {
  task: 'data',
  title: commonText('dataEntry'),
  icon: icons.pencilAt,
  isOverlay: true,
  enabled: () => getUserPref('header', 'menu', 'showDataEntry'),
  view: ({ onClose: handleClose }) => <FormsDialog onClose={handleClose} />,
};
