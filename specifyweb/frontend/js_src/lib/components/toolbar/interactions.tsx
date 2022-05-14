import React from 'react';

import { commonText } from '../../localization/common';
import { getTablePermissions, hasToolPermission } from '../../permissions';
import { getUserPref } from '../../preferencesutils';
import { icons } from '../icons';
import { InteractionsDialog } from '../interactionsdialog';
import type { MenuItem } from '../main';

export const menuItem: MenuItem = {
  task: 'interactions',
  title: commonText('interactions'),
  icon: icons.chat,
  isOverlay: true,
  enabled: () =>
    getUserPref('header', 'menu', 'showInteractions') &&
    // Show DataEntry only if has "create" permission to at least one table
    Object.values(getTablePermissions()).some(({ create }) => create) &&
    hasToolPermission('recordSets', 'read'),
  view: ({ onClose: handleClose, urlParameter }) => (
    <InteractionsDialog onClose={handleClose} urlParameter={urlParameter} />
  ),
};
