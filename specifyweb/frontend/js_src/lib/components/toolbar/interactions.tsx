import { icons } from '../icons';
import type { MenuItem } from '../main';
import { InteractionsDialog } from '../interactionsdialog';
import { commonText } from '../../localization/common';
import { hasToolPermission } from '../../permissions';
import { getUserPref } from '../../preferencesutils';
import React from 'react';

export const menuItem: MenuItem = {
  task: 'interactions',
  title: commonText('interactions'),
  icon: icons.chat,
  isOverlay: true,
  enabled: () =>
    getUserPref('header', 'menu', 'showInteractions') &&
    hasToolPermission('recordSets', 'read'),
  view: ({ onClose: handleClose, urlParameter }) => (
    <InteractionsDialog onClose={handleClose} urlParameter={urlParameter} />
  ),
};
